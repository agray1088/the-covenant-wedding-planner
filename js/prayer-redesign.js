/* Prayer Journal — Master s28 / 13b · Table 32c · Print preview 32d
   Views: Journal | Table | Print preview (no page reload).
   Rail: All entries · Answered · Still praying · Laid down · Written together
         + Rhythm meters + Group by Status / Author / Month.
   Stats (Journal): Entries · Answered · Still praying · Laid down · Words.
   Stats (Table): Entries · Answered · Still asking · Set down · Longest open.
   Stats (Print): Entries printing · Pages · Excluded · Paper · Print class.
   Drawer: Entry · Answer · Privacy · History.
   Primary: New entry. Figures come from data.prayer — never typed twice.
   Print class B keepsake from this page; covenant rows never travel in a packet. */
(function () {
  'use strict';

  window._prMode = window._prMode || 'journal';
  window._prRailView = window._prRailView || 'all';
  window._prGroupBy = window._prGroupBy || 'status';
  window._prSort = window._prSort || '';
  window._prUiFilters = window._prUiFilters || { status: 'all', author: 'both', month: 'all' };
  window._prAnsweredOnly = window._prAnsweredOnly !== false;
  window._prDrawerId = window._prDrawerId || null;
  window._prDrawerTab = window._prDrawerTab || 0;
  window._prSearch = window._prSearch || '';

  const DRAWER_TABS = ['Entry', 'Answer', 'Privacy', 'History'];
  const SHELL_VER = 'prayer-rd32-s28';

  /* Master-drawn entries from 13b + 32c (same records; figures derived). */
  const MASTER_PRAYER = [
    {
      date: '2026-06-30', focus: 'A house we can afford', author: 'Both',
      request: 'We asked for somewhere in Adenta we could pay for without borrowing from either family. We had seen eleven and every one was either out of reach or falling down.',
      answer: 'The Adenta flat came back on the market $400 below what we had budgeted, because the previous buyer pulled out. We move in two weeks after the wedding.',
      answered: '2026-07-24', status: 'Answered',
      links: [
        { page: 'Marriage Rhythms', detail: 'Monthly thanksgiving' },
        { page: 'Vision & Foundation', detail: 'Value · money in the light' }
      ],
      history: [
        { when: '2026-07-24', who: 'Both', what: 'Answer written' },
        { when: '2026-06-30', who: 'Both', what: 'Entry written' }
      ]
    },
    {
      date: '2026-05-12', focus: 'That Mum would come round', author: 'Ama',
      request: 'She has not said a word about the wedding since March.',
      answer: 'She asked to help choose the fabric. That was the whole answer.',
      answered: '2026-07-02', status: 'Answered'
    },
    {
      date: '2026-07-18', focus: 'For my father\'s health before November', author: 'Kwesi',
      request: 'The consultant wants to see him again in September. He wants to walk Ama\'s mother down the aisle and I want him to be able to.',
      answer: '', status: 'Still praying'
    },
    {
      date: '2026-07-21', focus: 'That we would not lose each other in the planning', author: 'Both',
      request: 'We have had three arguments this month and all three were about a spreadsheet.',
      answer: '', status: 'Still praying'
    },
    {
      date: '2026-04-14', focus: 'A December date', author: 'Ama',
      request: 'We wanted December. The hall had nothing until March. We stopped asking and took 8 November, and we are glad.',
      answer: '', status: 'Laid down', laidOn: '2026-04-20'
    },
    {
      date: '2026-01-12', focus: 'That both families would agree on the date', author: 'Both',
      request: 'They chose it together in one evening, after four months of nobody wanting to be the one to suggest a date.',
      answer: 'They chose it together in one evening.',
      answered: '2026-04-02', status: 'Answered'
    },
    {
      date: '2026-03-03', focus: 'For Kwesi\'s mother\'s health before the day', author: 'Both',
      request: 'Discharged on the Friday, and dancing at the engagement on the Sunday.',
      answer: 'Discharged, and dancing at the engagement.',
      answered: '2026-06-18', status: 'Answered'
    },
    {
      date: '2026-01-20', focus: 'That the venue would come in under budget', author: 'Both',
      request: 'It did not come in under budget. We signed anyway, and we are at peace about it, which was not the prayer but seems to be the answer.',
      answer: 'It did not. We are at peace about it.',
      answered: '2026-03-12', status: 'Answered', notAsAsked: true
    },
    {
      date: '2026-01-14', focus: 'For patience with each other in the last month', author: 'Both',
      request: 'Both of us',
      answer: '', status: 'Still praying'
    },
    {
      date: '2026-05-08', focus: 'That the marriage would outlast the wedding', author: 'Both',
      request: 'Written after counseling 03',
      answer: '', status: 'Still praying'
    },
    {
      date: '2026-07-02', focus: 'For Michael, who is carrying a lot quietly', author: 'Kwesi',
      request: 'Kwesi',
      answer: '', status: 'Still praying'
    },
    {
      date: '2026-02-01', focus: 'That the rain would hold off', author: 'Ama',
      request: 'It is November. We booked a marquee instead.',
      answer: '', status: 'Laid down', laidOn: '2026-06-04'
    }
  ];

  const LEGACY_FOCUS = /Vendor peace|Guest list|Marriage prep|Engagement|Wedding budget|Venue search|Family relationships|Premarital counseling|Finances|Patience|Honeymoon planning|The marriage ahead|Stress & anxiety|Gratitude/i;

  const esc = s => (typeof escapeHtml === 'function'
    ? escapeHtml(s == null ? '' : String(s))
    : String(s == null ? '' : s).replace(/[&<>"']/g, ch => ({
      '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;'
    }[ch])));

  function jsId(id) {
    return String(id == null ? '' : id).replace(/\\/g, '\\\\').replace(/'/g, "\\'");
  }

  function store() {
    if (typeof getCovenantPlannerData === 'function') return getCovenantPlannerData();
    try { if (typeof data !== 'undefined' && data) return data; } catch (e) { /* lexical */ }
    if (!window.data) window.data = {};
    return window.data;
  }

  function persist() {
    if (typeof save === 'function') save();
  }

  function ensurePrayer() {
    const d = store();
    if (!Array.isArray(d.prayer)) d.prayer = [];
  }

  function stampMaster(row) {
    const copy = Object.assign({}, row);
    if (typeof nextRecordId === 'function') copy._id = nextRecordId('prayer');
    copy.scripture = copy.scripture || '';
    return copy;
  }

  function ensureMasterPrayer() {
    ensurePrayer();
    const d = store();
    if (d.prayerMaster13b) return;
    const rows = d.prayer || [];
    const onlyLegacy = rows.length > 0 && rows.every(r => LEGACY_FOCUS.test(String(r.focus || r.title || '')));
    if (rows.length === 0 || onlyLegacy) {
      d.prayer = MASTER_PRAYER.map(stampMaster);
    } else {
      const have = new Set(rows.map(r => String(r.focus || r.title || '').trim().toLowerCase()));
      MASTER_PRAYER.forEach(function (n) {
        if (!have.has(String(n.focus).trim().toLowerCase())) d.prayer.push(stampMaster(n));
      });
    }
    d.prayerMaster13b = true;
    persist();
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
    return d.toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' });
  }
  function fmtChipDate(value) {
    const d = parseDate(value);
    if (!d) return '—';
    return d.toLocaleDateString('en-GB', { day: 'numeric', month: 'short' });
  }
  function monthLabel(value) {
    const d = parseDate(value);
    if (!d) return 'Undated';
    return d.toLocaleDateString('en-GB', { month: 'long', year: 'numeric' });
  }
  function daysBetween(a, b) {
    const da = parseDate(a);
    const db = parseDate(b);
    if (!da || !db) return null;
    return Math.max(0, Math.round((db - da) / 86400000));
  }
  function wordCount(text) {
    return String(text || '').trim().split(/\s+/).filter(Boolean).length;
  }
  function todayISO() {
    if (typeof window.todayISO === 'function') return window.todayISO();
    return new Date().toISOString().slice(0, 10);
  }
  function coupleNames() {
    const s = store().setup || {};
    const a = s.bride || 'Ama';
    const b = s.groom || 'Kwesi';
    return a + ' & ' + b;
  }
  function coupleAnd() {
    const s = store().setup || {};
    return [s.bride || 'Ama', s.groom || 'Kwesi'].join(' and ');
  }

  const ONES = ['zero', 'one', 'two', 'three', 'four', 'five', 'six', 'seven', 'eight', 'nine',
    'ten', 'eleven', 'twelve', 'thirteen', 'fourteen', 'fifteen', 'sixteen', 'seventeen', 'eighteen', 'nineteen'];
  const TENS = ['', '', 'twenty', 'thirty', 'forty', 'fifty', 'sixty', 'seventy', 'eighty', 'ninety'];
  function spellNumber(n) {
    n = Math.round(Number(n) || 0);
    if (n < 20) return ONES[n];
    if (n < 100) {
      const t = TENS[Math.floor(n / 10)];
      const o = n % 10;
      return o ? (t + '-' + ONES[o]) : t;
    }
    if (n < 200) {
      const rest = n - 100;
      return rest ? ('one hundred and ' + spellNumber(rest)) : 'one hundred';
    }
    return String(n);
  }
  function capitalize(s) {
    s = String(s || '');
    return s ? s.charAt(0).toUpperCase() + s.slice(1) : s;
  }

  function deriveKind(row) {
    const status = String(row.status || '').trim().toLowerCase();
    const answer = String(row.answer || '').trim();
    if (/laid|set down|setdown|released/.test(status)) return 'laid';
    if (row.notAsAsked || /not as asked/i.test(status)) return answer ? 'answered-other' : 'open';
    if (answer || status === 'answered') {
      if (/not as asked/i.test(answer) || /it did not/i.test(answer) && /peace about it/i.test(answer)) {
        return 'answered-other';
      }
      return 'answered';
    }
    return 'open';
  }
  function journalLabel(kind) {
    if (kind === 'answered' || kind === 'answered-other') return 'Answered';
    if (kind === 'laid') return 'Laid down';
    return 'Still praying';
  }
  function tableLabel(kind) {
    if (kind === 'answered-other') return 'Answered · not as asked';
    if (kind === 'answered') return 'Answered';
    if (kind === 'laid') return 'Set down';
    return 'Open';
  }
  function tableGroupLabel(kind) {
    if (kind === 'answered' || kind === 'answered-other') return 'Answered';
    if (kind === 'laid') return 'Set down';
    return 'Still asking';
  }

  function unify(row, i) {
    const kind = deriveKind(row);
    const title = String(row.focus || row.title || 'Untitled prayer').trim() || 'Untitled prayer';
    const request = String(row.request || '').trim();
    const answer = String(row.answer || '').trim();
    const author = String(row.author || row.writtenBy || 'Both').trim() || 'Both';
    const written = row.date || row.written || '';
    const answeredOn = row.answered || row.answeredOn || '';
    const laidOn = row.laidOn || row.setDown || '';
    const days = kind.indexOf('answered') === 0
      ? daysBetween(written, answeredOn || written)
      : (kind === 'laid' ? daysBetween(written, laidOn || written) : daysBetween(written, todayISO()));
    const id = row._id ? ('prayer:' + row._id) : ('prayer:idx:' + i);
    const hist = Array.isArray(row.history) ? row.history.slice() : [];
    if (!hist.length) {
      if (answer && answeredOn) hist.push({ when: answeredOn, who: author, what: 'Answer written' });
      if (kind === 'laid' && laidOn) hist.push({ when: laidOn, who: author, what: 'Set down' });
      if (written) hist.push({ when: written, who: author, what: 'Entry written' });
    }
    return {
      id: id, index: i, row: row, kind: kind,
      title: title, request: request, answer: answer,
      scripture: String(row.scripture || '').trim(),
      author: author, written: written, answeredOn: answeredOn, laidOn: laidOn,
      days: days, words: wordCount(request) + wordCount(answer),
      journalStatus: journalLabel(kind),
      tableStatus: tableLabel(kind),
      tableGroup: tableGroupLabel(kind),
      together: /both|together|we/i.test(author),
      notAsAsked: kind === 'answered-other',
      links: Array.isArray(row.links) ? row.links : [],
      history: hist
    };
  }

  function allEntries() {
    ensurePrayer();
    return store().prayer.map(unify);
  }
  function findById(id) {
    return allEntries().find(e => e.id === id) || null;
  }

  function isoWeekKey(d) {
    const date = new Date(Date.UTC(d.getFullYear(), d.getMonth(), d.getDate()));
    const day = date.getUTCDay() || 7;
    date.setUTCDate(date.getUTCDate() + 4 - day);
    const yearStart = new Date(Date.UTC(date.getUTCFullYear(), 0, 1));
    const wk = Math.ceil((((date - yearStart) / 86400000) + 1) / 7);
    return date.getUTCFullYear() + '-W' + wk;
  }
  function streakWeeks(keys) {
    if (!keys.length) return 0;
    const sorted = keys.slice().sort();
    let best = 1, cur = 1;
    for (let i = 1; i < sorted.length; i++) {
      const [y1, w1] = sorted[i - 1].split('-W').map(Number);
      const [y2, w2] = sorted[i].split('-W').map(Number);
      const seq = (y2 === y1 && w2 === w1 + 1) || (y2 === y1 + 1 && w1 >= 52 && w2 === 1);
      if (seq) { cur += 1; if (cur > best) best = cur; }
      else cur = 1;
    }
    return best;
  }
  function lastEntryLabel(written) {
    const d = parseDate(written);
    if (!d) return '—';
    const today = parseDate(todayISO());
    if (!today) return fmtShort(written);
    const diff = Math.round((today - d) / 86400000);
    if (diff === 0) return 'Today';
    if (diff === 1) return 'Yesterday';
    return fmtShort(written);
  }

  function prayerFigures() {
    const els = allEntries();
    const answered = els.filter(e => e.kind === 'answered' || e.kind === 'answered-other');
    const open = els.filter(e => e.kind === 'open');
    const laid = els.filter(e => e.kind === 'laid');
    const together = els.filter(e => e.together);
    const words = els.reduce((s, e) => s + e.words, 0);
    let longestOpen = 0;
    let oldestOpenTitle = '';
    open.forEach(e => {
      if ((e.days || 0) >= longestOpen) {
        longestOpen = e.days || 0;
        oldestOpenTitle = e.title;
      }
    });
    let longestWait = 0;
    answered.forEach(e => { if ((e.days || 0) > longestWait) longestWait = e.days || 0; });

    const weeks = new Set();
    els.forEach(e => {
      const d = parseDate(e.written);
      if (d) weeks.add(isoWeekKey(d));
    });
    const newest = els.slice().sort((a, b) => String(b.written).localeCompare(String(a.written)))[0];
    const printSet = window._prAnsweredOnly === false ? els : answered;
    const excluded = els.length - printSet.length;

    return {
      entries: els.length,
      answered: answered.length,
      open: open.length,
      laid: laid.length,
      together: together.length,
      words: words,
      longestOpen: longestOpen,
      oldestOpenTitle: oldestOpenTitle,
      longestWait: longestWait,
      weeksWithEntry: weeks.size,
      weeksWindow: 20,
      streak: streakWeeks(Array.from(weeks)),
      lastEntry: newest ? lastEntryLabel(newest.written) : '—',
      printCount: printSet.length,
      printExcluded: excluded,
      printPages: Math.max(1, Math.ceil((printSet.length || 1) / 1.5))
    };
  }
  function prayerRailCounts() {
    const f = prayerFigures();
    return {
      all: f.entries,
      answered: f.answered,
      open: f.open,
      laid: f.laid,
      together: f.together
    };
  }

  function matchesRail(e) {
    const v = window._prRailView || 'all';
    if (v === 'answered') return e.kind === 'answered' || e.kind === 'answered-other';
    if (v === 'open') return e.kind === 'open';
    if (v === 'laid') return e.kind === 'laid';
    if (v === 'together') return e.together;
    return true;
  }
  function matchesFilters(e) {
    if (!matchesRail(e)) return false;
    const ui = window._prUiFilters || {};
    if (ui.status && ui.status !== 'all') {
      const want = String(ui.status).toLowerCase();
      if (want === 'answered' && !(e.kind === 'answered' || e.kind === 'answered-other')) return false;
      if ((want === 'still praying' || want === 'still asking' || want === 'open') && e.kind !== 'open') return false;
      if ((want === 'laid down' || want === 'set down') && e.kind !== 'laid') return false;
    }
    if (ui.author && ui.author !== 'all' && ui.author !== 'both') {
      if (String(e.author).toLowerCase() !== String(ui.author).toLowerCase()) return false;
    }
    if (ui.month && ui.month !== 'all') {
      if (monthLabel(e.written).toLowerCase() !== String(ui.month).toLowerCase()) return false;
    }
    if (window._prSearch) {
      const q = window._prSearch.toLowerCase();
      const hay = [e.title, e.request, e.answer, e.author, e.scripture].join(' ').toLowerCase();
      if (!hay.includes(q)) return false;
    }
    return true;
  }
  function sortEntries(list) {
    const mode = window._prMode || 'journal';
    const sort = window._prSort || (mode === 'table' ? 'days' : 'newest');
    const rows = list.slice();
    rows.sort((a, b) => {
      if (sort === 'oldest') return String(a.written || '').localeCompare(String(b.written || ''));
      if (sort === 'az') return a.title.localeCompare(b.title);
      if (sort === 'za') return b.title.localeCompare(a.title);
      if (sort === 'days') return (b.days || 0) - (a.days || 0);
      return String(b.written || '').localeCompare(String(a.written || ''));
    });
    return rows;
  }
  function filteredEntries() {
    return sortEntries(allEntries().filter(matchesFilters));
  }

  function groupKey(e) {
    const g = window._prGroupBy || 'status';
    if (g === 'author') return e.author || 'Both';
    if (g === 'month') return monthLabel(e.written);
    return window._prMode === 'table' ? e.tableGroup : e.journalStatus;
  }

  /* ── shell ───────────────────────────────────────────────────────────── */

  function pageheadActionsHtml() {
    const mode = window._prMode || 'journal';
    if (mode === 'table') {
      return ''
        + '<button type="button" class="rd-btn" onclick="rdPrPrint()">Print journal</button>'
        + '<button type="button" class="rd-btn" onclick="rdPrFullEditor()">Full editor</button>'
        + '<button type="button" class="rd-btn" onclick="rdPrExport()">Export</button>'
        + '<button type="button" class="rd-btn rd-btn--primary" onclick="rdPrAdd()">Write an entry</button>';
    }
    if (mode === 'print') {
      return ''
        + '<button type="button" class="rd-btn" onclick="rdPrPrint()">Print keepsake</button>'
        + '<button type="button" class="rd-btn" onclick="rdPrFullEditor()">Full editor</button>'
        + '<button type="button" class="rd-btn" onclick="rdPrExportPdf()">Export PDF</button>'
        + '<button type="button" class="rd-btn rd-btn--primary" onclick="rdPrPrint()">Print</button>';
    }
    return ''
      + '<button type="button" class="rd-btn" onclick="rdPrSearch()">Search entries</button>'
      + '<button type="button" class="rd-btn" onclick="rdPrPrintSection()"><svg viewBox="0 0 24 24" aria-hidden="true" style="width:14px;height:14px;fill:none;stroke:currentColor;stroke-width:1.7;stroke-linecap:round;stroke-linejoin:round"><path d="M6 9V4h12v5"/><rect x="4" y="9" width="16" height="7" rx="1"/><path d="M7 16h10v4H7z"/></svg>Print section</button>'
      + '<button type="button" class="rd-btn" onclick="rdPrFullEditor()">Full editor</button>'
      + '<button type="button" class="rd-btn" onclick="rdPrExport()">Export</button>'
      + '<button type="button" class="rd-btn rd-btn--primary" onclick="rdPrAdd()">New entry</button>';
  }

  function uedPrayerShellRd() {
    const panel = document.getElementById('panel-prayer');
    if (!panel) return;
    panel.classList.add('ued-scope', 'prayer-mockup');
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
          <div class="rd-pagehead__title-row">
            <h1 class="rd-pagehead__title">Prayer Journal</h1>
          </div>
        </div>
        <div class="rd-pagehead__actions">${pageheadActionsHtml()}</div>
      </div>
      <div class="rd-stats m-stats" id="prayer-stats" aria-label="Prayer summary"></div>
      <div class="rd-toolbar" id="prayer-toolbar"></div>
      <div class="rd-surface">
        <div class="rd-surface__row" id="prayer-surface-row">
          <div class="rd-surface__main" id="prayer-view-host">
            <div class="rd-view" id="pr-view-journal" data-pr-view="journal"></div>
            <div class="rd-view" id="pr-view-table" data-pr-view="table" hidden></div>
            <div class="rd-view" id="pr-view-print" data-pr-view="print" hidden></div>
          </div>
          <div id="prayer-drawer-slot"></div>
        </div>
      </div>
    </div>`;
    if (typeof window.covenantShell !== 'undefined' && window.covenantShell.drawer) {
      window.covenantShell.drawer();
    }
  }

  function renderPrayerStatsRd() {
    const host = document.getElementById('prayer-stats');
    if (!host) return;
    const f = prayerFigures();
    const mode = window._prMode || 'journal';
    let items;
    if (mode === 'table') {
      const attn = f.longestOpen && f.oldestOpenTitle
        ? f.oldestOpenTitle.replace(/^For\s+/i, '').replace(/\s+in the last month$/i, '')
        : undefined;
      const answeredPct = f.entries ? Math.round((f.answered / f.entries) * 100) : 0;
      items = [
        { label: 'Entries', value: String(f.entries) },
        {
          label: 'Answered',
          value: String(f.answered),
          target: { pct: answeredPct, tick: 0 }
        },
        { label: 'Still asking', value: String(f.open) },
        { label: 'Set down', value: String(f.laid) },
        { label: 'Longest open', value: f.longestOpen ? (f.longestOpen + ' days') : '—', attention: attn }
      ];
    } else if (mode === 'print') {
      const printPct = f.entries ? Math.round((f.printCount / f.entries) * 100) : 0;
      items = [
        { label: 'Entries printing', value: f.printCount + ' of ' + f.entries, target: { pct: printPct, tick: 0 } },
        { label: 'Pages', value: String(f.printPages) },
        { label: 'Excluded', value: String(f.printExcluded), attention: 'open and set down' },
        { label: 'Paper', value: 'A5 · portrait' },
        { label: 'Print class', value: 'B · keepsake' }
      ];
    } else {
      items = [
        { label: 'Entries', value: String(f.entries) },
        { label: 'Answered', value: String(f.answered) },
        { label: 'Still praying', value: String(f.open) },
        { label: 'Laid down', value: String(f.laid) },
        { label: 'Words', value: f.words.toLocaleString() }
      ];
    }
    if (typeof RdDepth !== 'undefined' && RdDepth.renderStats && mode !== 'print' && mode !== 'table') {
      RdDepth.renderStats(host, items);
      return;
    }
    if (mode === 'print' || mode === 'table') {
      host.innerHTML = items.map(it => {
        let valCls = 'm-stat-val';
        if (it.label === 'Excluded' && Number(it.value) > 0) valCls += ' is-amber';
        return '<div class="m-stat"><div class="m-stat-label">' + esc(it.label) + '</div>'
          + '<div class="' + valCls + '">' + esc(String(it.value)) + '</div>'
          + (it.target ? '<div class="rd-stat__target" aria-hidden="true"><div class="rd-stat__target-fill' + (it.label === 'Answered' ? ' is-forest' : '') + '" style="width:' + (it.target.pct || 0) + '%"></div></div>' : '')
          + (it.attention ? '<div class="m-stat-note">' + esc(it.attention) + '</div>' : '')
          + '</div>';
      }).join('');
      return;
    }
    if (typeof RdDepth !== 'undefined' && RdDepth.renderStats) {
      RdDepth.renderStats(host, items);
      return;
    }
    host.innerHTML = items.map(it =>
      `<div class="m-stat"><div class="m-stat-label">${esc(it.label)}</div><div class="m-stat-val">${esc(String(it.value))}</div></div>`
    ).join('');
  }

  function filterChip(label, field) {
    const ui = window._prUiFilters || {};
    const cur = ui[field];
    const on = cur && cur !== 'all' && !(field === 'author' && cur === 'both');
    const display = field === 'author' && (!cur || cur === 'all') ? 'both' : (cur || 'all');
    const chev = '<svg viewBox="0 0 24 24" aria-hidden="true" style="width:1em;height:1em;fill:none;stroke:currentColor;stroke-width:2.2;stroke-linecap:round"><path d="m6 9 6 6 6-6"/></svg>';
    return `<button type="button" class="rd-chip${on ? ' is-active' : ''}" onclick="rdPrCycleFilter('${field}')">${esc(label + ': ' + display)}`
      + (on ? `<span class="rd-chip__clear" onclick="event.stopPropagation();rdPrClearFilter('${field}')">&#10005;</span>` : chev)
      + '</button>';
  }

  function sortLabel() {
    const mode = window._prMode || 'journal';
    const sort = window._prSort || (mode === 'table' ? 'days' : 'newest');
    if (sort === 'days') return 'Sort by days open';
    if (sort === 'oldest') return 'Sort by oldest';
    if (sort === 'az') return 'Sort A–Z';
    if (sort === 'za') return 'Sort Z–A';
    return 'Sort by newest';
  }

  function renderPrayerToolbar() {
    const host = document.getElementById('prayer-toolbar');
    if (!host) return;
    const mode = window._prMode || 'journal';
    const g = window._prGroupBy || 'status';
    let left = '';
    if (mode === 'print') {
      left =
        `<button type="button" class="rd-chip${window._prAnsweredOnly ? ' is-active' : ''}" onclick="rdPrToggleAnsweredOnly()">Answered only${window._prAnsweredOnly ? ' ✕' : ''}</button>` +
        `<button type="button" class="rd-chip rd-chip--ghost">Paper: A5</button>` +
        `<span class="rd-pr-toolbar-note">Open prayers excluded by default</span>`;
    } else if (mode === 'table') {
      left = filterChip('Status', 'status') + filterChip('Written by', 'author') +
        `<button type="button" class="rd-chip is-active" onclick="rdPrCycleGroup()">Group by ${esc(g)}${g !== 'status' ? '<span class="rd-chip__clear" onclick="event.stopPropagation();rdPrClearGroup()">✕</span>' : ''}</button>` +
        (typeof rdSortChipHtml === 'function' ? rdSortChipHtml(sortLabel(), 'rdPrayerOpenSort(this)') : '');
      if (typeof rdStandardRightHtml === 'function') left += rdStandardRightHtml('prayer');
    } else {
      left = filterChip('Status', 'status') + filterChip('Author', 'author') + filterChip('Month', 'month') +
        (typeof rdSortChipHtml === 'function' ? rdSortChipHtml(sortLabel(), 'rdPrayerOpenSort(this)') : '');
      if (typeof rdStandardRightHtml === 'function') left += rdStandardRightHtml('prayer');
    }
    host.innerHTML = left +
      `<div class="rd-toolbar__right">` +
      `<div class="rd-viewswitch" role="group" aria-label="Prayer view">` +
      `<button type="button" class="rd-viewswitch__item${mode === 'journal' ? ' is-active' : ''}" onclick="rdSetPrayerView('journal')">Prayer Journal</button>` +
      `<button type="button" class="rd-viewswitch__item${mode === 'table' ? ' is-active' : ''}" onclick="rdSetPrayerView('table')">Table view</button>` +
      `<button type="button" class="rd-viewswitch__item${mode === 'print' ? ' is-active' : ''}" onclick="rdSetPrayerView('print')">Print preview</button>` +
      `</div></div>`;
  }

  function applyViewMode() {
    const mode = window._prMode || 'journal';
    ['journal', 'table', 'print'].forEach(name => {
      const el = document.getElementById('pr-view-' + name);
      if (el) el.hidden = name !== mode;
    });
  }
  function rdSetPrayerView(mode) {
    window._prMode = (mode === 'table' || mode === 'print') ? mode : 'journal';
    if (!window._prSort) window._prSort = window._prMode === 'table' ? 'days' : 'newest';
    renderPrayerRd();
  }
  function applyPrayerRailView(viewId) {
    window._prRailView = viewId || 'all';
    if (typeof setSavedView === 'function') setSavedView('prayer', window._prRailView);
    renderPrayerRd();
  }
  function applyPrayerGroupBy(g) {
    window._prGroupBy = g || 'status';
    renderPrayerRd();
  }

  function groupedMap(els, preferTable) {
    const groups = {};
    const order = [];
    els.forEach(e => {
      const k = preferTable && (window._prGroupBy || 'status') === 'status' ? e.tableGroup : groupKey(e);
      if (!groups[k]) { groups[k] = []; order.push(k); }
      groups[k].push(e);
    });
    if (preferTable && (window._prGroupBy || 'status') === 'status') {
      return { groups, order: ['Answered', 'Still asking', 'Set down'].filter(k => groups[k] && groups[k].length) };
    }
    return { groups, order };
  }

  /* ── Journal (#13b) ──────────────────────────────────────────────────── */

  function journalChip(kind, label) {
    if (kind === 'answered' || kind === 'answered-other') {
      return '<span class="rd-pr-chip rd-pr-chip--answered">' + esc(label) + '</span>';
    }
    if (kind === 'laid') {
      return '<span class="rd-pr-chip rd-pr-chip--laid">' + esc(label) + '</span>';
    }
    return '<span class="rd-pr-chip rd-pr-chip--open">' + esc(label) + '</span>';
  }

  function renderJournalView() {
    const host = document.getElementById('pr-view-journal');
    if (!host) return;
    const els = filteredEntries();
    if (!els.length) {
      host.innerHTML = '<div class="rd-pr-journal-wrap"><p class="rd-pr-empty">No entries in this view yet.</p>'
        + '<button type="button" class="rd-pr-write" onclick="rdPrAdd()">+ Write an entry</button></div>';
      return;
    }
    const grouped = (window._prGroupBy && window._prGroupBy !== 'status');
    const pack = grouped ? groupedMap(els, false) : { groups: { _: els }, order: ['_'] };
    let html = '<div class="rd-pr-journal-wrap"><div class="rd-pr-journal">';
    pack.order.forEach(g => {
      const rows = pack.groups[g] || [];
      if (!rows.length) return;
      if (grouped) {
        html += '<div class="rd-pr-journal__grouphead"><div class="rd-pagehead__eyebrow">' + esc(g) + ' · ' + rows.length + '</div></div>';
      }
      rows.forEach(e => {
        const closed = e.kind === 'answered' || e.kind === 'answered-other';
        const sid = jsId(e.id);
        html += '<article class="rd-pr-entry' + (closed ? ' is-answered' : '') + (e.kind === 'laid' ? ' is-laid' : '') + (window._prDrawerId === e.id ? ' is-open' : '') + '" onclick="rdPrOpenDrawer(\'' + esc(sid) + '\')">'
          + '<div class="rd-pr-entry__meta">'
          + journalChip(e.kind, e.journalStatus)
          + '<span class="rd-pr-entry__when">' + esc(fmtLong(e.written)) + ' · ' + esc(e.author) + '</span>'
          + '</div>'
          + '<h3 class="rd-pr-entry__title">' + esc(e.title) + '</h3>'
          + '<p class="rd-pr-entry__ask">' + esc(e.request || '—') + '</p>';
        if (closed && e.answer) {
          const lead = e.answeredOn
            ? ('Answered ' + fmtLong(e.answeredOn).replace(/ \d{4}$/, '') + ' — ')
            : '';
          html += '<div class="rd-pr-entry__answer">'
            + '<div class="rd-pr-entry__answer-label">The answer</div>'
            + '<p>' + esc(lead + e.answer) + '</p>'
            + '</div>';
        }
        html += '</article>';
      });
    });
    html += '</div><button type="button" class="rd-pr-write" onclick="rdPrAdd()">+ Write an entry</button></div>';
    host.innerHTML = html;
  }

  /* ── Table (#32c) ────────────────────────────────────────────────────── */

  function tableExcerpt(e) {
    if (e.kind === 'answered' || e.kind === 'answered-other') {
      const when = e.answeredOn ? fmtShort(e.answeredOn).replace(/ \d{4}$/, '') : '';
      const q = e.answer ? ('“' + e.answer.replace(/^["“]|["”]$/g, '') + '”') : '';
      return (when ? ('Answered ' + when) : 'Answered') + (q ? (' · ' + q) : '');
    }
    if (e.kind === 'laid') {
      return e.request ? ('“' + e.request + '”') : 'Set down';
    }
    return e.request || e.author || '—';
  }

  function tableChip(kind, label) {
    if (kind === 'answered-other') {
      return '<span class="rd-pr-chip rd-pr-chip--other">' + esc(label) + '</span>';
    }
    if (kind === 'answered') {
      return '<span class="rd-pr-chip rd-pr-chip--answered">' + esc(label) + '</span>';
    }
    if (kind === 'laid') {
      return '<span class="rd-pr-chip rd-pr-chip--laid">' + esc(label) + '</span>';
    }
    return '<span class="rd-pr-chip rd-pr-chip--open">' + esc(label) + '</span>';
  }

  function renderTableView() {
    const host = document.getElementById('pr-view-table');
    if (!host) return;
    const els = filteredEntries();
    const pack = groupedMap(els, true);
    const f = prayerFigures();
    const helpFor = function (g, rows) {
      if (g === 'Answered') return 'closed in serif · the page’s one typographic reward';
      if (g === 'Still asking') return rows.length ? ('oldest is ' + (f.longestOpen || 0) + ' days') : 'none open';
      if (g === 'Set down') return 'no longer being asked · kept, not deleted';
      return rows.length + (rows.length === 1 ? ' entry' : ' entries');
    };
    let html = '<div class="rd-pr-table">';
    pack.order.forEach(g => {
      const rows = pack.groups[g] || [];
      if (!rows.length) return;
      html += '<section class="rd-pr-table__group">'
        + '<div class="rd-pr-table__head">'
        + '<span class="rd-pr-table__head-title">' + esc(g) + ' · ' + rows.length + ' ' + (rows.length === 1 ? 'entry' : 'entries') + '</span>'
        + '<span class="rd-pr-table__head-note">' + esc(helpFor(g, rows)) + '</span>'
        + '</div>';
      rows.forEach(e => {
        const sid = jsId(e.id);
        const daysCell = e.kind === 'laid'
          ? (e.laidOn ? ('Set down ' + fmtChipDate(e.laidOn)) : 'Set down')
          : (e.days != null ? (e.days + ' days') : '—');
        html += '<button type="button" class="rd-pr-table__row' + (e.kind.indexOf('answered') === 0 ? ' is-answered' : '') + (window._prDrawerId === e.id ? ' is-open' : '') + '" onclick="rdPrOpenDrawer(\'' + esc(sid) + '\')">'
          + '<div class="rd-pr-table__main">'
          + '<strong>' + esc(e.title) + '</strong>'
          + '<span>' + esc(tableExcerpt(e)) + '</span>'
          + '</div>'
          + '<div class="rd-pr-table__asked">Asked ' + esc(fmtShort(e.written).replace(/ \d{4}$/, '')) + '</div>'
          + '<div class="rd-pr-table__days">' + esc(daysCell) + '</div>'
          + '<div class="rd-pr-table__chip">' + tableChip(e.kind, e.tableStatus) + '</div>'
          + '</button>';
      });
      html += '</section>';
    });
    if (!els.length) html += '<p class="rd-pr-empty">No entries in this view yet.</p>';
    html += '</div>';
    host.innerHTML = html;
  }

  /* ── Print preview (#32d) ────────────────────────────────────────────── */

  function printRangeLabel(els) {
    if (!els.length) return '—';
    const first = parseDate(els[0].written);
    const last = parseDate(els[els.length - 1].written);
    if (!first || !last) return fmtLong(els[0].written);
    const a = first.toLocaleDateString('en-GB', { month: 'long' });
    const b = last.toLocaleDateString('en-GB', { month: 'long', year: 'numeric' });
    if (first.getFullYear() === last.getFullYear() && first.getMonth() === last.getMonth()) {
      return a + ' ' + last.getFullYear();
    }
    return a + ' to ' + b;
  }

  function printMetaLine(e) {
    const asked = 'Asked ' + fmtLong(e.written).replace(/ \d{4}$/, '');
    if (!e.answeredOn) return asked;
    const ans = 'answered ' + fmtLong(e.answeredOn).replace(/ \d{4}$/, '');
    if (e.kind === 'answered-other' || e.notAsAsked) return asked + ' · ' + ans + ' · not as asked';
    const days = e.days != null ? spellNumber(e.days) + ' days' : '';
    return asked + ' · ' + ans + (days ? (' · ' + days) : '');
  }

  function renderPrintView() {
    const host = document.getElementById('pr-view-print');
    if (!host) return;
    let els = allEntries().filter(e => {
      if (window._prAnsweredOnly) return e.kind === 'answered' || e.kind === 'answered-other';
      return true;
    });
    els = els.filter(matchesRail).sort((a, b) => String(a.written || '').localeCompare(String(b.written || '')));
    const f = prayerFigures();
    const countLabel = capitalize(spellNumber(els.length)) + ' prayer' + (els.length === 1 ? '' : 's');
    let html = '<div class="rd-pr-proof">'
      + '<article class="rd-pr-sheet" data-print-light="1">'
      + '<div class="rd-pr-sheet__headrule"><span>' + esc(coupleNames()) + '</span><span>Prayer journal</span></div>'
      + '<header class="rd-pr-sheet__titlepage">'
      + '<div class="rd-pr-sheet__names-upper">' + esc(coupleNames()) + '</div>'
      + '<h2 class="rd-pr-sheet__maintitle">Answered</h2>'
      + '<div class="rd-pr-sheet__gold" aria-hidden="true"></div>'
      + '<p class="rd-pr-sheet__sub">' + esc(countLabel + ', ' + printRangeLabel(els)) + '</p>'
      + '</header><div class="rd-pr-sheet__body">';
    if (!els.length) {
      html += '<p class="rd-pr-empty">No answered entries to print yet.</p>';
    } else {
      els.forEach(e => {
        html += '<section class="rd-pr-sheet__entry">'
          + '<h3 class="rd-pr-sheet__entry-title">' + esc(e.title) + '</h3>'
          + '<div class="rd-pr-sheet__entry-meta">' + esc(printMetaLine(e)) + '</div>'
          + '<p class="rd-pr-sheet__entry-text">' + esc(e.answer || e.request || '') + '</p>'
          + '</section>';
      });
    }
    html += '</div><footer class="rd-pr-sheet__foot"><span>Proof · ' + esc(fmtLong(todayISO())) + '</span>'
      + '<span>Page 1 of ' + esc(String(f.printPages)) + '</span></footer>'
      + '</article>'
      + '<p class="rd-pr-proof__note">Print always renders light, even when the app is in dark mode. Answered entries only by default — open prayers are excluded until you toggle the chip. Class B keepsake · serif throughout · dates spelled out · no UI chrome.</p>'
      + '</div>';
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

  function renderPrayerDrawer() {
    const slot = document.getElementById('prayer-drawer-slot');
    if (!slot) return;
    const shared = document.getElementById('record-drawer');
    if (shared && slot.contains(shared) && !shared.hasAttribute('hidden')) {
      slot.classList.add('is-open');
      return;
    }
    const e = findById(window._prDrawerId);
    if (!e || (window._prMode || 'journal') === 'print') {
      if (!(shared && slot.contains(shared) && !shared.hasAttribute('hidden'))) {
        parkSharedDrawerAway(slot);
        slot.innerHTML = '';
        slot.classList.remove('is-open');
      }
      return;
    }
    parkSharedDrawerAway(slot);
    const tab = Math.max(0, Math.min(DRAWER_TABS.length - 1, parseInt(window._prDrawerTab, 10) || 0));
    const f = prayerFigures();
    const sid = jsId(e.id);
    let body = '';
    if (tab === 0) {
      const links = e.links.length ? e.links : [];
      body =
        field('Written', fmtLong(e.written)) +
        field('Author', e.author) +
        field('Status', e.journalStatus) +
        field('Answered', e.answeredOn ? fmtLong(e.answeredOn) : '—') +
        field('Days', e.days != null ? String(e.days) : '—') +
        `<div class="rd-drawer__section-title">What we asked</div>` +
        `<textarea class="rd-pr-drawer__input" rows="4" oninput="rdPrPatch('${esc(sid)}','request',this.value)">${esc(e.request)}</textarea>` +
        `<p class="rd-drawer__note">Status is derived from whether the Answer tab has text. There is no tick — an entry is answered when an answer exists.</p>` +
        (links.length
          ? (`<div class="rd-drawer__section-title">Linked</div>` +
            links.map(l => field(l.page, l.detail)).join(''))
          : '');
    } else if (tab === 1) {
      body =
        `<textarea class="rd-pr-drawer__input rd-pr-drawer__input--serif" rows="6" placeholder="Writing here marks it answered." oninput="rdPrPatch('${esc(sid)}','answer',this.value)">${esc(e.answer)}</textarea>` +
        field('Answered on', e.answeredOn ? fmtLong(e.answeredOn) : '—') +
        field('Days waiting', e.days != null ? String(e.days) : '—') +
        `<p class="rd-drawer__note">Writing here is what marks the entry answered, moves it out of “Still praying” and changes the page stat` +
        (e.answer ? '' : (' from ' + f.answered + ' to ' + (f.answered + 1))) +
        `. One field, three consequences.</p>` +
        `<div class="rd-drawer__section-title">Across the journal</div>` +
        field('Answered', f.answered + ' of ' + f.entries) +
        field('Still praying', String(f.open)) +
        field('Laid down', String(f.laid)) +
        field('Longest wait', f.longestWait ? (f.longestWait + ' days') : '—');
    } else if (tab === 2) {
      body =
        field('Share packets', 'Never included') +
        field('Print', 'Keepsake only') +
        field('Visible to', coupleAnd()) +
        field('Vendors', 'Never') +
        `<p class="rd-pr-drawer__callout">This is the <em>only</em> record type in the planner that cannot be shared at all. The share-packet section picker greys prayer out rather than hiding it, so you can see that it was withheld deliberately.</p>` +
        `<p class="rd-drawer__note">Privacy is a property of the record type, not a setting on this entry. There is nothing to switch on, which is why the tab shows facts rather than toggles.</p>`;
    } else {
      const hist = e.history.slice();
      body =
        `<div class="rd-drawer__section-title">This entry</div>` +
        hist.map(h =>
          `<div class="rd-drawer__hist"><strong>${esc(fmtChipDate(h.when))} · ${esc(h.who || e.author)}</strong><div>${esc(h.what)}</div></div>`
        ).join('') +
        `<p class="rd-drawer__note">Two edits in twenty-four days. Here a sparse history is the point, not a gap.</p>` +
        `<div class="rd-drawer__section-title">Rhythm</div>` +
        field('Weeks with an entry', f.weeksWithEntry + ' of ' + f.weeksWindow) +
        field('Longest streak', f.streak + ' weeks');
    }

    const eyebrow = 'Entry · ' + (e.kind.indexOf('answered') === 0 ? 'answered' : (e.kind === 'laid' ? 'laid down' : 'open'));
    slot.classList.add('is-open');
    slot.innerHTML =
      `<aside class="rd-drawer rd-pr-drawer" aria-label="Prayer entry">` +
      `<div class="rd-drawer__head">` +
      `<div class="rd-drawer__eyebrow">${esc(eyebrow)}</div>` +
      `<h2 class="rd-drawer__title">${esc(e.title)}</h2>` +
      `<div class="rd-drawer__chips">` +
      `<span class="status-pill" data-pillscheme="${e.kind === 'answered-other' ? 'red' : (e.kind.indexOf('answered') === 0 ? 'gold' : (e.kind === 'laid' ? 'muted' : 'forest'))}">${esc(e.kind === 'answered-other' ? 'Answered · not as asked' : e.journalStatus)}</span>` +
      `<span class="status-pill" data-pillscheme="gold">${esc(e.author + ' · ' + fmtChipDate(e.written))}</span>` +
      `</div>` +
      `<button type="button" class="rd-drawer__close" onclick="rdPrCloseDrawer()" aria-label="Close">×</button>` +
      `<div class="rd-drawer__tabs" role="tablist">` +
      DRAWER_TABS.map((label, i) =>
        `<button type="button" class="rd-drawer__tab${i === tab ? ' is-active' : ''}" onclick="rdPrSetDrawerTab(${i})">${esc(label)}</button>`
      ).join('') +
      `</div></div>` +
      `<div class="rd-drawer__body">${body}</div>` +
      `<div class="rd-drawer__foot">` +
      `<button type="button" class="rd-btn rd-btn--primary" onclick="rdPrSave()">Save</button>` +
      `<button type="button" class="rd-btn" onclick="rdPrFullEditor('${esc(sid)}')">Open full editor</button>` +
      `</div></aside>`;
  }

  /* ── actions ─────────────────────────────────────────────────────────── */

  function rdPrOpenDrawer(id) {
    window._prDrawerId = id;
    window._prDrawerTab = 0;
    if (window._prMode === 'print') window._prMode = 'journal';
    renderPrayerRd();
  }
  function rdPrCloseDrawer() {
    window._prDrawerId = null;
    const slot = document.getElementById('prayer-drawer-slot');
    if (slot) {
      parkSharedDrawerAway(slot);
      slot.innerHTML = '';
      slot.classList.remove('is-open');
    }
  }
  function rdPrSetDrawerTab(i) {
    window._prDrawerTab = i;
    renderPrayerDrawer();
  }
  function rdPrPatch(id, key, val) {
    const e = findById(id);
    if (!e) return;
    const row = e.row;
    if (key === 'request') row.request = val;
    if (key === 'answer') {
      const was = String(row.answer || '').trim();
      row.answer = val;
      const now = String(val || '').trim();
      if (now && !was) {
        row.answered = row.answered || todayISO();
        row.status = row.notAsAsked ? 'Answered' : 'Answered';
        row.history = Array.isArray(row.history) ? row.history : [];
        row.history.unshift({ when: row.answered, who: row.author || 'Both', what: 'Answer written' });
      }
      if (!now) {
        row.answered = '';
        if (!/laid|set down/i.test(String(row.status || ''))) row.status = 'Still praying';
      }
    }
    persist();
    if (key === 'answer') {
      renderPrayerStatsRd();
      if (window._prMode === 'table') renderTableView();
      else renderJournalView();
      const f = prayerFigures();
      const note = document.querySelector('#prayer-drawer-slot .rd-drawer__note');
      if (note && note.textContent.indexOf('One field') >= 0) {
        note.textContent = 'Writing here is what marks the entry answered, moves it out of “Still praying” and changes the page stat from ' +
          (nowEmpty(val) ? f.answered : Math.max(0, f.answered - 1)) + ' to ' + f.answered +
          '. One field, three consequences.';
      }
    }
  }
  function nowEmpty(val) { return !String(val || '').trim(); }
  function rdPrSave() {
    persist();
    rdPrCloseDrawer();
    renderPrayerRd();
  }
  function rdPrAdd() {
    ensurePrayer();
    const d = store();
    const row = {
      date: todayISO(),
      focus: 'Untitled prayer',
      request: '',
      scripture: '',
      answer: '',
      status: 'Still praying',
      author: 'Both',
      history: [{ when: todayISO(), who: 'Both', what: 'Entry written' }]
    };
    if (typeof nextRecordId === 'function') row._id = nextRecordId('prayer');
    d.prayer.unshift(row);
    persist();
    window._prMode = window._prMode === 'print' ? 'journal' : window._prMode;
    window._prDrawerId = row._id ? ('prayer:' + row._id) : ('prayer:idx:0');
    window._prDrawerTab = 0;
    renderPrayerRd();
  }
  function rdPrFullEditor(id) {
    const e = id ? findById(id) : findById(window._prDrawerId);
    window._prDrawerId = null;
    const slot = document.getElementById('prayer-drawer-slot');
    if (slot && !slot.querySelector('#record-drawer')) {
      slot.innerHTML = '';
      slot.classList.remove('is-open');
    }
    if (typeof openRecordEditor === 'function') {
      if (e) openRecordEditor('prayer', e.index);
      else openRecordEditor('prayer');
    }
  }
  async function rdPrSearch() {
    const cur = window._prSearch || '';
    const val = typeof covPrompt === 'function'
      ? await covPrompt('Search entries', { defaultValue: cur, title: 'Search entries' })
      : window.prompt('Search entries:', cur);
    if (val == null) return;
    window._prSearch = String(val).trim();
    renderPrayerRd();
  }
  function goPrintViewAndPrint() {
    window._prMode = 'print';
    renderPrayerRd();
    setTimeout(() => {
      if (typeof printCurrentPage === 'function') printCurrentPage();
      else window.print();
    }, 40);
  }
  function rdPrPrint() { goPrintViewAndPrint(); }
  function rdPrPrintSection() { goPrintViewAndPrint(); }
  function rdPrExportPdf() { goPrintViewAndPrint(); }
  function rdPrExport() {
    if (typeof exportSectionCSV === 'function') {
      exportSectionCSV('Prayer Journal', allEntries().map(e => ({
        date: e.written, focus: e.title, request: e.request, scripture: e.scripture,
        answer: e.answer, status: e.journalStatus, author: e.author
      })));
    }
  }
  function rdPrToggleAnsweredOnly() {
    window._prAnsweredOnly = !window._prAnsweredOnly;
    renderPrayerRd();
  }
  function rdPrCycleFilter(field) {
    const options = { all: true };
    if (field === 'status') {
      options.Answered = true;
      options['Still praying'] = true;
      options['Laid down'] = true;
    }
    if (field === 'author') {
      options.both = true;
      allEntries().forEach(e => { if (e.author) options[e.author] = true; });
    }
    if (field === 'month') {
      allEntries().forEach(e => { options[monthLabel(e.written)] = true; });
    }
    const list = Object.keys(options);
    const cur = (window._prUiFilters || {})[field] || (field === 'author' ? 'both' : 'all');
    const i = list.indexOf(cur);
    window._prUiFilters[field] = list[(i + 1) % list.length];
    renderPrayerRd();
  }
  function rdPrClearFilter(field) {
    window._prUiFilters[field] = field === 'author' ? 'both' : 'all';
    renderPrayerRd();
  }
  function rdPrCycleGroup() {
    const list = ['status', 'author', 'month'];
    const i = list.indexOf(window._prGroupBy || 'status');
    window._prGroupBy = list[(i + 1) % list.length];
    renderPrayerRd();
  }
  function rdPrClearGroup() {
    window._prGroupBy = 'status';
    renderPrayerRd();
  }
  function rdPrayerOpenSort(btn) {
    const mode = window._prMode || 'journal';
    const opts = mode === 'table'
      ? [
        { value: 'days', label: 'Sort by days open' },
        { value: 'newest', label: 'Sort by newest' },
        { value: 'oldest', label: 'Sort by oldest' },
        { value: 'az', label: 'Sort A–Z' }
      ]
      : [
        { value: 'newest', label: 'Sort by newest' },
        { value: 'oldest', label: 'Sort by oldest' },
        { value: 'az', label: 'Sort A–Z' }
      ];
    const cur = window._prSort || (mode === 'table' ? 'days' : 'newest');
    if (typeof window.rdStdOpenSort === 'function') {
      window.rdStdOpenSort(btn, 'prayer', opts, cur, function (val) {
        window._prSort = val;
        renderPrayerRd();
      });
      return;
    }
    const i = opts.findIndex(o => o.value === cur);
    window._prSort = opts[(i + 1) % opts.length].value;
    renderPrayerRd();
  }

  /* ── main ────────────────────────────────────────────────────────────── */

  function renderPrayerRd() {
    ensureMasterPrayer();
    uedPrayerShellRd();
    if (typeof renderPageUxChrome === 'function') renderPageUxChrome('prayer');
    applyViewMode();
    renderPrayerStatsRd();
    renderPrayerToolbar();

    const mode = window._prMode || 'journal';
    if (mode === 'table') renderTableView();
    else if (mode === 'print') renderPrintView();
    else renderJournalView();
    renderPrayerDrawer();

    if (typeof renderContextSidebar === 'function'
      && document.body.getAttribute('data-active-panel') === 'prayer'
      && document.body.classList.contains('context-sidebar-mode')) {
      renderContextSidebar('prayer');
    }
    if (typeof uxRevealPanel === 'function') uxRevealPanel('prayer');
  }

  window.uedPrayerShell = uedPrayerShellRd;
  window.renderPrayerPage = renderPrayerRd;
  window.renderPrayerRd = renderPrayerRd;
  window.renderPrayer = renderPrayerRd;
  window.rdSetPrayerView = rdSetPrayerView;
  window.applyPrayerRailView = applyPrayerRailView;
  window.applyPrayerGroupBy = applyPrayerGroupBy;
  window.prayerRailCounts = prayerRailCounts;
  window.prayerFigures = prayerFigures;
  window.rdPrOpenDrawer = rdPrOpenDrawer;
  window.rdPrCloseDrawer = rdPrCloseDrawer;
  window.rdPrSetDrawerTab = rdPrSetDrawerTab;
  window.rdPrPatch = rdPrPatch;
  window.rdPrSave = rdPrSave;
  window.rdPrAdd = rdPrAdd;
  window.rdPrFullEditor = rdPrFullEditor;
  window.rdPrSearch = rdPrSearch;
  window.rdPrPrint = rdPrPrint;
  window.rdPrPrintSection = rdPrPrintSection;
  window.rdPrExport = rdPrExport;
  window.rdPrExportPdf = rdPrExportPdf;
  window.rdPrToggleAnsweredOnly = rdPrToggleAnsweredOnly;
  window.rdPrCycleFilter = rdPrCycleFilter;
  window.rdPrClearFilter = rdPrClearFilter;
  window.rdPrCycleGroup = rdPrCycleGroup;
  window.rdPrClearGroup = rdPrClearGroup;
  window.rdPrayerOpenSort = rdPrayerOpenSort;

  function hookPrayerPanelRenderer() {
    if (window.SYSTEM_PANEL_RENDERERS) {
      window.SYSTEM_PANEL_RENDERERS.prayer = function () { renderPrayerRd(); };
    }
  }
  hookPrayerPanelRenderer();
  var _showPanelPr = window.showPanel;
  if (typeof _showPanelPr === 'function') {
    window.showPanel = function (id, forceOpen) {
      var out = _showPanelPr.call(window, id, forceOpen);
      hookPrayerPanelRenderer();
      return out;
    };
  }
})();
