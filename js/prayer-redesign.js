/* Prayer Journal — All.dc #13b + Views #32c/#32d + Drawers batch 26 (Entry) + Dark.dc rail.
   Views: Journal | Table | Print preview.
   Rail: All entries · Answered · Still praying · Laid down · Written together
         + Rhythm meters + Group by Status / Author / Month.
   Stats (Journal): Entries · Answered · Still praying · Laid down · Words.
   Stats (Table): Entries · Answered · Still asking · Set down · Longest open.
   Stats (Print): Entries printing · Pages · Excluded · Paper · Print class.
   Drawer tabs: Entry · Answer · Privacy · History.
   Data: data.prayer[] — date, focus, request, scripture, answer, status (+ soft author/answered). */
(function () {
  'use strict';

  window._prMode = window._prMode || 'journal';
  window._prRailView = window._prRailView || 'all';
  window._prGroupBy = window._prGroupBy || 'status';
  window._prUiFilters = window._prUiFilters || { status: 'all', author: 'both', month: 'all' };
  window._prAnsweredOnly = window._prAnsweredOnly !== false;
  window._prDrawerId = window._prDrawerId || null;
  window._prDrawerTab = window._prDrawerTab || 0;
  window._prSearch = window._prSearch || '';

  const DRAWER_TABS = ['Entry', 'Answer', 'Privacy', 'History'];

  const esc = s => (typeof escapeHtml === 'function'
    ? escapeHtml(s == null ? '' : String(s))
    : String(s == null ? '' : s));

  function ensurePrayer() {
    if (!window.data) window.data = {};
    if (!Array.isArray(data.prayer)) data.prayer = [];
  }

  function parseDate(value) {
    if (!value) return null;
    const d = new Date(String(value).split('T')[0] + 'T00:00:00');
    return Number.isNaN(d.getTime()) ? null : d;
  }
  function fmtLong(value) {
    const d = parseDate(value);
    if (!d) return String(value || '—');
    return d.toLocaleDateString('en-US', { day: 'numeric', month: 'long', year: 'numeric' });
  }
  function fmtShort(value) {
    const d = parseDate(value);
    if (!d) return String(value || '—');
    return d.toLocaleDateString('en-US', { day: 'numeric', month: 'short', year: 'numeric' });
  }
  function fmtChipDate(value) {
    const d = parseDate(value);
    if (!d) return '—';
    return d.toLocaleDateString('en-US', { day: 'numeric', month: 'short' });
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
  function coupleNames() {
    const s = data.setup || {};
    const a = s.bride || 'Ama';
    const b = s.groom || 'Kwesi';
    return a + ' & ' + b;
  }

  /* Status model: journal uses Still praying / Laid down; table uses Still asking / Set down. */
  function deriveKind(row) {
    const status = String(row.status || '').trim().toLowerCase();
    const answer = String(row.answer || '').trim();
    if (/laid|set down|setdown|released/.test(status)) return 'laid';
    if (row.notAsAsked || /not as asked/i.test(answer) || /not as asked/i.test(status)) {
      return answer ? 'answered-other' : 'open';
    }
    if (answer || status === 'answered') return 'answered';
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
    const answeredOn = row.answered || row.answeredOn || (kind.indexOf('answered') === 0 ? (row.date || '') : '');
    const days = kind.indexOf('answered') === 0
      ? (daysBetween(written, answeredOn) ?? daysBetween(written, written))
      : (daysBetween(written, new Date().toISOString().slice(0, 10)));
    const id = row._id ? ('prayer:' + row._id) : ('prayer:idx:' + i);
    return {
      id: id, index: i, row: row, kind: kind,
      title: title, request: request, answer: answer,
      scripture: String(row.scripture || '').trim(),
      author: author, written: written, answeredOn: answeredOn,
      days: days, words: wordCount(request) + wordCount(answer),
      journalStatus: journalLabel(kind),
      tableStatus: tableLabel(kind),
      tableGroup: tableGroupLabel(kind),
      together: /both|together|we/i.test(author)
    };
  }

  function allEntries() {
    ensurePrayer();
    return data.prayer.map(unify);
  }
  function findById(id) {
    return allEntries().find(e => e.id === id) || null;
  }

  function prayerFigures() {
    const els = allEntries();
    const answered = els.filter(e => e.kind === 'answered' || e.kind === 'answered-other');
    const open = els.filter(e => e.kind === 'open');
    const laid = els.filter(e => e.kind === 'laid');
    const together = els.filter(e => e.together);
    const words = els.reduce((s, e) => s + e.words, 0);
    let longestOpen = 0;
    open.forEach(e => { if ((e.days || 0) > longestOpen) longestOpen = e.days || 0; });
    let longestWait = 0;
    answered.forEach(e => { if ((e.days || 0) > longestWait) longestWait = e.days || 0; });

    /* Rhythm: weeks with an entry over a 20-week window ending today */
    const weeks = new Set();
    els.forEach(e => {
      const d = parseDate(e.written);
      if (!d) return;
      const oneJan = new Date(d.getFullYear(), 0, 1);
      const wk = Math.ceil((((d - oneJan) / 86400000) + oneJan.getDay() + 1) / 7);
      weeks.add(d.getFullYear() + '-W' + wk);
    });
    const printDefault = answered;
    const excluded = els.length - printDefault.length;

    return {
      entries: els.length,
      answered: answered.length,
      open: open.length,
      laid: laid.length,
      together: together.length,
      words: words,
      longestOpen: longestOpen,
      longestWait: longestWait,
      weeksWithEntry: weeks.size,
      weeksWindow: 20,
      streak: Math.min(4, weeks.size || 0),
      lastEntry: els.length ? fmtShort(els.slice().sort((a, b) => String(b.written).localeCompare(String(a.written)))[0].written) : '—',
      printCount: printDefault.length,
      printExcluded: excluded,
      printPages: Math.max(1, Math.ceil(Math.max(printDefault.length, 1) / 2))
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
    } else if (ui.author === 'both' && window._prMode === 'journal') {
      /* "Author: both" in All.dc is the default chip label meaning filter unset / couple-facing — show all */
    }
    if (ui.month && ui.month !== 'all') {
      const d = parseDate(e.written);
      if (!d) return false;
      const label = d.toLocaleDateString('en-US', { month: 'long', year: 'numeric' });
      if (label.toLowerCase() !== String(ui.month).toLowerCase()) return false;
    }
    if (window._prSearch) {
      const q = window._prSearch.toLowerCase();
      const hay = [e.title, e.request, e.answer, e.author, e.scripture].join(' ').toLowerCase();
      if (!hay.includes(q)) return false;
    }
    return true;
  }
  function filteredEntries() {
    const list = allEntries().filter(matchesFilters);
    list.sort((a, b) => String(b.written || '').localeCompare(String(a.written || '')));
    return list;
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
        + '<button type="button" class="rd-btn" onclick="rdPrExport()">Export PDF</button>'
        + '<button type="button" class="rd-btn rd-btn--primary" onclick="rdPrPrint()">Print</button>';
    }
    return ''
      + '<button type="button" class="rd-btn" onclick="rdPrSearch()">Search entries</button>'
      + '<button type="button" class="rd-btn" onclick="rdPrPrint()"><svg viewBox="0 0 24 24" aria-hidden="true" style="width:14px;height:14px;fill:none;stroke:currentColor;stroke-width:1.7;stroke-linecap:round;stroke-linejoin:round"><path d="M6 9V4h12v5"/><rect x="4" y="9" width="16" height="7" rx="1"/><path d="M7 16h10v4H7z"/></svg>Print section</button>'
      + '<button type="button" class="rd-btn" onclick="rdPrFullEditor()">Full editor</button>'
      + '<button type="button" class="rd-btn" onclick="rdPrExport()">Export</button>'
      + '<button type="button" class="rd-btn rd-btn--primary" onclick="rdPrAdd()">New entry</button>';
  }

  function uedPrayerShellRd() {
    const panel = document.getElementById('panel-prayer');
    if (!panel) return;
    panel.classList.add('ued-scope', 'prayer-mockup');
    if (panel.dataset.uedShell === 'prayer-rd13b') {
      const actions = panel.querySelector('.rd-pagehead__actions');
      if (actions) actions.innerHTML = pageheadActionsHtml();
      return;
    }
    panel.dataset.uedShell = 'prayer-rd13b';
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
    if (mode === 'table') {
      if (typeof RdDepth !== 'undefined' && RdDepth.renderStats) {
        RdDepth.renderStats(host, [
          { label: 'Entries', value: String(f.entries) },
          { label: 'Answered', value: String(f.answered) },
          { label: 'Still asking', value: String(f.open) },
          { label: 'Set down', value: String(f.laid) },
          { label: 'Longest open', value: f.longestOpen ? (f.longestOpen + ' days') : '—', attention: f.longestOpen ? 'patience with each other' : undefined }
        ]);
        return;
      }
    }
    if (mode === 'print') {
      if (typeof RdDepth !== 'undefined' && RdDepth.renderStats) {
        RdDepth.renderStats(host, [
          { label: 'Entries printing', value: f.printCount + ' of ' + f.entries },
          { label: 'Pages', value: String(f.printPages) },
          { label: 'Excluded', value: String(f.printExcluded), attention: 'open and set down' },
          { label: 'Paper', value: 'A5 · portrait' },
          { label: 'Print class', value: 'B · keepsake' }
        ]);
        return;
      }
    }
    if (typeof RdDepth !== 'undefined' && RdDepth.renderStats) {
      RdDepth.renderStats(host, [
        { label: 'Entries', value: String(f.entries) },
        { label: 'Answered', value: String(f.answered) },
        { label: 'Still praying', value: String(f.open) },
        { label: 'Laid down', value: String(f.laid) },
        { label: 'Words', value: f.words.toLocaleString() }
      ]);
      return;
    }
    host.innerHTML = [
      ['Entries', f.entries], ['Answered', f.answered], ['Still praying', f.open],
      ['Laid down', f.laid], ['Words', f.words.toLocaleString()]
    ].map(([l, v]) =>
      `<div class="m-stat"><div class="m-stat-label">${esc(l)}</div><div class="m-stat-val">${esc(String(v))}</div></div>`
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

  function renderPrayerToolbar() {
    const host = document.getElementById('prayer-toolbar');
    if (!host) return;
    const mode = window._prMode || 'journal';
    let left = '';
    if (mode === 'print') {
      left =
        `<button type="button" class="rd-chip${window._prAnsweredOnly ? ' is-active' : ''}" onclick="rdPrToggleAnsweredOnly()">Answered only${window._prAnsweredOnly ? ' ✕' : ''}</button>` +
        `<button type="button" class="rd-chip rd-chip--ghost">Paper: A5</button>` +
        `<span class="rd-pr-toolbar-note">Open prayers excluded by default</span>`;
    } else if (mode === 'table') {
      left = filterChip('Status', 'status') + filterChip('Written by', 'author') +
        `<button type="button" class="rd-chip is-active">Group by status</button>` +
        `<button type="button" class="rd-chip rd-chip--ghost">Sort by days open</button>`;
    } else {
      left = filterChip('Status', 'status') + filterChip('Author', 'author') + filterChip('Month', 'month') +
        `<button type="button" class="rd-chip rd-chip--ghost">Sort by newest</button>`;
    }
    host.innerHTML = left +
      `<div class="rd-toolbar__right">` +
      `<div class="rd-viewswitch" role="group" aria-label="Prayer view">` +
      `<button type="button" class="rd-viewswitch__item${mode === 'journal' ? ' is-active' : ''}" onclick="rdSetPrayerView('journal')">Journal</button>` +
      `<button type="button" class="rd-viewswitch__item${mode === 'table' ? ' is-active' : ''}" onclick="rdSetPrayerView('table')">Table</button>` +
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
    renderPrayerRd();
  }
  function applyPrayerRailView(viewId) {
    window._prRailView = viewId || 'all';
    if (typeof setSavedView === 'function') setSavedView('prayer', window._prRailView);
    window._prMode = 'journal';
    renderPrayerRd();
  }
  function applyPrayerGroupBy(g) {
    window._prGroupBy = g || 'status';
    renderPrayerRd();
  }

  /* ── Journal (#13b) ──────────────────────────────────────────────────── */

  function renderJournalView() {
    const host = document.getElementById('pr-view-journal');
    if (!host) return;
    const els = filteredEntries();
    if (!els.length) {
      host.innerHTML = `<p class="rd-pr-empty">No entries in this view yet.</p>` +
        `<button type="button" class="rd-pr-addbtn" onclick="rdPrAdd()"><span>+</span> Write an entry</button>`;
      return;
    }
    let html = `<div class="rd-pr-journal">`;
    els.forEach(e => {
      const closed = e.kind === 'answered' || e.kind === 'answered-other';
      const scheme = e.kind === 'laid' ? 'muted' : (closed ? 'gold' : 'forest');
      html += `<article class="rd-pr-entry${closed ? ' is-answered' : ''}${e.kind === 'laid' ? ' is-laid' : ''}" onclick="rdPrOpenDrawer('${esc(e.id)}')">` +
        `<div class="rd-pr-entry__meta">` +
        `<span class="status-pill" data-pillscheme="${scheme}">${esc(e.journalStatus)}</span>` +
        `<span class="rd-pr-entry__when">${esc(fmtLong(e.written))} · ${esc(e.author)}</span>` +
        `</div>` +
        `<h3 class="rd-pr-entry__title">${esc(e.title)}</h3>` +
        `<p class="rd-pr-entry__ask">${esc(e.request || '—')}</p>`;
      if (closed && e.answer) {
        html += `<div class="rd-pr-entry__answer">` +
          `<div class="rd-pr-entry__answer-label">The answer</div>` +
          `<p>${esc(e.answer)}</p>` +
          `</div>`;
      }
      html += `</article>`;
    });
    html += `</div>`;
    html += `<button type="button" class="rd-pr-addbtn" onclick="rdPrAdd()"><span>+</span> Write an entry</button>`;
    host.innerHTML = html;
  }

  /* ── Table (#32c) ────────────────────────────────────────────────────── */

  function renderTableView() {
    const host = document.getElementById('pr-view-table');
    if (!host) return;
    const els = filteredEntries();
    const groups = { Answered: [], 'Still asking': [], 'Set down': [] };
    els.forEach(e => {
      const g = e.tableGroup;
      if (!groups[g]) groups[g] = [];
      groups[g].push(e);
    });
    const help = {
      Answered: 'closed in serif · the page’s one typographic reward',
      'Still asking': els.filter(e => e.kind === 'open').length
        ? ('oldest is ' + (prayerFigures().longestOpen || 0) + ' days')
        : 'none open',
      'Set down': 'no longer being asked · kept, not deleted'
    };
    let html = `<div class="rd-grouplist">`;
    Object.keys(groups).forEach(g => {
      const rows = groups[g];
      if (!rows.length) return;
      html += `<section class="rd-grouplist__group">` +
        `<div class="rd-section__head"><div class="rd-pagehead__eyebrow">${esc(g)} · ${rows.length}</div>` +
        `<p class="rd-help">${esc(help[g] || '')}</p></div>`;
      rows.forEach(e => {
        const excerpt = e.answer
          ? e.answer.slice(0, 90) + (e.answer.length > 90 ? '…' : '')
          : (e.request.slice(0, 90) + (e.request.length > 90 ? '…' : ''));
        const scheme = e.kind === 'answered-other' ? 'red'
          : (e.kind.indexOf('answered') === 0 ? 'gold' : (e.kind === 'laid' ? 'muted' : 'forest'));
        html += `<button type="button" class="rd-grouplist__row${e.kind.indexOf('answered') === 0 ? ' is-answered' : ''}" onclick="rdPrOpenDrawer('${esc(e.id)}')">` +
          `<div class="rd-grouplist__main">` +
          `<strong>${esc(e.title)}</strong>` +
          `<span>${esc(excerpt || '—')}</span>` +
          `</div>` +
          `<div class="rd-grouplist__meta">Asked ${esc(fmtShort(e.written))}</div>` +
          `<div class="rd-grouplist__days">${e.days != null ? esc(e.days + ' days') : '—'}</div>` +
          `<span class="status-pill" data-pillscheme="${scheme}">${esc(e.tableStatus)}</span>` +
          `</button>`;
      });
      html += `</section>`;
    });
    if (!els.length) html += `<p class="rd-pr-empty">No entries in this view yet.</p>`;
    html += `</div>`;
    host.innerHTML = html;
  }

  /* ── Print preview (#32d) ────────────────────────────────────────────── */

  function renderPrintView() {
    const host = document.getElementById('pr-view-print');
    if (!host) return;
    let els = allEntries().filter(e => {
      if (window._prAnsweredOnly) return e.kind === 'answered' || e.kind === 'answered-other';
      return true;
    });
    els = els.filter(matchesRail).sort((a, b) => String(a.written || '').localeCompare(String(b.written || '')));
    const f = prayerFigures();
    const range = els.length
      ? (fmtShort(els[0].written) + ' to ' + fmtShort(els[els.length - 1].written))
      : '—';
    let html = `<article class="rd-pr-print rd-printsheet">` +
      `<header class="rd-pr-print__head">` +
      `<div class="rd-pr-print__names">${esc(coupleNames())}</div>` +
      `<div class="rd-pr-print__kicker">Prayer journal</div>` +
      `<h2>Answered</h2>` +
      `<p class="rd-pr-print__sub">${esc(els.length + ' prayer' + (els.length === 1 ? '' : 's') + ', ' + range)}</p>` +
      `</header>`;
    if (!els.length) {
      html += `<p class="rd-pr-empty">No answered entries to print yet.</p>`;
    } else {
      els.forEach(e => {
        const daysLabel = e.kind === 'answered-other'
          ? 'not as asked'
          : (e.days != null ? (e.days + ' days') : '');
        html += `<section class="rd-pr-print__entry">` +
          `<h3>${esc(e.title)}</h3>` +
          `<div class="rd-pr-print__meta">Asked ${esc(fmtLong(e.written))}` +
          (e.answeredOn ? ` · answered ${esc(fmtLong(e.answeredOn))}` : '') +
          (daysLabel ? ` · ${esc(daysLabel)}` : '') +
          `</div>` +
          `<p class="rd-pr-print__ask">${esc(e.request || '')}</p>` +
          (e.answer ? `<p class="rd-pr-print__answer">${esc(e.answer)}</p>` : '') +
          `</section>`;
      });
    }
    html += `<footer class="rd-pr-print__foot">Proof · ${esc(fmtLong(new Date().toISOString().slice(0, 10)))}` +
      `<span>Page 1 of ${esc(String(f.printPages))}</span></footer></article>`;
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
    let body = '';
    if (tab === 0) {
      body =
        field('Written', fmtLong(e.written)) +
        field('Author', e.author) +
        field('Status', e.journalStatus) +
        field('Answered', e.answeredOn ? fmtLong(e.answeredOn) : '—') +
        field('Days', e.days != null ? String(e.days) : '—') +
        `<div class="rd-drawer__section-title">What we asked</div>` +
        `<p class="rd-pr-drawer__prose">${esc(e.request || '—')}</p>` +
        (e.answer
          ? (`<div class="rd-drawer__section-title">The answer</div><p class="rd-pr-drawer__prose">${esc(e.answer)}</p>`)
          : '') +
        `<p class="rd-drawer__note">Status is derived from the answer. There is no tick — an entry is answered when an answer exists.</p>`;
    } else if (tab === 1) {
      body =
        `<p class="rd-pr-drawer__prose">${esc(e.answer || 'Nothing written yet.')}</p>` +
        field('Answered on', e.answeredOn ? fmtLong(e.answeredOn) : '—') +
        field('Days waiting', e.days != null ? String(e.days) : '—') +
        `<p class="rd-drawer__note">An answer closes the entry and sets it in serif on the journal page. That is the page’s one typographic reward.</p>` +
        `<div class="rd-drawer__section-title">Across the journal</div>` +
        field('Answered', f.answered + ' of ' + f.entries) +
        field('Still praying', String(f.open)) +
        field('Laid down', String(f.laid)) +
        field('Longest wait', f.longestWait ? (f.longestWait + ' days') : '—');
    } else if (tab === 2) {
      body =
        field('Share packets', 'Never included') +
        field('Print', 'Keepsake only') +
        field('Visible to', coupleNames()) +
        field('Vendors', 'Never') +
        `<p class="rd-pr-drawer__callout">Prayer entries are the only unshareable record type. They grey out in the share-packet picker — these are facts rather than toggles.</p>`;
    } else {
      body =
        `<div class="rd-drawer__section-title">This entry</div>` +
        (e.answer
          ? `<div class="rd-drawer__hist"><strong>${esc(fmtChipDate(e.answeredOn || e.written))}</strong> · ${esc(e.author)}<div>Answer written</div></div>`
          : '') +
        `<div class="rd-drawer__hist"><strong>${esc(fmtChipDate(e.written))}</strong> · ${esc(e.author)}<div>Entry written</div></div>` +
        `<p class="rd-drawer__note">History is sparse by design — a prayer journal does not need a dense audit trail.</p>` +
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
      `<span class="status-pill" data-pillscheme="${e.kind.indexOf('answered') === 0 ? 'gold' : (e.kind === 'laid' ? 'muted' : 'forest')}">${esc(e.journalStatus)}</span>` +
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
      `<button type="button" class="rd-btn rd-btn--primary" onclick="rdPrCloseDrawer()">Save</button>` +
      `<button type="button" class="rd-btn" onclick="rdPrFullEditor('${esc(e.id)}')">Full editor</button>` +
      `</div></aside>`;
  }

  /* ── actions ─────────────────────────────────────────────────────────── */

  function rdPrOpenDrawer(id) {
    window._prDrawerId = id;
    window._prDrawerTab = 0;
    if (window._prMode === 'print') window._prMode = 'journal';
    renderPrayerDrawer();
    if (window._prMode === 'table') renderTableView();
    else renderJournalView();
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
  function rdPrAdd() {
    if (typeof openRecordEditor === 'function') openRecordEditor('prayer');
    else if (typeof addPrayerRow === 'function') addPrayerRow();
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
  function rdPrPrint() {
    if (typeof buildPrayerPrintSheets === 'function' && typeof openCovenantPrintTemplate === 'function') {
      openCovenantPrintTemplate(buildPrayerPrintSheets());
    } else if (typeof printCurrentPage === 'function') printCurrentPage();
    else window.print();
  }
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
      allEntries().forEach(e => {
        const d = parseDate(e.written);
        if (d) options[d.toLocaleDateString('en-US', { month: 'long', year: 'numeric' })] = true;
      });
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

  /* ── main ────────────────────────────────────────────────────────────── */

  function renderPrayerRd() {
    ensurePrayer();
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
  window.rdPrAdd = rdPrAdd;
  window.rdPrFullEditor = rdPrFullEditor;
  window.rdPrSearch = rdPrSearch;
  window.rdPrPrint = rdPrPrint;
  window.rdPrExport = rdPrExport;
  window.rdPrToggleAnsweredOnly = rdPrToggleAnsweredOnly;
  window.rdPrCycleFilter = rdPrCycleFilter;
  window.rdPrClearFilter = rdPrClearFilter;

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
