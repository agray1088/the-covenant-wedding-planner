/* Premarital Counseling — All.dc #13c + Views #32e/#32f + Drawers batch 26 (Session) + Dark.dc rail.
   Views: Table | Cards | Calendar.
   Rail: All sessions · Completed · Scheduled · Not booked · Homework due
         + Progress meters + Group by Status / Topic / Month.
   Stats: Sessions · Completed · Homework done · Next · Counselor.
   Table columns: Session · Topic · Date · Homework · Status (+ §13 homework child rows).
   Drawer tabs: Session · Homework · Notes · History.
   Data: data.counseling[] — num, date, topic, homework (string|[]), takeaway, questions, status. */
(function () {
  'use strict';

  window._couMode = window._couMode || 'table';
  window._couRailView = window._couRailView || 'all';
  window._couGroupBy = window._couGroupBy || 'status';
  window._couUiFilters = window._couUiFilters || { status: 'all', topic: 'all', month: 'all' };
  window._couShowCommitments = window._couShowCommitments !== false;
  window._couHomeworkFilter = !!window._couHomeworkFilter;
  window._couDrawerId = window._couDrawerId || null;
  window._couDrawerTab = window._couDrawerTab || 0;
  window._couExpanded = window._couExpanded || null;
  window._couSel = window._couSel instanceof Set ? window._couSel : new Set();
  window._couCalMonth = window._couCalMonth || null;

  const DRAWER_TABS = ['Session', 'Homework', 'Notes', 'History'];

  const esc = s => (typeof escapeHtml === 'function'
    ? escapeHtml(s == null ? '' : String(s))
    : String(s == null ? '' : s));

  function ensureCou() {
    if (!window.data) window.data = {};
    if (!Array.isArray(data.counseling)) data.counseling = [];
  }

  function parseDate(value) {
    if (!value) return null;
    const d = new Date(String(value).split('T')[0] + 'T00:00:00');
    return Number.isNaN(d.getTime()) ? null : d;
  }
  function fmtShort(value) {
    const d = parseDate(value);
    if (!d) return String(value || '—');
    return d.toLocaleDateString('en-US', { day: 'numeric', month: 'short' });
  }
  function fmtLong(value) {
    const d = parseDate(value);
    if (!d) return String(value || '—');
    return d.toLocaleDateString('en-US', { day: 'numeric', month: 'long', year: 'numeric' });
  }
  function pad2(n) { return String(n).padStart(2, '0'); }

  function topicCategory(topic) {
    const t = String(topic || '').toLowerCase();
    if (/money|financ|budget/.test(t)) return 'Money';
    if (/argu|conflict|communicat/.test(t)) return 'Conflict';
    if (/intim|expect/.test(t)) return 'Intimacy';
    if (/faith|spiritual|christ|worship/.test(t)) return 'Spiritual rhythms';
    if (/famil|child|origin|role/.test(t)) return 'Family';
    if (/week before|closing|first year/.test(t)) return 'Closing';
    if (/found|why marriage|covenant/.test(t)) return 'Foundations';
    return 'Foundations';
  }

  function parseHomework(row) {
    if (Array.isArray(row.homeworkItems) && row.homeworkItems.length) {
      return row.homeworkItems.map(h => ({
        task: String(h.task || h.item || '').trim() || 'Homework',
        who: String(h.who || h.owner || 'Both').trim() || 'Both',
        due: h.due || '',
        status: String(h.status || (h.done ? 'Done' : 'Not started')).trim() || 'Not started',
        done: !!(h.done || /done|complete/i.test(String(h.status || '')))
      }));
    }
    const raw = String(row.homework || '').trim();
    if (!raw) return [];
    return raw.split(/\n|;|\|/).map(part => part.trim()).filter(Boolean).map(task => ({
      task: task,
      who: 'Both',
      due: '',
      status: /complete|done/i.test(String(row.status || '')) ? 'Done' : 'Not started',
      done: /complete|done/i.test(String(row.status || ''))
    }));
  }

  function deriveKind(row, hw) {
    const st = String(row.status || '').trim().toLowerCase();
    const doneHw = hw.filter(h => h.done).length;
    const totalHw = hw.length;
    const hasDate = !!parseDate(row.date);
    if (/not booked|unscheduled|not started/.test(st) && !hasDate) return 'notbooked';
    if ((/complete|completed|done/.test(st) || (totalHw > 0 && doneHw === totalHw && hasDate))
      && !/homework due|scheduled/.test(st)) {
      if (totalHw === 0 || doneHw === totalHw) return 'complete';
    }
    if (totalHw > 0 && doneHw < totalHw && hasDate) return 'homework';
    if (hasDate || /scheduled|upcoming/.test(st)) return 'scheduled';
    if (/complete|completed/.test(st)) return 'complete';
    return 'notbooked';
  }
  function statusLabel(kind) {
    if (kind === 'complete') return 'Complete';
    if (kind === 'homework') return 'Homework due';
    if (kind === 'scheduled') return 'Scheduled';
    return 'Not booked';
  }
  function groupLabel(kind) {
    if (kind === 'complete') return 'Completed';
    if (kind === 'notbooked') return 'Not booked';
    return 'Scheduled';
  }

  function counselorName() {
    const s = data.setup || {};
    return String(s.counselor || s.pastor || (data.ceremony && data.ceremony.officiant) || 'Rev. Mensah').trim() || 'Rev. Mensah';
  }

  function unify(row, i) {
    const hw = parseHomework(row);
    const kind = deriveKind(row, hw);
    const num = Number(row.num) || (i + 1);
    const topic = String(row.topic || '').trim() || 'Untitled session';
    const title = pad2(num) + ' · ' + topic.split(/[—–-]/)[0].trim();
    const id = row._id ? ('counseling:' + row._id) : ('counseling:idx:' + i);
    const time = String(row.time || row.when || '').trim();
    const dateLabel = parseDate(row.date)
      ? (fmtShort(row.date) + (time ? ' · ' + time : ''))
      : '—';
    return {
      id: id, index: i, row: row, num: num,
      title: title, topic: topic, category: topicCategory(topic),
      date: row.date || '', time: time, dateLabel: dateLabel,
      homework: hw,
      hwDone: hw.filter(h => h.done).length,
      hwTotal: hw.length,
      kind: kind,
      status: statusLabel(kind),
      group: groupLabel(kind),
      takeaway: String(row.takeaway || row.notes || '').trim(),
      questions: String(row.questions || '').trim(),
      counselor: String(row.counselor || counselorName()).trim(),
      where: String(row.where || row.location || 'Grace Chapel · study').trim(),
      length: String(row.length || '90 minutes').trim()
    };
  }

  function allSessions() {
    ensureCou();
    return data.counseling.map(unify).sort((a, b) => a.num - b.num);
  }
  function findById(id) {
    return allSessions().find(s => s.id === id) || null;
  }

  function counselingFigures() {
    const els = allSessions();
    const complete = els.filter(e => e.kind === 'complete');
    const scheduled = els.filter(e => e.kind === 'scheduled' || e.kind === 'homework');
    const notbooked = els.filter(e => e.kind === 'notbooked');
    const hwDue = els.filter(e => e.kind === 'homework');
    let hwDone = 0, hwTotal = 0;
    els.forEach(e => { hwDone += e.hwDone; hwTotal += e.hwTotal; });
    const upcoming = els
      .filter(e => e.date && (e.kind === 'scheduled' || e.kind === 'homework'))
      .sort((a, b) => String(a.date).localeCompare(String(b.date)))[0];
    const withNotes = els.filter(e => e.takeaway);
    const words = withNotes.reduce((s, e) => s + String(e.takeaway).split(/\s+/).filter(Boolean).length, 0);
    const last = els.filter(e => e.date).slice().sort((a, b) => String(b.date).localeCompare(String(a.date)))[0];
    return {
      sessions: els.length,
      complete: complete.length,
      scheduled: scheduled.length,
      notbooked: notbooked.length,
      homeworkDue: hwDue.length,
      hwDone: hwDone,
      hwTotal: hwTotal,
      nextLabel: upcoming ? fmtShort(upcoming.date) : '—',
      nextTopic: upcoming ? upcoming.category : '',
      finishes: last && last.kind !== 'complete' ? fmtShort(els.filter(e => e.date).slice(-1)[0]?.date) : (els.filter(e => e.date).slice(-1)[0] ? fmtShort(els.filter(e => e.date).slice(-1)[0].date) : '—'),
      counselor: counselorName(),
      notesCount: withNotes.length,
      words: words,
      held: complete.length,
      booked: scheduled.length,
      collisions: 0
    };
  }
  function counselingRailCounts() {
    const f = counselingFigures();
    return {
      all: f.sessions,
      complete: f.complete,
      scheduled: f.scheduled,
      notbooked: f.notbooked,
      homework: f.homeworkDue
    };
  }

  function matchesRail(e) {
    const v = window._couRailView || 'all';
    if (v === 'complete') return e.kind === 'complete';
    if (v === 'scheduled') return e.kind === 'scheduled' || e.kind === 'homework';
    if (v === 'notbooked') return e.kind === 'notbooked';
    if (v === 'homework') return e.kind === 'homework';
    return true;
  }
  function matchesFilters(e) {
    if (!matchesRail(e)) return false;
    const ui = window._couUiFilters || {};
    if (ui.status && ui.status !== 'all' && String(e.status).toLowerCase() !== String(ui.status).toLowerCase()) return false;
    if (ui.topic && ui.topic !== 'all' && String(e.category).toLowerCase() !== String(ui.topic).toLowerCase()) return false;
    if (ui.month && ui.month !== 'all') {
      const d = parseDate(e.date);
      if (!d) return false;
      const label = d.toLocaleDateString('en-US', { month: 'long', year: 'numeric' });
      if (label.toLowerCase() !== String(ui.month).toLowerCase()) return false;
    }
    if (window._couHomeworkFilter && e.kind !== 'homework') return false;
    return true;
  }
  function filteredSessions() {
    return allSessions().filter(matchesFilters);
  }

  /* ── shell ───────────────────────────────────────────────────────────── */

  function pageheadActionsHtml() {
    const mode = window._couMode || 'table';
    if (mode === 'cards') {
      return ''
        + '<button type="button" class="rd-btn" onclick="rdCouPrintNotes()">Print notes</button>'
        + '<button type="button" class="rd-btn" onclick="rdCouFullEditor()">Full editor</button>'
        + '<button type="button" class="rd-btn" onclick="rdCouExport()">Export</button>'
        + '<button type="button" class="rd-btn rd-btn--primary" onclick="rdCouAdd()">Book a session</button>';
    }
    if (mode === 'calendar') {
      return ''
        + '<button type="button" class="rd-btn" onclick="rdCouPrint()">Print schedule</button>'
        + '<button type="button" class="rd-btn" onclick="rdCouFullEditor()">Full editor</button>'
        + '<button type="button" class="rd-btn" onclick="rdCouExport()">Export</button>'
        + '<button type="button" class="rd-btn rd-btn--primary" onclick="rdCouAdd()">Book a session</button>';
    }
    return ''
      + '<button type="button" class="rd-btn" onclick="rdCouMessage()">Message the counselor</button>'
      + '<button type="button" class="rd-btn" onclick="rdCouPrint()"><svg viewBox="0 0 24 24" aria-hidden="true" style="width:14px;height:14px;fill:none;stroke:currentColor;stroke-width:1.7;stroke-linecap:round;stroke-linejoin:round"><path d="M6 9V4h12v5"/><rect x="4" y="9" width="16" height="7" rx="1"/><path d="M7 16h10v4H7z"/></svg>Print section</button>'
      + '<button type="button" class="rd-btn" onclick="rdCouFullEditor()">Full editor</button>'
      + '<button type="button" class="rd-btn" onclick="rdCouExport()">Export</button>'
      + '<button type="button" class="rd-btn rd-btn--primary" onclick="rdCouAdd()">Book a session</button>';
  }

  function uedCounselingShellRd() {
    const panel = document.getElementById('panel-counseling');
    if (!panel) return;
    panel.classList.add('ued-scope', 'counseling-mockup');
    if (panel.dataset.uedShell === 'counseling-rd13c') {
      const actions = panel.querySelector('.rd-pagehead__actions');
      if (actions) actions.innerHTML = pageheadActionsHtml();
      return;
    }
    panel.dataset.uedShell = 'counseling-rd13c';
    panel.innerHTML = `<div class="rd-page">
      <div class="rd-pagehead">
        <div>
          <div class="rd-pagehead__eyebrow">Covenant</div>
          <div class="rd-pagehead__title-row">
            <h1 class="rd-pagehead__title">Premarital Counseling</h1>
          </div>
        </div>
        <div class="rd-pagehead__actions">${pageheadActionsHtml()}</div>
      </div>
      <div class="rd-stats m-stats" id="counseling-stats" aria-label="Counseling summary"></div>
      <div class="rd-toolbar" id="counseling-toolbar"></div>
      <div class="rd-bulkbar" id="counseling-bulk-bar" hidden></div>
      <div class="rd-surface">
        <div class="rd-surface__row" id="counseling-surface-row">
          <div class="rd-surface__main" id="counseling-view-host">
            <div class="rd-view" id="cou-view-table" data-cou-view="table"></div>
            <div class="rd-view" id="cou-view-cards" data-cou-view="cards" hidden></div>
            <div class="rd-view" id="cou-view-calendar" data-cou-view="calendar" hidden></div>
          </div>
          <div id="counseling-drawer-slot"></div>
        </div>
      </div>
    </div>`;
    if (typeof window.covenantShell !== 'undefined' && window.covenantShell.drawer) {
      window.covenantShell.drawer();
    }
  }

  function renderCouStatsRd() {
    const host = document.getElementById('counseling-stats');
    if (!host) return;
    const f = counselingFigures();
    const mode = window._couMode || 'table';
    if (mode === 'cards') {
      if (typeof RdDepth !== 'undefined' && RdDepth.renderStats) {
        RdDepth.renderStats(host, [
          { label: 'Sessions', value: String(f.sessions) },
          { label: 'Complete', value: String(f.complete) },
          { label: 'Homework owed', value: String(f.homeworkDue), attention: f.homeworkDue ? 'outstanding' : undefined },
          { label: 'Unscheduled', value: String(f.notbooked), attention: f.notbooked ? 'book before rehearsal' : undefined },
          { label: 'Next session', value: f.nextLabel, attention: f.nextTopic || undefined }
        ]);
        return;
      }
    }
    if (mode === 'calendar') {
      if (typeof RdDepth !== 'undefined' && RdDepth.renderStats) {
        RdDepth.renderStats(host, [
          { label: 'Booked', value: String(f.booked), attention: f.nextLabel !== '—' ? f.nextLabel : undefined },
          { label: 'Held', value: String(f.held) },
          { label: 'Unscheduled', value: String(f.notbooked) },
          { label: 'Weeks remaining', value: '—' },
          { label: 'Collisions', value: String(f.collisions), attention: 'checked against appointments' }
        ]);
        return;
      }
    }
    if (typeof RdDepth !== 'undefined' && RdDepth.renderStats) {
      RdDepth.renderStats(host, [
        { label: 'Sessions', value: String(f.sessions) },
        { label: 'Completed', value: String(f.complete) },
        { label: 'Homework done', value: f.hwDone + ' of ' + Math.max(f.hwTotal, f.hwDone) },
        { label: 'Next', value: f.nextLabel },
        { label: 'Counselor', value: f.counselor }
      ]);
      return;
    }
    host.innerHTML = [
      ['Sessions', f.sessions], ['Completed', f.complete],
      ['Homework done', f.hwDone + ' of ' + f.hwTotal],
      ['Next', f.nextLabel], ['Counselor', f.counselor]
    ].map(([l, v]) =>
      `<div class="m-stat"><div class="m-stat-label">${esc(l)}</div><div class="m-stat-val">${esc(String(v))}</div></div>`
    ).join('');
  }

  function filterChip(label, field) {
    const ui = window._couUiFilters || {};
    const cur = ui[field] || 'all';
    const on = cur && cur !== 'all';
    const chev = '<svg viewBox="0 0 24 24" aria-hidden="true" style="width:1em;height:1em;fill:none;stroke:currentColor;stroke-width:2.2;stroke-linecap:round"><path d="m6 9 6 6 6-6"/></svg>';
    return `<button type="button" class="rd-chip${on ? ' is-active' : ''}" onclick="rdCouCycleFilter('${field}')">${esc(on ? label + ': ' + cur : label + ': all')}`
      + (on ? `<span class="rd-chip__clear" onclick="event.stopPropagation();rdCouClearFilter('${field}')">&#10005;</span>` : chev)
      + '</button>';
  }

  function renderCouToolbar() {
    const host = document.getElementById('counseling-toolbar');
    if (!host) return;
    const mode = window._couMode || 'table';
    let left = '';
    if (mode === 'calendar') {
      const month = calMonthDate();
      const label = month.toLocaleDateString('en-US', { month: 'long', year: 'numeric' });
      left =
        `<button type="button" class="rd-chip is-active">Month: ${esc(label.split(' ')[0])}</button>` +
        `<button type="button" class="rd-chip${window._couShowCommitments ? ' is-active' : ''}" onclick="rdCouToggleCommitments()">Show other commitments${window._couShowCommitments ? ' ✕' : ''}</button>` +
        `<span class="rd-cou-toolbar-note">Red = proposed, not booked</span>`;
    } else if (mode === 'cards') {
      left = filterChip('Status', 'status') +
        `<button type="button" class="rd-chip rd-chip--ghost">With: ${esc(counselorName())}</button>` +
        `<button type="button" class="rd-chip${window._couHomeworkFilter ? ' is-active' : ''}" onclick="rdCouToggleHwFilter()">Homework outstanding${window._couHomeworkFilter ? ' ✕' : ''}</button>` +
        `<button type="button" class="rd-chip rd-chip--ghost">Sort by session number</button>`;
    } else {
      left = filterChip('Status', 'status') + filterChip('Topic', 'topic') + filterChip('Month', 'month') +
        `<button type="button" class="rd-chip rd-chip--ghost">Sort by session number</button>`;
    }
    host.innerHTML = left +
      (mode === 'table'
        ? `<button type="button" class="rd-chip rd-chip--ghost">Columns · 5 of 5</button>` +
          `<button type="button" class="rd-chip rd-chip--ghost">Auto-fit columns</button>` +
          `<button type="button" class="rd-chip rd-chip--ghost">Row height · compact</button>`
        : '') +
      `<div class="rd-toolbar__right">` +
      `<div class="rd-viewswitch" role="group" aria-label="Counseling view">` +
      `<button type="button" class="rd-viewswitch__item${mode === 'table' ? ' is-active' : ''}" onclick="rdSetCounselingView('table')">Table</button>` +
      `<button type="button" class="rd-viewswitch__item${mode === 'cards' ? ' is-active' : ''}" onclick="rdSetCounselingView('cards')">Cards</button>` +
      `<button type="button" class="rd-viewswitch__item${mode === 'calendar' ? ' is-active' : ''}" onclick="rdSetCounselingView('calendar')">Calendar</button>` +
      `</div></div>`;
  }

  function renderBulkBar() {
    const host = document.getElementById('counseling-bulk-bar');
    if (!host) return;
    const n = window._couSel.size;
    if (!n || (window._couMode || 'table') !== 'table') {
      host.hidden = true;
      host.innerHTML = '';
      return;
    }
    host.hidden = false;
    host.innerHTML =
      `<span class="rd-bulkbar__count">${n} selected</span><span class="rd-bulkbar__sep"></span>` +
      `<button type="button" class="rd-bulkbar__action" onclick="rdCouBulk('reschedule')">Reschedule</button>` +
      `<button type="button" class="rd-bulkbar__action" onclick="rdCouBulk('hwdone')">Mark homework done</button>` +
      `<button type="button" class="rd-bulkbar__action" onclick="rdCouBulk('note')">Add note</button>` +
      `<button type="button" class="rd-bulkbar__action" onclick="rdCouPrintNotes()">Print record</button>` +
      `<button type="button" class="rd-bulkbar__clear" onclick="rdCouBulkClear()">Clear selection</button>`;
  }

  function applyViewMode() {
    const mode = window._couMode || 'table';
    ['table', 'cards', 'calendar'].forEach(name => {
      const el = document.getElementById('cou-view-' + name);
      if (el) el.hidden = name !== mode;
    });
  }
  function rdSetCounselingView(mode) {
    window._couMode = (mode === 'cards' || mode === 'calendar') ? mode : 'table';
    renderCounselingRd();
  }
  function applyCounselingRailView(viewId) {
    window._couRailView = viewId || 'all';
    if (typeof setSavedView === 'function') setSavedView('counseling', window._couRailView);
    window._couMode = 'table';
    renderCounselingRd();
  }
  function applyCounselingGroupBy(g) {
    window._couGroupBy = g || 'status';
    renderCounselingRd();
  }

  /* ── Table ───────────────────────────────────────────────────────────── */

  function renderTableView() {
    const host = document.getElementById('cou-view-table');
    if (!host) return;
    const els = filteredSessions();
    const by = window._couGroupBy || 'status';
    const groups = {};
    els.forEach(e => {
      let key = e.group;
      if (by === 'topic') key = e.category;
      if (by === 'month') {
        const d = parseDate(e.date);
        key = d ? d.toLocaleDateString('en-US', { month: 'long', year: 'numeric' }) : 'Unscheduled';
      }
      if (!groups[key]) groups[key] = [];
      groups[key].push(e);
    });
    const order = by === 'status' ? ['Completed', 'Scheduled', 'Not booked'] : Object.keys(groups);

    let html = `<table class="rd-cou-table"><thead><tr>` +
      `<th style="width:34px"></th><th>Session</th><th>Topic</th><th>Date</th><th>Homework</th><th>Status</th>` +
      `</tr></thead><tbody>`;

    order.forEach(g => {
      const rows = groups[g];
      if (!rows || !rows.length) return;
      const hwD = rows.reduce((s, r) => s + r.hwDone, 0);
      const hwT = rows.reduce((s, r) => s + r.hwTotal, 0);
      const sub = g === 'Not booked'
        ? (rows.length + ' session' + (rows.length === 1 ? '' : 's'))
        : (rows.length + ' session' + (rows.length === 1 ? '' : 's') + ' · ' + hwD + ' of ' + hwT + ' homework done');
      html += `<tr class="rd-cou-group"><td colspan="6">${esc(g)} · ${esc(sub)}</td></tr>`;
      rows.forEach(e => {
        const sel = window._couSel.has(e.id);
        const expanded = window._couExpanded === e.id;
        const scheme = e.kind === 'complete' ? 'gold' : (e.kind === 'homework' ? 'red' : (e.kind === 'notbooked' ? 'muted' : 'forest'));
        html += `<tr class="rd-cou-row${sel ? ' is-selected' : ''}${e.kind === 'homework' ? ' is-due' : ''}" data-cou-id="${esc(e.id)}" onclick="rdCouOpenDrawer('${esc(e.id)}')">` +
          `<td onclick="event.stopPropagation()"><input type="checkbox" ${sel ? 'checked' : ''} onchange="rdCouToggleSel('${esc(e.id)}')"></td>` +
          `<td class="rd-cou-name">${esc(e.title)}` +
          `<span class="rd-cou-row__actions">` +
          `<button type="button" onclick="event.stopPropagation();rdCouToggleExpand('${esc(e.id)}')">${expanded ? 'Hide' : 'Homework'}</button>` +
          `<button type="button" onclick="event.stopPropagation();rdCouFullEditor('${esc(e.id)}')">Full editor</button>` +
          `</span></td>` +
          `<td>${esc(e.category)}</td><td>${esc(e.dateLabel)}</td>` +
          `<td>${esc(e.hwDone + ' of ' + e.hwTotal)}</td>` +
          `<td><span class="status-pill" data-pillscheme="${scheme}">${esc(e.status)}</span></td>` +
          `</tr>`;
        if (expanded) {
          html += `<tr class="rd-cou-child"><td colspan="6">` +
            `<div class="rd-cou-hwpanel">` +
            `<div class="rd-section__head">` +
            `<div class="rd-pagehead__eyebrow">Homework · session ${esc(pad2(e.num))}</div>` +
            `<p class="rd-help">${e.date ? ('Due before ' + esc(fmtLong(e.date))) : 'No date set'}</p>` +
            `<button type="button" class="rd-btn rd-btn--quiet" style="margin-left:auto" onclick="rdCouAddHomework('${esc(e.id)}')">+ Add homework</button>` +
            `</div>` +
            `<table class="rd-cou-hwtable"><thead><tr><th>Task</th><th>Who</th><th>Due</th><th>Status</th></tr></thead><tbody>`;
          if (!e.homework.length) {
            html += `<tr><td colspan="4" class="rd-cou-empty">No homework rows yet.</td></tr>`;
          } else {
            e.homework.forEach((h, hi) => {
              html += `<tr>` +
                `<td>${esc(h.task)}</td><td>${esc(h.who)}</td><td>${esc(h.due ? fmtShort(h.due) : '—')}</td>` +
                `<td><button type="button" class="rd-chip${h.done ? ' is-active' : ''}" onclick="rdCouToggleHw('${esc(e.id)}',${hi})">${esc(h.status)}</button></td>` +
                `</tr>`;
            });
          }
          html += `</tbody></table></div></td></tr>`;
        }
      });
    });
    if (!els.length) {
      html += `<tr class="rd-cou-empty-row"><td colspan="6">No sessions in this view yet.</td></tr>`;
    }
    html += `</tbody></table>`;
    html += `<button type="button" class="rd-cou-addbtn" onclick="rdCouAdd()"><span>+</span> Book a session with ${esc(counselorName())}</button>`;

    /* Keepsake notes band */
    const noted = allSessions().filter(e => e.takeaway).slice(0, 4);
    html += `<section class="rd-cou-keepsake">` +
      `<div class="rd-section__head">` +
      `<div class="rd-pagehead__eyebrow">What we have written down</div>` +
      `<p class="rd-help">${noted.length} session${noted.length === 1 ? '' : 's'} of notes, kept as a single record and printed as a Class B keepsake</p>` +
      `<button type="button" class="rd-btn rd-btn--quiet" style="margin-left:auto" onclick="rdCouPrintNotes()">Print the record</button>` +
      `</div>`;
    if (noted.length) {
      html += `<div class="rd-cou-keepsake__list">` + noted.map(e =>
        `<article onclick="rdCouOpenDrawer('${esc(e.id)}')"><h4>${esc(e.title)}</h4><p>${esc(e.takeaway)}</p></article>`
      ).join('') + `</div>`;
    } else {
      html += `<p class="rd-cou-empty">Notes are taken after the session, not before.</p>`;
    }
    html += `</section>`;
    host.innerHTML = html;
  }

  /* ── Cards (#32e) ────────────────────────────────────────────────────── */

  function renderCardsView() {
    const host = document.getElementById('cou-view-cards');
    if (!host) return;
    const els = filteredSessions();
    let html = `<div class="rd-cou-cardgrid">`;
    els.forEach(e => {
      const scheme = e.kind === 'complete' ? 'gold' : (e.kind === 'homework' ? 'red' : (e.kind === 'notbooked' ? 'muted' : 'forest'));
      html += `<article class="rd-cou-card" onclick="rdCouOpenDrawer('${esc(e.id)}')">` +
        `<div class="rd-cou-card__top">` +
        `<span class="rd-cou-card__num">${esc(pad2(e.num))}</span>` +
        `<span class="status-pill" data-pillscheme="${scheme}">${esc(e.status)}</span>` +
        `</div>` +
        `<h3>${esc(e.topic)}</h3>` +
        `<div class="rd-cou-card__meta">${esc(e.category)} · ${esc(e.dateLabel)}</div>` +
        `<div class="rd-cou-card__hw">Homework ${esc(e.hwDone + ' of ' + e.hwTotal)}</div>` +
        (e.kind === 'notbooked' ? `<p class="rd-cou-card__note">Book before the rehearsal</p>` : '') +
        `</article>`;
    });
    if (!els.length) html += `<p class="rd-cou-empty">No sessions in this view yet.</p>`;
    html += `</div>`;
    host.innerHTML = html;
  }

  /* ── Calendar (#32f) ─────────────────────────────────────────────────── */

  function calMonthDate() {
    if (window._couCalMonth) {
      const d = parseDate(window._couCalMonth + '-01');
      if (d) return d;
    }
    const next = allSessions().find(e => e.date && (e.kind === 'scheduled' || e.kind === 'homework'));
    if (next) {
      const d = parseDate(next.date);
      if (d) return new Date(d.getFullYear(), d.getMonth(), 1);
    }
    const now = new Date();
    return new Date(now.getFullYear(), now.getMonth(), 1);
  }

  function renderCalendarView() {
    const host = document.getElementById('cou-view-calendar');
    if (!host) return;
    const month = calMonthDate();
    window._couCalMonth = month.getFullYear() + '-' + pad2(month.getMonth() + 1);
    const y = month.getFullYear();
    const m = month.getMonth();
    const firstDow = new Date(y, m, 1).getDay();
    const daysInMonth = new Date(y, m + 1, 0).getDate();
    const sessions = allSessions().filter(e => {
      const d = parseDate(e.date);
      return d && d.getFullYear() === y && d.getMonth() === m;
    });
    const f = counselingFigures();
    const monthLabel = month.toLocaleDateString('en-US', { month: 'long', year: 'numeric' });

    let html = `<div class="rd-cou-cal">` +
      `<div class="rd-section__head">` +
      `<div class="rd-pagehead__eyebrow">${esc(monthLabel)} · ${sessions.length} session${sessions.length === 1 ? '' : 's'} booked · ${f.notbooked} still unscheduled</div>` +
      `<p class="rd-help">Click a day to add · sessions appear on Smart Calendar but are not appointment records</p>` +
      `<div style="margin-left:auto;display:flex;gap:6px">` +
      `<button type="button" class="rd-btn rd-btn--quiet" onclick="rdCouShiftMonth(-1)">‹</button>` +
      `<button type="button" class="rd-btn rd-btn--quiet" onclick="rdCouShiftMonth(1)">›</button>` +
      `</div></div>` +
      `<div class="rd-cou-cal__grid">` +
      ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map(d => `<div class="rd-cou-cal__dow">${d}</div>`).join('');

    for (let i = 0; i < firstDow; i++) html += `<div class="rd-cou-cal__day is-empty"></div>`;
    for (let day = 1; day <= daysInMonth; day++) {
      const iso = y + '-' + pad2(m + 1) + '-' + pad2(day);
      const daySessions = sessions.filter(e => String(e.date).slice(0, 10) === iso);
      html += `<div class="rd-cou-cal__day" onclick="rdCouAddOnDay('${iso}')">` +
        `<div class="rd-cou-cal__num">${day}</div>`;
      daySessions.forEach(e => {
        html += `<button type="button" class="rd-cou-cal__event${e.kind === 'notbooked' ? ' is-proposed' : ''}" onclick="event.stopPropagation();rdCouOpenDrawer('${esc(e.id)}')">` +
          `${esc(pad2(e.num) + ' · ' + e.category)}${e.time ? ' · ' + esc(e.time) : ''}` +
          `</button>`;
      });
      if (window._couShowCommitments && typeof data !== 'undefined' && Array.isArray(data.appointments)) {
        data.appointments.forEach(a => {
          if (String(a.date || '').slice(0, 10) === iso) {
            html += `<div class="rd-cou-cal__other">${esc(a.title || a.name || 'Appointment')}${a.time ? ' · ' + esc(a.time) : ''}</div>`;
          }
        });
      }
      html += `</div>`;
    }
    html += `</div></div>`;
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

  function renderCouDrawer() {
    const slot = document.getElementById('counseling-drawer-slot');
    if (!slot) return;
    const shared = document.getElementById('record-drawer');
    if (shared && slot.contains(shared) && !shared.hasAttribute('hidden')) {
      slot.classList.add('is-open');
      return;
    }
    const e = findById(window._couDrawerId);
    if (!e) {
      if (!(shared && slot.contains(shared) && !shared.hasAttribute('hidden'))) {
        parkSharedDrawerAway(slot);
        slot.innerHTML = '';
        slot.classList.remove('is-open');
      }
      return;
    }
    parkSharedDrawerAway(slot);
    const tab = Math.max(0, Math.min(DRAWER_TABS.length - 1, parseInt(window._couDrawerTab, 10) || 0));
    const f = counselingFigures();
    const total = Math.max(f.sessions, e.num);
    let body = '';
    if (tab === 0) {
      body =
        field('Number', pad2(e.num) + ' of ' + pad2(total)) +
        field('Topic', e.category) +
        field('Counselor', e.counselor) +
        field('Where', e.where) +
        field('Date', e.date ? (fmtLong(e.date) + (e.time ? ' · ' + e.time : '')) : '—') +
        field('Length', e.length) +
        `<p class="rd-drawer__note">Sessions appear on the Smart Calendar. They are not appointment records — the calendar reads them, it does not own them.</p>` +
        field('Smart Calendar', e.dateLabel !== '—' ? e.dateLabel + ' →' : '—', "typeof showPanel==='function'&&showPanel('calendar')");
    } else if (tab === 1) {
      body =
        `<div class="rd-drawer__section-title">Homework · ${e.hwDone} of ${e.hwTotal}</div>` +
        (e.homework.length
          ? e.homework.map((h, hi) =>
            `<div class="rd-drawer__guest">${esc(h.task)} <span>${esc(h.due ? ('Due ' + fmtShort(h.due)) : h.status)}</span>` +
            `<button type="button" class="rd-chip" style="margin-left:8px" onclick="rdCouToggleHw('${esc(e.id)}',${hi})">${h.done ? 'Done' : 'Tick'}</button></div>`
          ).join('')
          : '<p class="rd-drawer__note">No homework rows yet.</p>') +
        `<p class="rd-drawer__note">A session is finished when the homework is done — completion is derived from these child rows, not a tick on the parent.</p>` +
        `<button type="button" class="rd-btn" onclick="rdCouAddHomework('${esc(e.id)}')">+ Add homework</button>` +
        (e.homework.some(h => !h.done)
          ? `<button type="button" class="rd-btn" onclick="rdCouTickAll('${esc(e.id)}')">Tick both</button>`
          : '');
    } else if (tab === 2) {
      body =
        (e.takeaway
          ? `<p class="rd-cou-drawer__prose">${esc(e.takeaway)}</p>`
          : `<p class="rd-drawer__note">Nothing written yet — notes are taken after the session, not before.</p>`) +
        (e.questions ? `<div class="rd-drawer__section-title">Questions</div><p class="rd-drawer__note">${esc(e.questions)}</p>` : '') +
        `<div class="rd-drawer__section-title">Notes written</div>` +
        field('Sessions with notes', f.notesCount + ' of ' + f.complete) +
        field('Words', String(f.words));
    } else {
      body =
        `<div class="rd-drawer__hist"><strong>—</strong> · Planner<div>Created in the plan of ${esc(String(f.sessions))}</div></div>` +
        (e.date ? `<div class="rd-drawer__hist"><strong>${esc(fmtShort(e.date))}</strong> · Planner<div>Booked</div></div>` : '') +
        (e.hwTotal ? `<div class="rd-drawer__hist"><strong>—</strong> · Planner<div>Homework · ${esc(e.hwDone + ' of ' + e.hwTotal)}</div></div>` : '') +
        `<p class="rd-drawer__note">History is provisional until counseling audit tracking lands.</p>`;
    }

    const domainCta = (tab === 1 && e.kind === 'homework')
      ? `<button type="button" class="rd-btn rd-btn--primary" onclick="rdCouTickAll('${esc(e.id)}')">Tick both</button>`
      : `<button type="button" class="rd-btn rd-btn--primary" onclick="rdCouCloseDrawer()">Save</button>`;

    slot.classList.add('is-open');
    slot.innerHTML =
      `<aside class="rd-drawer rd-cou-drawer" aria-label="Counseling session">` +
      `<div class="rd-drawer__head">` +
      `<div class="rd-drawer__eyebrow">Session ${esc(pad2(e.num))} · ${esc(e.kind === 'complete' ? 'complete' : (e.kind === 'homework' ? 'scheduled' : e.kind))}</div>` +
      `<h2 class="rd-drawer__title">${esc(e.topic)}</h2>` +
      `<div class="rd-drawer__chips">` +
      (e.dateLabel !== '—' ? `<span class="status-pill" data-pillscheme="gold">${esc(e.dateLabel)}</span>` : '') +
      `<span class="status-pill" data-pillscheme="${e.kind === 'homework' ? 'red' : 'gold'}">${esc(e.status)}</span>` +
      `</div>` +
      `<button type="button" class="rd-drawer__close" onclick="rdCouCloseDrawer()" aria-label="Close">×</button>` +
      `<div class="rd-drawer__tabs" role="tablist">` +
      DRAWER_TABS.map((label, i) =>
        `<button type="button" class="rd-drawer__tab${i === tab ? ' is-active' : ''}" onclick="rdCouSetDrawerTab(${i})">${esc(label)}</button>`
      ).join('') +
      `</div></div>` +
      `<div class="rd-drawer__body">${body}</div>` +
      `<div class="rd-drawer__foot">` +
      domainCta +
      `<button type="button" class="rd-btn" onclick="rdCouFullEditor('${esc(e.id)}')">Full editor</button>` +
      `</div></aside>`;
  }

  /* ── actions ─────────────────────────────────────────────────────────── */

  function ensureHomeworkArray(row) {
    if (!Array.isArray(row.homeworkItems)) {
      row.homeworkItems = parseHomework(row);
    }
    return row.homeworkItems;
  }

  function rdCouOpenDrawer(id) {
    window._couDrawerId = id;
    window._couDrawerTab = 0;
    window._couExpanded = id;
    renderCounselingRd();
  }
  function rdCouCloseDrawer() {
    window._couDrawerId = null;
    const slot = document.getElementById('counseling-drawer-slot');
    if (slot) {
      parkSharedDrawerAway(slot);
      slot.innerHTML = '';
      slot.classList.remove('is-open');
    }
  }
  function rdCouSetDrawerTab(i) {
    window._couDrawerTab = i;
    renderCouDrawer();
  }
  function rdCouToggleExpand(id) {
    window._couExpanded = window._couExpanded === id ? null : id;
    renderTableView();
  }
  function rdCouAdd() {
    if (typeof openRecordEditor === 'function') openRecordEditor('counseling');
    else if (typeof addCounselingRow === 'function') addCounselingRow();
  }
  function rdCouAddOnDay(iso) {
    if (typeof openRecordEditor === 'function') {
      openRecordEditor('counseling');
      try {
        if (window.recordEditorState && window.recordEditorState.draft) {
          window.recordEditorState.draft.date = iso;
          window.recordEditorState.draft.status = 'Scheduled';
        }
      } catch (e) { /* soft */ }
    } else rdCouAdd();
  }
  function rdCouFullEditor(id) {
    const e = id ? findById(id) : findById(window._couDrawerId);
    window._couDrawerId = null;
    const slot = document.getElementById('counseling-drawer-slot');
    if (slot && !slot.querySelector('#record-drawer')) {
      slot.innerHTML = '';
      slot.classList.remove('is-open');
    }
    if (typeof openRecordEditor === 'function') {
      if (e) openRecordEditor('counseling', e.index);
      else openRecordEditor('counseling');
    }
  }
  function rdCouMessage() {
    if (typeof covAlert === 'function') covAlert('Message ' + counselorName() + ' from your usual mail or messaging app — counselor contact lives on the session record.');
    else window.alert('Message ' + counselorName());
  }
  function rdCouPrint() {
    if (typeof buildCounselingPrintSheets === 'function' && typeof openCovenantPrintTemplate === 'function') {
      openCovenantPrintTemplate(buildCounselingPrintSheets());
    } else if (typeof printCurrentPage === 'function') printCurrentPage();
    else window.print();
  }
  function rdCouPrintNotes() { rdCouPrint(); }
  function rdCouExport() {
    if (typeof exportSectionCSV === 'function') {
      exportSectionCSV('Premarital Counseling', allSessions().map(e => ({
        num: e.num, topic: e.topic, date: e.date, homework: e.hwDone + ' of ' + e.hwTotal, status: e.status
      })));
    }
  }
  function rdCouAddHomework(id) {
    const e = findById(id);
    if (!e) return;
    const items = ensureHomeworkArray(e.row);
    items.push({ task: 'New homework', who: 'Both', due: '', status: 'Not started', done: false });
    e.row.homeworkItems = items;
    if (typeof save === 'function') save();
    renderCounselingRd();
  }
  function rdCouToggleHw(id, hi) {
    const e = findById(id);
    if (!e) return;
    const items = ensureHomeworkArray(e.row);
    if (!items[hi]) return;
    items[hi].done = !items[hi].done;
    items[hi].status = items[hi].done ? 'Done' : 'Not started';
    e.row.homeworkItems = items;
    if (items.length && items.every(h => h.done) && e.date) e.row.status = 'Complete';
    else if (e.date) e.row.status = 'Scheduled';
    if (typeof save === 'function') save();
    renderCounselingRd();
  }
  function rdCouTickAll(id) {
    const e = findById(id);
    if (!e) return;
    const items = ensureHomeworkArray(e.row);
    items.forEach(h => { h.done = true; h.status = 'Done'; });
    e.row.homeworkItems = items;
    if (e.date) e.row.status = 'Complete';
    if (typeof save === 'function') save();
    renderCounselingRd();
  }
  function rdCouCycleFilter(field) {
    const options = { all: true };
    if (field === 'status') allSessions().forEach(e => { options[e.status] = true; });
    if (field === 'topic') allSessions().forEach(e => { options[e.category] = true; });
    if (field === 'month') allSessions().forEach(e => {
      const d = parseDate(e.date);
      if (d) options[d.toLocaleDateString('en-US', { month: 'long', year: 'numeric' })] = true;
    });
    const list = Object.keys(options);
    const cur = (window._couUiFilters || {})[field] || 'all';
    const i = list.indexOf(cur);
    window._couUiFilters[field] = list[(i + 1) % list.length];
    renderCounselingRd();
  }
  function rdCouClearFilter(field) {
    window._couUiFilters[field] = 'all';
    renderCounselingRd();
  }
  function rdCouToggleCommitments() {
    window._couShowCommitments = !window._couShowCommitments;
    renderCounselingRd();
  }
  function rdCouToggleHwFilter() {
    window._couHomeworkFilter = !window._couHomeworkFilter;
    renderCounselingRd();
  }
  function rdCouShiftMonth(delta) {
    const d = calMonthDate();
    d.setMonth(d.getMonth() + delta);
    window._couCalMonth = d.getFullYear() + '-' + pad2(d.getMonth() + 1);
    renderCounselingRd();
  }
  function rdCouToggleSel(id) {
    if (window._couSel.has(id)) window._couSel.delete(id);
    else window._couSel.add(id);
    renderTableView();
    renderBulkBar();
  }
  function rdCouBulkClear() {
    window._couSel.clear();
    renderTableView();
    renderBulkBar();
  }
  async function rdCouBulk(action) {
    const ids = Array.from(window._couSel);
    if (!ids.length) return;
    if (action === 'hwdone') {
      ids.forEach(id => rdCouTickAll(id));
      return;
    }
    if (action === 'reschedule') {
      const first = findById(ids[0]);
      if (first) rdCouFullEditor(first.id);
      return;
    }
    if (action === 'note') {
      const first = findById(ids[0]);
      if (first) {
        window._couDrawerId = first.id;
        window._couDrawerTab = 2;
        renderCounselingRd();
      }
    }
  }

  /* ── main ────────────────────────────────────────────────────────────── */

  function renderCounselingRd() {
    ensureCou();
    uedCounselingShellRd();
    if (typeof renderPageUxChrome === 'function') renderPageUxChrome('counseling');
    applyViewMode();
    renderCouStatsRd();
    renderCouToolbar();
    renderBulkBar();

    const mode = window._couMode || 'table';
    if (mode === 'cards') renderCardsView();
    else if (mode === 'calendar') renderCalendarView();
    else renderTableView();
    renderCouDrawer();

    if (typeof renderContextSidebar === 'function'
      && document.body.getAttribute('data-active-panel') === 'counseling'
      && document.body.classList.contains('context-sidebar-mode')) {
      renderContextSidebar('counseling');
    }
    if (typeof uxRevealPanel === 'function') uxRevealPanel('counseling');
  }

  window.uedCounselingShell = uedCounselingShellRd;
  window.renderCounselingPage = renderCounselingRd;
  window.renderCounselingRd = renderCounselingRd;
  window.renderCounseling = renderCounselingRd;
  window.rdSetCounselingView = rdSetCounselingView;
  window.applyCounselingRailView = applyCounselingRailView;
  window.applyCounselingGroupBy = applyCounselingGroupBy;
  window.counselingRailCounts = counselingRailCounts;
  window.counselingFigures = counselingFigures;
  window.rdCouOpenDrawer = rdCouOpenDrawer;
  window.rdCouCloseDrawer = rdCouCloseDrawer;
  window.rdCouSetDrawerTab = rdCouSetDrawerTab;
  window.rdCouToggleExpand = rdCouToggleExpand;
  window.rdCouAdd = rdCouAdd;
  window.rdCouAddOnDay = rdCouAddOnDay;
  window.rdCouFullEditor = rdCouFullEditor;
  window.rdCouMessage = rdCouMessage;
  window.rdCouPrint = rdCouPrint;
  window.rdCouPrintNotes = rdCouPrintNotes;
  window.rdCouExport = rdCouExport;
  window.rdCouAddHomework = rdCouAddHomework;
  window.rdCouToggleHw = rdCouToggleHw;
  window.rdCouTickAll = rdCouTickAll;
  window.rdCouCycleFilter = rdCouCycleFilter;
  window.rdCouClearFilter = rdCouClearFilter;
  window.rdCouToggleCommitments = rdCouToggleCommitments;
  window.rdCouToggleHwFilter = rdCouToggleHwFilter;
  window.rdCouShiftMonth = rdCouShiftMonth;
  window.rdCouToggleSel = rdCouToggleSel;
  window.rdCouBulkClear = rdCouBulkClear;
  window.rdCouBulk = rdCouBulk;

  function hookCounselingPanelRenderer() {
    if (window.SYSTEM_PANEL_RENDERERS) {
      window.SYSTEM_PANEL_RENDERERS.counseling = function () { renderCounselingRd(); };
    }
  }
  hookCounselingPanelRenderer();
  var _showPanelCou = window.showPanel;
  if (typeof _showPanelCou === 'function') {
    window.showPanel = function (id, forceOpen) {
      var out = _showPanelCou.call(window, id, forceOpen);
      hookCounselingPanelRenderer();
      return out;
    };
  }
})();
