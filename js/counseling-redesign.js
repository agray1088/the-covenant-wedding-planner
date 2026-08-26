/* Premarital Counseling — Master s29 / 13c · Cards 32e · Calendar 32f
   Views: Table | Cards | Calendar (no page reload).
   Rail: All sessions · Completed · Scheduled · Not booked · Homework due
         + Progress meters + Group by Status / Topic / Month.
   Stats (Table): Sessions · Completed · Homework done · Next · Counselor.
   Stats (Cards): Sessions · Complete · Homework owed · Unscheduled · Next session.
   Stats (Calendar): Booked · Held · Unscheduled · Weeks remaining · Collisions.
   Drawer: Session · Homework · Notes · History.
   Primary: Book a session. Completion is derived from homework rows. */
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
  window._couExpanded = window._couExpanded === undefined ? 'pending-05' : window._couExpanded;
  window._couSel = window._couSel instanceof Set ? window._couSel : new Set();
  window._couCalMonth = window._couCalMonth || '2026-08';

  const DRAWER_TABS = ['Session', 'Homework', 'Notes', 'History'];
  const SHELL_VER = 'counseling-rd13c-s29';
  const REHEARSAL = '2026-11-06';
  const LEGACY_TOPIC = /Money & stewardship|Communication patterns|Family-of-origin/i;

  const MASTER_COUNSELING = [
    {
      num: 1, date: '2026-04-14', time: '', topic: 'Why marriage',
      homeworkItems: [
        { task: 'Read the covenant preface', who: 'Both', due: '2026-04-10', status: 'Done', done: true },
        { task: 'Write why we are marrying', who: 'Both', due: '2026-04-12', status: 'Done', done: true }
      ],
      takeaway: '', questions: '',
      history: [
        { when: '2026-04-14', who: 'Ama', what: 'Session held' },
        { when: '2026-04-14', who: 'Ama', what: 'Created in the plan of 8' }
      ]
    },
    {
      num: 2, date: '2026-05-12', time: '', topic: 'How we argue',
      homeworkItems: [
        { task: 'Name the retreat pattern', who: 'Both', due: '2026-05-08', status: 'Done', done: true },
        { task: 'Practise “I am gathering” once', who: 'Ama', due: '2026-05-10', status: 'Done', done: true },
        { task: 'Practise “I am gathering” once', who: 'Kwesi', due: '2026-05-10', status: 'Done', done: true }
      ],
      takeaway: 'We both retreat. Ama goes quiet and Kwesi goes busy, and we have spent four years mistaking each other’s retreat for indifference. Rev. Mensah gave us the phrase “I am not finished, I am gathering” and it has already stopped one argument.',
      questions: '',
      history: [
        { when: '2026-05-12', who: 'Ama', what: 'Notes written' },
        { when: '2026-05-12', who: 'Ama', what: 'Session held' },
        { when: '2026-04-14', who: 'Ama', what: 'Created in the plan of 8' }
      ]
    },
    {
      num: 3, date: '2026-06-09', time: '', topic: 'Families of origin',
      homeworkItems: [
        { task: 'Map who we learned money from', who: 'Both', due: '2026-06-05', status: 'Done', done: true },
        { task: 'Name one family rule we will not keep', who: 'Both', due: '2026-06-07', status: 'Done', done: true }
      ],
      takeaway: '', questions: '',
      history: [
        { when: '2026-06-09', who: 'Ama', what: 'Session held' },
        { when: '2026-04-14', who: 'Ama', what: 'Created in the plan of 8' }
      ]
    },
    {
      num: 4, date: '2026-07-14', time: '', topic: 'Money in the light',
      homeworkItems: [
        { task: 'List every debt', who: 'Ama', due: '2026-07-10', status: 'Done', done: true },
        { task: 'List every debt', who: 'Kwesi', due: '2026-07-10', status: 'Done', done: true }
      ],
      takeaway: 'We came in disagreeing about the wedding budget and left disagreeing about it, but with a rule: no purchase over $200 without both of us. That rule is now the third value on our Vision page.',
      questions: '',
      history: [
        { when: '2026-07-14', who: 'Ama', what: 'Notes written' },
        { when: '2026-07-14', who: 'Ama', what: 'Session held' },
        { when: '2026-04-14', who: 'Ama', what: 'Created in the plan of 8' }
      ],
      links: [{ page: 'Vision & Foundation', detail: 'Promises' }]
    },
    {
      num: 5, date: '2026-08-12', time: '6:00pm', topic: 'Intimacy and expectation',
      homeworkItems: [
        { task: 'Read chapters 7–9, separately', who: 'Both', due: '2026-08-05', status: 'Not started', done: false },
        { task: 'Write three expectations neither of us has said aloud', who: 'Both', due: '2026-08-10', status: 'Not started', done: false }
      ],
      takeaway: '', questions: '',
      prep: 'Read chapter 4',
      history: [
        { when: '2026-07-20', who: 'Ama', what: 'Homework added · 2 items' },
        { when: '2026-07-14', who: 'Ama', what: 'Booked for 12 Aug' },
        { when: '2026-04-14', who: 'Ama', what: 'Created in the plan of 8' }
      ],
      links: [
        { page: 'Smart Calendar', detail: '12 Aug 6:00pm', go: "typeof showPanel==='function'&&showPanel('calendar')" },
        { page: 'Timeline & Tasks', detail: '2 tasks', go: "typeof showPanel==='function'&&showPanel('tasks')" },
        { page: 'Vision & Foundation', detail: 'Promises', go: "typeof showPanel==='function'&&showPanel('vision')" }
      ]
    },
    {
      num: 6, date: '2026-09-09', time: '6:00pm', topic: 'Faith at home',
      homeworkItems: [
        { task: 'Choose a household prayer hour', who: 'Both', due: '2026-09-07', status: 'Not started', done: false },
        { task: 'Name one Sunday we will not skip', who: 'Both', due: '2026-09-07', status: 'Not started', done: false }
      ],
      takeaway: '', questions: '',
      history: [
        { when: '2026-07-14', who: 'Ama', what: 'Booked for 9 Sep' },
        { when: '2026-04-14', who: 'Ama', what: 'Created in the plan of 8' }
      ]
    },
    {
      num: 7, date: '2026-10-07', time: '6:00pm', topic: 'Children and time',
      homeworkItems: [
        { task: 'Write what we hope for in five years', who: 'Both', due: '2026-10-05', status: 'Not started', done: false }
      ],
      takeaway: '', questions: '',
      history: [
        { when: '2026-07-14', who: 'Ama', what: 'Booked for 7 Oct' },
        { when: '2026-04-14', who: 'Ama', what: 'Created in the plan of 8' }
      ]
    },
    {
      num: 8, date: '', time: '', topic: 'The week before',
      homeworkItems: [
        { task: 'Write the closing questions', who: 'Both', due: '', status: 'Not started', done: false },
        { task: 'Name what we still have not said', who: 'Both', due: '', status: 'Not started', done: false }
      ],
      takeaway: '', questions: '',
      proposedDate: '2026-08-26',
      history: [
        { when: '2026-04-14', who: 'Ama', what: 'Created in the plan of 8' }
      ]
    }
  ];

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

  function ensureCou() {
    const d = store();
    if (!Array.isArray(d.counseling)) d.counseling = [];
    if (!d.setup) d.setup = {};
    if (!d.setup.counselor && !d.setup.pastor) d.setup.counselor = 'Rev. Mensah';
  }

  function stampMaster(row) {
    const copy = JSON.parse(JSON.stringify(row));
    if (typeof nextRecordId === 'function') copy._id = nextRecordId('counseling');
    copy.status = copy.status || '';
    return copy;
  }

  function ensureMasterCounseling() {
    ensureCou();
    const d = store();
    if (d.counselingMaster13c) return;
    const rows = d.counseling || [];
    const onlyLegacy = rows.length > 0 && rows.every(r => LEGACY_TOPIC.test(String(r.topic || '')));
    if (rows.length === 0 || onlyLegacy) {
      d.counseling = MASTER_COUNSELING.map(stampMaster);
    } else {
      const have = new Set(rows.map(r => String(r.topic || '').trim().toLowerCase()));
      MASTER_COUNSELING.forEach(function (n) {
        if (!have.has(String(n.topic).trim().toLowerCase())) d.counseling.push(stampMaster(n));
      });
    }
    d.counselingMaster13c = true;
    persist();
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
  function todayISO() {
    const n = new Date();
    return n.getFullYear() + '-' + pad2(n.getMonth() + 1) + '-' + pad2(n.getDate());
  }

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

  /* Completion is derived from child homework, never a parent tick. */
  function deriveKind(row, hw) {
    const hasDate = !!parseDate(row.date);
    const totalHw = hw.length;
    const doneHw = hw.filter(h => h.done).length;
    if (!hasDate) return 'notbooked';
    if (totalHw > 0 && doneHw === totalHw) return 'complete';
    if (totalHw > 0 && doneHw < totalHw) return 'homework';
    return 'scheduled';
  }
  function statusLabel(kind) {
    if (kind === 'complete') return 'Complete';
    if (kind === 'homework') return 'Homework due';
    if (kind === 'scheduled') return 'Scheduled';
    return 'Not booked';
  }
  function cardStatusLabel(kind, row) {
    if (kind === 'complete') return 'Complete';
    if (kind === 'homework') return 'Homework outstanding';
    if (kind === 'scheduled') return 'Upcoming';
    if (/first year|optional/i.test(String(row.topic || ''))) return 'Optional';
    return 'Unscheduled';
  }
  function groupLabel(kind) {
    if (kind === 'complete') return 'Completed';
    if (kind === 'notbooked') return 'Not booked';
    return 'Scheduled';
  }

  function counselorName() {
    const d = store();
    const s = d.setup || {};
    return String(s.counselor || s.pastor || (d.ceremony && d.ceremony.officiant) || 'Rev. Mensah').trim() || 'Rev. Mensah';
  }

  function unify(row, i) {
    const hw = parseHomework(row);
    const kind = deriveKind(row, hw);
    const num = Number(row.num) || (i + 1);
    const topic = String(row.topic || '').trim() || 'Untitled session';
    const title = pad2(num) + ' · ' + topic.split(/[—–]/)[0].trim();
    const id = row._id ? ('counseling:' + row._id) : ('counseling:idx:' + i);
    const time = String(row.time || row.when || '').trim();
    const dateLabel = parseDate(row.date)
      ? (fmtShort(row.date) + (time ? ' · ' + time : ''))
      : '—';
    const owed = hw.filter(h => !h.done);
    const owedWho = Array.from(new Set(owed.map(h => h.who).filter(w => w && w !== 'Both')));
    return {
      id: id, index: i, row: row, num: num,
      title: title, topic: topic, category: topicCategory(topic),
      date: row.date || '', time: time, dateLabel: dateLabel,
      proposedDate: row.proposedDate || '',
      homework: hw,
      hwDone: hw.filter(h => h.done).length,
      hwTotal: hw.length,
      kind: kind,
      status: statusLabel(kind),
      cardStatus: cardStatusLabel(kind, row),
      group: groupLabel(kind),
      takeaway: String(row.takeaway || row.notes || '').trim(),
      questions: String(row.questions || '').trim(),
      counselor: String(row.counselor || counselorName()).trim(),
      where: String(row.where || row.location || 'Grace Chapel · study').trim(),
      length: String(row.length || '90 minutes').trim(),
      prep: String(row.prep || '').trim(),
      history: Array.isArray(row.history) ? row.history : [],
      links: Array.isArray(row.links) ? row.links : [],
      owedWho: owedWho,
      overdue: owed.filter(h => h.due && h.due < todayISO())
    };
  }

  function allSessions() {
    ensureCou();
    return store().counseling.map(unify).sort((a, b) => a.num - b.num);
  }
  function findById(id) {
    return allSessions().find(s => s.id === id) || null;
  }

  function rehearsalDate() { return parseDate(REHEARSAL); }

  function weeksRemaining() {
    const r = rehearsalDate();
    if (!r) return '—';
    const now = parseDate(todayISO()) || new Date();
    const ms = r.getTime() - now.getTime();
    if (ms <= 0) return '0';
    return String(Math.ceil(ms / (7 * 24 * 60 * 60 * 1000)));
  }

  function otherCommitments() {
    const d = store();
    const out = [];
    (d.appointments || []).forEach(a => {
      const date = String(a.date || '').slice(0, 10);
      if (!date) return;
      out.push({
        date: date,
        title: a.title || a.name || 'Appointment',
        time: a.time || a.when || '',
        source: 'appointment'
      });
    });
    return out;
  }

  function counselingFigures() {
    const els = allSessions();
    const complete = els.filter(e => e.kind === 'complete');
    const scheduled = els.filter(e => e.kind === 'scheduled' || e.kind === 'homework');
    const notbooked = els.filter(e => e.kind === 'notbooked');
    const hwDue = els.filter(e => e.kind === 'homework');
    let hwDone = 0, hwDated = 0, hwAll = 0, hwAllDone = 0;
    els.forEach(e => {
      hwAll += e.hwTotal;
      hwAllDone += e.hwDone;
      if (e.kind !== 'notbooked') {
        hwDone += e.hwDone;
        hwDated += e.hwTotal;
      }
    });
    const upcoming = els
      .filter(e => e.date && (e.kind === 'scheduled' || e.kind === 'homework'))
      .sort((a, b) => String(a.date).localeCompare(String(b.date)))[0];
    const withNotes = els.filter(e => e.takeaway);
    const words = withNotes.reduce((s, e) => s + String(e.takeaway).split(/\s+/).filter(Boolean).length, 0);
    const dated = els.filter(e => e.date).slice().sort((a, b) => String(a.date).localeCompare(String(b.date)));
    const last = dated[dated.length - 1];
    const owedItems = els.reduce((n, e) => n + e.homework.filter(h => !h.done).length, 0);
    const collisions = collisionCount();
    return {
      sessions: els.length,
      complete: complete.length,
      scheduled: scheduled.length,
      notbooked: notbooked.length,
      homeworkDue: hwDue.length,
      hwDone: hwDone,
      hwTotal: hwDated || hwAll,
      hwAll: hwAll,
      hwAllDone: hwAllDone,
      owedItems: owedItems,
      nextLabel: upcoming ? fmtShort(upcoming.date) : '—',
      nextTopic: upcoming ? upcoming.category : '',
      finishes: last ? fmtShort(last.date) : '—',
      counselor: counselorName(),
      notesCount: withNotes.length,
      notesOfComplete: complete.length,
      words: words,
      held: complete.length,
      booked: scheduled.length,
      collisions: collisions,
      weeks: weeksRemaining()
    };
  }

  function collisionCount() {
    const days = {};
    allSessions().forEach(e => {
      if (e.date) days[e.date.slice(0, 10)] = true;
    });
    let n = 0;
    otherCommitments().forEach(c => {
      if (days[c.date]) n += 1;
    });
    return n;
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

  function registerCouColumns() {
    if (!window.rdColumns || typeof window.rdColumns.register !== 'function') return;
    window.rdColumns.register('counseling', [
      { key: 'session', label: 'Session', fixed: true },
      { key: 'topic', label: 'Topic' },
      { key: 'date', label: 'Date' },
      { key: 'homework', label: 'Homework' },
      { key: 'status', label: 'Status' }
    ], function () { renderCounselingRd(); });
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
    let items;
    if (mode === 'cards') {
      items = [
        { label: 'Sessions', value: String(f.sessions) },
        { label: 'Complete', value: String(f.complete) },
        { label: 'Homework owed', value: String(f.homeworkDue || f.owedItems), attention: f.homeworkDue ? 'outstanding' : undefined },
        { label: 'Unscheduled', value: String(f.notbooked), attention: f.notbooked ? 'both due before 6 Nov' : undefined },
        { label: 'Next session', value: f.nextLabel, attention: f.nextTopic || undefined }
      ];
    } else if (mode === 'calendar') {
      items = [
        { label: 'Booked', value: String(f.booked), attention: f.nextLabel !== '—' ? f.nextLabel + (f.nextTopic ? ' · ' + f.nextTopic : '') : undefined },
        { label: 'Held', value: String(f.held) },
        { label: 'Unscheduled', value: String(f.notbooked), attention: f.notbooked ? 'deadline 6 Nov' : undefined },
        { label: 'Weeks remaining', value: String(f.weeks) },
        { label: 'Collisions', value: String(f.collisions), attention: 'checked against appointments' }
      ];
    } else {
      items = [
        { label: 'Sessions', value: String(f.sessions) },
        { label: 'Completed', value: String(f.complete) },
        { label: 'Homework done', value: f.hwDone + ' of ' + Math.max(f.hwTotal, f.hwDone) },
        { label: 'Next', value: f.nextLabel },
        { label: 'Counselor', value: f.counselor }
      ];
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
    const ui = window._couUiFilters || {};
    const cur = ui[field] || 'all';
    const on = cur && cur !== 'all';
    const chev = '<svg viewBox="0 0 24 24" aria-hidden="true" style="width:1em;height:1em;fill:none;stroke:currentColor;stroke-width:2.2;stroke-linecap:round"><path d="m6 9 6 6 6-6"/></svg>';
    return `<button type="button" class="rd-chip${on ? ' is-active' : ''}" onclick="rdCouCycleFilter('${field}')">${esc(on ? label + ': ' + cur : label + ': all')}`
      + (on ? `<span class="rd-chip__clear" onclick="event.stopPropagation();rdCouClearFilter('${field}')">&#10005;</span>` : chev)
      + '</button>';
  }

  function viewSwitchHtml() {
    const mode = window._couMode || 'table';
    return `<div class="rd-toolbar__right">` +
      `<div class="rd-viewswitch" role="group" aria-label="Counseling view">` +
      `<button type="button" class="rd-viewswitch__item${mode === 'table' ? ' is-active' : ''}" onclick="rdSetCounselingView('table')">Table</button>` +
      `<button type="button" class="rd-viewswitch__item${mode === 'cards' ? ' is-active' : ''}" onclick="rdSetCounselingView('cards')">Cards</button>` +
      `<button type="button" class="rd-viewswitch__item${mode === 'calendar' ? ' is-active' : ''}" onclick="rdSetCounselingView('calendar')">Calendar</button>` +
      `</div></div>`;
  }

  function renderCouToolbar() {
    const host = document.getElementById('counseling-toolbar');
    if (!host) return;
    const mode = window._couMode || 'table';
    let left = '';
    if (mode === 'calendar') {
      const month = calMonthDate();
      const label = month.toLocaleDateString('en-US', { month: 'long' });
      left =
        `<button type="button" class="rd-chip is-active">Month: ${esc(label)}</button>` +
        `<button type="button" class="rd-chip${window._couShowCommitments ? ' is-active' : ''}" onclick="rdCouToggleCommitments()">Show other commitments${window._couShowCommitments ? ' ✕' : ''}</button>` +
        `<span class="rd-cou-toolbar-note">Red = proposed, not booked</span>`;
    } else if (mode === 'cards') {
      left = filterChip('Status', 'status') +
        `<button type="button" class="rd-chip rd-chip--ghost">With: ${esc(counselorName())}</button>` +
        `<button type="button" class="rd-chip${window._couHomeworkFilter ? ' is-active' : ''}" onclick="rdCouToggleHwFilter()">Homework outstanding${window._couHomeworkFilter ? ' ✕' : ''}</button>` +
        (typeof rdSortChipHtml === 'function' ? rdSortChipHtml('Sort by session number', "rdStdOpenSort(this,'counseling')") : '<button type="button" class="rd-chip rd-chip--ghost">Sort by session number</button>');
    } else {
      left = filterChip('Status', 'status') + filterChip('Topic', 'topic') + filterChip('Month', 'month') +
        (typeof rdSortChipHtml === 'function' ? rdSortChipHtml('Sort by session number', "rdStdOpenSort(this,'counseling')") : '') +
        (typeof rdStandardRightHtml === 'function' ? rdStandardRightHtml('counseling') : '');
    }
    host.innerHTML = left + viewSwitchHtml();
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
    renderCounselingRd();
  }
  function applyCounselingGroupBy(g) {
    window._couGroupBy = g || 'status';
    renderCounselingRd();
  }

  function defaultExpandedId() {
    if (window._couExpanded && window._couExpanded !== 'pending-05') return window._couExpanded;
    const five = allSessions().find(e => e.num === 5);
    window._couExpanded = five ? five.id : null;
    return window._couExpanded;
  }

  /* ── Table (#13c) ────────────────────────────────────────────────────── */

  function pillScheme(kind) {
    if (kind === 'complete') return 'gold';
    if (kind === 'homework') return 'red';
    if (kind === 'notbooked') return 'muted';
    return 'forest';
  }

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
    const expanded = defaultExpandedId();

    let html = `<table class="rd-cou-table rd-table--compact"><thead><tr>` +
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
        const isExp = expanded === e.id;
        const scheme = pillScheme(e.kind);
        const sid = jsId(e.id);
        html += `<tr class="rd-cou-row${sel ? ' is-selected' : ''}${e.kind === 'homework' ? ' is-due' : ''}" data-cou-id="${esc(e.id)}" onclick="rdCouOpenDrawer('${sid}')">` +
          `<td onclick="event.stopPropagation()"><input type="checkbox" ${sel ? 'checked' : ''} onchange="rdCouToggleSel('${sid}')"></td>` +
          `<td class="rd-cou-name">${esc(e.title)}` +
          `<span class="rd-cou-row__actions">` +
          `<button type="button" onclick="event.stopPropagation();rdCouToggleExpand('${sid}')">${isExp ? 'Hide' : 'Homework'}</button>` +
          `<button type="button" onclick="event.stopPropagation();rdCouFullEditor('${sid}')">Full editor</button>` +
          `</span></td>` +
          `<td>${esc(e.category)}</td><td>${esc(e.dateLabel)}</td>` +
          `<td>${esc(e.hwDone + ' of ' + e.hwTotal)}</td>` +
          `<td><span class="status-pill" data-pillscheme="${scheme}">${esc(e.status)}</span></td>` +
          `</tr>`;
        if (isExp) {
          html += `<tr class="rd-cou-child"><td colspan="6">` +
            `<div class="rd-cou-hwpanel">` +
            `<div class="rd-section__head">` +
            `<div class="rd-pagehead__eyebrow">Homework · session ${esc(pad2(e.num))}</div>` +
            `<p class="rd-help">${e.date ? ('Due before ' + esc(fmtLong(e.date))) : 'No date set'}</p>` +
            `<button type="button" class="rd-btn rd-btn--quiet" style="margin-left:auto" onclick="rdCouAddHomework('${sid}')">+ Add homework</button>` +
            `</div>` +
            `<table class="rd-cou-hwtable"><thead><tr><th>Task</th><th>Who</th><th>Due</th><th>Status</th></tr></thead><tbody>`;
          if (!e.homework.length) {
            html += `<tr><td colspan="4" class="rd-cou-empty">No homework rows yet.</td></tr>`;
          } else {
            e.homework.forEach((h, hi) => {
              html += `<tr>` +
                `<td>${esc(h.task)}</td><td>${esc(h.who)}</td><td>${esc(h.due ? fmtShort(h.due) : '—')}</td>` +
                `<td><button type="button" class="rd-chip${h.done ? ' is-active' : ''}" onclick="rdCouToggleHw('${sid}',${hi})">${esc(h.status)}</button></td>` +
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

    const noted = allSessions().filter(e => e.takeaway);
    html += `<section class="rd-cou-keepsake">` +
      `<div class="rd-section__head">` +
      `<div class="rd-pagehead__eyebrow">What we have written down</div>` +
      `<p class="rd-help">${noted.length} session${noted.length === 1 ? '' : 's'} of notes, kept as a single record and printed as a Class B keepsake</p>` +
      `<button type="button" class="rd-btn rd-btn--quiet" style="margin-left:auto" onclick="rdCouPrintNotes()">Print the record</button>` +
      `</div>`;
    if (noted.length) {
      html += `<div class="rd-cou-keepsake__list">` + noted.map(e =>
        `<article onclick="rdCouOpenDrawer('${jsId(e.id)}')"><h4>${esc(e.title)}</h4><p>${esc(e.takeaway)}</p></article>`
      ).join('') + `</div>`;
    } else {
      html += `<p class="rd-cou-empty">Notes are taken after the session, not before.</p>`;
    }
    html += `</section>`;
    host.innerHTML = html;
  }

  /* ── Cards (#32e) ────────────────────────────────────────────────────── */

  function cardNote(e) {
    if (e.kind === 'notbooked' && (e.num === 6 || e.num === 7)) return 'Must be before the rehearsal';
    if (e.kind === 'notbooked' && e.num === 8) return 'The week before the wedding';
    if (e.kind === 'notbooked') return 'Book before the rehearsal';
    if (e.owedWho.length) return 'Owed by ' + e.owedWho.join(' & ');
    if (e.prep && e.kind !== 'complete') return 'Prep ' + e.prep;
    return 'With ' + e.counselor;
  }

  function renderCardsView() {
    const host = document.getElementById('cou-view-cards');
    if (!host) return;
    const els = filteredSessions();
    let html = `<div class="rd-cou-cardgrid">`;
    els.forEach(e => {
      const scheme = pillScheme(e.kind === 'homework' ? 'homework' : e.kind);
      const pct = e.hwTotal ? Math.round((e.hwDone / e.hwTotal) * 100) : 0;
      const hwLine = e.kind === 'notbooked' && !e.hwDone
        ? 'Homework —'
        : ('Homework ' + e.hwDone + ' of ' + e.hwTotal + (e.kind === 'complete' ? ' done' : (e.hwDone === 0 ? ' set' : ' done')));
      const held = e.date
        ? ((e.kind === 'complete' ? 'Held ' : '') + e.dateLabel.replace(/ · .*/, ''))
        : 'Not scheduled';
      html += `<article class="rd-cou-card${e.kind === 'homework' ? ' is-owed' : ''}${e.kind === 'notbooked' ? ' is-open' : ''}" onclick="rdCouOpenDrawer('${jsId(e.id)}')">` +
        `<div class="rd-cou-card__top">` +
        `<span class="rd-cou-card__num">${esc(pad2(e.num))}</span>` +
        `<span class="status-pill" data-pillscheme="${scheme}">${esc(e.cardStatus)}</span>` +
        `</div>` +
        `<h3>${esc(pad2(e.num) + ' · ' + e.topic)}</h3>` +
        `<div class="rd-cou-card__meta">${esc(held)}</div>` +
        `<div class="rd-cou-card__bar" aria-hidden="true"><b style="width:${pct}%"></b></div>` +
        `<div class="rd-cou-card__hw">${esc(hwLine)}</div>` +
        `<div class="rd-cou-card__hw">Notes ${e.takeaway ? 'Written' : '—'}</div>` +
        `<p class="rd-cou-card__note">${esc(cardNote(e))}</p>` +
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
    return new Date(2026, 7, 1);
  }

  function renderCalendarView() {
    const host = document.getElementById('cou-view-calendar');
    if (!host) return;
    const month = calMonthDate();
    window._couCalMonth = month.getFullYear() + '-' + pad2(month.getMonth() + 1);
    const y = month.getFullYear();
    const m = month.getMonth();
    const first = new Date(y, m, 1);
    let mondayIndex = (first.getDay() + 6) % 7;
    const daysInMonth = new Date(y, m + 1, 0).getDate();
    const f = counselingFigures();
    const monthLabel = month.toLocaleDateString('en-US', { month: 'long', year: 'numeric' });
    const bookedThisMonth = allSessions().filter(e => {
      const d = parseDate(e.date);
      return d && d.getFullYear() === y && d.getMonth() === m && e.kind !== 'complete';
    }).length;

    let html = `<div class="rd-cou-cal">` +
      `<div class="rd-section__head">` +
      `<div class="rd-pagehead__eyebrow">${esc(monthLabel)} · ${bookedThisMonth} session${bookedThisMonth === 1 ? '' : 's'} booked · ${f.notbooked} session${f.notbooked === 1 ? '' : 's'} still unscheduled before 6 November</div>` +
      `<p class="rd-help">Click a day to add · drag an event to move it</p>` +
      `<div style="margin-left:auto;display:flex;gap:6px">` +
      `<button type="button" class="rd-btn rd-btn--quiet" onclick="rdCouShiftMonth(-1)">‹</button>` +
      `<button type="button" class="rd-btn rd-btn--quiet" onclick="rdCouCalToday()">Today</button>` +
      `<button type="button" class="rd-btn rd-btn--quiet" onclick="rdCouShiftMonth(1)">›</button>` +
      `</div></div>` +
      `<div class="rd-cou-cal__grid">` +
      ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'].map(d => `<div class="rd-cou-cal__dow">${d}</div>`).join('');

    for (let i = 0; i < mondayIndex; i++) html += `<div class="rd-cou-cal__day is-empty"></div>`;
    const today = todayISO();
    for (let day = 1; day <= daysInMonth; day++) {
      const iso = y + '-' + pad2(m + 1) + '-' + pad2(day);
      const daySessions = allSessions().filter(e => String(e.date).slice(0, 10) === iso);
      const proposed = allSessions().filter(e => !e.date && String(e.proposedDate || '').slice(0, 10) === iso);
      html += `<div class="rd-cou-cal__day${iso === today ? ' is-today' : ''}" onclick="rdCouAddOnDay('${iso}')">` +
        `<div class="rd-cou-cal__num">${day}</div>`;
      daySessions.forEach(e => {
        html += `<button type="button" class="rd-cou-cal__event" draggable="true" ondragstart="rdCouDrag('${jsId(e.id)}',event)" onclick="event.stopPropagation();rdCouOpenDrawer('${jsId(e.id)}')">` +
          `${esc(pad2(e.num) + ' · ' + e.category)}${e.time ? ' · ' + esc(e.time) : ''}` +
          `</button>`;
      });
      proposed.forEach(e => {
        html += `<button type="button" class="rd-cou-cal__event is-proposed" onclick="event.stopPropagation();rdCouOpenDrawer('${jsId(e.id)}')">` +
          `${esc(pad2(e.num) + ' · ' + e.category + ' · unscheduled')}` +
          `</button>`;
      });
      if (window._couShowCommitments) {
        otherCommitments().forEach(a => {
          if (a.date === iso) {
            html += `<div class="rd-cou-cal__other">${esc(a.title)}${a.time ? ' · ' + esc(a.time) : ''}</div>`;
          }
        });
      }
      html += `</div>`;
    }
    html += `</div></div>`;
    host.innerHTML = html;
    host.ondragover = ev => ev.preventDefault();
    host.ondrop = ev => {
      const id = ev.dataTransfer && ev.dataTransfer.getData('text/cou-id');
      const day = ev.target && ev.target.closest && ev.target.closest('.rd-cou-cal__day');
      if (!id || !day || day.classList.contains('is-empty')) return;
      const numEl = day.querySelector('.rd-cou-cal__num');
      if (!numEl) return;
      const iso = y + '-' + pad2(m + 1) + '-' + pad2(numEl.textContent);
      rdCouMoveToDay(id, iso);
    };
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
    const sid = jsId(e.id);
    let body = '';
    if (tab === 0) {
      body =
        field('Number', pad2(e.num) + ' of ' + pad2(total)) +
        field('Topic', e.category) +
        field('Counselor', e.counselor) +
        field('Where', e.where) +
        field('Date', e.date ? (fmtLong(e.date) + (e.time ? ' · ' + e.time : '')) : '—') +
        field('Length', e.length) +
        `<p class="rd-drawer__note">Sessions appear on the Smart Calendar but are <b>not</b> appointment records — they are their own table, so nothing is entered twice.</p>` +
        (e.links.length
          ? `<div class="rd-drawer__section-title">Linked</div>` + e.links.map(l =>
            field(l.page, l.detail, l.go || '')
          ).join('')
          : field('Smart Calendar', e.dateLabel !== '—' ? e.dateLabel + ' →' : '—', "typeof showPanel==='function'&&showPanel('calendar')"));
    } else if (tab === 1) {
      body =
        `<div class="rd-drawer__section-title">Homework · ${e.hwDone} of ${e.hwTotal}</div>` +
        (e.homework.length
          ? e.homework.map((h, hi) =>
            `<div class="rd-drawer__guest"><span>${esc(h.task)}</span><span class="${h.done ? '' : 'rd-cou-due'}">${esc(h.due ? ('Due ' + fmtShort(h.due)) : h.status)}</span>` +
            `<button type="button" class="rd-chip" onclick="rdCouToggleHw('${sid}',${hi})">${h.done ? 'Done' : 'Tick'}</button></div>`
          ).join('')
          : '<p class="rd-drawer__note">No homework rows yet.</p>') +
        `<p class="rd-drawer__note">The session bar on the page is <b>derived from these two rows</b>. Ticking them here moves the page stat and the rail meter — there is no separate “session complete” tick to fall out of step.</p>` +
        (e.overdue.length
          ? `<p class="rd-cou-callout">Both are overdue against the ${esc(e.date ? fmtLong(e.date) : 'session')}. ${esc(e.homework[0] ? e.homework[0].task.split(',')[0] : 'Reading')} was due a week ago.</p>`
          : '') +
        `<button type="button" class="rd-btn rd-btn--quiet" onclick="rdCouAddHomework('${sid}')">+ Add homework</button>`;
    } else if (tab === 2) {
      const earlier = allSessions().filter(x => x.takeaway && x.id !== e.id).slice(0, 2);
      body =
        (e.takeaway
          ? `<textarea class="rd-cou-drawer__input rd-cou-drawer__input--serif" rows="6" oninput="rdCouPatch('${sid}','takeaway',this.value)">${esc(e.takeaway)}</textarea>`
          : `<p class="rd-drawer__note">Nothing written yet — notes are taken after the session, not before.</p>` +
            `<textarea class="rd-cou-drawer__input rd-cou-drawer__input--serif" rows="5" placeholder="Written after, not before." oninput="rdCouPatch('${sid}','takeaway',this.value)"></textarea>`) +
        (earlier.length
          ? `<div class="rd-drawer__section-title">Earlier sessions</div>` + earlier.map(x =>
            `<blockquote class="rd-cou-quote"><strong>${esc(pad2(x.num) + ' · ' + x.topic)}</strong><span>${esc(x.takeaway)}</span></blockquote>`
          ).join('')
          : '') +
        `<p class="rd-drawer__note">Session notes are Class B and print as one continuous record, which is why they are written in prose rather than bullets.</p>` +
        `<div class="rd-drawer__section-title">Notes written</div>` +
        field('Sessions with notes', f.notesCount + ' of ' + Math.max(f.notesOfComplete, f.complete)) +
        field('Words', String(f.words));
    } else {
      const hist = (e.history && e.history.length) ? e.history : [
        { when: '', who: 'Planner', what: 'Created in the plan of ' + f.sessions }
      ];
      body =
        `<div class="rd-drawer__section-title">This session</div>` +
        hist.map(h =>
          `<div class="rd-drawer__hist"><strong>${esc(h.when ? fmtShort(h.when) : '—')} · ${esc(h.who || 'Planner')}</strong><div>${esc(h.what)}</div></div>`
        ).join('') +
        `<p class="rd-drawer__note">The eight sessions were created as a plan on 14 April, so ${f.notbooked} of them still ${f.notbooked === 1 ? 'has' : 'have'} no date. That is not a gap — it is a plan being kept to.</p>`;
    }

    const domainCta = (tab === 1 && e.homework.some(h => !h.done))
      ? `<button type="button" class="rd-btn rd-btn--primary" onclick="rdCouTickAll('${sid}')">Tick both</button>`
      : `<button type="button" class="rd-btn rd-btn--primary" onclick="rdCouCloseDrawer()">Save</button>`;

    const eyebrowKind = e.kind === 'complete' ? 'complete' : (e.kind === 'notbooked' ? 'unscheduled' : 'scheduled');
    slot.classList.add('is-open');
    slot.innerHTML =
      `<aside class="rd-drawer rd-cou-drawer" aria-label="Counseling session">` +
      `<div class="rd-drawer__head">` +
      `<div class="rd-drawer__eyebrow">Session ${esc(pad2(e.num))} · ${esc(eyebrowKind)}</div>` +
      `<h2 class="rd-drawer__title">${esc(e.topic)}</h2>` +
      `<div class="rd-drawer__chips">` +
      (e.dateLabel !== '—' ? `<span class="status-pill" data-pillscheme="gold">${esc(e.dateLabel)}</span>` : '') +
      `<span class="status-pill" data-pillscheme="${e.kind === 'homework' ? 'red' : (e.kind === 'complete' ? 'gold' : 'muted')}">${esc(e.status)}</span>` +
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
      `<button type="button" class="rd-btn" onclick="rdCouFullEditor('${sid}')">Full editor</button>` +
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
      } catch (err) { /* soft */ }
    } else rdCouAdd();
  }
  function rdCouDrag(id, ev) {
    if (ev && ev.dataTransfer) {
      ev.dataTransfer.setData('text/cou-id', id);
      ev.dataTransfer.effectAllowed = 'move';
    }
  }
  function rdCouMoveToDay(id, iso) {
    const e = findById(id);
    if (!e) return;
    e.row.date = iso;
    e.row.proposedDate = '';
    persist();
    renderCounselingRd();
  }
  function rdCouCalToday() {
    const n = new Date();
    window._couCalMonth = n.getFullYear() + '-' + pad2(n.getMonth() + 1);
    renderCounselingRd();
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
  function rdCouPatch(id, key, val) {
    const e = findById(id);
    if (!e) return;
    e.row[key] = val;
    persist();
    if (key === 'takeaway') {
      const f = counselingFigures();
      const host = document.getElementById('counseling-stats');
      if (host && typeof RdDepth !== 'undefined' && RdDepth.renderStats) {
        /* keep typing; full rerender on blur via Save */
      }
    }
  }
  function rdCouAddHomework(id) {
    const e = findById(id);
    if (!e) return;
    const items = ensureHomeworkArray(e.row);
    items.push({ task: 'New homework', who: 'Both', due: '', status: 'Not started', done: false });
    e.row.homeworkItems = items;
    persist();
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
    persist();
    renderCounselingRd();
  }
  function rdCouTickAll(id) {
    const e = findById(id);
    if (!e) return;
    const items = ensureHomeworkArray(e.row);
    items.forEach(h => { h.done = true; h.status = 'Done'; });
    e.row.homeworkItems = items;
    persist();
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
    ensureMasterCounseling();
    registerCouColumns();
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
  window.rdCouDrag = rdCouDrag;
  window.rdCouMoveToDay = rdCouMoveToDay;
  window.rdCouCalToday = rdCouCalToday;
  window.rdCouFullEditor = rdCouFullEditor;
  window.rdCouMessage = rdCouMessage;
  window.rdCouPrint = rdCouPrint;
  window.rdCouPrintNotes = rdCouPrintNotes;
  window.rdCouExport = rdCouExport;
  window.rdCouPatch = rdCouPatch;
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
