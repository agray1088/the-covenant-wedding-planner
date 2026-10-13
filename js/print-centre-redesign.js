/* Print Centre — All.dc #12d + Views Table / Day-of pack / Preview
   + Dark.dc rail (Everything · Class A · Class B · Printed · Day-of pack).
   Catalog: #print-target-select options + Class B keepsakes + day-of pack items.
   Print via printSharedPage / printCurrentPage / tryCovenantPrintTemplate.
   Persist lightly on data.printCentre = { pack:[], printed:{}, paper:'Letter' }. */
(function () {
  'use strict';

  window._pcMode = window._pcMode || 'table';
  window._pcRailView = window._pcRailView || 'everything';
  window._pcUiFilters = window._pcUiFilters || { class: 'all', source: 'all', status: 'all' };
  window._pcSel = window._pcSel instanceof Set ? window._pcSel : new Set();
  window._pcPreviewId = window._pcPreviewId || null;
  window._pcSort = window._pcSort || 'class';
  window._pcDrawerId = window._pcDrawerId || null;
  window._pcDrawerTab = window._pcDrawerTab || 0;

  const DRAWER_TABS = ['Document', 'Layout', 'Pack', 'History'];

  const CLASS_B_IDS = {
    vision: 1,
    firstmonth: 1,
    rhythms: 1,
    prayer: 1,
    counseling: 1,
    mood: 1,
    packets: 1
  };

  const CLASS_B_EXTRA = [
    { id: 'vision', title: 'Vision & Foundation', source: 'Covenant' },
    { id: 'firstmonth', title: 'First-Month Rhythms', source: 'Covenant' },
    { id: 'rhythms', title: 'First-Month Rhythms', source: 'Covenant', aliasOf: 'firstmonth' },
    { id: 'prayer', title: 'Prayer Journal', source: 'Covenant' },
    { id: 'counseling', title: 'Premarital Counseling record', source: 'Covenant' },
    { id: 'mood', title: 'Vision Board', source: 'Documents' },
    { id: 'packets', title: 'Share Packets', source: 'Documents' }
  ];

  const DAY_OF_DEFAULT = [
    { id: 'timeline', title: 'Wedding day timeline', source: 'Wedding Day Timeline' },
    { id: 'ceremony', title: 'Order of service', source: 'Ceremony & Reception' },
    { id: 'logistics', title: 'Weekend brief', source: 'Weekend Logistics' },
    { id: 'guests-labels', title: 'Address labels', source: 'Guest List' },
    { id: 'essentials', title: 'Essentials checklist', source: 'Essentials Checklist' },
    { id: 'contacts', title: 'Vendor contact sheet', source: 'Contacts' },
    { id: 'tables', title: 'Reception floor plan', source: 'Table Layout' }
  ];

  const DAY_OF_IDS = {
    timeline: 1,
    ceremony: 1,
    logistics: 1,
    guests: 1,
    'guests-labels': 1,
    essentials: 1,
    contacts: 1,
    tables: 1
  };

  const SOURCE_PANEL = {
    vision: 'reflect',
    firstmonth: 'firstmonth',
    rhythms: 'firstmonth',
    contacts: 'vendors',
    'guests-labels': 'guests'
  };

  const PAPER_CYCLE = ['Letter', 'A4', 'Both'];

  const PRINT_ICON = '<svg viewBox="0 0 24 24" aria-hidden="true" style="width:14px;height:14px;fill:none;stroke:currentColor;stroke-width:1.7;stroke-linecap:round;stroke-linejoin:round"><path d="M6 9V4h12v5"/><rect x="4" y="9" width="16" height="7" rx="1"/><path d="M7 16h10v4H7z"/></svg>';

  const esc = s => (typeof escapeHtml === 'function'
    ? escapeHtml(s == null ? '' : String(s))
    : String(s == null ? '' : s).replace(/[&<>"']/g, c => ({
      '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;'
    }[c])));

  function decodeEntities(s) {
    return String(s || '')
      .replace(/&amp;/g, '&')
      .replace(/&lt;/g, '<')
      .replace(/&gt;/g, '>')
      .replace(/&quot;/g, '"')
      .replace(/&#39;/g, "'");
  }

  function todayIso() {
    const d = new Date();
    return d.getFullYear() + '-' + String(d.getMonth() + 1).padStart(2, '0') + '-' + String(d.getDate()).padStart(2, '0');
  }

  function fmtShort(iso) {
    if (!iso) return '—';
    const d = new Date(String(iso).split('T')[0] + 'T00:00:00');
    if (Number.isNaN(d.getTime())) return String(iso);
    return d.toLocaleDateString('en-US', { day: 'numeric', month: 'short' });
  }

  function fmtLong(iso) {
    if (!iso) return '—';
    const d = new Date(String(iso).split('T')[0] + 'T00:00:00');
    if (Number.isNaN(d.getTime())) return String(iso);
    return d.toLocaleDateString('en-US', { day: 'numeric', month: 'long', year: 'numeric' });
  }

  function ensurePc() {
    if (!window.data) window.data = {};
    if (!data.printCentre || typeof data.printCentre !== 'object') data.printCentre = {};
    const pc = data.printCentre;
    if (!Array.isArray(pc.pack)) {
      pc.pack = DAY_OF_DEFAULT.map(x => x.id).filter(id => id !== 'rhythms');
    }
    if (!pc.printed || typeof pc.printed !== 'object') pc.printed = {};
    if (!pc.paper || PAPER_CYCLE.indexOf(pc.paper) < 0) pc.paper = 'Letter';
    return pc;
  }

  function safeLen(key) {
    try {
      const v = data && data[key];
      if (Array.isArray(v)) return v.length;
      if (v && typeof v === 'object') return Object.keys(v).length;
    } catch (e) { /* soft */ }
    return 0;
  }

  function blockedReason(id) {
    const map = {
      timeline: () => !safeLen('timeline') && !safeLen('ceremonyOrder') ? 'No day-of events yet' : '',
      ceremony: () => !safeLen('ceremonyOrder') && !safeLen('ceremony') ? 'Order of service is empty' : '',
      logistics: () => !safeLen('logistics') && !safeLen('weekendLogistics') ? 'Weekend logistics empty' : '',
      guests: () => !safeLen('guests') ? 'No guests on the list' : '',
      'guests-labels': () => !safeLen('guests') ? 'No households to label' : '',
      essentials: () => !safeLen('essentials') ? 'Checklist is empty' : '',
      contacts: () => !safeLen('vendors') ? 'No vendors for a contact sheet' : '',
      tables: () => !safeLen('tables') && !safeLen('seating') ? 'No tables laid out' : '',
      shotlist: () => !safeLen('shotlist') && !safeLen('shots') ? 'Shot list is empty' : '',
      payments: () => !safeLen('payments') ? 'No payment rows' : '',
      budget: () => !safeLen('budget') && !safeLen('budgetCategories') ? 'Budget not started' : '',
      prayer: () => !safeLen('prayer') && !safeLen('prayers') ? 'Prayer journal is empty' : '',
      counseling: () => !safeLen('counseling') && !safeLen('counselingSessions') ? 'No counseling sessions' : '',
      vision: () => {
        const v = (data && data.vision) || {};
        return (v.marriageVision || v.priority1 || v.marriageVerseReference) ? '' : 'Vision fields still blank';
      },
      firstmonth: () => !safeLen('rhythms') && !((data && data.vision) || {}).firstMonth ? 'Rhythms not started' : '',
      rhythms: () => !safeLen('rhythms') ? 'Rhythms not started' : '',
      mood: () => !safeLen('moodItems') && !safeLen('moodPhotos') && !safeLen('visionBoard') ? 'Board is empty' : '',
      packets: () => !safeLen('packets') && !safeLen('vendorPackets') ? 'No packets yet' : '',
      party: () => !safeLen('party') ? 'Wedding party empty' : '',
      vendors: () => !safeLen('vendors') ? 'No vendors' : '',
      catering: () => !safeLen('catering') && !safeLen('menu') ? 'Menu not set' : ''
    };
    const fn = map[id];
    return fn ? (fn() || '') : '';
  }

  function pagesEstimate(id, title) {
    const n = {
      timeline: Math.max(1, Math.ceil(Math.max(safeLen('timeline'), 8) / 14)),
      guests: Math.max(1, Math.ceil(Math.max(safeLen('guests'), 1) / 28)),
      'guests-labels': Math.max(1, Math.ceil(Math.max(safeLen('guests'), 1) / 30)),
      budget: 2,
      payments: Math.max(1, Math.ceil(Math.max(safeLen('payments'), 1) / 20)),
      vendors: Math.max(1, Math.ceil(Math.max(safeLen('vendors'), 1) / 12)),
      contacts: Math.max(1, Math.ceil(Math.max(safeLen('vendors'), 1) / 14)),
      tables: 2,
      ceremony: 2,
      prayer: Math.max(1, Math.ceil(Math.max(safeLen('prayer'), 2) / 6)),
      counseling: Math.max(1, Math.ceil(Math.max(safeLen('counseling'), 1) / 4)),
      vision: 2,
      firstmonth: 2,
      rhythms: 2,
      mood: 1,
      packets: Math.max(1, Math.ceil(Math.max(safeLen('packets'), 1) / 3)),
      essentials: Math.max(1, Math.ceil(Math.max(safeLen('essentials'), 1) / 22)),
      shotlist: Math.max(1, Math.ceil(Math.max(safeLen('shotlist'), safeLen('shots'), 1) / 18)),
      logistics: 2,
      tasks: Math.max(1, Math.ceil(Math.max(safeLen('tasks'), 1) / 22))
    };
    if (n[id]) return n[id];
    if (/label|place card|menu/i.test(title || '')) return Math.max(1, Math.ceil(Math.max(safeLen('guests'), 10) / 40));
    return 1;
  }

  function sourceLabelFromOption(id, optionText) {
    const t = decodeEntities(optionText || '').trim();
    if (t) return t;
    const fallback = {
      vision: 'Covenant',
      firstmonth: 'Covenant',
      rhythms: 'Covenant',
      contacts: 'Contacts',
      'guests-labels': 'Guest List'
    };
    return fallback[id] || id;
  }

  function selectOptions() {
    const sel = document.getElementById('print-target-select');
    if (!sel) return [];
    return Array.from(sel.querySelectorAll('option')).map(opt => ({
      id: String(opt.value || '').trim(),
      title: decodeEntities(opt.textContent || opt.value || '').trim(),
      source: decodeEntities(opt.textContent || opt.value || '').trim()
    })).filter(x => x.id && x.id !== 'current' && x.id !== 'print-centre');
  }

  function catalogMap() {
    const pc = ensurePc();
    const map = new Map();

    function upsert(raw, extras) {
      if (!raw || !raw.id) return;
      if (raw.aliasOf && map.has(raw.aliasOf)) return;
      const id = raw.id;
      const prev = map.get(id) || {};
      const title = String(raw.title || prev.title || id).trim();
      const source = String(raw.source || prev.source || title).trim();
      const isB = !!(CLASS_B_IDS[id] || (extras && extras.class === 'B') || prev.class === 'B');
      const dayOfDefault = !!(DAY_OF_IDS[id] || (extras && extras.dayOf) || prev.dayOf);
      const inPack = pc.pack.indexOf(id) >= 0;
      const reason = blockedReason(id);
      let status = 'Ready';
      if (pc.printed[id]) status = 'Printed';
      else if (reason) status = 'Blocked';
      map.set(id, {
        id: id,
        title: title,
        source: source,
        class: isB ? 'B' : 'A',
        status: status,
        dayOf: dayOfDefault || inPack,
        paper: pc.paper || 'Letter',
        pages: pagesEstimate(id, title),
        lastPrinted: pc.printed[id] || '',
        blockedReason: reason,
        printTarget: SOURCE_PANEL[id] || id
      });
    }

    selectOptions().forEach(o => {
      upsert({
        id: o.id,
        title: o.title,
        source: sourceLabelFromOption(o.id, o.source)
      }, { class: CLASS_B_IDS[o.id] ? 'B' : 'A', dayOf: !!DAY_OF_IDS[o.id] });
    });

    CLASS_B_EXTRA.forEach(o => upsert(o, { class: 'B' }));
    DAY_OF_DEFAULT.forEach(o => upsert(o, { dayOf: true, class: CLASS_B_IDS[o.id] ? 'B' : 'A' }));

    /* Ensure pack membership marks dayOf even for non-default items. */
    pc.pack.forEach(id => {
      if (map.has(id)) map.get(id).dayOf = true;
    });

    return map;
  }

  function allPrintables() {
    return Array.from(catalogMap().values());
  }

  function pcFigures() {
    const items = allPrintables();
    const classA = items.filter(x => x.class === 'A');
    const classB = items.filter(x => x.class === 'B');
    const printed = items.filter(x => x.status === 'Printed');
    const blocked = items.filter(x => x.status === 'Blocked');
    const dayOf = items.filter(x => x.dayOf);
    const pack = ensurePc().pack
      .map(id => items.find(x => x.id === id))
      .filter(Boolean);
    const packReady = pack.filter(x => x.status === 'Ready' || x.status === 'Printed');
    const packBlocked = pack.filter(x => x.status === 'Blocked');
    return {
      everything: items.length,
      classA: classA.length,
      classB: classB.length,
      printed: printed.length,
      blocked: blocked.length,
      dayOf: dayOf.length,
      dayOfReady: packReady.length,
      dayOfTotal: pack.length || dayOf.length,
      packBlocked: packBlocked.length,
      paper: ensurePc().paper || 'Letter',
      items: items
    };
  }

  function pcRailCounts() {
    const f = pcFigures();
    return {
      everything: f.everything,
      all: f.everything,
      classA: f.classA,
      classB: f.classB,
      printed: f.printed,
      dayof: f.dayOfTotal,
      dayOf: f.dayOfTotal
    };
  }

  function matchesRail(x) {
    const v = window._pcRailView || 'everything';
    if (!v || v === 'everything' || v === 'all') return true;
    if (v === 'classA') return x.class === 'A';
    if (v === 'classB') return x.class === 'B';
    if (v === 'printed') return x.status === 'Printed';
    if (v === 'dayof' || v === 'dayOf') return x.dayOf;
    return true;
  }

  function matchesFilters(x) {
    if (!matchesRail(x)) return false;
    const ui = window._pcUiFilters || {};
    if (ui.class && ui.class !== 'all') {
      const want = String(ui.class).toUpperCase().replace(/[^AB]/g, '');
      if (want && x.class !== want) return false;
    }
    if (ui.source && ui.source !== 'all' && x.source.toLowerCase() !== String(ui.source).toLowerCase()) return false;
    if (ui.status && ui.status !== 'all' && x.status.toLowerCase() !== String(ui.status).toLowerCase()) return false;
    return true;
  }

  function filteredPrintables() {
    const items = allPrintables().filter(matchesFilters);
    const sort = window._pcSort || 'class';
    items.sort((a, b) => {
      if (sort === 'status') return a.status.localeCompare(b.status) || a.title.localeCompare(b.title);
      if (sort === 'source') return a.source.localeCompare(b.source) || a.title.localeCompare(b.title);
      if (sort === 'title') return a.title.localeCompare(b.title);
      if (a.class !== b.class) return a.class < b.class ? -1 : 1;
      return a.title.localeCompare(b.title);
    });
    return items;
  }

  function statusPill(status) {
    let scheme = 'green';
    if (status === 'Blocked') scheme = 'red';
    else if (status === 'Printed') scheme = 'gold';
    else if (status === 'Ready') scheme = 'green';
    else scheme = 'gray';
    return `<span class="status-pill" data-pillscheme="${scheme}">${esc(status)}</span>`;
  }

  function classPill(cls) {
    const scheme = cls === 'B' ? 'gold' : 'blue';
    const label = cls === 'B' ? 'Class B' : 'Class A';
    return `<span class="status-pill" data-pillscheme="${scheme}">${esc(label)}</span>`;
  }

  function persistPc(soft) {
    ensurePc();
    if (!soft && typeof save === 'function') save();
  }

  function markPrinted(ids) {
    const pc = ensurePc();
    const list = Array.isArray(ids) ? ids : [ids];
    const stamp = todayIso();
    list.forEach(id => { if (id) pc.printed[id] = stamp; });
    persistPc();
  }

  /* ── printing ─────────────────────────────────────────────────────────── */

  function printPrintable(id, opts) {
    const item = allPrintables().find(x => x.id === id) || { id: id, printTarget: SOURCE_PANEL[id] || id };
    const target = item.printTarget || id;
    const quiet = opts && opts.quiet;

    function done() {
      markPrinted(id);
      if (!quiet) renderPrintCentreRd();
    }

    try {
      if (id === 'vision' || target === 'vision') {
        if (typeof buildVisionFoundationPrintSheets === 'function' && typeof openCovenantPrintTemplate === 'function') {
          openCovenantPrintTemplate(buildVisionFoundationPrintSheets());
          done();
          return true;
        }
        if (typeof tryCovenantPrintTemplate === 'function') {
          window._rflTab = 'vision';
          if (tryCovenantPrintTemplate('reflect')) { done(); return true; }
        }
      }
      if (id === 'firstmonth' || id === 'rhythms' || target === 'firstmonth' || target === 'rhythms') {
        if (typeof buildRhythmsPrintSheets === 'function' && typeof openCovenantPrintTemplate === 'function') {
          openCovenantPrintTemplate(buildRhythmsPrintSheets());
          done();
          return true;
        }
        if (typeof tryCovenantPrintTemplate === 'function') {
          window._rflTab = 'rhythms';
          if (tryCovenantPrintTemplate('reflect')) { done(); return true; }
        }
      }
      if (typeof tryCovenantPrintTemplate === 'function' && tryCovenantPrintTemplate(target)) {
        done();
        return true;
      }
      if (typeof printSharedPage === 'function') {
        printSharedPage(target);
        done();
        return true;
      }
      const sel = document.getElementById('print-target-select');
      if (sel && Array.from(sel.options).some(o => o.value === target)) {
        sel.value = target;
        if (typeof printSelectedSection === 'function') {
          printSelectedSection();
          done();
          return true;
        }
        if (typeof showPanel === 'function') showPanel(target);
        setTimeout(() => {
          if (typeof printCurrentPage === 'function') printCurrentPage();
          else window.print();
          done();
        }, 160);
        return true;
      }
      window.print();
      done();
      return true;
    } catch (err) {
      if (typeof console !== 'undefined') console.error('Print Centre print failed:', err);
      if (typeof printSharedPage === 'function') {
        printSharedPage(target);
        done();
        return true;
      }
      window.print();
      done();
      return false;
    }
  }

  function printSelection() {
    const ids = Array.from(window._pcSel);
    if (!ids.length) {
      const focus = window._pcPreviewId || (filteredPrintables()[0] && filteredPrintables()[0].id);
      if (focus) printPrintable(focus);
      else if (typeof printCurrentPage === 'function') printCurrentPage();
      else window.print();
      return;
    }
    printSequence(ids);
  }

  function printSequence(ids) {
    const list = (ids || []).slice();
    if (!list.length) {
      window.print();
      return;
    }
    let i = 0;
    function next() {
      if (i >= list.length) {
        renderPrintCentreRd();
        return;
      }
      const id = list[i++];
      printPrintable(id, { quiet: true });
      setTimeout(next, 700);
    }
    next();
  }

  function exportAllPDF() {
    const items = filteredPrintables();
    if (!items.length) {
      window.print();
      return;
    }
    if (items.length === 1) {
      printPrintable(items[0].id);
      return;
    }
    /* Sequential print jobs — browser PDF dialog per sheet when no bulk binder exists. */
    printSequence(items.map(x => x.id));
  }

  function printDayOfPack() {
    const pc = ensurePc();
    const ids = pc.pack.slice();
    if (!ids.length) {
      if (typeof showToast === 'function') showToast('Day-of pack is empty', 'warn');
      return;
    }
    printSequence(ids);
  }

  function togglePaperSize() {
    const pc = ensurePc();
    const i = PAPER_CYCLE.indexOf(pc.paper || 'Letter');
    pc.paper = PAPER_CYCLE[(i + 1) % PAPER_CYCLE.length];
    persistPc();
    renderPrintCentreRd();
  }

  function setPaperSize(paper) {
    const pc = ensurePc();
    pc.paper = PAPER_CYCLE.indexOf(paper) >= 0 ? paper : 'Letter';
    persistPc();
    renderPrintCentreRd();
  }

  /* ── shell ───────────────────────────────────────────────────────────── */

  function pageheadActionsHtml() {
    const paper = ensurePc().paper || 'Letter';
    return ''
      + `<button type="button" class="rd-btn" onclick="togglePaperSize()">Paper: ${esc(paper)}</button>`
      + `<button type="button" class="rd-btn" onclick="rdPcPrintSection()">${PRINT_ICON}Print section</button>`
      + `<button type="button" class="rd-btn" onclick="exportAllPDF()">Export all as PDF</button>`
      + `<button type="button" class="rd-btn rd-btn--primary" onclick="printSelection()">Print selection</button>`;
  }

  function uedPrintCentreShellRd() {
    const panel = document.getElementById('panel-print-centre');
    if (!panel) return;
    panel.classList.add('ued-scope', 'print-centre-mockup');
    if (panel.dataset.uedShell === 'pc-rd12d') {
      const actions = panel.querySelector('.rd-pagehead__actions');
      if (actions) actions.innerHTML = pageheadActionsHtml();
      return;
    }
    panel.dataset.uedShell = 'pc-rd12d';
    panel.innerHTML = `<div class="rd-page">
      <div class="rd-pagehead">
        <div>
          <div class="rd-pagehead__eyebrow">Documents</div>
          <div class="rd-pagehead__title-row">
            <h1 class="rd-pagehead__title">Print Centre</h1>
          </div>
        </div>
        <div class="rd-pagehead__actions">${pageheadActionsHtml()}</div>
      </div>
      <div class="rd-stats m-stats" id="print-centre-stats" aria-label="Print Centre summary"></div>
      <div class="rd-toolbar" id="print-centre-toolbar"></div>
      <div class="rd-bulkbar" id="print-centre-bulk-bar" hidden></div>
      <div class="rd-surface">
        <div class="rd-surface__row" id="print-centre-surface-row">
          <div class="rd-surface__main" id="print-centre-view-host">
            <div class="rd-view" id="pc-view-table" data-pc-view="table"></div>
            <div class="rd-view" id="pc-view-dayof" data-pc-view="dayof" hidden></div>
            <div class="rd-view" id="pc-view-preview" data-pc-view="preview" hidden></div>
          </div>
          <div id="print-centre-drawer-slot"></div>
        </div>
      </div>
    </div>`;
    if (typeof window.covenantShell !== 'undefined' && window.covenantShell.drawer) {
      window.covenantShell.drawer();
    }
  }

  function renderPcStatsRd() {
    const host = document.getElementById('print-centre-stats') || document.getElementById('print-stats');
    if (!host) return;
    const f = pcFigures();
    const stats = [
      { label: 'Everything', value: String(f.everything) },
      { label: 'Class A', value: String(f.classA) },
      { label: 'Class B', value: String(f.classB) },
      { label: 'Printed', value: String(f.printed) },
      {
        label: 'Day-of pack ready',
        value: f.dayOfReady + ' of ' + f.dayOfTotal,
        attention: f.packBlocked ? (f.packBlocked + ' blocked') : undefined
      }
    ];
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

  function filterChip(label, field) {
    const ui = window._pcUiFilters || {};
    const cur = ui[field] || 'all';
    const on = cur && cur !== 'all';
    const chev = '<svg viewBox="0 0 24 24" aria-hidden="true" style="width:1em;height:1em;fill:none;stroke:currentColor;stroke-width:2.2;stroke-linecap:round"><path d="m6 9 6 6 6-6"/></svg>';
    return `<button type="button" class="rd-chip${on ? ' is-active' : ''}" onclick="rdPcCycleFilter('${field}')">${esc(on ? label + ': ' + cur : label + ': all')}`
      + (on ? `<span class="rd-chip__clear" onclick="event.stopPropagation();rdPcClearFilter('${field}')">&#10005;</span>` : chev)
      + '</button>';
  }

  function renderPcToolbar() {
    const host = document.getElementById('print-centre-toolbar');
    if (!host) return;
    const mode = window._pcMode || 'table';
    const preview = allPrintables().find(x => x.id === window._pcPreviewId) || filteredPrintables()[0];
    let left = '';
    if (mode === 'preview') {
      left = `<span class="rd-chip is-active">Document: ${esc(preview ? preview.title : '—')}</span>`
        + `<span class="rd-chip">Class ${esc(preview ? preview.class : '—')}</span>`
        + `<span class="rd-chip">Paper: ${esc(ensurePc().paper)}</span>`;
    } else if (mode === 'dayof') {
      const f = pcFigures();
      left = `<span class="rd-chip is-active">Day-of pack · ${f.dayOfTotal}</span>`
        + `<span class="rd-chip">${f.dayOfReady} ready</span>`
        + (f.packBlocked ? `<span class="rd-chip is-active">${f.packBlocked} blocked</span>` : '');
    } else {
      left = filterChip('Class', 'class') + filterChip('Source', 'source') + filterChip('Status', 'status')
        + `<button type="button" class="rd-chip rd-chip--ghost" onclick="rdPcCycleSort()">Sort by ${esc(window._pcSort || 'class')}</button>`;
    }
    host.innerHTML = left
      + `<div class="rd-toolbar__right">`
      + `<div class="rd-viewswitch" role="group" aria-label="Print Centre view">`
      + `<button type="button" class="rd-viewswitch__item${mode === 'table' ? ' is-active' : ''}" onclick="rdSetPrintCentreView('table')">Table</button>`
      + `<button type="button" class="rd-viewswitch__item${mode === 'dayof' ? ' is-active' : ''}" onclick="rdSetPrintCentreView('dayof')">Day-of pack</button>`
      + `<button type="button" class="rd-viewswitch__item${mode === 'preview' ? ' is-active' : ''}" onclick="rdSetPrintCentreView('preview')">Preview</button>`
      + `</div></div>`;
  }

  function renderPcBulk() {
    const host = document.getElementById('print-centre-bulk-bar');
    if (!host) return;
    const n = window._pcSel.size;
    if (!n || window._pcMode === 'preview') {
      host.hidden = true;
      host.innerHTML = '';
      return;
    }
    host.hidden = false;
    host.innerHTML =
      `<span class="rd-bulkbar__count">${n} selected</span><span class="rd-bulkbar__sep"></span>`
      + `<button type="button" class="rd-bulkbar__action" onclick="rdPcBulk('pack')">Add to day-of pack</button>`
      + `<button type="button" class="rd-bulkbar__action" onclick="rdPcBulk('paper')">Set paper size</button>`
      + `<button type="button" class="rd-bulkbar__action" onclick="rdPcBulk('print')">Print selected</button>`
      + `<button type="button" class="rd-bulkbar__action" onclick="rdPcBulk('pdf')">Export as one PDF</button>`
      + `<button type="button" class="rd-bulkbar__clear" onclick="rdPcBulkClear()">Clear selection</button>`;
  }

  function applyViewMode() {
    const mode = window._pcMode || 'table';
    ['table', 'dayof', 'preview'].forEach(name => {
      const el = document.getElementById('pc-view-' + name);
      if (el) el.hidden = name !== mode;
    });
  }

  function rdSetPrintCentreView(mode) {
    window._pcMode = (mode === 'dayof' || mode === 'preview') ? mode : 'table';
    renderPrintCentreRd();
  }

  function applyPrintCentreRailView(viewId) {
    const allowed = { everything: 1, all: 1, classA: 1, classB: 1, printed: 1, dayof: 1, dayOf: 1 };
    let v = viewId || 'everything';
    if (v === 'all') v = 'everything';
    if (v === 'dayOf') v = 'dayof';
    window._pcRailView = allowed[v] ? (v === 'all' ? 'everything' : v) : 'everything';
    if (typeof setSavedView === 'function') setSavedView('print-centre', window._pcRailView);
    if (window._pcRailView === 'dayof') window._pcMode = 'dayof';
    else window._pcMode = 'table';
    renderPrintCentreRd();
  }

  /* ── Table ────────────────────────────────────────────────────────────── */

  function groupPrintables(items) {
    const a = items.filter(x => x.class === 'A');
    const b = items.filter(x => x.class === 'B');
    const groups = [];
    if (a.length) groups.push({ key: 'Class A · working documents', items: a });
    if (b.length) groups.push({ key: 'Class B · keepsakes', items: b });
    return groups;
  }

  function renderTableView() {
    const host = document.getElementById('pc-view-table');
    if (!host) return;
    const items = filteredPrintables();
    if (!items.length) {
      host.innerHTML = `<div class="rd-pc-empty"><h3>No printables in this view</h3>`
        + `<p>Clear a filter or switch the rail view to see the catalog.</p></div>`;
      return;
    }
    const groups = groupPrintables(items);
    let html = `<div class="rd-table-wrap ued-table-wrap" id="print-centre-table">`
      + `<table class="rd-pc-table"><thead><tr>`
      + `<th class="rd-pc-check"></th><th>Document</th><th>Source page</th><th>Pages</th><th>Last printed</th><th>Status</th>`
      + `</tr></thead><tbody>`;

    groups.forEach(g => {
      html += `<tr class="rd-pc-group"><td colspan="6"><span>${esc(g.key)} · ${g.items.length}</span></td></tr>`;
      g.items.forEach(x => {
        const sel = window._pcSel.has(x.id);
        const open = window._pcPreviewId === x.id;
        html += `<tr class="rd-pc-row${sel ? ' is-selected' : ''}${open ? ' is-open' : ''}" onclick="rdPcOpenDrawer('${esc(x.id)}')">`
          + `<td class="rd-pc-check" onclick="event.stopPropagation();rdPcToggleSel('${esc(x.id)}')">`
          + `<input type="checkbox" ${sel ? 'checked' : ''} aria-label="Select ${esc(x.title)}"></td>`
          + `<td class="rd-pc-name">${esc(x.title)}`
          + `<span class="rd-pc-row__actions">`
          + `<button type="button" class="rd-btn rd-btn--quiet" onclick="event.stopPropagation();rdPcSelectPreview('${esc(x.id)}');rdSetPrintCentreView('preview')">Preview</button>`
          + `<button type="button" class="rd-btn rd-btn--quiet" onclick="event.stopPropagation();rdPcPrintOne('${esc(x.id)}')">Print</button>`
          + `</span></td>`
          + `<td>${esc(x.source)}</td>`
          + `<td>${x.pages}</td>`
          + `<td>${esc(fmtShort(x.lastPrinted))}</td>`
          + `<td>${statusPill(x.status)}</td>`
          + `</tr>`;
      });
    });
    html += `</tbody></table></div>`;

    const preview = items.find(x => x.id === window._pcPreviewId) || items[0];
    if (preview) {
      window._pcPreviewId = preview.id;
      html += `<section class="rd-pc-inline-preview">`
        + `<div class="rd-pc-inline-preview__head">`
        + `<div><div class="rd-pagehead__eyebrow">Preview · ${esc(preview.title)}</div>`
        + `<p class="rd-help">Class ${esc(preview.class)} · ${esc(preview.paper)} · ${preview.pages} page${preview.pages === 1 ? '' : 's'}</p></div>`
        + `<button type="button" class="rd-btn" onclick="rdPcPrintOne('${esc(preview.id)}')">Open print view</button>`
        + `</div>`
        + `<div class="rd-pc-inline-preview__meta">`
        + `<div><span>Source</span><strong>${esc(preview.source)}</strong></div>`
        + `<div><span>Status</span><strong>${esc(preview.status)}</strong></div>`
        + `<div><span>Day-of pack</span><strong>${preview.dayOf ? 'Yes' : 'No'}</strong></div>`
        + `<div><span>Last printed</span><strong>${esc(fmtLong(preview.lastPrinted))}</strong></div>`
        + `</div>`
        + (preview.blockedReason
          ? `<div class="rd-pc-callout"><strong>Blocked</strong><p>${esc(preview.blockedReason)}</p></div>`
          : `<p class="rd-help">${preview.class === 'B'
            ? 'Class B keeps Cormorant and gold hairlines — a keepsake, not a working sheet.'
            : 'Class A prints black on white with repeating headers for the day itself.'}</p>`)
        + `</section>`;
    }
    host.innerHTML = html;
  }

  /* ── Day-of pack ──────────────────────────────────────────────────────── */

  function packItemsOrdered() {
    const pc = ensurePc();
    const catalog = catalogMap();
    const ordered = [];
    pc.pack.forEach(id => {
      if (catalog.has(id)) ordered.push(catalog.get(id));
    });
    /* Include day-of defaults not yet in pack persistence for visibility. */
    allPrintables().forEach(x => {
      if (x.dayOf && !ordered.some(o => o.id === x.id)) ordered.push(x);
    });
    return ordered;
  }

  function renderDayOfView() {
    const host = document.getElementById('pc-view-dayof');
    if (!host) return;
    const pack = packItemsOrdered();
    const f = pcFigures();
    let html = `<div class="rd-section__head">`
      + `<div class="rd-pagehead__eyebrow">Day-of pack · ${pack.length} documents</div>`
      + `<p class="rd-help">Printed as one job, in this order.</p>`
      + `<button type="button" class="rd-btn rd-btn--primary" style="margin-left:auto" onclick="printDayOfPack()">Print the pack</button>`
      + `</div>`;

    if (!pack.length) {
      html += `<div class="rd-pc-empty"><p>Nothing in the day-of pack yet. Select printables in the table and add them.</p>`
        + `<button type="button" class="rd-btn" onclick="rdSetPrintCentreView('table')">Back to table</button></div>`;
      host.innerHTML = html;
      return;
    }

    html += `<div class="rd-grid-2" id="print-dayof-pack">`;
    pack.forEach((x, idx) => {
      const n = String(idx + 1).padStart(2, '0');
      html += `<article class="rd-pc-packcard${x.status === 'Blocked' ? ' is-blocked' : ''}" onclick="rdPcSelectPreview('${esc(x.id)}');rdSetPrintCentreView('preview')">`
        + `<div class="rd-pc-packcard__num">${n}</div>`
        + `<div class="rd-pc-packcard__main">`
        + `<h3>${esc(x.title)}</h3>`
        + `<p>${esc(x.source)} · Class ${esc(x.class)} · ${x.pages} page${x.pages === 1 ? '' : 's'}</p>`
        + `</div>`
        + `<div class="rd-pc-packcard__status">${statusPill(x.status)}</div>`
        + `<button type="button" class="rd-btn rd-btn--quiet" onclick="event.stopPropagation();rdPcPrintOne('${esc(x.id)}')">Print</button>`
        + `</article>`;
    });
    html += `</div>`;
    html += `<p class="rd-help" style="margin-top:12px">${f.dayOfReady} of ${pack.length} ready`
      + (f.packBlocked ? ` · ${f.packBlocked} blocked` : '')
      + ` · Paper ${esc(f.paper)}</p>`;
    host.innerHTML = html;
  }

  /* ── Preview ──────────────────────────────────────────────────────────── */

  function coupleLine() {
    const s = (window.data && data.setup) || {};
    const bride = String(s.brideFirst || s.bride || 'Bride').trim() || 'Bride';
    const groom = String(s.groomFirst || s.groom || 'Groom').trim() || 'Groom';
    const date = s.weddingDate || s.date || '';
    let dateLabel = '';
    if (date) {
      const d = new Date(String(date).split('T')[0] + 'T00:00:00');
      if (!Number.isNaN(d.getTime())) {
        dateLabel = d.toLocaleDateString('en-US', { day: 'numeric', month: 'short', year: 'numeric' });
      }
    }
    return bride + ' & ' + groom + (dateLabel ? ' · ' + dateLabel : '');
  }

  function renderPreviewView() {
    const host = document.getElementById('pc-view-preview');
    if (!host) return;
    const items = filteredPrintables();
    const x = items.find(i => i.id === window._pcPreviewId)
      || allPrintables().find(i => i.id === window._pcPreviewId)
      || items[0]
      || allPrintables()[0];
    if (!x) {
      host.innerHTML = `<div class="rd-pc-empty"><p>No printable selected.</p></div>`;
      return;
    }
    window._pcPreviewId = x.id;
    const inPack = ensurePc().pack.indexOf(x.id) >= 0;
    host.innerHTML = `<div class="rd-pc-preview">`
      + `<div class="rd-pc-preview__sheet">`
      + `<div class="rd-pc-preview__eyebrow">Preview · ${esc(x.title)}</div>`
      + `<div class="rd-pc-preview__chips">${classPill(x.class)}${statusPill(x.status)}`
      + `<span class="status-pill" data-pillscheme="gray">${esc(x.paper)} · ${x.pages} page${x.pages === 1 ? '' : 's'}</span></div>`
      + `<h2>${esc(x.title)}</h2>`
      + `<p class="rd-help">${esc(coupleLine())}</p>`
      + `<div class="rd-pc-preview__body">`
      + `<p>Source page: <strong>${esc(x.source)}</strong></p>`
      + `<p>${x.class === 'B'
        ? 'Keepsake layout — Cormorant display, gold hairlines, meant to keep.'
        : 'Working document — black on white, repeating headers, built for the day.'}</p>`
      + (x.blockedReason ? `<p class="rd-pc-preview__warn"><strong>Blocked:</strong> ${esc(x.blockedReason)}</p>` : '')
      + `<p>Last printed: ${esc(fmtLong(x.lastPrinted))}</p>`
      + `</div>`
      + `<div class="rd-pc-preview__actions">`
      + `<button type="button" class="rd-btn rd-btn--primary" onclick="rdPcPrintOne('${esc(x.id)}')">Open print view</button>`
      + `<button type="button" class="rd-btn" onclick="rdPcOpenSource('${esc(x.id)}')">Open source page</button>`
      + `<button type="button" class="rd-btn" onclick="rdPcTogglePack('${esc(x.id)}')">${inPack ? 'Remove from day-of pack' : 'Add to day-of pack'}</button>`
      + `</div></div>`
      + `<aside class="rd-pc-preview__side">`
      + `<div class="rd-drawer__section-title">Printable · class ${esc(x.class)}</div>`
      + fieldPlain('Document', x.title)
      + fieldPlain('Class', x.class === 'B' ? 'B · keepsake' : 'A · working document')
      + fieldPlain('Paper', (x.paper || 'Letter') + (x.paper === 'Both' ? '' : ' · A4 aware'))
      + fieldPlain('Pages', String(x.pages))
      + fieldPlain('Last printed', fmtLong(x.lastPrinted))
      + fieldPlain('Day-of pack', inPack || x.dayOf ? 'Included' : 'Not in pack')
      + `<p class="rd-drawer__note">${x.class === 'B'
        ? 'Class B never masquerades as a working sheet. If shared, the recipient still gets the keepsake treatment.'
        : 'Class A never prints gold or fills. Share-packet recipients get the same working document.'}</p>`
      + `</aside></div>`;
  }

  function fieldPlain(label, value) {
    return `<div class="rd-drawer__field"><span>${esc(label)}</span><strong>${esc(value)}</strong></div>`;
  }

  /* ── drawer (Document · Layout · Pack · History) ─────────────────────── */

  function parkSharedPcDrawerAway(slot) {
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

  function renderPcDrawer() {
    const slot = document.getElementById('print-centre-drawer-slot');
    if (!slot) return;
    const shared = document.getElementById('record-drawer');
    if (shared && slot.contains(shared) && !shared.hasAttribute('hidden')) {
      slot.classList.add('is-open');
      return;
    }
    const x = allPrintables().find(i => i.id === window._pcDrawerId);
    if (!x) {
      if (!(shared && slot.contains(shared) && !shared.hasAttribute('hidden'))) {
        parkSharedPcDrawerAway(slot);
        slot.innerHTML = '';
        slot.classList.remove('is-open');
      }
      return;
    }
    parkSharedPcDrawerAway(slot);
    const tab = Math.max(0, Math.min(DRAWER_TABS.length - 1, parseInt(window._pcDrawerTab, 10) || 0));
    const pc = ensurePc();
    const inPack = pc.pack.indexOf(x.id) >= 0;
    const pack = packItemsOrdered();
    const packBlocked = pack.filter(p => p.status === 'Blocked');
    let body = '';
    if (tab === 0) {
      body =
        field('Source', x.source, "rdPcOpenSource('" + esc(x.id) + "')") +
        field('Class', x.class === 'B' ? 'B · keepsake' : 'A · working document') +
        field('Paper', (x.paper || 'Letter') + ' · A4 aware') +
        field('Pages', String(x.pages)) +
        field('Status', x.status) +
        field('Last printed', fmtLong(x.lastPrinted)) +
        (x.blockedReason
          ? `<p class="rd-drawer__note">Blocked: ${esc(x.blockedReason)}</p>`
          : `<p class="rd-drawer__note">There is no print template. The page prints itself — screen chrome hides and the work surface expands. A separate template would be a second copy that drifts.</p>`);
    } else if (tab === 1) {
      body =
        field('Header', 'Couple · title · date printed') +
        field('Footer', 'Page x of y') +
        field('Colour', x.class === 'B' ? 'Cormorant · one gold hairline' : 'Black on white') +
        field('Breaks', 'At row boundaries') +
        field('Minimum type', x.class === 'B' ? '19pt Cormorant' : '12pt') +
        `<p class="rd-drawer__note">${x.class === 'A'
          ? 'Class A never prints gold or fills. Even from a share packet, the recipient gets the working document, not a styled page.'
          : 'Class B keeps Cormorant and one gold hairline — a keepsake even when opened from a share packet.'}</p>`;
    } else if (tab === 2) {
      body =
        field('In the day-of pack', inPack ? ('Yes · position ' + String(pack.findIndex(p => p.id === x.id) + 1).padStart(2, '0')) : 'No') +
        field('Pack size', String(pack.length) + ' documents') +
        field('Pack status', packBlocked.length ? (packBlocked.length + ' blocked') : 'All ready') +
        `<div class="rd-drawer__section-title">The pack · ${pack.length}</div>` +
        pack.slice(0, 6).map((p, i) =>
          `<div class="rd-drawer__hist"><strong>${String(i + 1).padStart(2, '0')} ${esc(p.title)}</strong><div>${statusPill(p.status)}</div></div>`
        ).join('') +
        (packBlocked.length
          ? `<p class="rd-drawer__note">The pack prints as one job in this order. ${packBlocked.length} document${packBlocked.length === 1 ? '' : 's'} blocked, so printing now would leave a gap — the pack refuses rather than printing a partial.</p>`
          : `<p class="rd-drawer__note">The pack prints as one job, in this order. Every document in it is ready.</p>`);
    } else {
      body =
        `<div class="rd-drawer__section-title">This document</div>` +
        (x.lastPrinted
          ? `<div class="rd-drawer__hist"><strong>${esc(fmtShort(x.lastPrinted))}</strong> · Planner<div>Printed · ${x.pages} page${x.pages === 1 ? '' : 's'}</div></div>`
          : '') +
        (inPack
          ? `<div class="rd-drawer__hist"><strong>—</strong> · Planner<div>Added to the day-of pack</div></div>`
          : '') +
        `<div class="rd-drawer__hist"><strong>—</strong> · Planner<div>Created from ${esc(x.source)}</div></div>` +
        `<p class="rd-drawer__note">${x.lastPrinted
          ? 'Printing is logged — a document printed and then changed is a paper copy that is now wrong. The log is the only way to know that.'
          : 'Not printed yet. Printing will be logged here, because paper goes stale the moment the source changes.'}</p>`;
    }

    const eyebrow = 'Printable · class ' + x.class;
    slot.classList.add('is-open');
    slot.innerHTML =
      `<aside class="rd-drawer rd-pc-drawer" aria-label="Printable">` +
      `<div class="rd-drawer__head">` +
      `<div class="rd-drawer__eyebrow">${esc(eyebrow)}</div>` +
      `<h2 class="rd-drawer__title">${esc(x.title)}</h2>` +
      `<div class="rd-drawer__chips">` +
      classPill(x.class) +
      `<span class="status-pill" data-pillscheme="gray">${esc(x.pages)} page${x.pages === 1 ? '' : 's'}</span>` +
      `</div>` +
      `<button type="button" class="rd-drawer__close" onclick="rdPcCloseDrawer()" aria-label="Close">×</button>` +
      `<div class="rd-drawer__tabs" role="tablist">` +
      DRAWER_TABS.map((label, i) =>
        `<button type="button" class="rd-drawer__tab${i === tab ? ' is-active' : ''}" onclick="rdPcSetDrawerTab(${i})">${esc(label)}</button>`
      ).join('') +
      `</div></div>` +
      `<div class="rd-drawer__body">${body}</div>` +
      `<div class="rd-drawer__foot">` +
      (tab === 2
        ? `<button type="button" class="rd-btn rd-btn--primary" onclick="rdPcPrintOne('${esc(x.id)}')">${packBlocked.length ? 'Resolve the ' + packBlocked.length : 'Print the pack'}</button>`
        : `<button type="button" class="rd-btn" onclick="rdPcCloseDrawer()">Save</button>`) +
      `<button type="button" class="rd-btn" onclick="rdPcFullEditor('${esc(x.id)}')">Full editor</button>` +
      `</div></aside>`;
  }

  function rdPcOpenDrawer(id) {
    window._pcDrawerId = id;
    window._pcDrawerTab = 0;
    window._pcPreviewId = id;
    renderPcDrawer();
    if (window._pcMode === 'table') renderTableView();
  }
  function rdPcCloseDrawer() {
    window._pcDrawerId = null;
    const slot = document.getElementById('print-centre-drawer-slot');
    if (slot) {
      parkSharedPcDrawerAway(slot);
      slot.innerHTML = '';
      slot.classList.remove('is-open');
    }
  }
  function rdPcSetDrawerTab(i) {
    window._pcDrawerTab = i;
    renderPcDrawer();
  }
  function rdPcFullEditor(id) {
    const item = allPrintables().find(x => x.id === (id || window._pcDrawerId));
    rdPcCloseDrawer();
    if (item) rdPcOpenSource(item.id);
  }

  /* ── actions ──────────────────────────────────────────────────────────── */

  function rdPcSelectPreview(id) {
    window._pcPreviewId = id;
    if (window._pcMode === 'table') renderTableView();
    else renderPrintCentreRd();
  }

  function rdPcToggleSel(id) {
    if (window._pcSel.has(id)) window._pcSel.delete(id);
    else window._pcSel.add(id);
    renderPcBulk();
    if (window._pcMode === 'table') renderTableView();
    else if (window._pcMode === 'dayof') renderDayOfView();
  }

  function rdPcBulkClear() {
    window._pcSel.clear();
    renderPrintCentreRd();
  }

  async function rdPcBulk(action) {
    const ids = Array.from(window._pcSel);
    if (!ids.length) return;
    const pc = ensurePc();
    if (action === 'pack') {
      ids.forEach(id => {
        if (pc.pack.indexOf(id) < 0) pc.pack.push(id);
      });
      persistPc();
      if (typeof showToast === 'function') showToast('Added to day-of pack', 'ok');
      renderPrintCentreRd();
      return;
    }
    if (action === 'paper') {
      const next = (typeof covPrompt === 'function'
        ? await covPrompt('Paper size (Letter, A4, or Both)', pc.paper || 'Letter')
        : window.prompt('Paper size (Letter, A4, or Both)', pc.paper || 'Letter'));
      if (!next) return;
      const cleaned = String(next).trim();
      const match = PAPER_CYCLE.find(p => p.toLowerCase() === cleaned.toLowerCase());
      pc.paper = match || 'Letter';
      persistPc();
      renderPrintCentreRd();
      return;
    }
    if (action === 'print' || action === 'pdf') {
      printSequence(ids);
    }
  }

  function rdPcTogglePack(id) {
    const pc = ensurePc();
    const i = pc.pack.indexOf(id);
    if (i >= 0) pc.pack.splice(i, 1);
    else pc.pack.push(id);
    persistPc();
    renderPrintCentreRd();
  }

  function rdPcPrintOne(id) {
    window._pcPreviewId = id;
    printPrintable(id);
  }

  function rdPcPrintSection() {
    if (window._pcMode === 'dayof') {
      printDayOfPack();
      return;
    }
    if (window._pcPreviewId) {
      printPrintable(window._pcPreviewId);
      return;
    }
    if (typeof printCurrentPage === 'function') printCurrentPage();
    else window.print();
  }

  function rdPcOpenSource(id) {
    const item = allPrintables().find(x => x.id === id);
    const target = (item && item.printTarget) || SOURCE_PANEL[id] || id;
    if (typeof showPanel === 'function') showPanel(target);
  }

  function rdPcCycleFilter(field) {
    const options = { all: true };
    if (field === 'class') {
      options.A = true;
      options.B = true;
    }
    if (field === 'source') allPrintables().forEach(x => { options[x.source] = true; });
    if (field === 'status') {
      options.Ready = true;
      options.Blocked = true;
      options.Printed = true;
    }
    const list = Object.keys(options);
    const cur = (window._pcUiFilters || {})[field] || 'all';
    const i = list.indexOf(cur);
    window._pcUiFilters[field] = list[(i + 1) % list.length];
    renderPrintCentreRd();
  }

  function rdPcClearFilter(field) {
    window._pcUiFilters[field] = 'all';
    renderPrintCentreRd();
  }

  function rdPcCycleSort() {
    const order = ['class', 'source', 'status', 'title'];
    const i = order.indexOf(window._pcSort || 'class');
    window._pcSort = order[(i + 1) % order.length];
    renderPrintCentreRd();
  }

  function savePrintView() {
    if (typeof setSavedView === 'function') setSavedView('print-centre', window._pcRailView || 'everything');
    if (typeof showToast === 'function') showToast('Print Centre view remembered', 'ok');
  }

  /* ── main ─────────────────────────────────────────────────────────────── */

  function renderPrintCentreRd() {
    ensurePc();
    if (typeof getSavedView === 'function') {
      const saved = getSavedView('print-centre', window._pcRailView || 'everything');
      if (saved) window._pcRailView = saved === 'all' ? 'everything' : saved;
    }
    uedPrintCentreShellRd();
    if (typeof renderPageUxChrome === 'function') renderPageUxChrome('print-centre');
    applyViewMode();
    renderPcStatsRd();
    renderPcToolbar();
    renderPcBulk();

    const mode = window._pcMode || 'table';
    if (mode === 'dayof') renderDayOfView();
    else if (mode === 'preview') renderPreviewView();
    else renderTableView();
    renderPcDrawer();

    if (typeof renderContextSidebar === 'function'
      && document.body.getAttribute('data-active-panel') === 'print-centre'
      && document.body.classList.contains('context-sidebar-mode')) {
      renderContextSidebar('print-centre');
    }
    if (typeof uxRevealPanel === 'function') uxRevealPanel('print-centre');
  }

  window.uedPrintCentreShell = uedPrintCentreShellRd;
  window.renderPrintCentrePage = renderPrintCentreRd;
  window.renderPrintCentreRd = renderPrintCentreRd;
  window.rdSetPrintCentreView = rdSetPrintCentreView;
  window.applyPrintCentreRailView = applyPrintCentreRailView;
  window.pcRailCounts = pcRailCounts;
  window.pcFigures = pcFigures;
  window.togglePaperSize = togglePaperSize;
  window.setPrintCentrePaper = setPaperSize;
  window.exportAllPDF = exportAllPDF;
  window.printSelection = printSelection;
  window.printDayOfPack = printDayOfPack;
  window.savePrintView = savePrintView;
  window.rdPcSelectPreview = rdPcSelectPreview;
  window.rdPcToggleSel = rdPcToggleSel;
  window.rdPcBulkClear = rdPcBulkClear;
  window.rdPcBulk = rdPcBulk;
  window.rdPcTogglePack = rdPcTogglePack;
  window.rdPcPrintOne = rdPcPrintOne;
  window.rdPcPrintSection = rdPcPrintSection;
  window.rdPcOpenSource = rdPcOpenSource;
  window.rdPcCycleFilter = rdPcCycleFilter;
  window.rdPcClearFilter = rdPcClearFilter;
  window.rdPcCycleSort = rdPcCycleSort;
  window.printPrintable = printPrintable;
  window.rdPcOpenDrawer = rdPcOpenDrawer;
  window.rdPcCloseDrawer = rdPcCloseDrawer;
  window.rdPcSetDrawerTab = rdPcSetDrawerTab;
  window.rdPcFullEditor = rdPcFullEditor;

  function hookPcPanelRenderer() {
    if (window.SYSTEM_PANEL_RENDERERS) {
      window.SYSTEM_PANEL_RENDERERS['print-centre'] = function () { renderPrintCentreRd(); };
    }
    window.renderPrintCentre = renderPrintCentreRd;
  }
  hookPcPanelRenderer();
  var _showPanelPc = window.showPanel;
  if (typeof _showPanelPc === 'function') {
    window.showPanel = function (id, forceOpen) {
      var out = _showPanelPc.call(window, id, forceOpen);
      hookPcPanelRenderer();
      return out;
    };
  }
})();
