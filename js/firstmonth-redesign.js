/* First-Month Rhythms — All.dc #13d
   Table (default) with keepsake year plot under it · Cards · Year view.
   Columns: Rhythm · Cadence · Owner · Area · Kept · Since.
   Rail: Views · Since the wedding · Group by · note. */
(function () {
  'use strict';

  window._fmMode = window._fmMode || 'table';
  window._fmRailView = window._fmRailView || 'all';
  window._fmGroupBy = window._fmGroupBy || 'cadence';
  window._fmUiFilters = window._fmUiFilters || { cadence: 'all', owner: 'both', area: 'all' };
  window._fmSel = window._fmSel instanceof Set ? window._fmSel : new Set();

  const CADENCE_ORDER = ['Daily', 'Weekly', 'Monthly', 'Yearly'];
  const CADENCE_LABELS = ['Every night', 'Weekly', 'Weekly · Thu', 'Weekly · Sun', 'Monthly', 'Monthly · 1st', 'Yearly · 8 Nov', 'Daily', 'Weekly', 'Monthly', 'Yearly'];
  const AREAS = ['Spiritual', 'Attention', 'Rest', 'Communication', 'Hospitality', 'Money', 'Us', 'Covenant', 'Faith', 'Home', 'Other'];
  const OWNERS = ['Both', 'Ama', 'Kwesi', 'Ama calls it', 'Kwesi prepares', 'Alternating', 'Bride', 'Groom'];

  const SEED_RHYTHMS = [
    {
      id: 'pray', title: 'Pray together before sleep',
      meaning: 'Out loud, by name, even on the short nights',
      cadence: 'Every night', cadenceKind: 'Daily', owner: 'Both', area: 'Spiritual',
      kept: '14 nights', since: '9 Nov', streakNights: 14
    },
    {
      id: 'screens', title: 'No screens after 10pm',
      meaning: '',
      cadence: 'Every night', cadenceKind: 'Daily', owner: 'Both', area: 'Attention',
      kept: '9 of 14', since: '9 Nov'
    },
    {
      id: 'sabbath', title: 'Sabbath · Sunday afternoon, nothing scheduled',
      meaning: '',
      cadence: 'Weekly', cadenceKind: 'Weekly', owner: 'Both', area: 'Rest',
      kept: '2 of 2 weeks', since: '15 Nov'
    },
    {
      id: 'state', title: 'The state-of-us conversation',
      meaning: '',
      cadence: 'Weekly · Thu', cadenceKind: 'Weekly', owner: 'Ama calls it', area: 'Communication',
      kept: '2 of 2 weeks', since: '13 Nov'
    },
    {
      id: 'meal', title: 'One meal with someone outside the two of us',
      meaning: '',
      cadence: 'Weekly', cadenceKind: 'Weekly', owner: 'Both', area: 'Hospitality',
      kept: '1 of 2 weeks', since: '9 Nov'
    },
    {
      id: 'church', title: 'Church together, in person',
      meaning: '',
      cadence: 'Weekly · Sun', cadenceKind: 'Weekly', owner: 'Both', area: 'Spiritual',
      kept: '2 of 2 weeks', since: '15 Nov'
    },
    {
      id: 'money', title: 'Money hour · every account open on the table',
      meaning: '',
      cadence: 'Monthly · 1st', cadenceKind: 'Monthly', owner: 'Kwesi prepares', area: 'Money',
      kept: '1 of 1', since: '1 Dec'
    },
    {
      id: 'nightout', title: 'A night out that costs something',
      meaning: '',
      cadence: 'Monthly', cadenceKind: 'Monthly', owner: 'Alternating', area: 'Us',
      kept: '0 of 1', since: '1 Dec'
    },
    {
      id: 'vows', title: 'Read the vows aloud on the anniversary',
      meaning: '',
      cadence: 'Yearly · 8 Nov', cadenceKind: 'Yearly', owner: 'Both', area: 'Covenant',
      kept: '', since: '8 Nov 2027'
    }
  ];

  const esc = s => (typeof escapeHtml === 'function'
    ? escapeHtml(s == null ? '' : String(s))
    : String(s == null ? '' : s).replace(/[&<>"']/g, ch => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[ch])));

  function store() {
    if (typeof getCovenantPlannerData === 'function') return getCovenantPlannerData();
    try { if (typeof data !== 'undefined') return data; } catch (e) { /* lexical */ }
    if (!window.data) window.data = {};
    return window.data;
  }
  function saveNow() { if (typeof save === 'function') save(); }

  function weddingDate() {
    const d = store();
    const raw = String((d.setup && d.setup.date) || '').trim();
    if (!raw) return null;
    const dt = new Date(raw.split('T')[0] + 'T00:00:00');
    return Number.isNaN(dt.getTime()) ? null : dt;
  }
  function beginsDate() {
    const wed = weddingDate();
    if (!wed) return null;
    const next = new Date(wed.getTime());
    next.setDate(next.getDate() + 1);
    return next;
  }
  function fmtBeginsShort(dt) {
    if (!dt) return '—';
    return dt.toLocaleDateString('en-US', { day: 'numeric', month: 'short', year: 'numeric' }).replace(',', '');
  }
  function fmtBeginsLong(dt) {
    if (!dt) return '—';
    return dt.toLocaleDateString('en-US', { day: 'numeric', month: 'long', year: 'numeric' });
  }
  function fmtSinceDefault(dt) {
    if (!dt) return '';
    return dt.toLocaleDateString('en-US', { day: 'numeric', month: 'short' });
  }

  function cadenceKindOf(c) {
    const raw = String(c || '').toLowerCase();
    if (/year|annual|anniversary/.test(raw)) return 'Yearly';
    if (/month/.test(raw)) return 'Monthly';
    if (/week/.test(raw)) return 'Weekly';
    if (/night|day|daily/.test(raw)) return 'Daily';
    return 'Weekly';
  }

  function ensureData() {
    const d = store();
    if (!d.firstmonth || typeof d.firstmonth !== 'object' || Array.isArray(d.firstmonth)) d.firstmonth = {};
    if (!Array.isArray(d.rhythms)) d.rhythms = [];
    const looksLegacy = d.rhythms.length > 0 && d.rhythms.every(r =>
      /Weekly Sabbath|Weekly Date Night|Daily Devotion|Budget Meeting|Monthly Check-In|Local Church Plan|Keep Simple|Conversations To Have|New rhythm/i.test(String(r.title || r.name || ''))
    );
    /* Seed the nine 13d mock rhythms once when empty, or replace the old 8-row scaffold. */
    if ((!d.rhythms.length && !d.firstmonth._fm13dSeeded) || (looksLegacy && !d.firstmonth._fm13dSeeded)) {
      const begins = beginsDate();
      const sinceDef = fmtSinceDefault(begins) || '9 Nov';
      d.rhythms = SEED_RHYTHMS.map(seed => ({
        _id: 'fm-' + seed.id,
        title: seed.title,
        meaning: seed.meaning,
        cadence: seed.cadence,
        cadenceKind: seed.cadenceKind,
        owner: seed.owner,
        area: seed.area,
        kept: seed.kept,
        since: seed.since || sinceDef,
        paused: false,
        status: seed.kept && !/^0\b/.test(seed.kept) ? 'Kept' : 'Planned'
      }));
      d.firstmonth._fm13dSeeded = true;
    } else {
      d.rhythms.forEach(r => {
        if (!r.cadenceKind) r.cadenceKind = cadenceKindOf(r.cadence || r.frequency);
        if (r.title == null && r.name) r.title = r.name;
        if (r.meaning == null) r.meaning = r.subtitle || '';
        if (r.kept == null) r.kept = r.streak || '';
        if (r.since == null) r.since = r.starts || '';
        if (r.owner == null) r.owner = 'Both';
        if (r.area == null) r.area = r.category || 'Other';
        if (r.paused == null) r.paused = false;
      });
    }
    return d;
  }

  function allRows() {
    const d = ensureData();
    return d.rhythms.map((row, index) => ({
      row, index,
      id: row._id || ('fm:' + index),
      title: String(row.title || row.name || 'Untitled rhythm'),
      meaning: String(row.meaning || row.subtitle || ''),
      cadence: String(row.cadence || row.frequency || 'Weekly'),
      cadenceKind: row.cadenceKind || cadenceKindOf(row.cadence || row.frequency),
      owner: String(row.owner || 'Both'),
      area: String(row.area || 'Other'),
      kept: String(row.kept || row.streak || ''),
      since: String(row.since || row.starts || ''),
      paused: !!row.paused
    }));
  }

  function matchesFilters(r) {
    const ui = window._fmUiFilters || {};
    const rail = window._fmRailView || 'all';
    if (rail !== 'all' && r.cadenceKind.toLowerCase() !== rail) return false;
    if (ui.cadence && ui.cadence !== 'all' && r.cadenceKind.toLowerCase() !== String(ui.cadence).toLowerCase()) return false;
    if (ui.owner && ui.owner !== 'all' && ui.owner !== 'both' && r.owner !== ui.owner) return false;
    if (ui.area && ui.area !== 'all' && r.area !== ui.area) return false;
    return true;
  }
  function visibleRows() { return allRows().filter(matchesFilters); }

  function isKept(r) {
    if (r.paused) return false;
    const k = String(r.kept || '');
    if (!k) return false;
    if (/^0\b/.test(k)) return false;
    return true;
  }

  function fmFigures() {
    const rows = allRows();
    const by = { Daily: 0, Weekly: 0, Monthly: 0, Yearly: 0 };
    rows.forEach(r => { by[r.cadenceKind] = (by[r.cadenceKind] || 0) + 1; });
    const kept = rows.filter(isKept).length;
    const begins = beginsDate();
    const pray = rows.find(r => /pray together/i.test(r.title));
    const streakLabel = pray && isKept(pray)
      ? 'Prayer · 14 weeks'
      : (kept ? (kept + ' kept') : '—');
    return {
      rhythms: rows.length,
      daily: by.Daily || 0,
      weekly: by.Weekly || 0,
      monthly: by.Monthly || 0,
      yearly: by.Yearly || 0,
      keptThisMonth: kept,
      streaks: streakLabel,
      longestStreak: streakLabel,
      beginsShort: fmtBeginsShort(begins),
      beginsLong: fmtBeginsLong(begins),
      startsLong: fmtBeginsLong(begins),
      review: 'Every anniversary',
      byCadence: by
    };
  }
  function fmRailCounts() {
    const f = fmFigures();
    return { all: f.rhythms, daily: f.daily, weekly: f.weekly, monthly: f.monthly, yearly: f.yearly };
  }

  function pageheadActionsHtml() {
    return ''
      + '<button type="button" class="rd-btn" onclick="rdFmTemplate()">Add from a template</button>'
      + '<button type="button" class="rd-btn" onclick="rdFmPrint()">Print section</button>'
      + '<button type="button" class="rd-btn" onclick="rdFmFullEditor()">Full editor</button>'
      + '<button type="button" class="rd-btn" onclick="rdFmExport()">Export</button>'
      + '<button type="button" class="rd-btn rd-btn--primary" onclick="rdFmAdd()">New rhythm</button>';
  }

  function ensureShell() {
    const panel = document.getElementById('panel-firstmonth');
    if (!panel) return;
    panel.classList.add('ued-scope', 'firstmonth-mockup');
    if (panel.dataset.uedShell === 'firstmonth-rd13dv2') {
      const actions = panel.querySelector('.rd-pagehead__actions');
      if (actions) actions.innerHTML = pageheadActionsHtml();
      return;
    }
    panel.dataset.uedShell = 'firstmonth-rd13dv2';
    panel.innerHTML = `<div class="rd-page">
      <div class="rd-pagehead">
        <div>
          <div class="rd-pagehead__eyebrow">Covenant</div>
          <div class="rd-pagehead__title-row"><h1 class="rd-pagehead__title">First-Month Rhythms</h1></div>
        </div>
        <div class="rd-pagehead__actions">${pageheadActionsHtml()}</div>
      </div>
      <div class="rd-stats m-stats" id="firstmonth-stats" aria-label="First-month rhythm summary"></div>
      <div class="rd-toolbar" id="firstmonth-toolbar"></div>
      <div class="rd-bulkbar" id="firstmonth-bulk-bar" hidden></div>
      <div class="rd-surface">
        <div class="rd-surface__row">
          <div class="rd-surface__main" id="firstmonth-view-host">
            <div class="rd-view" id="fm-view-table"></div>
            <div class="rd-view" id="fm-view-cards" hidden></div>
            <div class="rd-view" id="fm-view-year" hidden></div>
          </div>
        </div>
      </div>
    </div>`;
  }

  function renderStats() {
    const host = document.getElementById('firstmonth-stats');
    if (!host) return;
    const f = fmFigures();
    const stats = [
      { label: 'Rhythms', value: String(f.rhythms) },
      { label: 'Daily', value: String(f.daily) },
      { label: 'Weekly', value: String(f.weekly) },
      { label: 'Monthly', value: String(f.monthly) },
      { label: 'Begins', value: f.beginsShort }
    ];
    if (typeof RdDepth !== 'undefined' && RdDepth.renderStats) {
      RdDepth.renderStats(host, stats);
      return;
    }
    host.innerHTML = stats.map(s =>
      `<div class="m-stat"><div class="m-stat-label">${esc(s.label)}</div><div class="m-stat-val">${esc(s.value)}</div></div>`
    ).join('');
  }

  function filterChip(label, field) {
    const ui = window._fmUiFilters || {};
    const cur = ui[field] || 'all';
    const on = cur && cur !== 'all' && !(field === 'owner' && cur === 'both');
    const display = field === 'owner' && (!cur || cur === 'all') ? 'both' : cur;
    const chev = '<svg viewBox="0 0 24 24" aria-hidden="true" style="width:1em;height:1em;fill:none;stroke:currentColor;stroke-width:2.2;stroke-linecap:round"><path d="m6 9 6 6 6-6"/></svg>';
    return `<button type="button" class="rd-chip${on ? ' is-active' : ''}" onclick="rdFmCycleFilter('${field}')">${esc(label + ': ' + display)}`
      + (on ? `<span class="rd-chip__clear" onclick="event.stopPropagation();rdFmClearFilter('${field}')">&#10005;</span>` : chev)
      + '</button>';
  }

  function renderToolbar() {
    const host = document.getElementById('firstmonth-toolbar');
    if (!host) return;
    const mode = window._fmMode || 'table';
    host.innerHTML =
      filterChip('Cadence', 'cadence') +
      filterChip('Owner', 'owner') +
      filterChip('Area', 'area') +
      (typeof rdSortChipHtml === 'function'
        ? rdSortChipHtml('Sort by cadence', "rdFmSortCadence()")
        : '<button type="button" class="rd-chip rd-chip--ghost" onclick="rdFmSortCadence()">Sort by cadence</button>') +
      `<div class="rd-toolbar__right">` +
      (typeof rdStandardRightHtml === 'function' ? rdStandardRightHtml('firstmonth') : '') +
      `<div class="rd-viewswitch" role="group" aria-label="First-month view">` +
      `<button type="button" class="rd-viewswitch__item${mode === 'table' ? ' is-active' : ''}" onclick="rdSetFirstmonthView('table')">Table</button>` +
      `<button type="button" class="rd-viewswitch__item${mode === 'cards' ? ' is-active' : ''}" onclick="rdSetFirstmonthView('cards')">Cards</button>` +
      `<button type="button" class="rd-viewswitch__item${mode === 'year' ? ' is-active' : ''}" onclick="rdSetFirstmonthView('year')">Year view</button>` +
      `</div></div>`;
  }

  function renderBulkBar() {
    const host = document.getElementById('firstmonth-bulk-bar');
    if (!host) return;
    const n = window._fmSel.size;
    if (!n) { host.hidden = true; host.innerHTML = ''; return; }
    host.hidden = false;
    host.innerHTML =
      `<span class="rd-bulkbar__count">${n} selected</span><span class="rd-bulkbar__sep"></span>` +
      `<button type="button" class="rd-bulkbar__action" onclick="rdFmBulkCadence()">Change cadence</button>` +
      `<button type="button" class="rd-bulkbar__action" onclick="rdFmBulkOwner()">Assign owner</button>` +
      `<button type="button" class="rd-bulkbar__action" onclick="rdFmBulkPause()">Pause</button>` +
      `<button type="button" class="rd-bulkbar__action" onclick="rdFmPrintCard()">Print the card</button>` +
      `<button type="button" class="rd-bulkbar__clear" onclick="rdFmBulkClear()">Clear selection</button>`;
  }

  function applyMode() {
    const mode = window._fmMode || 'table';
    ['table', 'cards', 'year'].forEach(name => {
      const el = document.getElementById('fm-view-' + name);
      if (el) el.hidden = mode !== name;
    });
  }
  function rdSetFirstmonthView(mode) {
    window._fmMode = (mode === 'cards' || mode === 'year') ? mode : 'table';
    renderFirstmonthRd();
  }
  function applyFirstmonthRailView(viewId) {
    window._fmRailView = ['all', 'daily', 'weekly', 'monthly', 'yearly'].includes(viewId) ? viewId : 'all';
    if (typeof setSavedView === 'function') setSavedView('firstmonth', window._fmRailView);
    renderFirstmonthRd();
  }
  function applyFirstmonthGroupBy(id) {
    window._fmGroupBy = ['cadence', 'owner', 'area'].includes(id) ? id : 'cadence';
    renderFirstmonthRd();
  }

  function selectHtml(list, val) {
    const opts = list.slice();
    if (val && !opts.includes(val)) opts.push(val);
    return opts.map(x => `<option value="${esc(x)}"${String(x) === String(val || '') ? ' selected' : ''}>${esc(x)}</option>`).join('');
  }

  function groupItems() {
    const group = window._fmGroupBy || 'cadence';
    const rows = visibleRows();
    const map = {};
    rows.forEach(r => {
      let key = r.cadenceKind;
      if (group === 'owner') key = r.owner;
      else if (group === 'area') key = r.area;
      if (!map[key]) map[key] = [];
      map[key].push(r);
    });
    const keys = Object.keys(map);
    if (group === 'cadence') {
      keys.sort((a, b) => CADENCE_ORDER.indexOf(a) - CADENCE_ORDER.indexOf(b));
    } else keys.sort();
    return keys.map(k => ({ key: k, rows: map[k] }));
  }

  function yearMonths() {
    const begins = beginsDate();
    const months = [];
    const start = begins || new Date();
    for (let i = 0; i < 13; i++) {
      const dt = new Date(start.getFullYear(), start.getMonth() + i, 1);
      months.push({
        key: dt.getFullYear() + '-' + dt.getMonth(),
        label: dt.toLocaleDateString('en-US', { month: 'short' }),
        dt
      });
    }
    return months;
  }

  function yearplotHtml(rows) {
    const months = yearMonths();
    const legend = CADENCE_ORDER.map(c => `<span class="rd-yearplot__leg rd-yearplot__leg--${c.toLowerCase()}">${esc(c)}</span>`).join('');
    let html = `<div class="rd-section__head">` +
      `<div><div class="rd-pagehead__eyebrow">The first year</div>` +
      `<p class="rd-help">${rows.length} rhythm${rows.length === 1 ? '' : 's'}, plotted from the day after the wedding</p></div>` +
      `<button type="button" class="rd-btn rd-btn--quiet" style="margin-left:auto" onclick="rdFmPrintCard()">Print the card</button>` +
      `</div>`;
    html += `<div class="rd-yearplot" id="firstmonth-year-plot">`;
    html += `<div class="rd-yearplot__months"><span></span>${months.map(m => `<b>${esc(m.label)}</b>`).join('')}</div>`;
    rows.forEach(r => {
      const short = r.title.length > 28 ? r.title.slice(0, 26) + '…' : r.title;
      html += `<div class="rd-yearplot__row"><strong title="${esc(r.title)}">${esc(short)}</strong>`;
      months.forEach((m, i) => {
        let mark = '—';
        let cls = '';
        if (r.cadenceKind === 'Daily' || r.cadenceKind === 'Weekly') { mark = '●'; cls = ' is-on is-' + r.cadenceKind.toLowerCase(); }
        else if (r.cadenceKind === 'Monthly') { mark = '○'; cls = ' is-month'; }
        else if (r.cadenceKind === 'Yearly') {
          if (i === 12 || i === 0) { mark = '●'; cls = ' is-year'; }
          else { mark = '—'; }
        }
        html += `<span class="rd-yearplot__cell${cls}" title="${esc(r.title + ' · ' + m.label)}">${mark}</span>`;
      });
      html += `</div>`;
    });
    html += `<div class="rd-yearplot__legend">${legend}</div></div>`;
    return html;
  }

  function renderTableView() {
    const host = document.getElementById('fm-view-table');
    if (!host) return;
    const groups = groupItems();
    const all = allRows();
    let html = `<div class="ued-table-wrap"><table class="ued-table rd-table rd-fm-table"><thead><tr>` +
      `<th style="width:34px"></th><th>Rhythm</th><th>Cadence</th><th>Owner</th><th>Area</th><th>Kept</th><th>Since</th>` +
      `</tr></thead><tbody>`;
    if (!groups.length) {
      html += `<tr><td colspan="7" class="rd-empty">No rhythms match this view.</td></tr>`;
    } else {
      groups.forEach(g => {
        const bandLabel = (window._fmGroupBy || 'cadence') === 'cadence'
          ? `${g.key} · ${g.rows.length} rhythm${g.rows.length === 1 ? '' : 's'}`
          : `${g.key} · ${g.rows.length}`;
        html += `<tr class="rd-group-row rd-fm-group"><td colspan="7">${esc(bandLabel)}</td></tr>`;
        g.rows.forEach(r => {
          const sel = window._fmSel.has(r.id);
          html += `<tr class="${sel ? 'is-selected' : ''}${r.paused ? ' is-paused' : ''}">` +
            `<td><input type="checkbox" ${sel ? 'checked' : ''} onchange="rdFmToggleSel('${esc(r.id)}')"></td>` +
            `<td class="rd-fm-rhythmcell">` +
            `<input class="no-currency rd-fm-title" data-currency="false" value="${esc(r.title)}" placeholder="Rhythm" oninput="rdFmSave(${r.index},'title',this.value)">` +
            `<textarea class="no-currency rd-fm-meaning" data-currency="false" rows="1" placeholder="What it means" oninput="rdFmSave(${r.index},'meaning',this.value)">${esc(r.meaning)}</textarea>` +
            `</td>` +
            `<td><input class="no-currency" data-currency="false" list="fm-cadence-list" value="${esc(r.cadence)}" oninput="rdFmSave(${r.index},'cadence',this.value)"></td>` +
            `<td><input class="no-currency" data-currency="false" list="fm-owner-list" value="${esc(r.owner)}" oninput="rdFmSave(${r.index},'owner',this.value)"></td>` +
            `<td><select onchange="rdFmSave(${r.index},'area',this.value)">${selectHtml(AREAS, r.area)}</select></td>` +
            `<td><input class="no-currency" data-currency="false" value="${esc(r.kept)}" placeholder="—" oninput="rdFmSave(${r.index},'kept',this.value)"></td>` +
            `<td><input class="no-currency" data-currency="false" value="${esc(r.since)}" placeholder="—" oninput="rdFmSave(${r.index},'since',this.value)"></td>` +
            `</tr>`;
        });
      });
    }
    html += `</tbody></table></div>`;
    html += `<datalist id="fm-cadence-list">${CADENCE_LABELS.map(c => `<option value="${esc(c)}">`).join('')}</datalist>`;
    html += `<datalist id="fm-owner-list">${OWNERS.map(c => `<option value="${esc(c)}">`).join('')}</datalist>`;
    html += `<button type="button" class="rd-fm-addbtn" onclick="rdFmAdd()"><span>+</span> Add a rhythm</button>`;
    html += yearplotHtml(all);
    host.innerHTML = html;
  }

  function renderCardsView() {
    const host = document.getElementById('fm-view-cards');
    if (!host) return;
    const rows = visibleRows();
    const begins = fmFigures().beginsLong;
    host.innerHTML = `<div class="rd-fm-cards">${rows.map(r => {
      const kept = r.kept || '—';
      const before = !r.kept ? ' before ' + (begins === '—' ? 'the wedding day' : begins) : '';
      return `<article class="rd-fm-card${r.paused ? ' is-paused' : ''}">` +
        `<header><h3>${esc(r.title)}</h3><span class="rd-fm-card__cadence">${esc(r.cadence)}</span></header>` +
        (r.meaning ? `<p class="rd-fm-card__meaning">${esc(r.meaning)}</p>` : '') +
        `<div class="rd-fm-card__meta">` +
        `<span><b>Owner</b> ${esc(r.owner)}</span>` +
        `<span><b>Area</b> ${esc(r.area)}</span>` +
        `<span><b>Kept</b> ${esc(kept)}${esc(before)}</span>` +
        `<span><b>Since</b> ${esc(r.since || '—')}</span>` +
        `</div></article>`;
    }).join('') || '<div class="rd-empty">No rhythm cards match this view.</div>'}</div>`;
  }

  function renderYearView() {
    const host = document.getElementById('fm-view-year');
    if (!host) return;
    host.innerHTML = yearplotHtml(visibleRows());
  }

  function rdFmSave(index, field, val) {
    const d = ensureData();
    if (!d.rhythms[index]) return;
    d.rhythms[index][field] = val;
    if (field === 'cadence') d.rhythms[index].cadenceKind = cadenceKindOf(val);
    if (field === 'title') d.rhythms[index].name = val;
    saveNow();
    renderStats();
    if (typeof renderContextSidebar === 'function'
      && document.body.getAttribute('data-active-panel') === 'firstmonth') {
      renderContextSidebar('firstmonth');
    }
  }
  function rdFmAdd() {
    const d = ensureData();
    const begins = beginsDate();
    d.rhythms.push({
      _id: 'fm-' + Date.now().toString(16),
      title: '', meaning: '', cadence: 'Weekly', cadenceKind: 'Weekly',
      owner: 'Both', area: 'Us', kept: '', since: fmtSinceDefault(begins),
      paused: false, status: 'Planned'
    });
    saveNow();
    window._fmMode = 'table';
    window._fmRailView = 'all';
    renderFirstmonthRd();
  }
  function rdFmTemplate() {
    const d = ensureData();
    const existing = new Set(d.rhythms.map(r => String(r.title || '').toLowerCase()));
    let added = 0;
    SEED_RHYTHMS.forEach(seed => {
      if (existing.has(seed.title.toLowerCase())) return;
      d.rhythms.push({
        _id: 'fm-' + seed.id + '-' + Date.now().toString(16),
        title: seed.title, meaning: seed.meaning, cadence: seed.cadence,
        cadenceKind: seed.cadenceKind, owner: seed.owner, area: seed.area,
        kept: seed.kept, since: seed.since, paused: false, status: 'Planned'
      });
      added += 1;
    });
    saveNow();
    renderFirstmonthRd();
    if (typeof showToast === 'function') {
      showToast(added ? ('Added ' + added + ' rhythm' + (added === 1 ? '' : 's') + ' from the starter list.') : 'Starter rhythms are already on the page.');
    }
  }
  function rdFmPrint() {
    if (typeof openCovenantPrintTemplate === 'function' && typeof buildRhythmsPrintSheets === 'function') {
      openCovenantPrintTemplate(buildRhythmsPrintSheets());
    } else if (typeof printCurrentPage === 'function') printCurrentPage();
    else window.print();
  }
  function rdFmPrintCard() { rdFmPrint(); }
  function rdFmFullEditor() {
    if (typeof openRecordEditor === 'function') openRecordEditor('rhythms');
    else if (typeof showToast === 'function') showToast('Edit rhythms in the table, or open Full editor when available.');
  }
  function rdFmExport() {
    const d = ensureData();
    const a = document.createElement('a');
    a.href = URL.createObjectURL(new Blob([JSON.stringify({ rhythms: d.rhythms }, null, 2)], { type: 'application/json' }));
    a.download = 'first-month-rhythms.json';
    document.body.appendChild(a);
    a.click();
    setTimeout(() => { URL.revokeObjectURL(a.href); a.remove(); }, 0);
    if (typeof showToast === 'function') showToast('Rhythms exported.');
  }
  function rdFmCycleFilter(field) {
    const opts = { all: true };
    const rows = allRows();
    if (field === 'cadence') CADENCE_ORDER.forEach(c => { opts[c.toLowerCase()] = true; });
    if (field === 'owner') { opts.both = true; rows.forEach(r => { opts[r.owner] = true; }); }
    if (field === 'area') rows.forEach(r => { opts[r.area] = true; });
    const list = Object.keys(opts);
    const cur = (window._fmUiFilters || {})[field] || (field === 'owner' ? 'both' : 'all');
    const i = Math.max(0, list.indexOf(cur));
    window._fmUiFilters[field] = list[(i + 1) % list.length];
    renderToolbar();
    renderTableView();
    renderCardsView();
    renderYearView();
  }
  function rdFmClearFilter(field) {
    window._fmUiFilters[field] = field === 'owner' ? 'both' : 'all';
    renderToolbar();
    renderTableView();
    renderCardsView();
    renderYearView();
  }
  function rdFmSortCadence() {
    const d = ensureData();
    d.rhythms.sort((a, b) => {
      const ka = CADENCE_ORDER.indexOf(a.cadenceKind || cadenceKindOf(a.cadence));
      const kb = CADENCE_ORDER.indexOf(b.cadenceKind || cadenceKindOf(b.cadence));
      return (ka < 0 ? 99 : ka) - (kb < 0 ? 99 : kb);
    });
    saveNow();
    renderTableView();
  }
  function rdFmToggleSel(id) {
    if (window._fmSel.has(id)) window._fmSel.delete(id);
    else window._fmSel.add(id);
    renderBulkBar();
    renderTableView();
  }
  function rdFmBulkClear() {
    window._fmSel.clear();
    renderBulkBar();
    renderTableView();
  }
  function selectedIndexes() {
    const d = ensureData();
    const out = [];
    d.rhythms.forEach((r, i) => {
      const id = r._id || ('fm:' + i);
      if (window._fmSel.has(id)) out.push(i);
    });
    return out;
  }
  function rdFmBulkCadence() {
    const cadence = window.prompt('Cadence (e.g. Weekly · Thu)', 'Weekly');
    if (!cadence) return;
    const d = ensureData();
    selectedIndexes().forEach(i => {
      d.rhythms[i].cadence = cadence;
      d.rhythms[i].cadenceKind = cadenceKindOf(cadence);
    });
    saveNow();
    rdFmBulkClear();
    renderFirstmonthRd();
  }
  function rdFmBulkOwner() {
    const owner = window.prompt('Assign owner', 'Both');
    if (!owner) return;
    const d = ensureData();
    selectedIndexes().forEach(i => { d.rhythms[i].owner = owner; });
    saveNow();
    rdFmBulkClear();
    renderFirstmonthRd();
  }
  function rdFmBulkPause() {
    const d = ensureData();
    selectedIndexes().forEach(i => { d.rhythms[i].paused = true; d.rhythms[i].status = 'Paused'; });
    saveNow();
    rdFmBulkClear();
    renderFirstmonthRd();
  }

  function renderFirstmonthRd() {
    ensureData();
    if (typeof getSavedView === 'function') window._fmRailView = getSavedView('firstmonth', window._fmRailView || 'all');
    ensureShell();
    if (typeof renderPageUxChrome === 'function') renderPageUxChrome('firstmonth');
    applyMode();
    renderStats();
    renderToolbar();
    renderBulkBar();
    renderTableView();
    renderCardsView();
    renderYearView();
    if (typeof renderContextSidebar === 'function'
      && document.body.getAttribute('data-active-panel') === 'firstmonth'
      && document.body.classList.contains('context-sidebar-mode')) {
      renderContextSidebar('firstmonth');
    }
    if (typeof uxRevealPanel === 'function') uxRevealPanel('firstmonth');
  }

  window.uedFirstmonthShell = ensureShell;
  window.renderFirstmonthPage = renderFirstmonthRd;
  window.renderFirstmonthRd = renderFirstmonthRd;
  window.rdSetFirstmonthView = rdSetFirstmonthView;
  window.applyFirstmonthRailView = applyFirstmonthRailView;
  window.applyFirstmonthGroupBy = applyFirstmonthGroupBy;
  window.fmRailCounts = fmRailCounts;
  window.fmFigures = fmFigures;
  window.rdFmSave = rdFmSave;
  window.rdFmAdd = rdFmAdd;
  window.rdFmTemplate = rdFmTemplate;
  window.rdFmPrint = rdFmPrint;
  window.rdFmPrintCard = rdFmPrintCard;
  window.rdFmFullEditor = rdFmFullEditor;
  window.rdFmExport = rdFmExport;
  window.rdFmCycleFilter = rdFmCycleFilter;
  window.rdFmClearFilter = rdFmClearFilter;
  window.rdFmSortCadence = rdFmSortCadence;
  window.rdFmToggleSel = rdFmToggleSel;
  window.rdFmBulkClear = rdFmBulkClear;
  window.rdFmBulkCadence = rdFmBulkCadence;
  window.rdFmBulkOwner = rdFmBulkOwner;
  window.rdFmBulkPause = rdFmBulkPause;
  window.openRhythmTemplates = rdFmTemplate;
  window.addRhythmRow = rdFmAdd;

  function hookFirstmonthPanelRenderer() {
    if (window.SYSTEM_PANEL_RENDERERS) window.SYSTEM_PANEL_RENDERERS.firstmonth = function () { renderFirstmonthRd(); };
  }
  hookFirstmonthPanelRenderer();
  var _showPanelFm = window.showPanel;
  if (typeof _showPanelFm === 'function') {
    window.showPanel = function (id, forceOpen) {
      var out = _showPanelFm.call(window, id, forceOpen);
      hookFirstmonthPanelRenderer();
      return out;
    };
  }
})();
