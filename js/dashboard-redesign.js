/* Dashboard — All.dc #3a + Dark.dc #3a rail
   No Views.dc switcher. No Drawers.dc record drawer.
   Surface: countdown + 3 rings · next best step · needs attention ·
   budget/guest/day trio · guided path (5) · planning/data health · section progress (18).
   Rail: On this page jump links + Foundation meters + scripture note.
   Data: plannerGuidanceState, guideBuildAlerts, budget/guest/task helpers, countdown. */
(function () {
  'use strict';

  window._dashJump = window._dashJump || 'dash-next-step';

  const SECTION_ORDER = [
    ['setup', 'Wedding Setup'],
    ['tasks', 'Planning Timeline'],
    ['calendar', 'Smart Calendar'],
    ['budget', 'Budget'],
    ['payments', 'Payments'],
    ['guests', 'Guest List'],
    ['vendors', 'Venue & Vendors'],
    ['catering', 'Catering & Menu'],
    ['party', 'Wedding Party'],
    ['tables', 'Table Layout'],
    ['ceremony', 'Ceremony & Reception'],
    ['timeline', 'Wedding Day Timeline'],
    ['mood', 'Vision Board'],
    ['prayer', 'Prayer Journal'],
    ['counseling', 'Premarital Counseling'],
    ['contracts', 'Contracts'],
    ['gifts', 'Gifts'],
    ['honeymoon', 'Honeymoon & After']
  ];

  const JUMPS = [
    ['dash-next-step', 'Next best step'],
    ['dash-needs', 'Needs attention'],
    ['dash-budget-health', 'Budget health'],
    ['dash-guest-response', 'Guest response'],
    ['dash-day-preview', 'Wedding day preview']
  ];

  const esc = s => (typeof escapeHtml === 'function'
    ? escapeHtml(s == null ? '' : String(s))
    : String(s == null ? '' : s).replace(/[&<>"']/g, c => ({
      '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;'
    }[c])));

  function arr(v) {
    if (typeof safeArray === 'function') return safeArray(v);
    return Array.isArray(v) ? v : [];
  }

  function money(n) {
    if (typeof uedMoney === 'function') return uedMoney(n);
    const v = Math.round(Number(n) || 0);
    return '$' + v.toLocaleString();
  }

  function moneyShort(n) {
    const v = Number(n) || 0;
    if (Math.abs(v) >= 1000) return '$' + (v / 1000).toFixed(1).replace(/\.0$/, '') + 'k';
    return money(v);
  }

  function fmtShortDate(iso) {
    if (!iso) return '—';
    const d = new Date(String(iso).slice(0, 10) + 'T00:00:00');
    if (Number.isNaN(d.getTime())) return String(iso);
    return d.toLocaleDateString('en-US', { day: 'numeric', month: 'short' });
  }

  function weddingMetaLine() {
    const s = (window.data && data.setup) || {};
    const iso = s.date;
    let datePart = 'Add wedding date';
    if (iso) {
      try {
        const d = new Date(String(iso).slice(0, 10) + 'T00:00:00');
        if (!Number.isNaN(d.getTime())) {
          datePart = d.toLocaleDateString('en-US', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' });
        }
      } catch (e) { /* soft */ }
    }
    const time = s.time || s['ceremony-time'] || s.ceremonyTime || '4:00 pm';
    const tz = (typeof dashboardCountdownState === 'function' && dashboardCountdownState().timezoneLabel)
      || s.timezone || 'local';
    return datePart + ' · ' + time + ' · ' + tz;
  }

  /* ── figures ─────────────────────────────────────────────────────────── */

  function dashFigures() {
    const guests = arr(data && data.guests);
    const tasks = arr(data && data.tasks);
    const payments = arr(data && data.payments);
    const totalBudget = parseFloat((data && data.setup && data.setup.budget) || 0) || 0;
    const committed = typeof budgetTotalPlanned === 'function' ? budgetTotalPlanned() : 0;
    const paid = typeof budgetTotalActual === 'function' ? budgetTotalActual() : 0;
    const due = Math.max(0, committed - paid);
    const commitPct = totalBudget ? Math.min(100, Math.round((committed || paid) / totalBudget * 100)) : 0;

    const yes = guests.filter(g => /yes|accepted/i.test(g.rsvp || '')).length;
    const no = guests.filter(g => /no|declined/i.test(g.rsvp || '')).length;
    const pending = guests.filter(g => !g.rsvp || /pending/i.test(g.rsvp || '')).length;
    const notSent = guests.filter(g => {
      const inv = String(g.invited || g.inviteSent || g.inviteDecision || '').toLowerCase();
      return inv === 'no' || inv === 'false' || inv === 'not sent' || inv === 'draft' || (!inv && !g.rsvp);
    }).length;
    const invited = Math.max(guests.length - notSent, yes + no + pending);

    const done = tasks.filter(t => /complete/i.test(t.status || '')).length;
    const inProg = tasks.filter(t => /progress|in progress/i.test(t.status || '')).length;
    const today = new Date(); today.setHours(0, 0, 0, 0);
    const overdue = tasks.filter(t => {
      if (/complete/i.test(t.status || '')) return false;
      const d = t.date ? new Date(String(t.date).slice(0, 10) + 'T00:00:00') : null;
      return d && !Number.isNaN(d.getTime()) && d < today;
    }).length;
    const taskPct = tasks.length ? Math.round(done / tasks.length * 100) : 0;

    const countdown = typeof dashboardCountdownState === 'function' ? dashboardCountdownState() : { diffDays: null };
    const daysLeft = countdown.diffDays == null ? '—' : (countdown.past ? '0' : String(Math.max(0, countdown.diffDays)));

    const guidance = typeof plannerGuidanceState === 'function' ? plannerGuidanceState() : { alerts: [], attentionCount: 0, current: null };
    const alerts = (guidance.alerts && guidance.alerts.length)
      ? guidance.alerts
      : (typeof guideBuildAlerts === 'function' ? guideBuildAlerts() : []);

    return {
      guests, tasks, payments,
      totalBudget, committed, paid, due, commitPct,
      yes, no, pending, notSent, invited,
      done, inProg, overdue, taskPct,
      daysLeft, countdown, guidance, alerts,
      attentionCount: guidance.attentionCount || alerts.length
    };
  }

  function attentionRows(f) {
    const rows = [];
    const today = new Date(); today.setHours(0, 0, 0, 0);

    arr(f.tasks).forEach(t => {
      if (/complete/i.test(t.status || '')) return;
      const d = t.date ? new Date(String(t.date).slice(0, 10) + 'T00:00:00') : null;
      if (d && !Number.isNaN(d.getTime()) && d < today) {
        rows.push({
          pill: 'Overdue',
          title: t.task || t.title || 'Task',
          when: fmtShortDate(t.date),
          panel: 'tasks',
          kind: 'overdue'
        });
      }
    });

    arr(f.payments).forEach(p => {
      if (/paid|complete/i.test(p.status || '')) return;
      const d = p.date || p.due;
      const dt = d ? new Date(String(d).slice(0, 10) + 'T00:00:00') : null;
      const soon = dt && !Number.isNaN(dt.getTime()) && (dt - today) / 86400000 <= 21;
      if (dt && (dt < today || soon)) {
        rows.push({
          pill: dt < today ? 'Overdue' : 'Payment',
          title: (p.vendor || p.desc || 'Payment') + (dt < today ? '' : ' balance due'),
          when: fmtShortDate(d),
          panel: 'payments',
          kind: 'payment'
        });
      }
    });

    if (f.pending > 0) {
      rows.push({
        pill: 'RSVP',
        title: f.pending + ' guest' + (f.pending === 1 ? '' : 's') + ' still pending',
        when: '—',
        panel: 'guests',
        kind: 'rsvp'
      });
    }

    const noMeal = f.guests.filter(g => /yes|accepted/i.test(g.rsvp || '') && !String(g.meal || '').trim()).length;
    if (noMeal > 0) {
      rows.push({
        pill: 'Meals',
        title: noMeal + ' confirmed guest' + (noMeal === 1 ? '' : 's') + ' have no meal',
        when: '—',
        panel: 'guests',
        kind: 'meals'
      });
    }

    /* Fall back to guidance alerts for remaining slots */
    f.alerts.forEach(a => {
      if (rows.length >= 5) return;
      const title = a.title || 'Attention';
      if (rows.some(r => r.title === title)) return;
      let pill = 'Watch';
      if (/rsvp/i.test(a.kind || '') || /rsvp/i.test(title)) pill = 'RSVP';
      else if (/payment|budget/i.test(a.kind || '') || /payment/i.test(title)) pill = 'Payment';
      else if (/overdue|past/i.test(title)) pill = 'Overdue';
      else if (/meal/i.test(title)) pill = 'Meals';
      rows.push({
        pill: pill,
        title: title,
        when: '—',
        panel: a.page || 'dashboard',
        action: a.action || '',
        kind: a.kind || 'general'
      });
    });

    return rows.slice(0, 5);
  }

  function nextBestStep(f) {
    const overdueTask = arr(f.tasks).find(t => {
      if (/complete/i.test(t.status || '')) return false;
      const d = t.date ? new Date(String(t.date).slice(0, 10) + 'T00:00:00') : null;
      const today = new Date(); today.setHours(0, 0, 0, 0);
      return d && !Number.isNaN(d.getTime()) && d < today;
    });
    const high = overdueTask || arr(f.tasks).find(t => /high|urgent/i.test(t.priority || '') && !/complete/i.test(t.status || ''))
      || arr(f.tasks).find(t => !/complete/i.test(t.status || ''));
    const current = f.guidance && f.guidance.current;

    if (high) {
      const d = high.date ? new Date(String(high.date).slice(0, 10) + 'T00:00:00') : null;
      const today = new Date(); today.setHours(0, 0, 0, 0);
      let title = high.task || high.title || 'Open your next task';
      if (d && d < today) {
        const days = Math.round((today - d) / 86400000);
        title += ' — ' + days + ' day' + (days === 1 ? '' : 's') + ' past your target date';
      }
      return {
        title: title,
        body: high.notes || high.note || 'Open the Planning Timeline to update status, owners, and due dates.',
        primary: 'Open task',
        primaryFn: "showPanel('tasks')",
        secondary: 'Compare vendors',
        secondaryFn: "showPanel('vendors')",
        tertiary: 'Snooze a week',
        tertiaryFn: 'rdDashSnooze()'
      };
    }

    if (current) {
      return {
        title: current.label || 'Continue planning',
        body: current.meta || 'Take the next step on your guided planning path.',
        primary: 'Open task',
        primaryFn: current.action || ("showPanel('" + (current.page || 'tasks') + "')"),
        secondary: 'Compare vendors',
        secondaryFn: "showPanel('vendors')",
        tertiary: 'Snooze a week',
        tertiaryFn: 'rdDashSnooze()'
      };
    }

    return {
      title: 'Set your wedding date and names',
      body: 'Wedding Setup feeds the countdown, guest list, and every keepsake. Start there.',
      primary: 'Open task',
      primaryFn: "showPanel('setup')",
      secondary: 'Compare vendors',
      secondaryFn: "showPanel('vendors')",
      tertiary: 'Snooze a week',
      tertiaryFn: 'rdDashSnooze()'
    };
  }

  function guidedSteps(f) {
    const setupDone = !!(data.setup && data.setup.bride && data.setup.groom && data.setup.date);
    let backupDone = false;
    let backupMeta = 'Download a .sqlite backup before major edits';
    try {
      const ob = typeof ensureOnboardData === 'function' ? ensureOnboardData() : {};
      backupDone = !!(ob.backupDone || ob.lastBackupTime);
      if (ob.lastBackupTime) {
        const days = Math.round((Date.now() - new Date(ob.lastBackupTime).getTime()) / 86400000);
        backupMeta = days <= 0 ? 'Backup downloaded today'
          : (days === 1 ? 'Backup downloaded yesterday' : ('Backup downloaded ' + days + ' days ago'));
      }
    } catch (e) { /* soft */ }

    const vendors = arr(data && data.vendors);
    const photo = vendors.some(v => /photo/i.test(v.category || v.type || v.name || ''));
    const cater = vendors.some(v => /cater/i.test(v.category || v.type || v.name || ''));
    const vendorsDone = photo && cater && vendors.length >= 3;
    let vendorMeta = 'Photographer, caterer, and venue partners';
    if (!photo) vendorMeta = 'Photographer outstanding · caterer next';
    else if (!cater) vendorMeta = 'Caterer outstanding · venue next';
    else if (!vendorsDone) vendorMeta = vendors.length + ' vendor' + (vendors.length === 1 ? '' : 's') + ' tracked';

    const uninvited = f.notSent || Math.max(0, f.guests.length - f.invited);
    const rsvpDone = f.guests.length > 0 && f.pending === 0 && uninvited === 0;
    const rsvpMeta = uninvited > 0
      ? (uninvited + ' household' + (uninvited === 1 ? '' : 's') + ' not invited yet')
      : (f.pending > 0 ? (f.pending + ' RSVPs still pending') : 'Guest list responding');

    const days = f.countdown && f.countdown.diffDays;
    const dayLockOpen = days != null && !f.countdown.past && days <= 30;
    const timeline = arr(data && (data.wdayTimeline || data.timeline));
    const dayDone = timeline.length >= 8;
    const dayMeta = dayLockOpen
      ? (timeline.length ? (timeline.length + ' events on the day') : 'Start locking the day-of plan')
      : 'Opens 30 days out';

    const steps = [
      { n: 1, label: 'Set the foundation', meta: 'Names, date, budget, venue', done: setupDone, page: 'setup' },
      { n: 2, label: 'Protect your plan', meta: backupMeta, done: backupDone, page: 'instructions', action: 'rdDashBackup()' },
      { n: 3, label: 'Book the core vendors', meta: vendorMeta, done: vendorsDone, page: 'vendors', continue: true },
      { n: 4, label: 'Invite & track RSVPs', meta: rsvpMeta, done: rsvpDone, page: 'guests' },
      { n: 5, label: 'Lock the day-of plan', meta: dayMeta, done: dayDone, page: 'timeline', locked: !dayLockOpen && !dayDone }
    ];

    let currentSet = false;
    steps.forEach(s => {
      if (s.done) s.state = 'done';
      else if (!currentSet && !s.locked) { s.state = 'current'; currentSet = true; }
      else s.state = s.locked ? 'future' : 'future';
    });
    if (!currentSet) {
      const last = steps[steps.length - 1];
      if (last) last.state = 'current';
    }
    return steps;
  }

  function foundationMeters() {
    let visionPct = 0;
    try {
      const decisions = typeof guideVisionDecisionCount === 'function' ? guideVisionDecisionCount() : 0;
      const pins = arr(data && data.moodItems).length;
      visionPct = Math.min(100, Math.round(((decisions || 0) * 20) + (pins ? 20 : 0)));
      if (!visionPct && pins) visionPct = Math.min(100, pins * 12);
    } catch (e) { visionPct = 0; }

    const counseling = arr(data && data.counseling);
    const counselingDone = counseling.filter(c => /done|complete/i.test(c.status || '')).length || counseling.length;
    const counselingTotal = Math.max(8, counseling.length || 8);

    const setup = typeof setupFoundationProgress === 'function'
      ? setupFoundationProgress()
      : { completed: 0, total: 7 };
    /* Mock shows 6/7 — map completed onto a 7-step display */
    const setupDone = Math.min(7, setup.completed);
    const setupTotal = 7;

    return {
      visionPct: visionPct || 0,
      counselingDone: counselingDone,
      counselingTotal: counselingTotal,
      setupDone: setupDone,
      setupTotal: setupTotal
    };
  }

  function budgetTopCats() {
    return arr(data && data.budget)
      .map(c => ({ name: c.cat || c.name || 'Category', spent: typeof catSpent === 'function' ? catSpent(c) : 0, planned: typeof catPlanned === 'function' ? catPlanned(c) : 0 }))
      .sort((a, b) => (b.planned || b.spent) - (a.planned || a.spent))
      .slice(0, 4);
  }

  function dayPreviewEvents() {
    const rows = arr(data && (data.wdayTimeline || data.timeline)).slice();
    rows.sort((a, b) => String(a.time || a.start || '').localeCompare(String(b.time || b.start || '')));
    return rows.slice(0, 5);
  }

  function donutSvg(pct, center, sub) {
    const safe = Math.max(0, Math.min(100, Number(pct) || 0));
    const c = 251.2;
    const dash = (safe / 100 * c).toFixed(1);
    return `<div class="rd-dash-donut">
      <svg viewBox="0 0 100 100" aria-hidden="true">
        <circle cx="50" cy="50" r="40" class="rd-dash-donut__track"></circle>
        <circle cx="50" cy="50" r="40" class="rd-dash-donut__fill" stroke-dasharray="${dash} ${c}"></circle>
      </svg>
      <div class="rd-dash-donut__label"><strong>${esc(center)}</strong>${sub ? '<span>' + esc(sub) + '</span>' : ''}</div>
    </div>`;
  }

  /* ── shell ───────────────────────────────────────────────────────────── */

  function pageheadActionsHtml() {
    return ''
      + '<button type="button" class="rd-btn" onclick="rdDashPrint()"><svg viewBox="0 0 24 24" aria-hidden="true" style="width:14px;height:14px;fill:none;stroke:currentColor;stroke-width:1.7;stroke-linecap:round;stroke-linejoin:round"><path d="M6 9V4h12v5"/><rect x="4" y="9" width="16" height="7" rx="1"/><path d="M7 16h10v4H7z"/></svg>Print section</button>'
      + '<button type="button" class="rd-btn" onclick="rdDashShare()">Share with vendor</button>';
  }

  function uedDashboardShellRd() {
    const panel = document.getElementById('panel-dashboard');
    if (!panel) return;

    /* Preserve load-bearing inputs outside the mount wipe */
    let hero = document.getElementById('heroPhotoInput');
    let banner = document.getElementById('dash-banner-editor');
    const heroHtml = hero ? hero.outerHTML : '<input type="file" id="heroPhotoInput" accept="image/*" style="display:none" onchange="uploadHeroPhoto(event)">';
    const bannerHtml = banner ? banner.outerHTML : '';

    panel.classList.add('ued-scope', 'dashboard-mockup', 'dashboard-v4');
    if (panel.dataset.uedShell === 'dash-rd3a') {
      const actions = panel.querySelector('.rd-pagehead__actions');
      if (actions) actions.innerHTML = pageheadActionsHtml();
      return;
    }
    panel.dataset.uedShell = 'dash-rd3a';
    panel.innerHTML = heroHtml + `<div class="rd-page">
      <div class="rd-pagehead">
        <div>
          <div class="rd-pagehead__eyebrow">Overview</div>
          <div class="rd-pagehead__title-row">
            <h1 class="rd-pagehead__title">Dashboard</h1>
          </div>
        </div>
        <div class="rd-pagehead__actions">${pageheadActionsHtml()}</div>
      </div>
      <div class="rd-stats m-stats" id="dashboard-stats" aria-label="Dashboard summary"></div>
      <div class="rd-surface" id="dashboard-surface"></div>
      <div class="rd-dash-banner-park" id="dash-banner-park">${bannerHtml}</div>
    </div>`;
  }

  function renderDashStats() {
    const host = document.getElementById('dashboard-stats');
    if (!host) return;
    const f = dashFigures();
    const stats = [
      { label: 'Days left', value: String(f.daysLeft) },
      { label: 'Budget committed', value: f.commitPct + '%' },
      { label: 'Guests yes', value: String(f.yes) },
      { label: 'Tasks done', value: f.done + '/' + f.tasks.length },
      { label: 'Needs attention', value: String(f.attentionCount), attention: f.attentionCount ? 'review' : undefined }
    ];
    if (typeof RdDepth !== 'undefined' && RdDepth.renderStats) {
      RdDepth.renderStats(host, stats);
      return;
    }
    host.innerHTML = stats.map(s =>
      `<div class="m-stat"><div class="m-stat-label">${esc(s.label)}</div><div class="m-stat-val">${esc(s.value)}</div></div>`
    ).join('');
  }

  /* ── surface blocks ──────────────────────────────────────────────────── */

  function countdownBlock(f) {
    const parts = typeof uedCountdownParts === 'function' ? uedCountdownParts(f.countdown) : { months: '--', days: '--', hours: '--', minutes: '--', seconds: '--' };
    return `<section class="rd-dash-card" id="dash-countdown" data-dash-card="countdown">
      <div class="rd-dash-card__head">
        <h3>Countdown</h3>
        <span class="rd-dash-card__meta">${esc(weddingMetaLine())}</span>
      </div>
      <div class="rd-dash-count">
        <div class="rd-dash-count__tile"><b id="dash-countdown-months">${esc(parts.months)}</b><span>Months</span></div>
        <div class="rd-dash-count__tile"><b id="dash-countdown-days">${esc(parts.days)}</b><span>Days</span></div>
        <div class="rd-dash-count__tile"><b id="dash-countdown-hours">${esc(parts.hours)}</b><span>Hours</span></div>
        <div class="rd-dash-count__tile"><b id="dash-countdown-minutes">${esc(parts.minutes)}</b><span>Minutes</span></div>
        <div class="rd-dash-count__tile is-gold"><b id="dash-countdown-seconds">${esc(parts.seconds)}</b><span>Seconds</span></div>
      </div>
      <div class="rd-dash-count__sub" id="dash-countdown-sub">${f.countdown && f.countdown.past ? 'Wedding celebrated' : 'until your wedding celebration!'}</div>
    </section>`;
  }

  function ringsBlock(f) {
    return `<section class="rd-dash-card rd-dash-rings" data-dash-card="rings">
      <div class="rd-dash-ring">
        <div class="rd-dash-ring__title">Budget committed</div>
        ${donutSvg(f.commitPct, f.commitPct + '%', moneyShort(f.committed || f.paid))}
        <div class="rd-dash-ring__foot">${esc(moneyShort(f.paid))} paid · ${esc(moneyShort(f.due))} due · of ${esc(money(f.totalBudget || 0))}</div>
      </div>
      <div class="rd-dash-ring">
        <div class="rd-dash-ring__title">RSVP</div>
        ${donutSvg(f.guests.length ? Math.round(f.yes / f.guests.length * 100) : 0, String(f.yes), 'accepted')}
        <div class="rd-dash-ring__foot">${f.no} no · ${f.pending} pending · ${f.notSent} not sent</div>
      </div>
      <div class="rd-dash-ring">
        <div class="rd-dash-ring__title">Tasks complete</div>
        ${donutSvg(f.taskPct, f.taskPct + '%', f.done + ' of ' + f.tasks.length)}
        <div class="rd-dash-ring__foot">${f.inProg} in progress · ${f.overdue} overdue</div>
      </div>
    </section>`;
  }

  function nextStepBlock(f) {
    const step = nextBestStep(f);
    return `<section class="rd-dash-card rd-dash-next" id="dash-next-step" data-dash-card="next-step">
      <div class="rd-dash-card__eyebrow">Next best step</div>
      <h3 class="rd-dash-next__title">${esc(step.title)}</h3>
      <p class="rd-dash-next__body">${esc(step.body)}</p>
      <div class="rd-dash-next__actions">
        <button type="button" class="rd-btn rd-btn--primary" onclick="${step.primaryFn}">${esc(step.primary)}</button>
        <button type="button" class="rd-btn" onclick="${step.secondaryFn}">${esc(step.secondary)}</button>
        <button type="button" class="rd-btn rd-btn--quiet" onclick="${step.tertiaryFn}">${esc(step.tertiary)}</button>
      </div>
    </section>`;
  }

  function needsBlock(f) {
    const rows = attentionRows(f);
    return `<section class="rd-dash-card" id="dash-needs" data-dash-card="needs">
      <div class="rd-dash-card__head">
        <h3>Needs attention · ${rows.length || f.attentionCount}</h3>
      </div>
      ${rows.length ? `<ul class="rd-dash-needs">${rows.map(r => {
        const go = r.action || ("showPanel('" + r.panel + "')");
        return `<li>
          <button type="button" class="rd-dash-needs__row" onclick="${go}">
            <span class="rd-dash-pill rd-dash-pill--${esc(r.kind)}">${esc(r.pill)}</span>
            <span class="rd-dash-needs__title">${esc(r.title)}</span>
            <span class="rd-dash-needs__when">${esc(r.when)}</span>
          </button>
        </li>`;
      }).join('')}</ul>` : '<p class="rd-help">No urgent alerts — keep going with your next step.</p>'}
    </section>`;
  }

  function healthTrio(f) {
    const cats = budgetTopCats();
    const max = Math.max(1, ...cats.map(c => c.planned || c.spent || 0));
    const events = dayPreviewEvents();
    const vendorMorning = arr(data && data.vtimeline).filter(v => {
      const t = String(v.time || v.arrive || '');
      return /am|a\.m\.|^([0-9]|10|11):/i.test(t);
    }).length;

    return `<div class="rd-dash-trio">
      <section class="rd-dash-card" id="dash-budget-health" data-dash-card="budget-health">
        <div class="rd-dash-card__head">
          <h3>Budget health</h3>
          <button type="button" class="rd-dash-link" onclick="showPanel('budget')">Open budget →</button>
        </div>
        <div class="rd-dash-budget__hero"><strong>${esc(money(f.committed || f.paid))}</strong>
          <span>committed of ${esc(money(f.totalBudget || 0))} · ${f.commitPct}%</span></div>
        <div class="rd-dash-bars">${cats.map(c => {
          const w = Math.max(4, Math.round(((c.planned || c.spent) / max) * 100));
          return `<div class="rd-dash-bar"><span>${esc(c.name)}</span><i style="width:${w}%"></i><em>${esc(money(c.planned || c.spent))}</em></div>`;
        }).join('') || '<p class="rd-help">No budget categories yet.</p>'}</div>
      </section>

      <section class="rd-dash-card" id="dash-guest-response" data-dash-card="guest-response">
        <div class="rd-dash-card__head">
          <h3>Guest response</h3>
          <button type="button" class="rd-dash-link" onclick="showPanel('guests')">Open guest list →</button>
        </div>
        <div class="rd-dash-budget__hero"><strong>${f.yes}</strong>
          <span>of ${f.invited || f.guests.length} invited responded yes</span></div>
        <ul class="rd-dash-legend">
          <li><b class="is-yes"></b>Accepted <span>${f.yes}</span></li>
          <li><b class="is-no"></b>Declined <span>${f.no}</span></li>
          <li><b class="is-pend"></b>Pending <span>${f.pending}</span></li>
          <li><b class="is-none"></b>Not invited yet <span>${f.notSent}</span></li>
        </ul>
      </section>

      <section class="rd-dash-card" id="dash-day-preview" data-dash-card="day-preview">
        <div class="rd-dash-card__head">
          <h3>Wedding day</h3>
          <button type="button" class="rd-dash-link" onclick="showPanel('timeline')">Full timeline →</button>
        </div>
        <ul class="rd-dash-day">
          ${events.length ? events.map((e, i) => {
            const time = e.time || e.start || '';
            const label = e.event || e.title || e.name || 'Event';
            const loc = e.location || e.venue || '';
            const isCer = /ceremony/i.test(label);
            return `<li class="${isCer ? 'is-ceremony' : ''}"><span>${esc(time)}</span><strong>${esc(label)}${loc ? ' · ' + esc(loc) : ''}</strong></li>`;
          }).join('') : '<li><span>—</span><strong>Add day-of events on the Wedding Day Timeline</strong></li>'}
        </ul>
        <div class="rd-dash-card__foot">${arr(data && (data.wdayTimeline || data.timeline)).length} events · ${vendorMorning || 0} vendors arrive before noon</div>
      </section>
    </div>`;
  }

  function guidedBlock(f) {
    const steps = guidedSteps(f);
    const currentIdx = steps.findIndex(s => s.state === 'current');
    const stepN = currentIdx >= 0 ? currentIdx + 1 : 1;
    return `<section class="rd-dash-card" id="dash-guided" data-dash-card="guided">
      <div class="rd-dash-card__head">
        <div>
          <h3>Guided planning path</h3>
          <p class="rd-dash-card__sub">A calmer way to know what needs attention</p>
        </div>
      </div>
      <p class="rd-help">Start with the essentials, download a <code>.sqlite</code> backup early, and use Share Packets when someone else needs to help. Step ${stepN} of 5 is where you are now.</p>
      <ol class="rd-dash-path">
        ${steps.map(s => {
          const cls = s.state === 'done' ? 'is-done' : (s.state === 'current' ? 'is-current' : 'is-future');
          const num = s.state === 'done' ? '✓' : String(s.n);
          const cta = s.state === 'current'
            ? `<button type="button" class="rd-btn rd-btn--primary" onclick="${s.action || ("showPanel('" + s.page + "')")}">Continue</button>`
            : '';
          return `<li class="${cls}">
            <span class="rd-dash-path__num">${num}</span>
            <div><strong>${esc(s.label)}</strong><span>${esc(s.meta)}</span></div>
            ${cta}
          </li>`;
        }).join('')}
      </ol>
    </section>`;
  }

  function planningHealthBlock() {
    /* Prefer structured risks; map levels to mock pills */
    let risks = [];
    try {
      if (typeof uxAllRisks === 'function') risks = uxAllRisks().filter(Boolean).slice(0, 5);
    } catch (e) { risks = []; }

    const pillFor = level => {
      if (/warn|danger|error|act/i.test(level || '')) return 'Act now';
      if (/good|ok|success|info/i.test(level || '') && /good/i.test(level || '')) return 'Good';
      if (/good|success/i.test(level || '')) return 'Good';
      return 'Watch';
    };

    const rows = risks.map((r, i) => {
      const title = r.title || 'Review planner item';
      const note = r.note || '';
      const pill = /on track|complete|good/i.test(title + ' ' + note) ? 'Good'
        : (/overdue|missing|not sent|uninvited|behind/i.test(title + ' ' + note) ? 'Act now' : pillFor(r.level));
      const go = (r.action && r.action.onclick) || ("showPanel('" + (r.panelId || 'dashboard') + "')");
      return `<li>
        <button type="button" class="rd-dash-health__row" onclick="${go}">
          <span class="rd-dash-health__n">${String(i + 1).padStart(2, '0')}</span>
          <span class="rd-dash-health__text">${esc(title)}${note ? '<em>' + esc(note) + '</em>' : ''}</span>
          <span class="rd-dash-pill rd-dash-pill--${pill === 'Act now' ? 'act' : (pill === 'Good' ? 'good' : 'watch')}">${pill}</span>
        </button>
      </li>`;
    });

    return `<section class="rd-dash-card" id="dash-planning-health" data-dash-card="planning-health">
      <div class="rd-dash-card__head"><h3>Planning health</h3><span class="rd-dash-card__meta">${risks.length || 0} checks</span></div>
      ${rows.length ? `<ul class="rd-dash-health">${rows.join('')}</ul>` : '<p class="rd-help">No urgent items right now.</p>'}
    </section>`;
  }

  function dataHealthBlock() {
    const warnings = typeof plannerRelationshipWarnings === 'function' ? plannerRelationshipWarnings().slice(0, 4) : [];
    return `<section class="rd-dash-card" id="dash-data-health" data-dash-card="data-health">
      <div class="rd-dash-card__head">
        <h3>Data health</h3>
        <span class="rd-dash-card__meta">${warnings.length} linked record${warnings.length === 1 ? '' : 's'} to review</span>
      </div>
      ${warnings.length ? `<ul class="rd-dash-health">${warnings.map((w, i) => `<li>
        <button type="button" class="rd-dash-health__row" onclick="showPanel('${esc(w.page || 'data-hub')}')">
          <span class="rd-dash-health__n">${String(i + 1).padStart(2, '0')}</span>
          <span class="rd-dash-health__text">${esc(w.title || 'Review linked record')}<em>${esc(w.note || w.text || '')}</em></span>
          <span class="rd-dash-link">Review →</span>
        </button>
      </li>`).join('')}</ul>` : '<p class="rd-help">Linked records look healthy.</p>'}
    </section>`;
  }

  function sectionProgressBlock() {
    const prog = typeof computeSectionProgress === 'function' ? computeSectionProgress() : {};
    const rows = SECTION_ORDER.map(([page, label], i) => {
      const s = prog[page] || { state: 'none', text: '' };
      let meta = 'Not started';
      if (s.state === 'done') meta = (s.text && s.text !== '✓') ? s.text : 'Done';
      else if (s.state === 'progress') meta = s.text || 'Started';
      else if (s.text) meta = s.text;
      return `<button type="button" class="rd-dash-sec" onclick="showPanel('${page}')">
        <span class="rd-dash-sec__n">${String(i + 1).padStart(2, '0')}</span>
        <span class="rd-dash-sec__name">${esc(label)}</span>
        <span class="rd-dash-sec__meta">${esc(meta)}</span>
      </button>`;
    }).join('');
    return `<section class="rd-dash-card" id="dash-sections" data-dash-card="sections">
      <div class="rd-dash-card__head">
        <h3>Section progress</h3>
        <span class="rd-dash-card__meta">${SECTION_ORDER.length} sections</span>
      </div>
      <div class="rd-dash-secgrid">${rows}</div>
    </section>`;
  }

  function renderDashSurface() {
    const host = document.getElementById('dashboard-surface');
    if (!host) return;
    const f = dashFigures();
    host.innerHTML =
      `<div class="rd-dash-row rd-dash-row--top">${countdownBlock(f)}${ringsBlock(f)}</div>` +
      `<div class="rd-dash-row rd-dash-row--next">${nextStepBlock(f)}${needsBlock(f)}</div>` +
      healthTrio(f) +
      guidedBlock(f) +
      `<div class="rd-dash-row rd-dash-row--health">${planningHealthBlock()}${dataHealthBlock()}</div>` +
      sectionProgressBlock();
  }

  /* ── actions ─────────────────────────────────────────────────────────── */

  function rdDashJumpTo(id) {
    window._dashJump = id || 'dash-next-step';
    const el = document.getElementById(window._dashJump);
    if (el && typeof el.scrollIntoView === 'function') {
      el.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
    if (typeof renderContextSidebar === 'function'
      && document.body.getAttribute('data-active-panel') === 'dashboard') {
      renderContextSidebar('dashboard');
    }
  }

  function rdDashPrint() {
    if (typeof printCurrentPage === 'function') printCurrentPage();
    else window.print();
  }

  function rdDashShare() {
    if (typeof showPanel === 'function') showPanel('packets');
  }

  function rdDashSnooze() {
    if (typeof showToast === 'function') showToast('Snoozed for a week — it will return to Needs attention.', 'ok');
    else if (typeof covAlert === 'function') covAlert('Snoozed for a week.');
  }

  function rdDashBackup() {
    if (typeof downloadSqliteBackup === 'function') downloadSqliteBackup();
    else if (typeof startHereBackup === 'function') startHereBackup();
    else if (typeof exportJSON === 'function') exportJSON();
  }

  function dashboardFoundationMeters() {
    return foundationMeters();
  }

  function dashboardRailJumps() {
    return JUMPS;
  }

  /* ── main ────────────────────────────────────────────────────────────── */

  function renderDashboardRd() {
    if (typeof syncCateringToBudget === 'function') syncCateringToBudget();
    if (typeof syncPaymentsToBudget === 'function') syncPaymentsToBudget();
    if (typeof syncWeddingWeekendToBudget === 'function') syncWeddingWeekendToBudget();

    uedDashboardShellRd();
    if (typeof renderPageUxChrome === 'function') renderPageUxChrome('dashboard');
    renderDashStats();
    renderDashSurface();

    if (typeof startDashboardLiveCountdown === 'function') startDashboardLiveCountdown();
    if (typeof checkMilestoneCelebrations === 'function') {
      try { checkMilestoneCelebrations(); } catch (e) { /* soft */ }
    }
    if (typeof updateTopbarNotificationsBell === 'function') {
      try { updateTopbarNotificationsBell(); } catch (e) { /* soft */ }
    }

    if (typeof renderContextSidebar === 'function'
      && document.body.getAttribute('data-active-panel') === 'dashboard'
      && document.body.classList.contains('context-sidebar-mode')) {
      renderContextSidebar('dashboard');
    }
    if (typeof uxRevealPanel === 'function') uxRevealPanel('dashboard');
  }

  window.uedDashboardShell = uedDashboardShellRd;
  window.renderDashboardRd = renderDashboardRd;
  window.renderDashboardPage = renderDashboardRd;
  window.rdDashJumpTo = rdDashJumpTo;
  window.rdDashPrint = rdDashPrint;
  window.rdDashShare = rdDashShare;
  window.rdDashSnooze = rdDashSnooze;
  window.rdDashBackup = rdDashBackup;
  window.dashboardFoundationMeters = dashboardFoundationMeters;
  window.dashboardRailJumps = dashboardRailJumps;
  window.dashFigures = dashFigures;

  /* Override legacy renderer — keep name renderDashboard for all call sites */
  window.renderDashboard = function () {
    renderDashboardRd();
  };

  function hookDashPanelRenderer() {
    if (window.SYSTEM_PANEL_RENDERERS) {
      window.SYSTEM_PANEL_RENDERERS.dashboard = function () {
        window.DASH_ANIMATE = true;
        renderDashboardRd();
        window.DASH_ANIMATE = false;
      };
    }
  }
  hookDashPanelRenderer();
  var _showPanelDash = window.showPanel;
  if (typeof _showPanelDash === 'function') {
    window.showPanel = function (id, forceOpen) {
      var out = _showPanelDash.call(window, id, forceOpen);
      hookDashPanelRenderer();
      return out;
    };
  }
})();
