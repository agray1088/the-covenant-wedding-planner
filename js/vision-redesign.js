/* Vision & Foundation — Master s27 / 13a · Edit 32a · Print preview 32b
   Section tabs 19l live in the Covenant sub-nav (five separate pages),
   not as an in-page strip.
   Views: Read | Edit | Print preview (no page reload).
   Rail: Our vision · Values · Scriptures · Promises · What we are building
         + Written meters + Keepsake class B.
   Drawer (Vision section): Section · Wording · Print · History.
   Primary: Print keepsake. Figures come from data.vision — never typed twice.
   Prints from this page (Class B); there is no separate print template. */
(function () {
  'use strict';

  window._visMode = window._visMode || 'read';
  window._visRailView = window._visRailView || 'vision';
  window._visUiFilters = window._visUiFilters || { section: 'all', author: 'both' };
  window._visSort = window._visSort || 'section';
  window._visDrawerId = window._visDrawerId || null;
  window._visDrawerTab = window._visDrawerTab || 0;
  window._visEditSection = window._visEditSection || 0;
  window._visLastSaveAt = window._visLastSaveAt || Date.now();
  window._visWrittenOnly = window._visWrittenOnly !== false;
  window._visPaper = window._visPaper || 'A5';
  window._visCursorPartner = window._visCursorPartner || '';

  const SHELL_VER = 'vis-rd13a-s27';
  const DRAWER_TABS = ['Section', 'Wording', 'Print', 'History'];
  const RAIL_VIEWS = ['vision', 'values', 'scriptures', 'promises', 'building'];
  const BLOCK_TYPES = [
    { id: 'scripture', label: 'Scripture reference' },
    { id: 'quote', label: 'Quote block' },
    { id: 'prayer', label: 'Prayer' },
    { id: 'divider', label: 'Divider' }
  ];
  const DOC_DEFAULTS = [
    { id: 'believe', title: 'What we believe about marriage', from: 'marriageVision' },
    { id: 'values-doc', title: 'Our values', from: '' },
    { id: 'home', title: 'What we want our home to be', from: 'guestExperience' },
    { id: 'money', title: 'How we will handle money', from: '' },
    { id: 'scriptures-doc', title: 'Scriptures we are standing on', from: 'marriageVerseFull' },
    { id: 'promises-doc', title: 'Promises', from: 'marriagePrayer' },
    { id: 'building', title: 'What we are building', from: 'marriageFirst' }
  ];

  const esc = s => (typeof escapeHtml === 'function'
    ? escapeHtml(s == null ? '' : String(s))
    : String(s == null ? '' : s).replace(/[&<>"']/g, ch => ({
      '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;'
    }[ch])));

  function store() {
    if (typeof getCovenantPlannerData === 'function') return getCovenantPlannerData();
    try { if (typeof data !== 'undefined' && data) return data; } catch (e) { /* lexical */ }
    if (!window.data) window.data = {};
    return window.data;
  }

  function persist() {
    const d = store();
    if (!d.vision || typeof d.vision !== 'object') d.vision = {};
    d.vision.updatedAt = new Date().toISOString();
    window._visLastSaveAt = Date.now();
    if (typeof save === 'function') save();
    else {
      try { localStorage.setItem('covenant-planner-data', JSON.stringify(d)); } catch (e) { /* soft */ }
    }
  }

  function setup() {
    return store().setup || {};
  }
  function brideName() { return String(setup().bride || 'Ama').trim() || 'Ama'; }
  function groomName() { return String(setup().groom || 'Kwesi').trim() || 'Kwesi'; }
  function coupleLine() {
    const s = setup();
    const names = [s.bride, s.groom].filter(Boolean).join(' & ') || (brideName() + ' & ' + groomName());
    const date = s.date ? fmtLong(s.date) : '';
    return date ? (names + ' · ' + date) : names;
  }
  function words(text) {
    return String(text || '').trim().split(/\s+/).filter(Boolean).length;
  }
  function parseDate(value) {
    if (!value) return null;
    const d = new Date(String(value).indexOf('T') >= 0 ? value : String(value).split('T')[0] + 'T00:00:00');
    return Number.isNaN(d.getTime()) ? null : d;
  }
  function fmtLong(value) {
    const d = parseDate(value);
    if (!d) return String(value || '—');
    return d.toLocaleDateString('en-GB', { day: 'numeric', month: 'long', year: 'numeric' });
  }
  function fmtShort(value) {
    const d = parseDate(value);
    if (!d) return String(value || '—');
    return d.toLocaleDateString('en-GB', { day: 'numeric', month: 'short' });
  }
  function fmtChipDate(value) {
    const d = parseDate(value);
    if (!d) return '—';
    return d.toLocaleDateString('en-GB', { day: 'numeric', month: 'short' });
  }
  function nid(prefix) {
    return prefix + '-' + Math.random().toString(36).slice(2, 8);
  }
  function roman(n) {
    const map = ['', 'I', 'II', 'III', 'IV', 'V', 'VI', 'VII', 'VIII', 'IX', 'X'];
    return map[n] || String(n);
  }
  function autosaveLabel() {
    const ms = Date.now() - (window._visLastSaveAt || Date.now());
    const sec = Math.max(1, Math.round(ms / 1000));
    if (sec < 60) return 'Autosaved ' + sec + ' second' + (sec === 1 ? '' : 's') + ' ago';
    const min = Math.round(sec / 60);
    return 'Autosaved ' + min + ' min ago';
  }

  function visionData() {
    const d = store();
    if (!d.vision || typeof d.vision !== 'object' || Array.isArray(d.vision)) d.vision = {};
    return d.vision;
  }

  function seedHistory(who, text, when) {
    return [{ at: when || '2026-07-21', who: who || 'Both', text: text || 'Added' }];
  }

  function migrateIfNeeded() {
    const v = visionData();
    if (!Array.isArray(v.values)) {
      const seeded = [];
      [['priority1', 'Priority 1'], ['priority2', 'Priority 2'], ['priority3', 'Priority 3']].forEach(([k, fallback], i) => {
        const body = String(v[k] || '').trim();
        if (body) seeded.push({
          id: 'val-' + (i + 1), title: fallback, body: body, author: 'Both',
          editedAt: v.updatedAt || '2026-07-21',
          history: seedHistory('Both', 'Added', '2026-06-03'),
          shows: []
        });
      });
      if (String(v.guestExperience || '').trim()) {
        seeded.push({
          id: 'val-guest', title: 'Guest experience', body: String(v.guestExperience).trim(),
          author: 'Both', editedAt: v.updatedAt || '2026-07-21',
          history: seedHistory('Both', 'Added'),
          shows: []
        });
      }
      if (String(v.avoid || '').trim()) {
        seeded.push({
          id: 'val-avoid', title: 'What we will not do', body: String(v.avoid).trim(),
          author: 'Both', editedAt: v.updatedAt || '2026-07-21',
          history: seedHistory('Both', 'Added'),
          shows: []
        });
      }
      v.values = seeded;
    }
    if (!Array.isArray(v.scriptures)) {
      const list = [];
      if (String(v.marriageVerseFull || '').trim() || String(v.marriageVerseReference || '').trim()) {
        list.push({
          id: 'scr-1',
          ref: String(v.marriageVerseReference || '').trim() || 'Scripture',
          quote: String(v.marriageVerseFull || '').trim(),
          note: [v.marriageVerseBrideMeaning, v.marriageVerseGroomMeaning].filter(Boolean).join(' · ') || 'Carried privately',
          author: 'Both',
          editedAt: v.updatedAt || '2026-07-21',
          history: seedHistory('Both', 'Added')
        });
      }
      v.scriptures = list;
    }
    if (!v.promises || typeof v.promises !== 'object' || Array.isArray(v.promises)) {
      const ama = [];
      const kwesi = [];
      if (String(v.herPrayerForHim || '').trim()) {
        ama.push({ id: 'pr-ama-1', text: String(v.herPrayerForHim).trim(), author: brideName(), editedAt: v.updatedAt || '2026-07-21', history: seedHistory(brideName(), 'Added') });
      }
      if (String(v.marriagePrayer || '').trim()) {
        ama.push({ id: 'pr-ama-2', text: String(v.marriagePrayer).trim(), author: brideName(), editedAt: v.updatedAt || '2026-07-21', history: seedHistory(brideName(), 'Added') });
      }
      if (String(v.hisPrayerForHer || '').trim()) {
        kwesi.push({ id: 'pr-kw-1', text: String(v.hisPrayerForHer).trim(), author: groomName(), editedAt: v.updatedAt || '2026-07-21', history: seedHistory(groomName(), 'Added') });
      }
      v.promises = { ama: ama, kwesi: kwesi };
    }
    if (typeof v.building !== 'string') {
      v.building = String(v.marriageFirst || '').trim();
    }
    if (!Array.isArray(v.docSections) || v.docSections.length !== 7) {
      v.docSections = DOC_DEFAULTS.map(def => {
        let body = '';
        if (def.id === 'values-doc') body = (v.values || []).map(x => x.title).filter(Boolean).join('. ');
        else if (def.id === 'scriptures-doc') body = (v.scriptures || []).map(x => x.quote || x.ref).filter(Boolean).join('\n\n');
        else if (def.id === 'promises-doc') {
          const all = (v.promises.ama || []).concat(v.promises.kwesi || []);
          body = all.map(p => p.text).filter(Boolean).join('\n');
        } else if (def.id === 'building') body = String(v.building || '').trim();
        else if (def.from) body = String(v[def.from] || '').trim();
        return {
          id: def.id,
          title: def.title,
          body: body,
          blocks: [],
          writtenBy: 'Both',
          editedAt: body ? (v.updatedAt || '2026-07-14') : ''
        };
      });
    }
    if (!Array.isArray(v.printLog)) v.printLog = [];
    if (!v.printVersion) v.printVersion = v.printLog.length ? v.printLog.length : (v.printedAt ? 1 : 0);
    return v;
  }

  function syncLegacyFields() {
    const v = visionData();
    const visSec = (v.docSections || []).find(s => s.id === 'believe');
    if (visSec && visSec.body) v.marriageVision = visSec.body;
    (v.values || []).forEach((val, i) => {
      if (i === 0) v.priority1 = val.body || val.title;
      if (i === 1) v.priority2 = val.body || val.title;
      if (i === 2) v.priority3 = val.body || val.title;
    });
    const firstScr = (v.scriptures || [])[0];
    if (firstScr) {
      v.marriageVerseReference = firstScr.ref || v.marriageVerseReference;
      v.marriageVerseFull = firstScr.quote || v.marriageVerseFull;
    }
    const ama0 = (v.promises && v.promises.ama && v.promises.ama[0]);
    const kw0 = (v.promises && v.promises.kwesi && v.promises.kwesi[0]);
    if (ama0) v.herPrayerForHim = ama0.text;
    if (kw0) v.hisPrayerForHer = kw0.text;
    v.marriageFirst = String(v.building || '');
  }

  function allValues() { return migrateIfNeeded().values || []; }
  function allScriptures() { return migrateIfNeeded().scriptures || []; }
  function allPromises() {
    const p = migrateIfNeeded().promises || { ama: [], kwesi: [] };
    return {
      ama: p.ama || [],
      kwesi: p.kwesi || []
    };
  }
  function promiseCount() {
    const p = allPromises();
    return p.ama.length + p.kwesi.length;
  }
  function docSections() { return migrateIfNeeded().docSections || []; }

  function recordById(id) {
    if (!id) return null;
    const v = migrateIfNeeded();
    const val = (v.values || []).find(x => x.id === id);
    if (val) return { kind: 'value', rec: val, group: 'Our values', groupId: 'values' };
    const scr = (v.scriptures || []).find(x => x.id === id);
    if (scr) return { kind: 'scripture', rec: scr, group: 'Scriptures we are standing on', groupId: 'scriptures' };
    const ama = (v.promises && v.promises.ama || []).find(x => x.id === id);
    if (ama) return { kind: 'promise', rec: ama, group: 'Promises', groupId: 'promises', side: 'ama' };
    const kw = (v.promises && v.promises.kwesi || []).find(x => x.id === id);
    if (kw) return { kind: 'promise', rec: kw, group: 'Promises', groupId: 'promises', side: 'kwesi' };
    const sec = (v.docSections || []).find(x => x.id === id || ('doc-' + x.id) === id);
    if (sec) return { kind: 'section', rec: sec, group: sec.title, groupId: sec.id === 'building' ? 'building' : (sec.id === 'believe' ? 'vision' : 'vision') };
    return null;
  }

  function authorMatches(author) {
    const f = (window._visUiFilters || {}).author || 'both';
    if (f === 'all' || f === 'both') return true;
    const a = String(author || 'Both').toLowerCase();
    if (f === 'bride') return a === 'both' || a === brideName().toLowerCase() || a.indexOf(brideName().toLowerCase()) >= 0;
    if (f === 'groom') return a === 'both' || a === groomName().toLowerCase() || a.indexOf(groomName().toLowerCase()) >= 0;
    return true;
  }

  function visFigures() {
    const v = migrateIfNeeded();
    const values = allValues();
    const scriptures = allScriptures();
    const pCount = promiseCount();
    const buildingOn = String(v.building || '').trim().length > 0;
    const visionOn = !!(v.docSections || []).find(s => s.id === 'believe' && String(s.body || '').trim());
    const groupsOn = [visionOn, values.length > 0, scriptures.length > 0, pCount > 0, buildingOn];
    const sectionsComplete = groupsOn.filter(Boolean).length;
    const docs = docSections();
    const docsWritten = docs.filter(s => String(s.body || '').trim()).length;
    const text = []
      .concat(docs.map(s => s.body))
      .concat(values.map(x => (x.title || '') + ' ' + (x.body || '')))
      .concat(scriptures.map(x => (x.quote || '') + ' ' + (x.ref || '')))
      .concat((v.promises.ama || []).map(x => x.text))
      .concat((v.promises.kwesi || []).map(x => x.text))
      .concat([v.building])
      .join(' ');
    const last = v.updatedAt || v.lastWritten || '';
    const printed = v.printedAt || (v.printLog && v.printLog[0] && v.printLog[0].at) || '';
    const suppressed = docs.filter(s => !String(s.body || '').trim()).length;
    const printing = window._visWrittenOnly === false ? docs.length : docsWritten;
    const pages = 1 + Math.ceil((window._visWrittenOnly === false ? docsWritten : printing) / 2);
    return {
      values: values.length,
      scriptures: scriptures.length,
      promises: pCount,
      words: words(text),
      sectionsComplete: sectionsComplete,
      sectionsTotal: 5,
      docsTotal: docs.length,
      docsWritten: docsWritten,
      lastWritten: last ? fmtChipDate(last) : '—',
      lastWrittenLong: last ? fmtLong(last) : '—',
      printed: printed ? (fmtChipDate(printed) + (v.printVersion ? ' · v' + v.printVersion : '')) : 'Not yet',
      printedLong: printed ? fmtLong(printed) : 'Not yet',
      printVersion: v.printVersion || 0,
      versionLabel: v.printVersion ? ('v' + v.printVersion) : '—',
      pages: Math.max(1, pages),
      printing: printing,
      suppressed: suppressed,
      paper: window._visPaper || 'A5',
      lastEditor: v.lastEditor || brideName()
    };
  }

  function visRailCounts() {
    const f = visFigures();
    return {
      vision: f.sectionsComplete ? 1 : 0,
      values: f.values,
      scriptures: f.scriptures,
      promises: f.promises,
      building: String(visionData().building || '').trim() ? 1 : 0
    };
  }

  function markEditor(who) {
    const v = visionData();
    v.lastEditor = who || brideName();
  }

  /* ── shell ─────────────────────────────────────────────────────────── */

  function pageheadActionsHtml() {
    const mode = window._visMode || 'read';
    if (mode === 'edit') {
      return ''
        + '<button type="button" class="rd-btn" onclick="rdVisPrint()">Print keepsake</button>'
        + '<button type="button" class="rd-btn" onclick="rdVisFullEditor()">Full editor</button>'
        + '<button type="button" class="rd-btn" onclick="rdSetVisionView(\'read\')">Read view</button>'
        + '<button type="button" class="rd-btn rd-btn--primary" onclick="rdSetVisionView(\'read\')">Done</button>';
    }
    if (mode === 'print') {
      return ''
        + '<button type="button" class="rd-btn" onclick="rdVisPrint()">Print keepsake</button>'
        + '<button type="button" class="rd-btn" onclick="rdVisFullEditor()">Full editor</button>'
        + '<button type="button" class="rd-btn" onclick="rdVisExportPdf()">Export PDF</button>'
        + '<button type="button" class="rd-btn rd-btn--primary" onclick="rdVisPrint()">Print</button>';
    }
    return ''
      + '<button type="button" class="rd-btn" onclick="rdVisAddScripture()">Add a scripture</button>'
      + '<button type="button" class="rd-btn" onclick="rdVisPrintSection()">Print section</button>'
      + '<button type="button" class="rd-btn" onclick="rdVisFullEditor()">Full editor</button>'
      + '<button type="button" class="rd-btn" onclick="rdVisExport()">Export</button>'
      + '<button type="button" class="rd-btn rd-btn--primary" onclick="rdVisPrint()">Print keepsake</button>';
  }

  function ensureShell() {
    const panel = document.getElementById('panel-vision');
    if (!panel) return;
    panel.classList.add('ued-scope', 'vision-mockup', 'vision-rd');
    if (panel.dataset.uedShell === SHELL_VER) {
      const actions = panel.querySelector('.rd-pagehead__actions');
      if (actions) actions.innerHTML = pageheadActionsHtml();
      return;
    }
    panel.dataset.uedShell = SHELL_VER;
    panel.innerHTML = `<div class="rd-page">
      <div class="rd-pagehead">
        <div>
          <div class="rd-pagehead__eyebrow">Covenant</div>
          <div class="rd-pagehead__title-row"><h1 class="rd-pagehead__title">Vision &amp; Foundation</h1></div>
        </div>
        <div class="rd-pagehead__actions">${pageheadActionsHtml()}</div>
      </div>
      <div class="rd-stats m-stats" id="vision-stats" aria-label="Vision summary"></div>
      <div class="rd-toolbar" id="vision-toolbar"></div>
      <div class="rd-surface">
        <div class="rd-surface__row">
          <div class="rd-surface__main" id="vision-view-host">
            <div class="rd-view" id="vis-view-read"></div>
            <div class="rd-view" id="vis-view-edit" hidden></div>
            <div class="rd-view" id="vis-view-print" hidden></div>
          </div>
          <div id="vision-drawer-slot"></div>
        </div>
      </div>
    </div>`;
    if (window.covenantShell && window.covenantShell.drawer) window.covenantShell.drawer();
  }

  function renderStats() {
    const host = document.getElementById('vision-stats');
    if (!host) return;
    const f = visFigures();
    const mode = window._visMode || 'read';
    let stats;
    if (mode === 'edit') {
      const idx = (window._visEditSection || 0) + 1;
      stats = [
        { label: 'Sections', value: String(f.docsTotal) },
        { label: 'Written', value: String(f.docsWritten) },
        { label: 'Words', value: f.words.toLocaleString('en-US') },
        { label: 'Last edit', value: autosaveLabel().replace('Autosaved ', '') },
        { label: f.lastEditor + ' · section ' + idx, value: 'Editing' },
        { label: 'Print class', value: 'B · keepsake' }
      ];
    } else if (mode === 'print') {
      stats = [
        { label: 'Pages', value: String(f.pages) },
        { label: 'Sections printing', value: f.printing + ' of ' + f.docsTotal },
        { label: 'Suppressed', value: String(f.suppressed), attention: f.suppressed ? 'no body text' : undefined },
        { label: 'Paper', value: f.paper + ' · portrait' },
        { label: 'Renders', value: 'Light always', attention: 'even in dark mode' }
      ];
    } else {
      stats = [
        { label: 'Values', value: String(f.values) },
        { label: 'Scriptures', value: String(f.scriptures) },
        { label: 'Promises', value: String(f.promises) },
        { label: 'Words', value: f.words.toLocaleString('en-US') },
        { label: 'Version', value: f.versionLabel }
      ];
    }
    if (typeof RdDepth !== 'undefined' && RdDepth.renderStats) {
      RdDepth.renderStats(host, stats);
      return;
    }
    host.innerHTML = stats.map(s =>
      `<div class="m-stat"><div class="m-stat-label">${esc(s.label)}</div><div class="m-stat-val">${esc(s.value)}</div>` +
      (s.attention ? `<div class="m-stat-note">${esc(s.attention)}</div>` : '') +
      `</div>`
    ).join('');
  }

  function filterChip(label, field, options) {
    const ui = window._visUiFilters || {};
    const cur = ui[field] || options[0];
    const on = cur && cur !== options[0];
    const display = field === 'author' && cur === 'bride' ? brideName()
      : (field === 'author' && cur === 'groom' ? groomName() : cur);
    const chev = '<svg viewBox="0 0 24 24" aria-hidden="true" style="width:1em;height:1em;fill:none;stroke:currentColor;stroke-width:2.2;stroke-linecap:round"><path d="m6 9 6 6 6-6"/></svg>';
    return `<button type="button" class="rd-chip${on ? ' is-active' : ''}" onclick="rdVisCycleFilter('${field}')">${esc(label + ': ' + display)}` +
      (on ? `<span class="rd-chip__clear" onclick="event.stopPropagation();rdVisClearFilter('${field}')">&#10005;</span>` : chev) +
      '</button>';
  }

  function viewSwitchHtml(mode) {
    return `<div class="rd-toolbar__right">
      <div class="rd-viewswitch" role="group" aria-label="Vision & Foundation view">
        <button type="button" class="rd-viewswitch__item${mode === 'read' ? ' is-active' : ''}" onclick="rdSetVisionView('read')">Read</button>
        <button type="button" class="rd-viewswitch__item${mode === 'edit' ? ' is-active' : ''}" onclick="rdSetVisionView('edit')">Edit</button>
        <button type="button" class="rd-viewswitch__item${mode === 'print' ? ' is-active' : ''}" onclick="rdSetVisionView('print')">Print preview</button>
      </div>
    </div>`;
  }

  function renderToolbar() {
    const host = document.getElementById('vision-toolbar');
    if (!host) return;
    const mode = window._visMode || 'read';
    const f = visFigures();
    let left = '';
    if (mode === 'edit') {
      const idx = (window._visEditSection || 0) + 1;
      left = `<span class="rd-chip is-active">Section: ${idx} of ${f.docsTotal}</span>`
        + `<span class="rd-chip is-active">Editing</span>`
        + `<span class="rd-chip rd-chip--ghost">Autosaved · both partners can edit</span>`;
    } else if (mode === 'print') {
      left = `<button type="button" class="rd-chip is-active" onclick="rdVisCyclePaper()">Paper: ${esc(f.paper)}</button>`
        + `<button type="button" class="rd-chip${window._visWrittenOnly !== false ? ' is-active' : ''}" onclick="rdVisToggleWrittenOnly()">Sections: ${window._visWrittenOnly !== false ? 'written only' : 'all'}</button>`
        + `<span class="rd-chip">Class B · keepsake</span>`;
    } else {
      left = filterChip('Section', 'section', ['all', 'vision', 'values', 'scriptures', 'promises', 'building'])
        + filterChip('Author', 'author', ['both', 'bride', 'groom'])
        + (typeof rdSortChipHtml === 'function'
          ? rdSortChipHtml('Sort by section', "rdVisOpenSort(this)")
          : `<button type="button" class="rd-chip rd-chip--ghost" onclick="rdVisCycleSort()">Sort by section</button>`);
    }
    host.innerHTML = `<div class="rd-toolbar__left">${left}</div>` + viewSwitchHtml(mode);
  }

  function applyMode() {
    const mode = window._visMode || 'read';
    ['read', 'edit', 'print'].forEach(name => {
      const el = document.getElementById('vis-view-' + name);
      if (el) el.hidden = mode !== name;
    });
  }

  function rdSetVisionView(mode) {
    window._visMode = (mode === 'edit' || mode === 'print') ? mode : 'read';
    renderVisionRd();
  }

  function applyVisionRailView(viewId) {
    window._visRailView = RAIL_VIEWS.indexOf(viewId) >= 0 ? viewId : 'vision';
    if (typeof setSavedView === 'function') setSavedView('vision', window._visRailView);
    window._visUiFilters.section = window._visRailView === 'vision' ? 'all' : window._visRailView;
    if (window._visMode === 'print') window._visMode = 'read';
    renderVisionRd();
    setTimeout(() => {
      const el = document.getElementById('vis-section-' + window._visRailView);
      if (el) el.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }, 30);
  }

  function sectionVisible(id) {
    const rail = window._visRailView || 'vision';
    const filter = (window._visUiFilters || {}).section || 'all';
    if (filter !== 'all' && filter !== id) return false;
    if (rail !== 'vision' && rail !== id) return false;
    return true;
  }

  /* ── read view · Master 13a editorial grid ─────────────────────────── */

  function visSecBar(eyebrow, sub, actionHtml) {
    return '<div class="rd-vis-secbar">'
      + '<div class="rd-vis-secbar__eyebrow">' + esc(eyebrow) + '</div>'
      + (sub ? '<div class="rd-vis-secbar__sub">' + esc(sub) + '</div>' : '')
      + (actionHtml || '')
      + '</div>';
  }

  function visSecAct(label, onclick, extra) {
    return '<button type="button" class="rd-vis-secbar__act"' + (extra || '')
      + ' onclick="' + onclick + '">' + esc(label) + '</button>';
  }

  function visionHeroHtml(body) {
    const paras = body ? body.split(/\n\n+/).map(p => p.trim()).filter(Boolean) : [];
    if (!paras.length) {
      return '<p class="rd-vis-hero__empty">Write the covenant vision you want to return to when planning gets loud.</p>';
    }
    const lead = '<p class="rd-vis-hero__lead">' + esc(paras[0]) + '</p>';
    const rest = paras.slice(1).map(p => '<p class="rd-vis-hero__body">' + esc(p) + '</p>').join('');
    return lead + rest;
  }

  function renderReadView() {
    const host = document.getElementById('vis-view-read');
    if (!host) return;
    const v = migrateIfNeeded();
    const f = visFigures();
    const believe = (v.docSections || []).find(s => s.id === 'believe') || {};
    const visionBody = String(believe.body || v.marriageVision || '').trim();
    const values = allValues().filter(x => authorMatches(x.author));
    const scriptures = allScriptures().filter(x => authorMatches(x.author));
    const promises = allPromises();
    const building = String(v.building || '').trim();
    const showValues = sectionVisible('values');
    const showScriptures = sectionVisible('scriptures');
    const pairCols = (showValues ? 1 : 0) + (showScriptures ? 1 : 0);

    let html = '<div class="rd-vis-read">';

    if (sectionVisible('vision')) {
      html += '<section class="rd-vis-hero" id="vis-section-vision" onclick="rdVisOpenDrawer(\'doc-believe\')">'
        + '<div class="rd-vis-hero__inner">'
        + '<div class="rd-vis-eyebrow">Our vision</div>'
        + '<div class="rd-vis-hairline" aria-hidden="true"></div>'
        + visionHeroHtml(visionBody)
        + '</div></section>';
    }

    if (pairCols) {
      html += '<div class="rd-vis-pair' + (pairCols === 1 ? ' rd-vis-pair--solo' : '') + '">';
      if (showValues) {
        html += '<section class="rd-vis-pane rd-vis-pane--values" id="vis-section-values">'
          + visSecBar('Our values · ' + f.values, 'Named by both of us, in the order we argued them into place',
            visSecAct('Reorder', 'event.stopPropagation();rdVisReorderValues()'))
          + '<div class="rd-vis-pane__body"><ol class="rd-vis-values">';
        values.forEach((val, i) => {
          html += '<li class="rd-vis-value' + (window._visDrawerId === val.id ? ' is-open' : '')
            + '" onclick="rdVisOpenDrawer(\'' + esc(val.id) + '\')">'
            + '<span class="rd-vis-value__n">' + String(i + 1).padStart(2, '0') + '</span>'
            + '<div><div class="rd-vis-value__title">' + esc(val.title || 'Untitled value') + '</div>'
            + '<p>' + esc(val.body || '') + '</p></div></li>';
        });
        html += '</ol>'
          + '<button type="button" class="rd-vis-add" onclick="rdVisAddValue()">+ Add a value</button>'
          + '</div></section>';
      }
      if (showScriptures) {
        html += '<section class="rd-vis-pane rd-vis-pane--scriptures" id="vis-section-scriptures">'
          + visSecBar('Scriptures we are standing on · ' + f.scriptures, 'Read at the ceremony or carried privately',
            visSecAct('Add', 'event.stopPropagation();rdVisAddScripture()'))
          + '<div class="rd-vis-pane__body"><ul class="rd-vis-scriptures">';
        scriptures.forEach(s => {
          const quote = s.quote ? '“' + esc(s.quote).replace(/^[“"]+|["”]+$/g, '') + '”' : '';
          html += '<li class="rd-vis-scripture' + (window._visDrawerId === s.id ? ' is-open' : '')
            + '" onclick="rdVisOpenDrawer(\'' + esc(s.id) + '\')">'
            + '<div class="rd-vis-scripture__ref">' + esc(s.ref) + '</div>'
            + (quote ? '<blockquote>' + quote + '</blockquote>' : '')
            + '<div class="rd-vis-scripture__note">' + esc(s.note || '') + '</div></li>';
        });
        html += '</ul>'
          + '<button type="button" class="rd-vis-add" onclick="rdVisAddScripture()">+ Add a scripture</button>'
          + '</div></section>';
      }
      html += '</div>';
    }

    if (sectionVisible('promises')) {
      const ama = promises.ama.filter(x => authorMatches(x.author || brideName()));
      const kwesi = promises.kwesi.filter(x => authorMatches(x.author || groomName()));
      html += '<section class="rd-vis-promises-wrap" id="vis-section-promises">'
        + visSecBar('Promises · ' + f.promises, 'Three each · these become the vows',
          visSecAct('Move to vows', 'event.stopPropagation();rdVisMoveToVows()'))
        + '<div class="rd-vis-promises">'
        + '<div class="rd-vis-promises__col"><div class="rd-vis-promises__head">' + esc(brideName()) + '’s promises</div><ol>';
      ama.forEach((p, i) => {
        html += '<li class="' + (window._visDrawerId === p.id ? 'is-open' : '')
          + '" onclick="rdVisOpenDrawer(\'' + esc(p.id) + '\')"><span>' + String(i + 1).padStart(2, '0')
          + '</span><p>' + esc(p.text) + '</p></li>';
      });
      html += '</ol></div><div class="rd-vis-promises__col"><div class="rd-vis-promises__head">' + esc(groomName())
        + '’s promises</div><ol>';
      kwesi.forEach((p, i) => {
        html += '<li class="' + (window._visDrawerId === p.id ? 'is-open' : '')
          + '" onclick="rdVisOpenDrawer(\'' + esc(p.id) + '\')"><span>' + String(i + 1).padStart(2, '0')
          + '</span><p>' + esc(p.text) + '</p></li>';
      });
      html += '</ol></div></div></section>';
    }

    if (sectionVisible('building')) {
      html += '<section class="rd-vis-building' + (building ? '' : ' rd-vis-building--unfinished') + '" id="vis-section-building">'
        + visSecBar('What we are building' + (building ? '' : ' · unfinished'),
          building ? '' : 'One section still empty — it prints as a blank ruled page until it is written',
          visSecAct('Write it', 'event.stopPropagation();rdVisWriteBuilding()'))
        + '<div class="rd-vis-building__body">'
        + (building
          ? '<div class="rd-vis-building__written" onclick="rdVisOpenDrawer(\'doc-building\')"><p>' + esc(building) + '</p></div>'
          : '<div class="rd-vis-building__placeholder">A paragraph on the family you hope to be in twenty years. Left deliberately for last — write it after the counseling sessions finish, and it prints as the closing page of the keepsake.</div>')
        + '</div></section>';
    }

    html += '</div>';
    host.innerHTML = html;
  }

  /* ── edit view ─────────────────────────────────────────────────────── */

  function renderEditView() {
    const host = document.getElementById('vis-view-edit');
    if (!host) return;
    const docs = docSections();
    const idx = Math.max(0, Math.min(docs.length - 1, window._visEditSection || 0));
    window._visEditSection = idx;
    const sec = docs[idx] || { title: '', body: '', blocks: [] };
    const blocks = Array.isArray(sec.blocks) ? sec.blocks : [];
    const partner = groomName();
    const otherSec = docs[4] || docs[docs.length - 1];
    htmlBlocks(host, sec, blocks, idx, docs.length, partner, otherSec);
  }

  function htmlBlocks(host, sec, blocks, idx, total, partner, otherSec) {
    let body = `<div class="rd-vis-edit">
      <div class="rd-vis-edit__banner">
        <strong>Editing · Section ${idx + 1} of ${total}</strong>
        <span>· ${esc(autosaveLabel())}</span>
        <button type="button" class="rd-btn rd-btn--quiet" onclick="rdSetVisionView('read')">Read view</button>
      </div>
      <label class="rd-vis-edit__title"><span>Section title</span>
        <input type="text" value="${esc(sec.title || '')}" oninput="rdVisSaveDocTitle(this.value)">
      </label>
      <label class="rd-vis-edit__body"><span>Body · written together${sec.editedAt ? ', ' + esc(fmtLong(sec.editedAt)) : ''}</span>
        <textarea oninput="rdVisSaveDocBody(this.value)">${esc(sec.body || '')}</textarea>
      </label>
      <div class="rd-vis-blocks">`;
    blocks.forEach((b, i) => {
      if (b.type === 'divider') {
        body += `<div class="rd-vis-blockinsert rd-vis-blockinsert--rule" data-i="${i}"><hr><button type="button" class="rd-btn rd-btn--quiet" onclick="rdVisRemoveBlock(${i})">Remove</button></div>`;
      } else {
        const lab = (BLOCK_TYPES.find(t => t.id === b.type) || { label: b.type }).label;
        body += `<label class="rd-vis-blockinsert"><span>${esc(lab)}</span>
          <textarea oninput="rdVisSaveBlock(${i}, this.value)">${esc(b.text || '')}</textarea>
          <button type="button" class="rd-btn rd-btn--quiet" onclick="rdVisRemoveBlock(${i})">Remove</button>
        </label>`;
      }
    });
    body += `</div>
      <div class="rd-vis-blockset" role="group" aria-label="Block set">`;
    BLOCK_TYPES.forEach(t => {
      body += `<button type="button" class="rd-chip" onclick="rdVisInsertBlock('${t.id}')">${esc(t.label)}</button>`;
    });
    body += `<button type="button" class="rd-btn rd-btn--quiet" onclick="rdVisInsertBlock('scripture')">+ Insert block</button>
      </div>
      <p class="rd-vis-coedit">Both of you can edit this page. ${esc(partner)} last wrote in section ${Math.min(total, 5)} on 2 July. Two people editing the same section at once is shown, not merged silently — you will see a cursor and a name label.</p>
      ${window._visCursorPartner ? `<div class="rd-vis-cursor" aria-hidden="true"><i></i>${esc(window._visCursorPartner)}</div>` : ''}
      <nav class="rd-vis-edit__nav">`;
    docSections().forEach((d, i) => {
      body += `<button type="button" class="rd-chip${i === idx ? ' is-active' : ''}" onclick="rdVisJumpSection(${i})">${i + 1}. ${esc(d.title)}</button>`;
    });
    body += `</nav></div>`;
    host.innerHTML = body;
  }

  /* ── print preview ─────────────────────────────────────────────────── */

  function printSections() {
    const docs = docSections();
    if (window._visWrittenOnly === false) return docs.slice();
    return docs.filter(s => String(s.body || '').trim());
  }

  function renderPrintView() {
    const host = document.getElementById('vis-view-print');
    if (!host) return;
    const f = visFigures();
    const docs = docSections();
    const printing = printSections();
    const paper = (window._visPaper || 'A5').toLowerCase();
    let sheet = `<div class="rd-vis-proof">
      <div class="rd-vis-sheet rd-vis-sheet--${esc(paper)}" data-print-light="1">
        <div class="rd-vis-sheet__kicker">${esc(coupleLine())}</div>
        <div class="rd-vis-sheet__titlepage">
          <div class="rd-vis-sheet__orn">✦</div>
          <h2>Our Foundation</h2>
          <p class="rd-vis-sheet__names">${esc(brideName())} &amp; ${esc(groomName())}</p>
          <hr class="rd-vis-sheet__gold">
          <p class="rd-vis-sheet__sub">Our Foundation</p>
        </div>`;
    docs.forEach((s, i) => {
      const written = String(s.body || '').trim();
      const shown = window._visWrittenOnly === false || written;
      if (!shown && window._visWrittenOnly !== false) return;
      sheet += `<section class="rd-vis-sheet__sec">
        <h3>${roman(i + 1)}. ${esc(s.title)}</h3>`;
      if (written) {
        written.split(/\n\n+/).forEach(p => { sheet += `<p>${esc(p)}</p>`; });
        (s.blocks || []).forEach(b => {
          if (b.type === 'divider') sheet += '<hr class="rd-vis-sheet__gold">';
          else if (b.type === 'scripture') sheet += `<blockquote class="rd-vis-sheet__q">${esc(b.text || '')}</blockquote>`;
          else if (b.text) sheet += `<p class="rd-vis-sheet__block">${esc(b.text)}</p>`;
        });
      } else {
        sheet += `<p class="rd-vis-sheet__gap">[Not written yet — this section will not print until it has text.]</p>`;
      }
      sheet += `</section>`;
    });
    sheet += `<div class="rd-vis-sheet__foot"><span>Proof · ${esc(fmtLong(new Date().toISOString()))}</span>
      <span>Page 1 of ${f.pages}</span></div>
      </div>
      <p class="rd-vis-proof__note">Print always renders light, even when the app is in dark mode. Empty sections are flagged here rather than printing a heading over blank paper. Class B — serif, centred title page, gold rule, generous measure, no UI chrome.</p>
    </div>`;
    host.innerHTML = sheet;
  }

  /* ── drawer ────────────────────────────────────────────────────────── */

  function parkSharedDrawerAway(slot) {
    const shared = document.getElementById('record-drawer');
    if (shared && slot && slot.contains(shared)) {
      document.body.appendChild(shared);
    }
  }

  function field(label, value, onclick) {
    const click = onclick ? ` class="rd-drawer__link" onclick="${onclick}"` : '';
    return `<div class="rd-drawer__field"><span>${esc(label)}</span><strong${click}>${esc(value)}</strong></div>`;
  }

  function recTitle(found) {
    if (!found) return '';
    if (found.kind === 'value') return found.rec.title || 'Untitled value';
    if (found.kind === 'scripture') return found.rec.ref || 'Scripture';
    if (found.kind === 'promise') return found.rec.text ? found.rec.text.slice(0, 42) : 'Promise';
    return found.rec.title || 'Section';
  }
  function recBody(found) {
    if (!found) return '';
    if (found.kind === 'value') return found.rec.body || '';
    if (found.kind === 'scripture') return found.rec.quote || '';
    if (found.kind === 'promise') return found.rec.text || '';
    return found.rec.body || '';
  }
  function recAuthor(found) {
    if (!found) return 'Both';
    return found.rec.author || found.rec.writtenBy || 'Both';
  }
  function recPosition(found) {
    if (found.kind === 'value') {
      const i = allValues().findIndex(x => x.id === found.rec.id);
      return (i + 1) + ' of ' + allValues().length;
    }
    if (found.kind === 'scripture') {
      const i = allScriptures().findIndex(x => x.id === found.rec.id);
      return (i + 1) + ' of ' + allScriptures().length;
    }
    if (found.kind === 'promise') {
      return promiseCount() ? '1 of ' + promiseCount() : '—';
    }
    const i = docSections().findIndex(x => x.id === found.rec.id);
    return (i + 1) + ' of ' + docSections().length;
  }
  function recChip(found) {
    if (found.kind === 'value') {
      const i = allValues().findIndex(x => x.id === found.rec.id);
      return 'Value ' + String(i + 1).padStart(2, '0');
    }
    if (found.kind === 'scripture') return 'Scripture';
    if (found.kind === 'promise') return 'Promise';
    return 'Section';
  }

  function defaultShows(found) {
    if (found.kind === 'value' && /money|account|spend/i.test((found.rec.title || '') + (found.rec.body || ''))) {
      return [
        { page: 'Keepsake print', detail: 'Page 2', go: "rdSetVisionView('print')" },
        { page: 'Premarital Counseling', detail: 'Session 4 · money', go: "typeof showPanel==='function'&&showPanel('counseling')" },
        { page: 'Marriage Rhythms', detail: 'Monthly money hour', go: "typeof showPanel==='function'&&showPanel('firstmonth')" }
      ];
    }
    return [
      { page: 'Keepsake print', detail: 'This section', go: "rdSetVisionView('print')" }
    ];
  }

  function renderVisDrawer() {
    const slot = document.getElementById('vision-drawer-slot');
    if (!slot) return;
    const shared = document.getElementById('record-drawer');
    if (!window._visDrawerId) {
      parkSharedDrawerAway(slot);
      slot.innerHTML = '';
      slot.classList.remove('is-open');
      return;
    }
    const found = recordById(window._visDrawerId.replace(/^doc-/, '')) || recordById(window._visDrawerId);
    if (!found) {
      window._visDrawerId = null;
      parkSharedDrawerAway(slot);
      slot.innerHTML = '';
      slot.classList.remove('is-open');
      return;
    }
    if (shared && !slot.contains(shared)) { /* keep shared parked */ }
    const tab = Math.max(0, Math.min(DRAWER_TABS.length - 1, parseInt(window._visDrawerTab, 10) || 0));
    const title = recTitle(found);
    const bodyText = recBody(found);
    const author = recAuthor(found);
    const pos = recPosition(found);
    const hist = Array.isArray(found.rec.history) && found.rec.history.length
      ? found.rec.history
      : [{ at: found.rec.editedAt || '2026-07-21', who: author, text: 'Added' }];
    const v = migrateIfNeeded();
    const printHist = v.printLog || [];

    let body = '';
    if (tab === 0) {
      const shows = found.rec.shows && found.rec.shows.length ? found.rec.shows : defaultShows(found);
      body =
        field('Section', found.group) +
        field('Position', pos) +
        field('Written by', author) +
        field('Last edited', found.rec.editedAt ? fmtLong(found.rec.editedAt) : 'This session') +
        `<div class="rd-drawer__section-title">Wording</div>` +
        `<div class="rd-vis-drawer__prose">${esc(bodyText) || '<span class="rd-empty">Unwritten.</span>'}</div>` +
        `<div class="rd-drawer__section-title">Where this shows</div>` +
        shows.map(s => field(s.page, s.detail, s.go)).join('') +
        `<div class="rd-drawer__section-title">Print</div>` +
        field('Class', 'B · keepsake') +
        field('Type', 'Cormorant 19pt') +
        field('Ornament', 'Gold hairline, once');
    } else if (tab === 1) {
      body =
        `<p class="rd-drawer__note">The one tab where prose is the record. It renders in Cormorant because it will print in Cormorant.</p>` +
        `<textarea class="rd-vis-drawer__textarea" oninput="rdVisSaveDrawerWording(this.value)">${esc(bodyText)}</textarea>` +
        `<div class="rd-drawer__section-title">Wording history</div>` +
        hist.map(h => `<div class="rd-drawer__hist"><strong>${esc(fmtChipDate(h.at))} · ${esc(h.who)}</strong><div>${esc(h.text)}</div></div>`).join('') +
        (hist[0] && hist[0].note ? `<p class="rd-drawer__note">${esc(hist[0].note)}</p>` : '');
    } else if (tab === 2) {
      body =
        `<div class="rd-vis-drawer__print">
          <div class="rd-vis-drawer__print-kicker">${esc(coupleLine())}</div>
          <div class="rd-vis-drawer__print-page">Vision &amp; Foundation</div>
          <strong>${esc(title)}</strong>
          <p>${esc(bodyText)}</p>
          <span>Class B · Cormorant · one gold hairline · page 2 of 6</span>
        </div>` +
        field('Class', 'B · keepsake') +
        field('Type', 'Cormorant 19pt') +
        field('Ornament', 'Gold hairline, once') +
        field('Margins', '0.9in') +
        `<p class="rd-drawer__note">Print is a tab here and nowhere else in the planner, because for a Covenant record the printed page is the deliverable. Everything else prints as a by-product.</p>`;
    } else {
      body =
        `<div class="rd-drawer__section-title">This section</div>` +
        hist.map(h => `<div class="rd-drawer__hist"><strong>${esc(fmtChipDate(h.at))} · ${esc(h.who)}</strong><div>${esc(h.text)}</div></div>`).join('') +
        printHist.slice(0, 3).map(h => `<div class="rd-drawer__hist"><strong>${esc(fmtChipDate(h.at))} · ${esc(h.who || 'Both')}</strong><div>Printed · v${esc(String(h.version || v.printVersion || ''))}</div></div>`).join('') +
        `<p class="rd-drawer__note">Printing is logged. A keepsake that has been printed and then edited is a keepsake whose paper copy is now wrong, and the log is the only way to know.</p>`;
    }

    const foot = tab === 2
      ? `<button type="button" class="rd-btn rd-btn--primary" onclick="rdVisPrint()">Print keepsake</button>`
        + `<button type="button" class="rd-btn" onclick="rdVisFullEditor()">Full editor</button>`
      : `<button type="button" class="rd-btn rd-btn--primary" onclick="rdVisCloseDrawer()">Save</button>`
        + `<button type="button" class="rd-btn" onclick="rdVisFullEditor()">Open full editor</button>`;

    slot.classList.add('is-open');
    slot.innerHTML =
      `<aside class="rd-drawer rd-vis-drawer" aria-label="Vision section">` +
      `<div class="rd-drawer__head">` +
      `<div class="rd-drawer__eyebrow">Section · ${esc((found.groupId || 'values').replace(/-/g, ' '))}</div>` +
      `<h2 class="rd-drawer__title">${esc(title)}</h2>` +
      `<div class="rd-drawer__chips">` +
      `<span class="status-pill" data-pillscheme="gold">${esc(recChip(found))}</span>` +
      `<span class="status-pill" data-pillscheme="gray">${esc(author)}</span>` +
      `</div>` +
      `<button type="button" class="rd-drawer__close" onclick="rdVisCloseDrawer()" aria-label="Close">×</button>` +
      `<div class="rd-drawer__tabs" role="tablist">` +
      DRAWER_TABS.map((label, i) =>
        `<button type="button" class="rd-drawer__tab${i === tab ? ' is-active' : ''}" onclick="rdVisSetDrawerTab(${i})">${esc(label)}</button>`
      ).join('') +
      `</div></div>` +
      `<div class="rd-drawer__body">${body}</div>` +
      `<div class="rd-drawer__foot">${foot}</div></aside>`;
  }

  /* ── mutations ─────────────────────────────────────────────────────── */

  function rdVisSaveDocTitle(val) {
    const docs = docSections();
    const sec = docs[window._visEditSection || 0];
    if (!sec) return;
    sec.title = val;
    sec.editedAt = new Date().toISOString();
    markEditor(brideName());
    persist();
    renderStats();
  }
  function rdVisSaveDocBody(val) {
    const docs = docSections();
    const sec = docs[window._visEditSection || 0];
    if (!sec) return;
    sec.body = val;
    sec.editedAt = new Date().toISOString();
    if (sec.id === 'believe') visionData().marriageVision = val;
    if (sec.id === 'building') visionData().building = val;
    markEditor(brideName());
    syncLegacyFields();
    persist();
    renderStats();
  }
  function rdVisSaveBlock(i, val) {
    const docs = docSections();
    const sec = docs[window._visEditSection || 0];
    if (!sec || !sec.blocks || !sec.blocks[i]) return;
    sec.blocks[i].text = val;
    persist();
  }
  function rdVisInsertBlock(type) {
    const docs = docSections();
    const sec = docs[window._visEditSection || 0];
    if (!sec) return;
    if (!Array.isArray(sec.blocks)) sec.blocks = [];
    sec.blocks.push({ type: type || 'scripture', text: '' });
    persist();
    renderEditView();
  }
  function rdVisRemoveBlock(i) {
    const docs = docSections();
    const sec = docs[window._visEditSection || 0];
    if (!sec || !sec.blocks) return;
    sec.blocks.splice(i, 1);
    persist();
    renderEditView();
  }
  function rdVisJumpSection(i) {
    window._visEditSection = i;
    renderVisionRd();
  }

  function rdVisSaveDrawerWording(val) {
    const found = recordById(window._visDrawerId.replace(/^doc-/, '')) || recordById(window._visDrawerId);
    if (!found) return;
    if (found.kind === 'value') found.rec.body = val;
    else if (found.kind === 'scripture') found.rec.quote = val;
    else if (found.kind === 'promise') found.rec.text = val;
    else found.rec.body = val;
    found.rec.editedAt = new Date().toISOString();
    if (!Array.isArray(found.rec.history)) found.rec.history = [];
    found.rec.history.unshift({ at: new Date().toISOString(), who: 'Both', text: 'Reworded' });
    markEditor('Both');
    syncLegacyFields();
    persist();
    renderStats();
  }

  function rdVisAddValue() {
    const v = migrateIfNeeded();
    const rec = {
      id: nid('val'), title: '', body: '', author: 'Both',
      editedAt: new Date().toISOString(), history: seedHistory('Both', 'Added', new Date().toISOString()),
      shows: []
    };
    v.values.push(rec);
    persist();
    window._visDrawerId = rec.id;
    window._visDrawerTab = 1;
    window._visRailView = 'values';
    window._visMode = 'read';
    renderVisionRd();
  }
  function rdVisAddScripture() {
    const v = migrateIfNeeded();
    const rec = {
      id: nid('scr'), ref: '', quote: '', note: '', author: 'Both',
      editedAt: new Date().toISOString(), history: seedHistory('Both', 'Added', new Date().toISOString())
    };
    v.scriptures.push(rec);
    persist();
    window._visDrawerId = rec.id;
    window._visDrawerTab = 1;
    window._visRailView = 'scriptures';
    window._visMode = 'read';
    renderVisionRd();
  }
  function rdVisReorderValues() {
    const v = migrateIfNeeded();
    if (v.values && v.values.length > 1) {
      v.values.push(v.values.shift());
      persist();
      renderVisionRd();
    }
  }
  function rdVisWriteBuilding() {
    window._visEditSection = 6;
    window._visMode = 'edit';
    window._visRailView = 'building';
    renderVisionRd();
  }
  function rdVisMoveToVows() {
    if (typeof rdCerWriteVows === 'function') rdCerWriteVows();
    else if (typeof showPanel === 'function') showPanel('ceremony');
  }

  function rdVisPrint() {
    const v = migrateIfNeeded();
    v.printedAt = new Date().toISOString();
    v.printVersion = (v.printVersion || 0) + 1;
    v.printLog = v.printLog || [];
    v.printLog.unshift({ at: v.printedAt, who: 'Both', version: v.printVersion });
    persist();
    window._visMode = 'print';
    renderVisionRd();
    setTimeout(() => {
      if (typeof printCurrentPage === 'function') printCurrentPage();
      else window.print();
    }, 40);
  }
  function rdVisPrintSection() {
    const rail = window._visRailView || 'vision';
    window._visUiFilters.section = rail === 'vision' ? 'all' : rail;
    rdVisPrint();
  }
  function rdVisExport() {
    const blob = new Blob([JSON.stringify(migrateIfNeeded(), null, 2)], { type: 'application/json' });
    const a = document.createElement('a');
    a.href = URL.createObjectURL(blob);
    a.download = 'vision-foundation.json';
    document.body.appendChild(a);
    a.click();
    setTimeout(() => { URL.revokeObjectURL(a.href); a.remove(); }, 0);
    if (typeof showToast === 'function') showToast('Vision exported.');
  }
  function rdVisExportPdf() {
    rdVisPrint();
  }
  function rdVisFullEditor(id) {
    if (id) window._visDrawerId = id;
    const found = recordById((window._visDrawerId || '').replace(/^doc-/, '')) || recordById(window._visDrawerId);
    if (found && found.kind === 'section') {
      const i = docSections().findIndex(s => s.id === found.rec.id);
      if (i >= 0) window._visEditSection = i;
    } else if (found && found.groupId === 'building') {
      window._visEditSection = 6;
    } else if (found && found.groupId === 'values') {
      window._visEditSection = 1;
    } else if (found && found.groupId === 'scriptures') {
      window._visEditSection = 4;
    } else if (found && found.groupId === 'promises') {
      window._visEditSection = 5;
    }
    window._visMode = 'edit';
    renderVisionRd();
  }
  function rdVisOpenDrawer(id) {
    window._visDrawerId = id;
    window._visDrawerTab = 0;
    renderVisionRd();
  }
  function rdVisCloseDrawer() {
    window._visDrawerId = null;
    const slot = document.getElementById('vision-drawer-slot');
    if (slot) {
      parkSharedDrawerAway(slot);
      slot.innerHTML = '';
      slot.classList.remove('is-open');
    }
    renderVisionRd();
  }
  function rdVisSetDrawerTab(i) {
    window._visDrawerTab = i;
    renderVisDrawer();
  }
  function rdVisCycleFilter(field) {
    const opts = field === 'author'
      ? ['both', 'bride', 'groom']
      : ['all', 'vision', 'values', 'scriptures', 'promises', 'building'];
    const cur = (window._visUiFilters || {})[field] || opts[0];
    const i = opts.indexOf(cur);
    window._visUiFilters[field] = opts[(i + 1) % opts.length];
    if (field === 'section') {
      const next = window._visUiFilters.section;
      window._visRailView = next === 'all' ? 'vision' : next;
      if (typeof setSavedView === 'function') setSavedView('vision', window._visRailView);
    }
    renderVisionRd();
  }
  function rdVisClearFilter(field) {
    window._visUiFilters[field] = field === 'author' ? 'both' : 'all';
    if (field === 'section') {
      window._visRailView = 'vision';
      if (typeof setSavedView === 'function') setSavedView('vision', 'vision');
    }
    renderVisionRd();
  }
  function rdVisCycleSort() { renderVisionRd(); }
  function rdVisOpenSort(btn) {
    if (typeof window.rdPickOne !== 'function') return;
    window.rdPickOne(btn, [{ value: 'section', label: 'Sort by section' }], 'section', function () {
      renderVisionRd();
    });
  }
  function rdVisCyclePaper() {
    window._visPaper = window._visPaper === 'A5' ? 'Letter' : 'A5';
    renderVisionRd();
  }
  function rdVisToggleWrittenOnly() {
    window._visWrittenOnly = !(window._visWrittenOnly !== false);
    renderVisionRd();
  }

  function renderVisionRd() {
    migrateIfNeeded();
    ensureShell();
    if (typeof renderPageUxChrome === 'function') renderPageUxChrome('vision');
    applyMode();
    renderStats();
    renderToolbar();
    const mode = window._visMode || 'read';
    if (mode === 'edit') renderEditView();
    else if (mode === 'print') renderPrintView();
    else renderReadView();
    renderVisDrawer();
    if (typeof renderContextSidebar === 'function'
      && document.body.getAttribute('data-active-panel') === 'vision'
      && document.body.classList.contains('context-sidebar-mode')) {
      renderContextSidebar('vision');
    }
    if (typeof uxRevealPanel === 'function') uxRevealPanel('vision');
  }

  window.uedVisionShell = ensureShell;
  window.renderVisionPage = renderVisionRd;
  window.renderVisionRd = renderVisionRd;
  window.rdSetVisionView = rdSetVisionView;
  window.applyVisionRailView = applyVisionRailView;
  window.visRailCounts = visRailCounts;
  window.visFigures = visFigures;
  window.rdVisPrint = rdVisPrint;
  window.rdVisPrintSection = rdVisPrintSection;
  window.rdVisExport = rdVisExport;
  window.rdVisExportPdf = rdVisExportPdf;
  window.rdVisAddValue = rdVisAddValue;
  window.rdVisAddScripture = rdVisAddScripture;
  window.rdVisReorderValues = rdVisReorderValues;
  window.rdVisWriteBuilding = rdVisWriteBuilding;
  window.rdVisMoveToVows = rdVisMoveToVows;
  window.rdVisFullEditor = rdVisFullEditor;
  window.rdVisOpenDrawer = rdVisOpenDrawer;
  window.rdVisCloseDrawer = rdVisCloseDrawer;
  window.rdVisSetDrawerTab = rdVisSetDrawerTab;
  window.rdVisSaveDocTitle = rdVisSaveDocTitle;
  window.rdVisSaveDocBody = rdVisSaveDocBody;
  window.rdVisSaveBlock = rdVisSaveBlock;
  window.rdVisInsertBlock = rdVisInsertBlock;
  window.rdVisRemoveBlock = rdVisRemoveBlock;
  window.rdVisJumpSection = rdVisJumpSection;
  window.rdVisSaveDrawerWording = rdVisSaveDrawerWording;
  window.rdVisCycleFilter = rdVisCycleFilter;
  window.rdVisClearFilter = rdVisClearFilter;
  window.rdVisCycleSort = rdVisCycleSort;
  window.rdVisOpenSort = rdVisOpenSort;
  window.rdVisCyclePaper = rdVisCyclePaper;
  window.rdVisToggleWrittenOnly = rdVisToggleWrittenOnly;

  function hookVisionPanelRenderer() {
    if (window.SYSTEM_PANEL_RENDERERS) window.SYSTEM_PANEL_RENDERERS.vision = function () { renderVisionRd(); };
  }
  hookVisionPanelRenderer();
  var _showPanelVis = window.showPanel;
  if (typeof _showPanelVis === 'function') {
    window.showPanel = function (id, forceOpen) {
      var out = _showPanelVis.call(window, id, forceOpen);
      hookVisionPanelRenderer();
      return out;
    };
  }
})();
