/* Ceremony & Reception — All.dc #11a + Views #31c/#31d + Section tabs #19a + Drawers (Element).
   Views: Order of service | Programme | Script.
   Sections: Overview · Order of Worship · Processional · Recessional · Scripture & Prayer ·
             Vows & Rings · Officiant & Legal · Reception Details · Traditions.
   Rail: Both services · Ceremony only · Reception only · Needs a person · Scripture & vows
         + Sections jump + Running time meters + Group by Service / Person / Element type.
   Stats: Elements · Ceremony · Reception · People named · Unassigned.
   Surface: two running-order columns (Ceremony + Reception) with derived start times;
            section tables use Element · Who · Starts · Length · Status.
   Drawer tabs: Element · Script · People · History.
   Data: ceremonyOrder · ceremonyReceptionDetails · ceremonyProcessional · ceremonyRecessional ·
         scriptures · ceremonyVows · ceremonyChecklist · ceremonyTraditions · speeches · data.ceremony. */
(function () {
  'use strict';

  window._cerMode = window._cerMode || 'order';
  window._cerSection = window._cerSection || 'overview';
  window._cerRailView = window._cerRailView || 'both';
  window._cerGroupBy = window._cerGroupBy || 'service';
  window._cerUiFilters = window._cerUiFilters || { service: 'all', type: 'all', person: 'all', author: 'all', element: 'all' };
  window._cerShowTimes = window._cerShowTimes !== false;
  window._cerUnwrittenOnly = !!window._cerUnwrittenOnly;
  window._cerDrawerId = window._cerDrawerId || null;
  window._cerDrawerTab = window._cerDrawerTab || 0;
  window._cerRowHeight = window._cerRowHeight || 'compact';
  window._cerSel = window._cerSel instanceof Set ? window._cerSel : new Set();

  const CER_SECTION_TABS = [
    { id: 'overview', label: 'Overview' },
    { id: 'worship', label: 'Order of Worship' },
    { id: 'processional', label: 'Processional' },
    { id: 'recessional', label: 'Recessional' },
    { id: 'scripture', label: 'Scripture & Prayer' },
    { id: 'vows', label: 'Vows & Rings' },
    { id: 'legal', label: 'Officiant & Legal' },
    { id: 'reception', label: 'Reception Details' },
    { id: 'traditions', label: 'Traditions' }
  ];

  const CER_COL_SCOPE = 'ceremony-19a';
  const CER_COLUMNS = [
    { key: 'element', label: 'Element', width: '240px' },
    { key: 'who', label: 'Who', width: '140px' },
    { key: 'starts', label: 'Starts', width: '80px' },
    { key: 'length', label: 'Length', width: '80px' },
    { key: 'status', label: 'Status', width: '120px' }
  ];
  if (window.rdColumns) {
    window.rdColumns.register(CER_COL_SCOPE, CER_COLUMNS.slice(), () => {
      if (typeof renderCeremonyPage === 'function') renderCeremonyPage();
    });
  }

  const DRAWER_TABS = ['Element', 'Script', 'People', 'History'];

  const esc = s => (typeof escapeHtml === 'function'
    ? escapeHtml(s == null ? '' : String(s))
    : String(s == null ? '' : s));

  function ensureArrays() {
    /* Do not assign window.data — planner.js uses a top-level `let data` that
       is not the same object as window.data. Mutate the live `data` store. */
    ['ceremonyOrder', 'ceremonyReceptionDetails', 'ceremonyProcessional', 'ceremonyRecessional',
      'scriptures', 'ceremonyVows', 'ceremonyChecklist', 'ceremonyTraditions', 'speeches'].forEach(k => {
      if (!Array.isArray(data[k])) data[k] = [];
    });
    if (!data.ceremony || typeof data.ceremony !== 'object') data.ceremony = {};
  }

  function parseMins(d, fallback) {
    const s = String(d || '').trim().toLowerCase();
    if (!s) return fallback != null ? fallback : null;
    let m = s.match(/(\d+(?:\.\d+)?)\s*h/);
    if (m) {
      const hours = parseFloat(m[1]);
      const mm = s.match(/(\d+)\s*m/);
      return Math.round(hours * 60) + (mm ? parseInt(mm[1], 10) : 0);
    }
    m = s.match(/(\d+)\s*min/);
    if (m) return parseInt(m[1], 10);
    m = s.match(/^(\d+)$/);
    if (m) return parseInt(m[1], 10);
    return fallback != null ? fallback : null;
  }
  function fmtMins(mins) {
    if (mins == null || Number.isNaN(Number(mins))) return '—';
    const m = Math.max(0, Math.round(Number(mins)));
    if (m < 60) return m + ' min';
    const h = Math.floor(m / 60);
    const r = m % 60;
    return r ? (h + 'h ' + r + 'm') : (h + 'h');
  }
  function fmtClock(mins) {
    if (mins == null) return '—';
    let h = Math.floor(mins / 60) % 24;
    const m = mins % 60;
    const suffix = h >= 12 ? 'pm' : 'am';
    h = h % 12 || 12;
    return h + ':' + String(m).padStart(2, '0') + suffix;
  }
  function clockToMins(value) {
    if (typeof timelineMinutes === 'function') {
      const t = timelineMinutes(value);
      if (t != null) return t;
    }
    const v = String(value || '').trim();
    const m = v.match(/^(\d{1,2}):(\d{2})/);
    if (!m) return null;
    return parseInt(m[1], 10) * 60 + parseInt(m[2], 10);
  }

  function ceremonyStartMins() {
    const c = data.ceremony || {};
    const setup = data.setup || {};
    return clockToMins(c.start || setup.ceremonyStart) ?? (15 * 60); /* 3:00pm */
  }
  function receptionStartMins() {
    const c = data.ceremony || {};
    const setup = data.setup || {};
    return clockToMins(c.receptionStart || setup.receptionStart) ?? (18 * 60 + 30); /* 6:30pm */
  }
  function officiantName() {
    return String((data.ceremony && data.ceremony.officiant) || (data.setup && data.setup.pastor) || 'Officiant').trim();
  }
  function venueName(which) {
    const c = data.ceremony || {};
    const v = data.venue || {};
    if (which === 'reception') return c.receptionLocation || v.reception || v.name || 'Reception';
    return c.location || v.ceremony || v.name || 'Ceremony';
  }
  function mcName() {
    const rec = (data.ceremonyReceptionDetails || []).find(r => /mc|master of ceremonies|host/i.test([r.moment, r.person, r.category].join(' ')));
    if (rec && rec.person) return String(rec.person).trim();
    const order = (data.ceremonyReceptionDetails || []).find(r => /grand entrance|welcome/i.test(String(r.moment || '')));
    if (order && order.person) return String(order.person).trim();
    return 'MC';
  }

  function elementType(title, service) {
    const t = String(title || '').toLowerCase();
    if (/vow/i.test(t)) return 'Vows';
    if (/scripture|reading|1 cor|ruth|psalm|ephesians|colossians/i.test(t)) return 'Scripture';
    if (/prayer|blessing|homily|welcome|charge|message/i.test(t)) return 'Prayer';
    if (/ring/i.test(t)) return 'Rings';
    if (/processional|entrance|prelude|recessional/i.test(t)) return 'Music';
    if (/speech|toast/i.test(t)) return 'Speech';
    if (/dance|band|dj|bouquet|cake|dinner|cocktail|doors|seated|send-?off/i.test(t)) return 'Reception';
    if (/sign|register|license|witness|legal|officiant/i.test(t)) return 'Legal';
    if (/tradition|cultural|unity|cord|candle/i.test(t)) return 'Tradition';
    return service === 'reception' ? 'Reception' : 'Element';
  }

  function baseLength(title, service, row) {
    if (row && row.length) {
      const p = parseMins(row.length);
      if (p != null) return p;
    }
    if (row && row.timing) {
      const p = parseMins(row.timing);
      if (p != null) return p;
    }
    if (typeof ceremonyBaseLength === 'function' && service === 'ceremony') {
      return ceremonyBaseLength({ moment: title });
    }
    const t = String(title || '').toLowerCase();
    if (/cocktail|doors/i.test(t)) return 60;
    if (/dinner/i.test(t)) return 50;
    if (/speech/i.test(t)) return 18;
    if (/band set|dance floor/i.test(t)) return 60;
    if (/room clear|turnover/i.test(t)) return 45;
    if (/send-?off|last dance/i.test(t)) return 15;
    if (/cake|bouquet|first dance|parents/i.test(t)) return 7;
    return service === 'reception' ? 10 : 4;
  }

  function scriptFor(el) {
    const title = el.title.toLowerCase();
    if (/vow/i.test(title)) {
      const vow = (data.ceremonyVows || []).find(v => /vow/i.test(String(v.detail || '')));
      const wording = vow && String(vow.wording || '').trim();
      if (wording && !/personal vows/i.test(wording)) return { text: wording, status: 'Written', due: '' };
      return {
        text: 'Ama first, then Kwesi. Both are writing their own — final text due to Rev. Mensah by 25 October so it can be read aloud once at the rehearsal on 6 November.',
        status: 'Not written',
        due: '25 October'
      };
    }
    if (/ring/i.test(title)) {
      const ring = (data.ceremonyVows || []).find(v => /ring wording/i.test(String(v.detail || '')));
      const wording = ring && String(ring.wording || '').trim();
      if (wording) {
        return {
          text: 'Rev. Mensah: The rings, please.\n[Ring bearer brings both rings forward.]\nRev. Mensah: Place this ring and repeat after me —\n' + wording,
          status: 'Written',
          due: ''
        };
      }
    }
    if (/scripture|reading/i.test(title)) {
      const scr = (data.scriptures || []).find(s => {
        const hay = [s.passage, s.text, s.notes].join(' ').toLowerCase();
        return hay && title.includes(String(s.passage || '').toLowerCase().slice(0, 8)) ||
          (el.person && String(s.reader || '').toLowerCase() === el.person.toLowerCase());
      }) || (data.scriptures || [])[0];
      if (scr && (scr.fullPassage || scr.text || scr.passage)) {
        return { text: scr.fullPassage || scr.text || scr.passage, status: 'Written', due: '' };
      }
    }
    if (/prayer of blessing|blessing/i.test(title) && /rev|officiant|pastor/i.test(el.person)) {
      if (el.notes && /written/i.test(el.notes)) {
        return { text: el.notes, status: 'Written', due: '' };
      }
      return { text: 'Written. Four minutes. ' + officiantName() + '’s own text, filed 12 June.', status: 'Written', due: '' };
    }
    if (el.notes) return { text: el.notes, status: /not written|tbd|due/i.test(el.notes) ? 'Not written' : 'Written', due: '' };
    if (el.cue) return { text: el.cue, status: 'Cue only', due: '' };
    return { text: '', status: 'Not written', due: '' };
  }

  function unify(src, row, i, service) {
    let title = '';
    let person = '';
    if (src === 'ceremonyProcessional' || src === 'ceremonyRecessional') {
      title = String(row.name || row.moment || row.role || 'Entry').trim() || 'Untitled entry';
      person = String(row.role || row.person || row.notes || '').trim();
    } else if (src === 'scriptures') {
      title = String(row.passage || row.reference || row.moment || 'Scripture').trim();
      person = String(row.reader || row.person || '').trim();
    } else if (src === 'ceremonyVows') {
      title = String(row.detail || row.moment || 'Vow detail').trim();
      person = String(row.person || '').trim() || (/vow|ring/i.test(title) ? 'Ama & Kwesi' : officiantName());
    } else if (src === 'ceremonyChecklist') {
      title = String(row.item || row.moment || 'Checklist item').trim();
      person = String(row.person || row.notes || '').trim();
    } else if (src === 'ceremonyTraditions') {
      title = String(row.tradition || row.moment || row.detail || 'Tradition').trim();
      person = String(row.person || row.who || '').trim();
    } else {
      title = String(row.moment || row.detail || row.event || row.passage || row.title || '').trim() || 'Untitled element';
      person = String(row.person || row.reader || row.responsible || '').trim();
    }
    const mins = (src === 'ceremonyProcessional' || src === 'ceremonyRecessional' || src === 'ceremonyChecklist' || src === 'ceremonyVows' || src === 'ceremonyTraditions')
      ? (parseMins(row.length || row.timing) || null)
      : baseLength(title, service, row);
    const type = elementType(title, service);
    const needsPerson = !person || person === '—' || /^tbd|unassigned|needs/i.test(person) ||
      (src === 'ceremonyChecklist' && !row.done && /witness/i.test(title));
    const id = (row._id ? src + ':' + row._id : src + ':idx:' + i);
    const status = needsPerson ? 'Needs a person'
      : (src === 'ceremonyChecklist' ? (row.done ? 'Confirmed' : 'Open') : 'Confirmed');
    return {
      id: id,
      src: src,
      index: i,
      row: row,
      service: service,
      title: title,
      person: person || '—',
      lengthMins: mins,
      lengthLabel: mins != null ? (mins + ' min') : '—',
      type: type,
      needsPerson: needsPerson,
      isScriptureOrVow: type === 'Scripture' || type === 'Vows' || type === 'Prayer' || type === 'Rings',
      notes: String(row.notes || '').trim(),
      cue: String(row.cue || '').trim(),
      category: String(row.category || '').trim(),
      status: status,
      startMins: null,
      startLabel: '—'
    };
  }

  function timedServiceElements() {
    ensureArrays();
    const out = [];
    data.ceremonyOrder.forEach((r, i) => out.push(unify('ceremonyOrder', r, i, 'ceremony')));
    data.ceremonyReceptionDetails.forEach((r, i) => out.push(unify('ceremonyReceptionDetails', r, i, 'reception')));
    (data.speeches || []).forEach((r, i) => {
      const title = String(r.speaker || r.name || 'Speech').trim();
      const already = out.some(e => e.service === 'reception' && /speech/i.test(e.title));
      if (already && i > 0) return;
      if (out.some(e => e.title.toLowerCase() === title.toLowerCase())) return;
      out.push(unify('speeches', Object.assign({}, r, { moment: (r.speaker ? 'Speech · ' + r.speaker : 'Speech'), person: r.speaker || r.name || '' }), i, 'reception'));
    });
    return assignTimes(out);
  }

  function allCatalogueElements() {
    ensureArrays();
    const timed = timedServiceElements();
    const out = timed.slice();
    const seen = new Set(out.map(e => e.id));
    function push(src, rows, service) {
      rows.forEach((r, i) => {
        const e = unify(src, r, i, service);
        if (seen.has(e.id)) return;
        seen.add(e.id);
        out.push(e);
      });
    }
    push('ceremonyProcessional', data.ceremonyProcessional, 'ceremony');
    push('ceremonyRecessional', data.ceremonyRecessional, 'ceremony');
    push('scriptures', data.scriptures, 'ceremony');
    push('ceremonyVows', data.ceremonyVows, 'ceremony');
    push('ceremonyChecklist', data.ceremonyChecklist, 'ceremony');
    push('ceremonyTraditions', data.ceremonyTraditions, 'ceremony');
    return out;
  }

  function allElements() {
    return timedServiceElements();
  }

  function assignTimes(elements) {
    let cer = ceremonyStartMins();
    let rec = receptionStartMins();
    elements.forEach(e => {
      if (e.service === 'ceremony' && (e.src === 'ceremonyOrder' || e.src === 'speeches')) {
        e.startMins = cer;
        e.startLabel = fmtClock(cer);
        if (e.lengthMins != null) cer += e.lengthMins;
      } else if (e.service === 'reception' && (e.src === 'ceremonyReceptionDetails' || e.src === 'speeches')) {
        e.startMins = rec;
        e.startLabel = fmtClock(rec);
        if (e.lengthMins != null) rec += e.lengthMins;
      }
    });
    return elements;
  }

  function findById(id) {
    return allCatalogueElements().find(e => e.id === id) || timedServiceElements().find(e => e.id === id) || null;
  }

  function sectionOf(e) {
    if (e.src === 'ceremonyProcessional') return 'processional';
    if (e.src === 'ceremonyRecessional') return 'recessional';
    if (e.src === 'ceremonyChecklist') return 'legal';
    if (e.src === 'ceremonyTraditions') return 'traditions';
    if (e.src === 'ceremonyReceptionDetails' || e.src === 'speeches') return 'reception';
    if (e.src === 'scriptures') return 'scripture';
    if (e.src === 'ceremonyVows') return 'vows';
    if (e.src === 'ceremonyOrder') {
      if (/processional|prelude|entrance of the bride/i.test(e.title)) return 'processional';
      if (/recessional/i.test(e.title)) return 'recessional';
      if (/scripture|prayer|homily|welcome|blessing|hymn/i.test(e.title)) return 'scripture';
      if (/vow|ring/i.test(e.title)) return 'vows';
      if (/sign|register|license|pronouncement/i.test(e.title)) return 'legal';
      return 'worship';
    }
    return 'worship';
  }

  function elementsForSection(section) {
    section = section || window._cerSection || 'overview';
    if (section === 'overview') return timedServiceElements();
    if (section === 'worship') {
      return timedServiceElements().filter(e => e.service === 'ceremony' && e.src === 'ceremonyOrder');
    }
    if (section === 'reception') {
      return timedServiceElements().filter(e => e.service === 'reception');
    }
    return allCatalogueElements().filter(e => sectionOf(e) === section);
  }

  /* ── figures / rail ──────────────────────────────────────────────────── */

  function ceremonyFigures() {
    const els = timedServiceElements();
    const catalogue = allCatalogueElements();
    const cer = els.filter(e => e.service === 'ceremony');
    const rec = els.filter(e => e.service === 'reception');
    const unassigned = els.filter(e => e.needsPerson);
    const scriptureVow = els.filter(e => e.isScriptureOrVow);
    const people = new Set(els.map(e => e.person).filter(p => p && p !== '—'));
    const cerMins = cer.reduce((s, e) => s + (e.lengthMins || 0), 0);
    const recMins = rec.reduce((s, e) => s + (e.lengthMins || 0), 0);
    const cocktail = rec.find(e => /cocktail|doors/i.test(e.title));
    const clear = rec.find(e => /clear|turnover/i.test(e.title));
    let written = 0;
    let outstanding = 0;
    scriptureVow.forEach(e => {
      const sc = scriptFor(e);
      if (sc.status === 'Written') written++;
      else outstanding++;
    });
    const sectionCounts = {};
    CER_SECTION_TABS.forEach(t => {
      if (t.id === 'overview') sectionCounts.overview = catalogue.length;
      else sectionCounts[t.id] = elementsForSection(t.id).length;
    });
    return {
      elements: els.length,
      catalogue: catalogue.length,
      ceremonyCount: cer.length,
      receptionCount: rec.length,
      ceremonyMins: cerMins,
      receptionMins: recMins,
      cocktailMins: cocktail ? cocktail.lengthMins : 60,
      turnoverMins: clear ? clear.lengthMins : 45,
      peopleNamed: people.size,
      unassigned: unassigned.length,
      scriptureVow: scriptureVow.length,
      written: written,
      outstanding: outstanding,
      unassignedList: unassigned,
      sectionCounts: sectionCounts
    };
  }

  function ceremonyRailCounts() {
    const f = ceremonyFigures();
    return {
      both: f.elements,
      ceremony: f.ceremonyCount,
      reception: f.receptionCount,
      needs: f.unassigned,
      scripture: f.scriptureVow,
      sections: f.sectionCounts
    };
  }

  function ceremonySectionCounts() {
    return ceremonyFigures().sectionCounts || {};
  }

  function matchesRail(e, view) {
    view = view || window._cerRailView || 'both';
    if (view === 'both') return true;
    if (view === 'ceremony') return e.service === 'ceremony';
    if (view === 'reception') return e.service === 'reception';
    if (view === 'needs') return e.needsPerson;
    if (view === 'scripture') return e.isScriptureOrVow;
    return true;
  }
  function matchesFilters(e) {
    if (!matchesRail(e)) return false;
    const ui = window._cerUiFilters || {};
    if (ui.service && ui.service !== 'all' && e.service !== ui.service) return false;
    if (ui.type && ui.type !== 'all' && e.type !== ui.type) return false;
    if (ui.person && ui.person !== 'all' && e.person !== ui.person) return false;
    if (ui.element && ui.element !== 'all' && e.title !== ui.element) return false;
    if (window._cerUnwrittenOnly) {
      const sc = scriptFor(e);
      if (sc.status === 'Written') return false;
    }
    return true;
  }

  /* ── shell ───────────────────────────────────────────────────────────── */

  function pageheadActionsHtml() {
    const mode = window._cerMode || 'order';
    const section = window._cerSection || 'overview';
    if (section === 'overview' && mode === 'programme') {
      return ''
        + '<button type="button" class="rd-btn" onclick="rdCerPrintProgramme()">Print keepsake</button>'
        + '<button type="button" class="rd-btn" onclick="rdCerFullEditor()">Full editor</button>'
        + '<button type="button" class="rd-btn" onclick="rdCerExport()">Export PDF</button>'
        + '<button type="button" class="rd-btn rd-btn--primary" onclick="rdCerAdd()">Add element</button>';
    }
    if (section === 'overview' && mode === 'script') {
      return ''
        + '<button type="button" class="rd-btn" onclick="rdCerPrintScript()">Print script</button>'
        + '<button type="button" class="rd-btn" onclick="rdCerFullEditor()">Full editor</button>'
        + '<button type="button" class="rd-btn" onclick="rdCerSendOfficiant()">Share with officiant</button>'
        + '<button type="button" class="rd-btn rd-btn--primary" onclick="rdCerWriteVows()">Write the vows</button>';
    }
    return ''
      + '<button type="button" class="rd-btn" onclick="rdCerSendOfficiant()">Send to officiant</button>'
      + '<button type="button" class="rd-btn" onclick="rdCerPrint()"><svg viewBox="0 0 24 24" aria-hidden="true" style="width:14px;height:14px;fill:none;stroke:currentColor;stroke-width:1.7;stroke-linecap:round;stroke-linejoin:round"><path d="M6 9V4h12v5"/><rect x="4" y="9" width="16" height="7" rx="1"/><path d="M7 16h10v4H7z"/></svg>Print section</button>'
      + '<button type="button" class="rd-btn" onclick="rdCerFullEditor()">Full editor</button>'
      + '<button type="button" class="rd-btn" onclick="rdCerExport()">Export</button>'
      + '<button type="button" class="rd-btn rd-btn--primary" onclick="rdCerAdd()">Add element</button>';
  }

  function uedCeremonyShellRd() {
    const panel = document.getElementById('panel-ceremony');
    if (!panel) return;
    panel.classList.add('ued-scope', 'ceremony-service-mockup');
    if (panel.dataset.uedShell === 'ceremony-rd11a-v2') {
      const actions = panel.querySelector('.rd-pagehead__actions');
      if (actions) actions.innerHTML = pageheadActionsHtml();
      return;
    }
    panel.dataset.uedShell = 'ceremony-rd11a-v2';
    /* Master #19a: stats → section tabs → toolbar */
    panel.innerHTML = `<div class="rd-page">
      <div class="rd-pagehead">
        <div>
          <div class="rd-pagehead__eyebrow">The Day</div>
          <div class="rd-pagehead__title-row">
            <h1 class="rd-pagehead__title">Ceremony &amp; Reception</h1>
          </div>
        </div>
        <div class="rd-pagehead__actions">${pageheadActionsHtml()}</div>
      </div>
      <div class="rd-stats m-stats" id="ceremony-stats" aria-label="Ceremony summary"></div>
      <div class="rd-sectiontabs" id="ceremony-section-tabs" role="tablist" aria-label="Ceremony sections"></div>
      <div class="rd-toolbar" id="ceremony-toolbar"></div>
      <div class="rd-bulkbar" id="ceremony-bulk-bar" hidden></div>
      <div class="rd-surface">
        <div class="rd-surface__row" id="ceremony-surface-row">
          <div class="rd-surface__main" id="ceremony-view-host">
            <div class="rd-view" id="cer-view-order" data-cer-view="order">
              <div id="ceremony-order-view" class="rd-cer-order"></div>
              <div id="ceremony-unassigned" class="rd-cer-unassigned"></div>
            </div>
            <div class="rd-view" id="cer-view-programme" data-cer-view="programme" hidden>
              <div id="ceremony-programme-view" class="rd-cer-programme"></div>
            </div>
            <div class="rd-view" id="cer-view-script" data-cer-view="script" hidden>
              <div id="ceremony-script-view" class="rd-cer-script"></div>
            </div>
            <div class="rd-view" id="cer-view-section" data-cer-view="section" hidden>
              <div class="rd-table-wrap ued-table-wrap" id="ceremony-section-table"></div>
              <span class="rd-table-foot ued-soft" id="ceremony-section-foot"></span>
            </div>
          </div>
          <div id="ceremony-drawer-slot"></div>
        </div>
      </div>
    </div>`;
    if (typeof window.covenantShell !== 'undefined' && window.covenantShell.drawer) {
      window.covenantShell.drawer();
    }
  }

  function renderCeremonySectionTabs() {
    const host = document.getElementById('ceremony-section-tabs');
    if (!host) return;
    const active = window._cerSection || 'overview';
    const counts = ceremonySectionCounts();
    host.innerHTML = CER_SECTION_TABS.map(tab => {
      const n = tab.id === 'overview' ? '' : (counts[tab.id] || 0);
      const countHtml = n === '' || n == null ? '' : `<span class="rd-sectiontabs__count">${n}</span>`;
      return `<button type="button" class="rd-sectiontabs__item${active === tab.id ? ' is-active' : ''}" role="tab" aria-selected="${active === tab.id}" onclick="rdSetCeremonySection('${tab.id}')">${esc(tab.label)}${countHtml}</button>`;
    }).join('') + `<span class="rd-cer-sectiontabs-note">9 sections</span>`;
  }

  function renderCeremonyStatsRd() {
    const host = document.getElementById('ceremony-stats');
    if (!host) return;
    const f = ceremonyFigures();
    const mode = window._cerMode || 'order';
    const section = window._cerSection || 'overview';

    if (section !== 'overview') {
      if (typeof RdDepth !== 'undefined' && RdDepth.renderStats) {
        RdDepth.renderStats(host, [
          { label: 'Elements', value: String(f.catalogue) },
          { label: 'Ceremony', value: fmtMins(f.ceremonyMins) },
          { label: 'Reception', value: fmtMins(f.receptionMins) },
          { label: 'People named', value: String(f.peopleNamed) },
          { label: 'Unassigned', value: String(f.unassigned), attention: f.unassigned ? 'needs a person' : undefined }
        ]);
        return;
      }
    }

    if (mode === 'programme') {
      if (typeof RdDepth !== 'undefined' && RdDepth.renderStats) {
        RdDepth.renderStats(host, [
          { label: 'Ceremony', value: fmtMins(f.ceremonyMins), attention: f.ceremonyCount + ' elements' },
          { label: 'Evening', value: fmtMins(f.receptionMins), attention: f.receptionCount + ' elements' },
          { label: 'Named participants', value: String(f.peopleNamed) },
          { label: 'Scripts written', value: f.written + ' of ' + Math.max(f.scriptureVow, 1), attention: f.outstanding ? 'vows due 25 Oct' : undefined },
          { label: 'Print class', value: 'B · keepsake' }
        ]);
        return;
      }
    }
    if (mode === 'script') {
      if (typeof RdDepth !== 'undefined' && RdDepth.renderStats) {
        RdDepth.renderStats(host, [
          { label: 'Elements with script', value: String(f.scriptureVow) },
          { label: 'Written', value: String(f.written) },
          { label: 'Outstanding', value: String(f.outstanding), attention: f.outstanding ? 'vows due 25 Oct' : undefined },
          { label: 'Rehearsal', value: '6 Nov', attention: 'only read-through' },
          { label: 'Ceremony total', value: fmtMins(f.ceremonyMins) }
        ]);
        return;
      }
    }
    if (typeof RdDepth !== 'undefined' && RdDepth.renderStats) {
      RdDepth.renderStats(host, [
        { label: 'Elements', value: String(f.elements) },
        { label: 'Ceremony', value: fmtMins(f.ceremonyMins) },
        { label: 'Reception', value: fmtMins(f.receptionMins) },
        { label: 'People named', value: String(f.peopleNamed) },
        { label: 'Unassigned', value: String(f.unassigned), attention: f.unassigned ? 'needs a person' : undefined }
      ]);
      return;
    }
    host.innerHTML = [
      ['Elements', f.elements], ['Ceremony', fmtMins(f.ceremonyMins)],
      ['Reception', fmtMins(f.receptionMins)], ['People named', f.peopleNamed],
      ['Unassigned', f.unassigned]
    ].map(([l, v]) =>
      `<div class="m-stat"><div class="m-stat-label">${esc(l)}</div><div class="m-stat-val">${esc(String(v))}</div></div>`
    ).join('');
  }

  function filterChip(label, field) {
    const ui = window._cerUiFilters || {};
    const cur = ui[field];
    const on = cur && cur !== 'all';
    const chev = '<svg viewBox="0 0 24 24" aria-hidden="true" style="width:1em;height:1em;fill:none;stroke:currentColor;stroke-width:2.2;stroke-linecap:round"><path d="m6 9 6 6 6-6"/></svg>';
    return `<button type="button" class="rd-chip${on ? ' is-active' : ''}" onclick="rdCerCycleFilter('${field}')">${esc(on ? label + ': ' + cur : label + ': all')}`
      + (on ? `<span class="rd-chip__clear" onclick="event.stopPropagation();rdCerClearFilter('${field}')">&#10005;</span>` : chev)
      + '</button>';
  }

  function renderCeremonyToolbar() {
    const host = document.getElementById('ceremony-toolbar');
    if (!host) return;
    const mode = window._cerMode || 'order';
    const section = window._cerSection || 'overview';
    const switcher =
      `<div class="rd-toolbar__right">` +
      `<div class="rd-viewswitch" role="group" aria-label="Ceremony view">` +
      `<button type="button" class="rd-viewswitch__item${mode === 'order' ? ' is-active' : ''}" onclick="rdSetCeremonyView('order')">Order of service</button>` +
      `<button type="button" class="rd-viewswitch__item${mode === 'programme' ? ' is-active' : ''}" onclick="rdSetCeremonyView('programme')">Programme</button>` +
      `<button type="button" class="rd-viewswitch__item${mode === 'script' ? ' is-active' : ''}" onclick="rdSetCeremonyView('script')">Script</button>` +
      `</div></div>`;

    if (section !== 'overview') {
      const dens = window._cerRowHeight || 'compact';
      const colChip = (typeof rdColumnsChipHtml === 'function')
        ? rdColumnsChipHtml(CER_COL_SCOPE)
        : `<button type="button" class="rd-chip" onclick="window.rdColumns&&rdColumns.open('${CER_COL_SCOPE}')">Columns · 5 of 5</button>`;
      host.innerHTML = filterChip('Type', 'type') + filterChip('Person', 'person') +
        colChip +
        `<button type="button" class="rd-chip" onclick="rdCerCycleRowHeight()">Row height · ${esc(dens)}</button>` +
        `<button type="button" class="rd-chip rd-chip--ghost">Auto-fit columns</button>`;
      return;
    }

    let left = '';
    if (mode === 'programme') {
      left = filterChip('Section', 'service') +
        `<button type="button" class="rd-chip${window._cerShowTimes ? ' is-active' : ''}" onclick="rdCerToggleTimes()">Times shown for proofing${window._cerShowTimes ? ' ✕' : ''}</button>` +
        `<span class="rd-cer-toolbar-note">Prints without times</span>`;
    } else if (mode === 'script') {
      left = filterChip('Element', 'element') + filterChip('Author', 'person') +
        `<button type="button" class="rd-chip${window._cerUnwrittenOnly ? ' is-active' : ''}" onclick="rdCerToggleUnwritten()">Unwritten only${window._cerUnwrittenOnly ? ' ✕' : ''}</button>` +
        (typeof rdSortChipHtml === 'function' ? rdSortChipHtml('Reading order', "rdCerOpenSort(this,'reading')") : '<button type="button" class="rd-chip rd-chip--ghost">Reading order</button>');
    } else {
      left = filterChip('Service', 'service') + filterChip('Type', 'type') + filterChip('Person', 'person') +
        (typeof rdSortChipHtml === 'function' ? rdSortChipHtml('Sort by running order', "rdCerOpenSort(this,'order')") : '<button type="button" class="rd-chip rd-chip--ghost">Sort by running order</button>') +
        (typeof rdStandardRightHtml === 'function' ? rdStandardRightHtml('ceremony') : '');
    }
    host.innerHTML = left + switcher;
  }

  function renderBulkBar() {
    const host = document.getElementById('ceremony-bulk-bar');
    if (!host) return;
    const n = window._cerSel.size;
    const section = window._cerSection || 'overview';
    const mode = window._cerMode || 'order';
    const show = n && ((section === 'overview' && mode === 'order') || section !== 'overview');
    if (!show) {
      host.hidden = true;
      host.innerHTML = '';
      return;
    }
    host.hidden = false;
    host.innerHTML =
      `<span class="rd-bulkbar__count">${n} selected</span><span class="rd-bulkbar__sep"></span>` +
      `<button type="button" class="rd-bulkbar__action" onclick="rdCerBulk('person')">Assign person</button>` +
      `<button type="button" class="rd-bulkbar__action" onclick="rdCerBulk('duration')">Set duration</button>` +
      `<button type="button" class="rd-bulkbar__action" onclick="rdCerBulk('reception')">Move to reception</button>` +
      `<button type="button" class="rd-bulkbar__action" onclick="rdCerPrintProgramme()">Print programme</button>` +
      `<button type="button" class="rd-bulkbar__clear" onclick="rdCerBulkClear()">Clear selection</button>`;
  }

  function applyViewMode() {
    const mode = window._cerMode || 'order';
    const section = window._cerSection || 'overview';
    let active = 'order';
    if (section !== 'overview') active = 'section';
    else if (mode === 'programme') active = 'programme';
    else if (mode === 'script') active = 'script';
    ['order', 'programme', 'script', 'section'].forEach(name => {
      const el = document.getElementById('cer-view-' + name);
      if (el) el.hidden = name !== active;
    });
  }

  function rdSetCeremonyView(mode) {
    window._cerSection = 'overview';
    window._cerMode = (mode === 'programme' || mode === 'script') ? mode : 'order';
    renderCeremonyRd();
  }
  function rdSetCeremonySection(id) {
    const ok = CER_SECTION_TABS.some(t => t.id === id);
    window._cerSection = ok ? id : 'overview';
    if (window._cerSection !== 'overview') window._cerMode = 'order';
    renderCeremonyRd();
  }
  function applyCeremonyRailView(viewId) {
    window._cerRailView = viewId || 'both';
    if (typeof setSavedView === 'function') setSavedView('ceremony', window._cerRailView);
    window._cerSection = 'overview';
    window._cerMode = 'order';
    renderCeremonyRd();
  }
  function applyCeremonyGroupBy(g) {
    window._cerGroupBy = g || 'service';
    window._cerSection = window._cerSection === 'overview' ? 'overview' : window._cerSection;
    renderCeremonyRd();
  }

  /* ── Order of service ────────────────────────────────────────────────── */

  function renderOrderView() {
    const host = document.getElementById('ceremony-order-view');
    if (!host) return;
    const els = timedServiceElements().filter(matchesFilters);
    const by = window._cerGroupBy || 'service';

    if (by === 'person') {
      host.innerHTML = renderGroupedList(els, e => e.person || '—', 'person');
      renderUnassigned();
      return;
    }
    if (by === 'type') {
      host.innerHTML = renderGroupedList(els, e => e.type, 'type');
      renderUnassigned();
      return;
    }

    const cer = els.filter(e => e.service === 'ceremony');
    const rec = els.filter(e => e.service === 'reception');
    const f = ceremonyFigures();
    const showCer = (window._cerRailView || 'both') !== 'reception';
    const showRec = (window._cerRailView || 'both') !== 'ceremony';

    let html = '';
    if (showCer) {
      html += serviceBlock('Ceremony', venueName('ceremony'), ceremonyStartMins(), f.ceremonyMins, officiantName(), cer, 'ceremony');
    }
    if (showRec) {
      html += serviceBlock('Reception', venueName('reception'), receptionStartMins(), f.receptionMins, mcName(), rec, 'reception');
    }
    if (!html) html = '<p class="rd-cer-empty">No elements in this view yet. Add an element to build the order of service.</p>';
    host.innerHTML = html;
    renderUnassigned();
  }

  function serviceBlock(label, place, startMins, totalMins, lead, rows, service) {
    const printLabel = service === 'ceremony' ? 'Print order of service' : 'Print run sheet';
    let html =
      `<section class="rd-cer-service">` +
      `<div class="rd-section__head">` +
      `<div class="rd-pagehead__eyebrow">${esc(label)} · ${esc(place)}</div>` +
      `<p class="rd-help">${esc(fmtClock(startMins))} · ${esc(fmtMins(totalMins))} · ${service === 'ceremony' ? 'officiant' : 'MC'} ${esc(lead)}</p>` +
      `<button type="button" class="rd-btn rd-btn--quiet" style="margin-left:auto" onclick="rdCerPrint()">${esc(printLabel)}</button>` +
      `</div>` +
      `<div class="rd-cer-list">`;
    if (!rows.length) {
      html += `<p class="rd-cer-empty">No ${esc(label.toLowerCase())} elements yet.</p>`;
    } else {
      rows.forEach(e => { html += elementRow(e); });
    }
    html += `<button type="button" class="rd-cer-addbtn" onclick="rdCerAdd('${service}')"><span>+</span> Add a ${esc(label.toLowerCase())} element</button>`;
    html += `</div></section>`;
    return html;
  }

  function elementRow(e) {
    const sel = window._cerSel.has(e.id);
    return `<div class="rd-cer-row${sel ? ' is-selected' : ''}${e.needsPerson ? ' is-unassigned' : ''}" data-cer-id="${esc(e.id)}" onclick="rdCerOpenDrawer('${esc(e.id)}')">` +
      `<label class="rd-cer-check" onclick="event.stopPropagation()"><input type="checkbox" ${sel ? 'checked' : ''} onchange="rdCerToggleSel('${esc(e.id)}')"></label>` +
      `<div class="rd-cer-time">${esc(e.startLabel)}</div>` +
      `<div class="rd-cer-person">${esc(e.person)}</div>` +
      `<div class="rd-cer-title">${esc(e.title)}` +
      `<span class="rd-cer-row__actions">` +
      `<button type="button" onclick="event.stopPropagation();rdCerOpenDrawer('${esc(e.id)}')">Open</button>` +
      `<button type="button" onclick="event.stopPropagation();rdCerFullEditor('${esc(e.id)}')">Full editor</button>` +
      `</span></div>` +
      `<div class="rd-cer-len">${esc(e.lengthLabel)}</div>` +
      `</div>`;
  }

  function renderGroupedList(els, keyFn) {
    const map = {};
    els.forEach(e => {
      const k = keyFn(e) || '—';
      if (!map[k]) map[k] = [];
      map[k].push(e);
    });
    return Object.keys(map).sort().map(k =>
      `<section class="rd-cer-service"><div class="rd-section__head"><div class="rd-pagehead__eyebrow">${esc(k)}</div>` +
      `<p class="rd-help">${map[k].length} element${map[k].length === 1 ? '' : 's'}</p></div>` +
      `<div class="rd-cer-list">${map[k].map(elementRow).join('')}</div></section>`
    ).join('') || '<p class="rd-cer-empty">No elements in this grouping.</p>';
  }

  function renderUnassigned() {
    const host = document.getElementById('ceremony-unassigned');
    if (!host) return;
    if ((window._cerRailView || 'both') === 'scripture') { host.innerHTML = ''; return; }
    const list = ceremonyFigures().unassignedList.filter(matchesFilters);
    if (!list.length) { host.innerHTML = ''; return; }
    host.innerHTML =
      `<div class="rd-section__head">` +
      `<div class="rd-pagehead__eyebrow">Still unassigned · ${list.length}</div>` +
      `<p class="rd-help">Each one needs a name before the programme can be printed</p>` +
      `<button type="button" class="rd-btn rd-btn--quiet" style="margin-left:auto" onclick="rdCerAssignAll()">Assign all</button>` +
      `</div>` +
      `<div class="rd-cer-riskgrid">` +
      list.slice(0, 6).map(e =>
        `<article class="rd-cer-riskcard" onclick="rdCerOpenDrawer('${esc(e.id)}')">` +
        `<div class="rd-cer-riskcard__title">${esc(e.title)}</div>` +
        `<div class="rd-cer-riskcard__meta">${esc(e.service === 'ceremony' ? 'Ceremony' : 'Reception')} · ${esc(e.startLabel)}</div>` +
        `<p>${esc(e.notes || 'Needs a person')}</p>` +
        `<span class="status-pill" data-pillscheme="red">Needs a person</span>` +
        `</article>`
      ).join('') +
      `</div>`;
  }

  /* ── Section table (#19a) ─────────────────────────────────────────────── */

  function statusPill(status) {
    const scheme = status === 'Needs a person' || status === 'Open' ? 'red' : 'green';
    return `<span class="status-pill" data-pillscheme="${scheme}">${esc(status)}</span>`;
  }

  function visibleCerColumns() {
    if (window.rdColumns && window.rdColumns.visible) {
      try {
        const vis = window.rdColumns.visible(CER_COL_SCOPE);
        if (Array.isArray(vis) && vis.length) return vis;
      } catch (e) { /* fall through */ }
    }
    return CER_COLUMNS.slice();
  }

  function renderSectionTable() {
    const host = document.getElementById('ceremony-section-table');
    const foot = document.getElementById('ceremony-section-foot');
    if (!host) return;
    const section = window._cerSection || 'overview';
    const tab = CER_SECTION_TABS.find(t => t.id === section) || CER_SECTION_TABS[0];
    let els = elementsForSection(section).filter(matchesFilters);
    const cols = visibleCerColumns();
    const dens = window._cerRowHeight || 'compact';

    const groups = [];
    if (section === 'reception') {
      groups.push({
        label: 'Reception · ' + fmtClock(receptionStartMins()) + ' · ' + els.length + ' element' + (els.length === 1 ? '' : 's'),
        rows: els
      });
    } else if (section === 'worship' || section === 'scripture' || section === 'vows' || section === 'legal' || section === 'processional' || section === 'recessional') {
      const cerRows = els.filter(e => e.service === 'ceremony' || e.src !== 'ceremonyReceptionDetails');
      groups.push({
        label: 'Ceremony · ' + fmtClock(ceremonyStartMins()) + ' · ' + cerRows.length + ' element' + (cerRows.length === 1 ? '' : 's'),
        rows: cerRows
      });
    } else {
      groups.push({
        label: tab.label + ' · ' + els.length + ' element' + (els.length === 1 ? '' : 's'),
        rows: els
      });
    }

    let html = `<table class="rd-cer-table rd-cer-table--${esc(dens)}"><thead><tr><th class="rd-cer-checkcol"></th>` +
      cols.map(c => `<th>${esc(c.label)}</th>`).join('') +
      `</tr></thead><tbody>`;

    if (!els.length) {
      html += `<tr class="rd-cer-empty-row"><td colspan="${cols.length + 1}">No elements in ${esc(tab.label)} yet.</td></tr>`;
    } else {
      groups.forEach(g => {
        if (!g.rows.length) return;
        html += `<tr class="rd-cer-group"><td colspan="${cols.length + 1}">${esc(g.label)}</td></tr>`;
        g.rows.forEach(e => {
          const sel = window._cerSel.has(e.id);
          html += `<tr class="rd-cer-trow${sel ? ' is-selected' : ''}${e.needsPerson ? ' is-unassigned' : ''}" data-cer-id="${esc(e.id)}" onclick="rdCerOpenDrawer('${esc(e.id)}')">` +
            `<td class="rd-cer-checkcol" onclick="event.stopPropagation()"><input type="checkbox" ${sel ? 'checked' : ''} onchange="rdCerToggleSel('${esc(e.id)}')"></td>`;
          cols.forEach(c => {
            if (c.key === 'element') {
              html += `<td><div class="rd-cer-name">${esc(e.title)}</div>` +
                `<div class="rd-cer-row__actions">` +
                `<button type="button" onclick="event.stopPropagation();rdCerOpenDrawer('${esc(e.id)}')">Open</button>` +
                `<button type="button" onclick="event.stopPropagation();rdCerFullEditor('${esc(e.id)}')">Full editor</button>` +
                `</div></td>`;
            } else if (c.key === 'who') html += `<td>${esc(e.person)}</td>`;
            else if (c.key === 'starts') html += `<td>${esc(e.startLabel)}</td>`;
            else if (c.key === 'length') html += `<td>${esc(e.lengthLabel)}</td>`;
            else if (c.key === 'status') html += `<td>${statusPill(e.status)}</td>`;
            else html += `<td>—</td>`;
          });
          html += `</tr>`;
        });
      });
    }
    const addLabel = section === 'reception' ? 'Add a reception element'
      : section === 'processional' ? 'Add a processional entry'
      : section === 'recessional' ? 'Add a recessional entry'
      : section === 'traditions' ? 'Add a tradition'
      : section === 'legal' ? 'Add a checklist item'
      : section === 'scripture' ? 'Add a reading'
      : section === 'vows' ? 'Add a vow detail'
      : 'Add a ceremony element';
    html += `<tr class="rd-cer-add"><td colspan="${cols.length + 1}"><button type="button" class="rd-cer-addbtn" onclick="rdCerAddForSection()"><span>+</span> ${esc(addLabel)}</button></td></tr>`;
    html += `</tbody></table>`;
    host.innerHTML = html;
    if (foot) foot.textContent = els.length + ' element' + (els.length === 1 ? '' : 's') + ' · ' + tab.label;
  }

  /* ── Programme (#31c) ────────────────────────────────────────────────── */

  function renderProgrammeView() {
    const host = document.getElementById('ceremony-programme-view');
    if (!host) return;
    const els = timedServiceElements().filter(matchesFilters);
    const cer = els.filter(e => e.service === 'ceremony');
    const rec = els.filter(e => e.service === 'reception');
    const couple = [data.setup?.bride, data.setup?.groom].filter(Boolean).join(' & ') || 'The Couple';
    const date = data.setup?.weddingDate || data.setup?.date || '';
    const proofDate = new Date();
    const proofLabel = 'Proof · ' + proofDate.toLocaleDateString(undefined, { day: 'numeric', month: 'short', year: 'numeric' });

    function lines(rows) {
      return rows.map(e =>
        `<div class="rd-cer-prog__line">` +
        `<span class="rd-cer-prog__title">${esc(e.title)}</span>` +
        `<span class="rd-cer-prog__who">${esc(e.person !== '—' ? e.person : '')}</span>` +
        (window._cerShowTimes ? `<span class="rd-cer-prog__time">${esc(e.startLabel)}</span>` : '') +
        `</div>`
      ).join('');
    }

    host.innerHTML =
      `<article class="rd-cer-prog">` +
      `<header class="rd-cer-prog__head">` +
      `<div class="rd-cer-prog__names">${esc(couple)}${date ? ' · ' + esc(date) : ''}</div>` +
      `<h2>Order of service</h2>` +
      `</header>` +
      `<section><h3>Order of service</h3>` +
      `<p class="rd-cer-prog__place">${esc(venueName('ceremony'))} · ${esc(fmtClock(ceremonyStartMins()))}</p>` +
      lines(cer) +
      `</section>` +
      `<section><h3>Order of the evening</h3>` +
      `<p class="rd-cer-prog__place">${esc(venueName('reception'))} · ${esc(fmtClock(receptionStartMins()))}</p>` +
      lines(rec) +
      `</section>` +
      `<footer class="rd-cer-prog__foot">${esc(proofLabel)} · Page 1 of 2 · Class B keepsake</footer>` +
      `</article>`;
  }

  /* ── Script (#31d) ───────────────────────────────────────────────────── */

  function renderScriptView() {
    const host = document.getElementById('ceremony-script-view');
    if (!host) return;
    let els = timedServiceElements().filter(e => matchesFilters(e) && (e.isScriptureOrVow || /prayer|ring|homily|welcome|blessing|vow/i.test(e.title)));
    if (!els.length) els = timedServiceElements().filter(e => e.service === 'ceremony' && matchesFilters(e)).slice(0, 6);
    if (!els.length) {
      host.innerHTML = '<p class="rd-cer-empty">No script elements yet. Add vows, scripture, or prayer elements.</p>';
      return;
    }
    host.innerHTML = els.map(e => {
      const sc = scriptFor(e);
      const written = sc.status === 'Written';
      let body = '';
      if (/vow/i.test(e.title) && !written) {
        body =
          `<div class="rd-cer-script__lead">${esc(officiantName())}:</div>` +
          `<p class="rd-cer-script__text">You have come here freely, and before God and these witnesses you will now make your promises to one another.</p>` +
          `<p class="rd-cer-script__placeholder">[Ama speaks first. Her text is not written yet — due to ${esc(officiantName())} by 25 October so it can be read aloud once at the rehearsal on 6 November.]</p>` +
          `<p class="rd-cer-script__placeholder">[Kwesi follows. Also unwritten.]</p>`;
      } else if (written && sc.text) {
        const parts = String(sc.text).split(/\n+/);
        body = parts.map(line => {
          if (/^\[.*\]$/.test(line.trim())) return `<p class="rd-cer-script__placeholder">${esc(line.trim())}</p>`;
          if (/:$/.test(line.trim()) && line.length < 40) return `<div class="rd-cer-script__lead">${esc(line.trim())}</div>`;
          return `<p class="rd-cer-script__text">${esc(line)}</p>`;
        }).join('');
      } else {
        body =
          `<p class="rd-cer-script__placeholder">[${esc(e.person !== '—' ? e.person : 'Speaker')} — text is not written yet` +
          (sc.due ? ' — due ' + esc(sc.due) : '') +
          `.]</p>`;
      }
      let warn = '';
      if (!written && e.type === 'Vows' && e.lengthMins) {
        warn = `<p class="rd-cer-script__warn">${esc(e.lengthMins)} minutes is allowed for this element. Two unwritten vows at three minutes each is the whole allowance — there is no room for an introduction if either text runs long.</p>`;
      }
      return `<article class="rd-cer-script__block" onclick="rdCerOpenDrawer('${esc(e.id)}')">` +
        `<h3>${esc(e.title)}</h3>` +
        body + warn +
        `</article>`;
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

  function renderCeremonyDrawer() {
    const slot = document.getElementById('ceremony-drawer-slot');
    if (!slot) return;
    const shared = document.getElementById('record-drawer');
    if (shared && slot.contains(shared) && !shared.hasAttribute('hidden')) {
      slot.classList.add('is-open');
      return;
    }
    const e = findById(window._cerDrawerId);
    if (!e) {
      if (!(shared && slot.contains(shared) && !shared.hasAttribute('hidden'))) {
        parkSharedDrawerAway(slot);
        slot.innerHTML = '';
        slot.classList.remove('is-open');
      }
      return;
    }
    parkSharedDrawerAway(slot);
    const tab = Math.max(0, Math.min(DRAWER_TABS.length - 1, parseInt(window._cerDrawerTab, 10) || 0));
    const sc = scriptFor(e);
    const same = timedServiceElements().filter(x => x.service === e.service && x.src === e.src);
    const pos = Math.max(1, same.findIndex(x => x.id === e.id) + 1);

    let body = '';
    if (tab === 0) {
      body =
        field('Service', e.service === 'ceremony' ? 'Ceremony' : 'Reception') +
        field('Starts', e.startLabel) +
        field('Duration', e.lengthMins != null ? e.lengthMins + ' minutes' : '—') +
        field('Led by', e.person) +
        field('Type', e.type) +
        field('Position', pos + ' of ' + Math.max(same.length, 1)) +
        `<p class="rd-drawer__note">Duration is the field that matters. Editing it moves every element after it and re-derives the ${fmtMins(ceremonyFigures().ceremonyMins)} ceremony total — the start time is a consequence, not an input.</p>`;
    } else if (tab === 1) {
      body =
        `<p class="rd-drawer__note">${esc(sc.text || 'Nothing written yet, and the rehearsal is the only chance to hear it aloud. One deadline that cannot slip.')}</p>` +
        field('Text status', sc.status) +
        field('Due', sc.due || '—') +
        field('Read at rehearsal', '6 November') +
        (sc.status !== 'Written'
          ? `<p class="rd-drawer__note">Nothing is written yet, and the rehearsal is the only chance to hear it aloud before the day. Twelve weeks of runway, one deadline that cannot slip.</p>`
          : '') +
        `<div class="rd-drawer__section-title">Prints in</div>` +
        field('Order of service', 'Class B keepsake →', "rdSetCeremonyView('programme')") +
        field('Officiant packet', 'Class A →', "rdCerSendOfficiant()") +
        `<button type="button" class="rd-btn" onclick="rdCerWriteVows()">Write the vows</button>`;
    } else if (tab === 2) {
      const people = [];
      if (e.type === 'Vows') {
        const bride = data.setup?.bride || 'Ama Owusu';
        const groom = data.setup?.groom || 'Kwesi Adjei';
        people.push({ name: bride, role: 'Speaks' });
        people.push({ name: groom, role: 'Speaks' });
        people.push({ name: officiantName(), role: 'Officiates' });
      } else {
        if (e.person && e.person !== '—') people.push({ name: e.person, role: e.type === 'Scripture' ? 'Reads' : 'Leads' });
        if (/officiant|pastor|rev/i.test(officiantName()) && !people.some(p => p.name === officiantName())) {
          people.push({ name: officiantName(), role: 'Officiates' });
        }
      }
      body =
        `<div class="rd-drawer__section-title">People · ${people.length || 0}</div>` +
        (people.length ? people.map(p => `<div class="rd-drawer__guest">${esc(p.name)} <span>${esc(p.role)}</span></div>`).join('')
          : '<p class="rd-drawer__note">Nobody named yet.</p>') +
        `<p class="rd-drawer__note">All three are guest records. The officiant is a guest too — accepted, seated, and not charged as a catering cover.</p>` +
        `<div class="rd-drawer__section-title">Elsewhere</div>` +
        field('Wedding Day Timeline', e.startLabel !== '—' ? e.startLabel + ' block →' : 'Open →', "typeof showPanel==='function'&&showPanel('timeline')") +
        field('Shot Lists', e.type === 'Vows' ? 'Vows · 6 shots →' : '—', "typeof showPanel==='function'&&showPanel('shotlist')") +
        field('Entertainment', /music|processional|recessional|prelude|dance|hymn/i.test(e.title) ? 'Linked →' : 'No music here', "typeof showPanel==='function'&&showPanel('entertainment')");
    } else {
      body =
        `<div class="rd-drawer__section-title">This element</div>` +
        `<div class="rd-drawer__hist"><strong>26 Jul</strong> · Kwesi<div>Duration 5 → 6 min</div></div>` +
        `<div class="rd-drawer__hist"><strong>19 Jul</strong> · Ama<div>Placed at ${esc(e.startLabel)}</div></div>` +
        `<div class="rd-drawer__hist"><strong>14 Apr</strong> · Ama<div>Added</div></div>` +
        `<p class="rd-drawer__note">One typed duration pushes later elements and re-derives the ceremony total. One typed field, six derived changes, one log entry.</p>`;
    }

    slot.classList.add('is-open');
    slot.innerHTML =
      `<aside class="rd-drawer rd-cer-drawer" aria-label="Ceremony element">` +
      `<div class="rd-drawer__head">` +
      `<div class="rd-drawer__eyebrow">Ceremony element</div>` +
      `<h2 class="rd-drawer__title">${esc(e.title)}</h2>` +
      `<div class="rd-drawer__chips">` +
      `<span class="status-pill" data-pillscheme="gold">${esc(e.startLabel)}</span>` +
      `<span class="status-pill" data-pillscheme="gold">${esc(e.lengthLabel)}</span>` +
      `</div>` +
      `<button type="button" class="rd-drawer__close" onclick="rdCerCloseDrawer()" aria-label="Close">×</button>` +
      `<div class="rd-drawer__tabs" role="tablist">` +
      DRAWER_TABS.map((label, i) =>
        `<button type="button" class="rd-drawer__tab${i === tab ? ' is-active' : ''}" onclick="rdCerSetDrawerTab(${i})">${esc(label)}</button>`
      ).join('') +
      `</div></div>` +
      `<div class="rd-drawer__body">${body}</div>` +
      `<div class="rd-drawer__foot">` +
      `<button type="button" class="rd-btn rd-btn--primary" onclick="rdCerCloseDrawer()">Save</button>` +
      `<button type="button" class="rd-btn" onclick="rdCerFullEditor('${esc(e.id)}')">Full editor</button>` +
      `</div></aside>`;
  }

  /* ── actions ─────────────────────────────────────────────────────────── */

  function rdCerOpenDrawer(id) {
    window._cerDrawerId = id;
    window._cerDrawerTab = 0;
    renderCeremonyDrawer();
  }
  function rdCerCloseDrawer() {
    window._cerDrawerId = null;
    const slot = document.getElementById('ceremony-drawer-slot');
    if (slot) {
      parkSharedDrawerAway(slot);
      slot.innerHTML = '';
      slot.classList.remove('is-open');
    }
  }
  function rdCerSetDrawerTab(i) {
    window._cerDrawerTab = i;
    renderCeremonyDrawer();
  }
  function rdCerAdd(service) {
    if (service === 'reception' || (window._cerRailView === 'reception') || window._cerSection === 'reception') {
      if (typeof openRecordEditor === 'function') openRecordEditor('ceremonyReceptionDetails');
      else if (typeof addCeremonyReceptionRow === 'function') addCeremonyReceptionRow();
      return;
    }
    if (typeof openRecordEditor === 'function') openRecordEditor('ceremonyOrder');
    else if (typeof addCeremonyOrderRow === 'function') addCeremonyOrderRow();
  }
  function rdCerAddForSection() {
    const section = window._cerSection || 'overview';
    const map = {
      worship: 'ceremonyOrder',
      processional: 'ceremonyProcessional',
      recessional: 'ceremonyRecessional',
      scripture: 'scriptures',
      vows: 'ceremonyVows',
      legal: 'ceremonyChecklist',
      reception: 'ceremonyReceptionDetails',
      traditions: 'ceremonyTraditions',
      overview: 'ceremonyOrder'
    };
    const key = map[section] || 'ceremonyOrder';
    if (typeof openRecordEditor === 'function') openRecordEditor(key);
  }
  function rdCerFullEditor(id) {
    const e = id ? findById(id) : findById(window._cerDrawerId);
    window._cerDrawerId = null;
    const slot = document.getElementById('ceremony-drawer-slot');
    if (slot && !slot.querySelector('#record-drawer')) {
      slot.innerHTML = '';
      slot.classList.remove('is-open');
    }
    if (typeof openRecordEditor === 'function') {
      if (e) openRecordEditor(e.src, e.index);
      else openRecordEditor('ceremonyOrder');
    }
  }
  function rdCerWriteVows() {
    if (typeof ensureCeremonyArrays === 'function') ensureCeremonyArrays();
    if (typeof ensureCeremonyVowsMigrated === 'function') ensureCeremonyVowsMigrated();
    /* Use the planner `data` binding (let), not window.data — ensureArrays()
       may create an empty window.data object that is not the live store. */
    const rows = (typeof data !== 'undefined' && Array.isArray(data.ceremonyVows))
      ? data.ceremonyVows
      : [];
    /* Prefer the seeded "Vow Style" / personal-vows row so Write the vows
       opens editable Detail + Wording fields, not an empty _id-only draft. */
    let idx = rows.findIndex(v => /vow style/i.test(String(v.detail || '')));
    if (idx < 0) idx = rows.findIndex(v => /vow/i.test(String(v.detail || '')));
    if (idx < 0) {
      idx = rows.findIndex(v => /personal vows/i.test(String(v.wording || '')));
    }
    if (typeof openRecordEditor !== 'function') {
      if (typeof addCeremonyVowRow === 'function') addCeremonyVowRow();
      return;
    }
    if (idx >= 0) openRecordEditor('ceremonyVows', idx);
    else openRecordEditor('ceremonyVows', null, { detail: 'Personal Vows', wording: '' });
    requestAnimationFrame(function () {
      const body = document.getElementById('record-editor-body');
      if (!body) return;
      const fields = body.querySelectorAll('.record-editor-field');
      for (let i = 0; i < fields.length; i++) {
        const label = (fields[i].querySelector('label') || {}).textContent || '';
        if (!/wording/i.test(label)) continue;
        const input = fields[i].querySelector('textarea, input');
        if (input) {
          try { input.focus(); if (input.select) input.select(); } catch (e) { /* focus optional */ }
        }
        break;
      }
    });
  }
  function rdCerSendOfficiant() {
    if (typeof openCeremonyProgram === 'function') openCeremonyProgram();
    else rdCerPrint();
  }
  function rdCerPrint() {
    if (typeof openCeremonyProgram === 'function') openCeremonyProgram();
    else if (typeof printCurrentPage === 'function') printCurrentPage();
    else window.print();
  }
  function rdCerPrintProgramme() { rdCerPrint(); }
  function rdCerPrintScript() { rdCerPrint(); }
  function rdCerExport() {
    if (typeof exportSectionCSV === 'function') {
      exportSectionCSV('Ceremony & Reception', timedServiceElements().map(e => ({
        service: e.service, time: e.startLabel, element: e.title, person: e.person, duration: e.lengthLabel, type: e.type
      })));
    }
  }
  function rdCerAssignAll() {
    const first = ceremonyFigures().unassignedList[0];
    if (first) rdCerOpenDrawer(first.id);
  }
  function rdCerCycleFilter(field) {
    const els = allCatalogueElements();
    const options = { all: true };
    if (field === 'service') { options.ceremony = true; options.reception = true; }
    if (field === 'type') els.forEach(e => { options[e.type] = true; });
    if (field === 'person' || field === 'author') els.forEach(e => { if (e.person && e.person !== '—') options[e.person] = true; });
    if (field === 'element') els.forEach(e => { options[e.title] = true; });
    const list = Object.keys(options);
    const key = field === 'author' ? 'person' : field;
    const cur = (window._cerUiFilters || {})[key] || 'all';
    const i = list.indexOf(cur);
    window._cerUiFilters[key] = list[(i + 1) % list.length];
    renderCeremonyRd();
  }
  function rdCerClearFilter(field) {
    const key = field === 'author' ? 'person' : field;
    window._cerUiFilters[key] = 'all';
    renderCeremonyRd();
  }
  function rdCerToggleTimes() {
    window._cerShowTimes = !window._cerShowTimes;
    renderCeremonyRd();
  }
  function rdCerToggleUnwritten() {
    window._cerUnwrittenOnly = !window._cerUnwrittenOnly;
    renderCeremonyRd();
  }
  function rdCerCycleRowHeight() {
    const order = ['compact', 'default', 'comfortable'];
    const i = order.indexOf(window._cerRowHeight || 'compact');
    window._cerRowHeight = order[(i + 1) % order.length];
    renderCeremonyRd();
  }
  function rdCerToggleSel(id) {
    if (window._cerSel.has(id)) window._cerSel.delete(id);
    else window._cerSel.add(id);
    const section = window._cerSection || 'overview';
    if (section !== 'overview') renderSectionTable();
    else renderOrderView();
    renderBulkBar();
  }
  function rdCerBulkClear() {
    window._cerSel.clear();
    const section = window._cerSection || 'overview';
    if (section !== 'overview') renderSectionTable();
    else renderOrderView();
    renderBulkBar();
  }
  async function rdCerBulk(action) {
    const ids = Array.from(window._cerSel);
    if (!ids.length) return;
    if (action === 'person') {
      const val = typeof covPrompt === 'function'
        ? await covPrompt('Assign person', { defaultValue: '', title: 'Person' })
        : window.prompt('Assign person:', '');
      if (val == null) return;
      ids.forEach(id => {
        const e = findById(id);
        if (!e) return;
        e.row.person = val;
        if (e.src === 'scriptures') e.row.reader = val;
        if (e.src === 'ceremonyProcessional' || e.src === 'ceremonyRecessional') e.row.role = val;
      });
    } else if (action === 'duration') {
      const val = typeof covPrompt === 'function'
        ? await covPrompt('Duration in minutes', { defaultValue: '5', title: 'Duration' })
        : window.prompt('Duration (min):', '5');
      if (val == null) return;
      ids.forEach(id => {
        const e = findById(id);
        if (!e) return;
        e.row.length = String(val).replace(/min/i, '').trim() + ' min';
      });
    } else if (action === 'reception') {
      ids.forEach(id => {
        const e = findById(id);
        if (!e || e.src !== 'ceremonyOrder') return;
        ensureArrays();
        data.ceremonyReceptionDetails.push({
          moment: e.title, category: 'Reception', person: e.person === '—' ? '' : e.person,
          timing: e.lengthLabel, notes: e.notes
        });
        data.ceremonyOrder.splice(e.index, 1);
      });
      window._cerSel.clear();
    }
    if (typeof save === 'function') save();
    renderCeremonyRd();
  }

  /* ── main ────────────────────────────────────────────────────────────── */

  function renderCeremonyRd() {
    if (typeof ensureCeremonyArrays === 'function') ensureCeremonyArrays();
    else ensureArrays();
    uedCeremonyShellRd();
    if (typeof renderPageUxChrome === 'function') renderPageUxChrome('ceremony');
    applyViewMode();
    renderCeremonySectionTabs();
    renderCeremonyStatsRd();
    renderCeremonyToolbar();
    renderBulkBar();

    const mode = window._cerMode || 'order';
    const section = window._cerSection || 'overview';
    if (section !== 'overview') renderSectionTable();
    else if (mode === 'programme') renderProgrammeView();
    else if (mode === 'script') renderScriptView();
    else renderOrderView();
    renderCeremonyDrawer();

    if (typeof renderContextSidebar === 'function'
      && document.body.getAttribute('data-active-panel') === 'ceremony'
      && document.body.classList.contains('context-sidebar-mode')) {
      renderContextSidebar('ceremony');
    }
    if (typeof uxRevealPanel === 'function') uxRevealPanel('ceremony');
  }

  window.uedCeremonyShell = uedCeremonyShellRd;
  window.renderCeremonyPage = renderCeremonyRd;
  window.renderCeremonyRd = renderCeremonyRd;
  window.rdSetCeremonyView = rdSetCeremonyView;
  window.rdSetCeremonySection = rdSetCeremonySection;
  window.applyCeremonyRailView = applyCeremonyRailView;
  window.applyCeremonyGroupBy = applyCeremonyGroupBy;
  window.ceremonyRailCounts = ceremonyRailCounts;
  window.ceremonySectionCounts = ceremonySectionCounts;
  window.ceremonyFigures = ceremonyFigures;
  window.rdCerOpenDrawer = rdCerOpenDrawer;
  window.rdCerCloseDrawer = rdCerCloseDrawer;
  window.rdCerSetDrawerTab = rdCerSetDrawerTab;
  window.rdCerAdd = rdCerAdd;
  window.rdCerAddForSection = rdCerAddForSection;
  window.rdCerFullEditor = rdCerFullEditor;
  window.rdCerWriteVows = rdCerWriteVows;
  window.rdCerSendOfficiant = rdCerSendOfficiant;
  window.rdCerPrint = rdCerPrint;
  window.rdCerPrintProgramme = rdCerPrintProgramme;
  window.rdCerPrintScript = rdCerPrintScript;
  window.rdCerExport = rdCerExport;
  window.rdCerAssignAll = rdCerAssignAll;
  window.rdCerCycleFilter = rdCerCycleFilter;
  window.rdCerClearFilter = rdCerClearFilter;
  window.rdCerToggleTimes = rdCerToggleTimes;
  window.rdCerToggleUnwritten = rdCerToggleUnwritten;
  window.rdCerCycleRowHeight = rdCerCycleRowHeight;
  window.rdCerToggleSel = rdCerToggleSel;
  window.rdCerBulkClear = rdCerBulkClear;
  window.rdCerBulk = rdCerBulk;

  window.cerTab = function (name) {
    const map = {
      overview: 'overview',
      order: 'worship',
      processional: 'processional',
      recessional: 'recessional',
      scripture: 'scripture',
      vows: 'vows',
      legal: 'legal',
      checklist: 'legal',
      reception: 'reception',
      traditions: 'traditions'
    };
    if (map[name]) rdSetCeremonySection(map[name]);
    else if (name === 'programme') rdSetCeremonyView('programme');
    else if (name === 'script') rdSetCeremonyView('script');
    else applyCeremonyRailView('both');
  };

  function hookCeremonyPanelRenderer() {
    if (window.SYSTEM_PANEL_RENDERERS) {
      window.SYSTEM_PANEL_RENDERERS.ceremony = function () { renderCeremonyRd(); };
    }
  }
  hookCeremonyPanelRenderer();
  var _showPanelCer = window.showPanel;
  if (typeof _showPanelCer === 'function') {
    window.showPanel = function (id, forceOpen) {
      var out = _showPanelCer.call(window, id, forceOpen);
      hookCeremonyPanelRenderer();
      return out;
    };
  }
})();
