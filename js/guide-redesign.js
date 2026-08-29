/* Get Started · Page-by-Page Guide · FAQ — Master s36 (15b · 15d · 15c + 33i/33j)
   Three no-tab reference pages. The §07 frame holds but the surface carries
   prose, so there is no stat strip, bulk bar or record on these pages.

   Additive: the existing Get Started prose, the guide accordion (buildGuide)
   and the FAQ content stay; this file adds the redesign pageheads with the
   right primary action, the Get Started backup warning, the Page-by-Page
   Guide Table view (33i · Page·Tab·Owns·Reads from·Feeds·Prints) with its
   entry drawer, and the FAQ quick-answers aside. */
(function () {
  'use strict';

  window._guideView = window._guideView || 'entries';
  window._guideDrawer = window._guideDrawer || null;
  window._guideDrawerTab = window._guideDrawerTab || 0;

  const DRAWER_TABS = ['Entry', 'Steps', 'Links', 'History'];

  /* 33i data contract — one row per page. "Owns" is the important column:
     only one page owns any given field; every other page reads it. */
  const PAGE_CONTRACT = [
    ['Wedding Setup', 'no-tab', 'Couple, date, venues, budget target, timezone', '—', 'Every page', 'Class B'],
    ['Dashboard', 'Overview', 'Nothing — it is all derived', 'Every page', '—', 'No'],
    ['Get Started', 'Overview', 'Nothing', '—', '—', 'Class B'],
    ['Timeline & Tasks', 'Planning', 'Tasks, phases, owners, due dates', 'Setup date', 'Dashboard, Calendar, Homecoming', 'Class A'],
    ['Appointments', 'Planning', 'Appointments, times, attendees', 'Vendors', 'Calendar, Timeline', 'Class A'],
    ['Smart Calendar', 'Planning', 'Nothing — aggregates dated records', 'Tasks, Appointments, Payments', '—', 'Class A'],
    ['Database Hub', 'Planning', 'Nothing — edits the tables in place', 'Every table', 'Every table', 'No'],
    ['Guest List', 'People', 'Guests, RSVP, meal, seat, side', 'Households, Setup', 'Households, Table Layout, Gifts, catering counts', 'Class A'],
    ['Households', 'People', 'Nothing — derived from guests', 'Guest List', 'Print Centre (labels)', 'Class A'],
    ['Contacts', 'People', 'Nothing — derived from guests & vendors', 'Guest List, Vendors', 'Day-of sheet', 'Class A'],
    ['Wedding Party', 'People', 'Party members, roles, attire, duties', 'Guest List', 'Ceremony, Shot Lists', 'Class A'],
    ['Table Layout', 'People', 'Tables, seats', 'Guest List', 'Guest List (seat), caterer export', 'Class A'],
    ['Gifts', 'People', 'Gifts, thank-you status', 'Guest List', 'Newlywed Homecoming (thank-you count)', 'Class A'],
    ['Budget', 'Money', 'Budget lines, categories, targets', 'Setup budget, Vendors', 'Dashboard, Payments', 'Class A'],
    ['Payments', 'Money', 'Payments, instalments, due dates', 'Contracts, Budget', 'Calendar, Dashboard, Budget', 'Class A'],
    ['Contracts & Invoices', 'Money', 'Contracts, documents, instalments', 'Vendors', 'Payments', 'Class A'],
    ['Venue & Vendors', 'Vendors', 'Vendors, status, category, quotes', 'Setup', 'Budget, Contracts, Appointments, Contacts', 'Class A'],
    ['Catering & Menu', 'Vendors', 'Menu, courses, dietary, suppliers', 'Guest List (counts)', 'Table Layout export', 'Class A'],
    ['Entertainment', 'Vendors', 'Songs, moments, performers', 'Vendors', 'Wedding Day Timeline', 'Class A'],
    ['Shot Lists', 'Vendors', 'Shots, windows, priority, supplier', 'Wedding Party, Guest List', 'Wedding Day Timeline', 'Class A'],
    ['Wedding Day Timeline', 'The Day', 'Day-of events, times', 'Ceremony, Entertainment, Logistics', 'Weekend Logistics', 'Class A'],
    ['Ceremony & Reception', 'The Day', 'Ceremony elements, people, durations', 'Wedding Party', 'Wedding Day Timeline', 'Class A'],
    ['Weekend Logistics', 'The Day', 'Movements, days, owners, places', 'Setup date', 'Wedding Day Timeline (Sunday)', 'Class A'],
    ['Newlywed Homecoming', 'Covenant', 'Settling tasks, name change, first-month budget', 'Gifts, Tasks', '—', 'Class A'],
    ['First-Month Rhythms', 'Covenant', 'Rhythms, cadence, streak', 'Setup date', '—', 'Class B'],
    ['Planner History', 'no-tab', 'The change log (append-only)', 'Every write', '—', 'No'],
    ['Vision & Foundation', 'Covenant', 'The seven vision sections', 'Setup, Counseling', 'Keepsakes', 'Class B'],
    ['Prayer Journal', 'Covenant', 'Prayer entries, answers', '—', '—', 'Class B'],
    ['Premarital Counseling', 'Covenant', 'Sessions, homework, notes', 'Setup', 'Rhythms, Vision', 'Class B'],
    ['Essentials Checklist', 'Documents', 'Items, kits, carriers, status', '—', 'Print Centre', 'Class A'],
    ['Honeymoon & After', 'The Day', 'Bookings, itinerary, trip budget', 'Setup date', '—', 'Class A'],
    ['Notes', 'Overview', 'Notes, pins, authors', 'Every record', '—', 'Class A'],
    ['Share Packets', 'Documents', 'Packets, recipients, access', 'Every record', '—', 'No'],
    ['Email Templates', 'Documents', 'Templates, audiences, merge fields', 'Guest List', '—', 'No'],
    ['Print Centre', 'Documents', 'Nothing — collects printables', 'Every printable page', '—', 'Class A/B'],
    ['Vision Board', 'People', 'Mood images, palette', '—', 'Print styling', 'Class B'],
    ['FAQ', 'Overview', 'Nothing', '—', '—', 'No']
  ];

  const FAQ_QUICK = [
    ['Auto-save', 'Your work saves automatically in this browser as you type. There is no save button to forget.'],
    ['Back up regularly', 'Download a .sqlite file weekly. It is the only copy that leaves this browser.'],
    ['Print beautifully', 'Every page has Print section. Working documents print plain; keepsakes keep the serif.'],
    ['Edit anywhere', 'Every table edits in place and every total re-derives immediately.'],
    ['Nothing is uploaded', 'No account, no cloud, no tracking. The trade-off is that backups are your job.']
  ];

  const GUIDE_BLURBS = {
    Dashboard: 'Shows what needs attention today and the single next best step.',
    'Wedding Setup': 'Holds the eleven facts every other page reads, plus menu visibility.',
    'Guest List': 'The 24-field guest record — the ledger every people figure is counted from.',
    Budget: 'Eight categories against a target, itemised, with pledges tracked separately.',
    Payments: 'Every instalment grouped by due month, with what is owed next.',
    'Table Layout': 'The floor plan, the seat assignments, and a card per table.',
    'Catering & Menu': 'Nine sections from menu builder to dietary summary, owning food budget lines.',
    'Database Hub': 'Data health plus a raw browser for all 24 tables.',
    'Print Centre': 'Every printable, sorted into working documents and keepsakes.'
  };

  window._guideExpanded = window._guideExpanded || new Set();
  window._guideFilterTab = window._guideFilterTab || 'all';

  const esc = s => (typeof escapeHtml === 'function'
    ? escapeHtml(s == null ? '' : String(s))
    : String(s == null ? '' : s).replace(/[&<>"']/g, ch => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[ch])));

  function hideLegacyChrome(panel) {
    if (!panel) return;
    panel.querySelectorAll('.inst-title-wrap, .faq-title-wrap, .inst-final-footer').forEach(el => {
      el.classList.add('rd-guide-legacy-hide');
    });
  }

  function ensureHead(panelId, eyebrow, title, primaryLabel, primaryOnclick, extraActions) {
    const panel = document.getElementById(panelId);
    if (!panel) return null;
    panel.classList.add('ued-scope', 'rd-guide-scope');
    hideLegacyChrome(panel);
    let head = panel.querySelector('.rd-guide-pagehead');
    if (!head) {
      head = document.createElement('div');
      head.className = 'rd-pagehead rd-guide-pagehead';
      panel.insertBefore(head, panel.firstChild);
    }
    head.innerHTML =
      '<div><div class="rd-pagehead__eyebrow">' + esc(eyebrow) + '</div>' +
      '<div class="rd-pagehead__title-row"><h1 class="rd-pagehead__title">' + esc(title) + '</h1></div></div>' +
      '<div class="rd-pagehead__actions">' + (extraActions || '') +
      '<button type="button" class="rd-btn rd-btn--primary" onclick="' + primaryOnclick + '">' + esc(primaryLabel) + '</button>' +
      '</div>';
    return panel;
  }

  /* ── Get Started (15b) ───────────────────────────────────────────────── */

  function backupMetaHtml() {
    let last = null;
    let size = null;
    let records = null;
    try {
      const ob = (typeof getCovenantPlannerData === 'function' ? getCovenantPlannerData() : window.data)?.onboard || {};
      if (ob.lastBackupTime) {
        const t = new Date(ob.lastBackupTime);
        if (!Number.isNaN(t.getTime())) {
          const mins = Math.round((Date.now() - t.getTime()) / 60000);
          if (mins < 60) last = mins + ' minute' + (mins === 1 ? '' : 's') + ' ago';
          else if (mins < 1440) last = Math.round(mins / 60) + ' hour' + (Math.round(mins / 60) === 1 ? '' : 's') + ' ago';
          else last = Math.round(mins / 1440) + ' day' + (Math.round(mins / 1440) === 1 ? '' : 's') + ' ago';
        }
      }
      if (ob.lastBackupSize) size = ob.lastBackupSize;
      if (typeof countPlannerRecords === 'function') records = countPlannerRecords();
      else {
        const d = (typeof getCovenantPlannerData === 'function') ? getCovenantPlannerData() : (window.data || {});
        records = ['guests', 'tasks', 'payments', 'vendors', 'budget', 'gifts', 'contracts', 'appointments']
          .reduce((n, k) => n + (Array.isArray(d[k]) ? d[k].length : 0), 0);
      }
    } catch (e) { /* optional meta */ }
    if (!last) return '';
    const parts = ['Last backup', last];
    if (size) parts.push(size);
    if (records != null) parts.push(records + ' record' + (records === 1 ? '' : 's'));
    return '<p class="rd-getstarted-readfirst__backup">' + esc(parts.join(' · ')) + '</p>';
  }

  function renderGetStarted() {
    const panel = ensureHead('panel-instructions', 'Overview · start planning',
      'Get Started', 'Download backup', 'rdGuideBackup()',
      '<button type="button" class="rd-btn" onclick="typeof showPanel===\'function\'&&showPanel(\'guide\',true)">Open the guide</button>' +
      '<button type="button" class="rd-btn" onclick="typeof printActivePanel===\'function\'&&printActivePanel()">Print section</button>' +
      '<button type="button" class="rd-btn" onclick="typeof rdOpenFullEditor===\'function\'&&rdOpenFullEditor()">Full editor</button>' +
      '<button type="button" class="rd-btn" onclick="typeof printActivePanel===\'function\'&&printActivePanel()">Print this page</button>');
    if (!panel) return;
    panel.querySelectorAll(
      '.inst-title-wrap, .inst-grid-3, .inst-wide-row, .inst-partner-handoff, .inst-welcome, .inst-actions-row, .inst-final-footer, ' +
      '#start-here-card, #rd-guide-backupwarn, #next-steps-path, #start-here-backup-edu, #start-here-templates, ' +
      '#start-here-essentials-hub, #start-here-checklist'
    ).forEach(el => { el.classList.add('rd-guide-legacy-hide'); });
    buildGetStartedBody(panel);
    if (typeof renderContextSidebar === 'function') renderContextSidebar('instructions');
  }

  function firstHourSteps(d) {
    const guests = Array.isArray(d.guests) ? d.guests.length : 0;
    const target = parseInt((d.setup && d.setup.guests) || 0, 10) || 0;
    return [
      ['Fill in Wedding Setup', 'Names, date, venues, budget, guest target', !!(d.setup && d.setup.bride && d.setup.date)],
      ['Download your first backup', 'Before typing anything else', false],
      ['Add your households', 'Addresses first, guests follow', Array.isArray(d.households) && d.households.length > 0],
      ['Set the budget target and categories', 'Eight categories, one target', Array.isArray(d.budget) && d.budget.length > 0],
      ['Enter the guest list', (target ? target + ' to go' : 'Guests') + ' · ' + guests + ' entered', guests > 0, 'guests'],
      ['Book the venue and log the contract', 'Venue & Vendors', Array.isArray(d.vendors) && d.vendors.some(v => /book/i.test(String(v.status || '')))],
      ['Print the day-of pack', 'Nine documents, one job', false, 'print']
    ];
  }

  function firstHourStepsHtml(steps) {
    let html = '';
    steps.forEach((s, i) => {
      const isDone = s[2];
      const isNext = !isDone && steps.slice(0, i).every(x => x[2]);
      html +=
        '<div class="rd-step' + (isDone ? ' is-done' : '') + '">' +
        '<span class="rd-step__chip' + (isDone ? ' rd-step__chip--done' : '') + '">' + (isDone ? '✓' : '') + '</span>' +
        '<span class="rd-step__num">' + String(i + 1).padStart(2, '0') + '</span>' +
        '<span class="rd-step__title' + (isDone ? ' rd-step__title--done' : '') + '">' + esc(s[0]) + '</span>' +
        '<span class="rd-step__desc rd-step__detail">' + esc(s[1]) + '</span>' +
        (isNext && s[3] === 'guests' ? '<button type="button" class="rd-btn rd-btn--primary rd-step__cta" onclick="typeof showPanel===\'function\'&&showPanel(\'guests\',true)">Start</button>' : '') +
        (isNext && s[3] === 'print' ? '<button type="button" class="rd-btn rd-btn--primary rd-step__cta" onclick="typeof showPanel===\'function\'&&showPanel(\'print\',true)">Print</button>' : '') +
        '</div>';
    });
    return html;
  }

  function pathStepsData() {
    if (typeof nspSteps === 'function') return nspSteps();
    const s = ((typeof getCovenantPlannerData === 'function' ? getCovenantPlannerData() : window.data) || {}).setup || {};
    const budgetSet = parseFloat(s.budget) > 0;
    const d = (typeof getCovenantPlannerData === 'function' ? getCovenantPlannerData() : window.data) || {};
    return [
      { title: 'Start with your foundation', body: 'Set your vision & verse, and begin premarital counseling.', cta: 'Open Vision & Foundation', act: "showReflectTabPage('vision')", done: !!(s.verse || s.mission) },
      { title: 'Shape your budget', body: 'Confirm categories, mark gifts, and log deposits as you book.', cta: 'Open Budget', act: "showPanel('budget')", done: budgetSet },
      { title: 'Build your guest list', body: 'Add guests & RSVPs, then choose your wedding party.', cta: 'Open Guest List', act: "showPanel('guests')", done: Array.isArray(d.guests) && d.guests.length > 0 },
      { title: 'Book your team & place', body: 'Compare venues, book vendors, and plan catering & menu.', cta: 'Open Vendors', act: "showPanel('vendors')", done: Array.isArray(d.vendors) && d.vendors.length > 0 },
      { title: 'Plan the day', body: 'Order of service, day-of timeline, music & shot lists.', cta: 'Open Ceremony & Reception', act: "showPanel('ceremony')", done: Array.isArray(d.timeline) && d.timeline.length > 0 }
    ];
  }

  function renderPathSection() {
    const steps = pathStepsData();
    const doneCount = steps.filter(s => s.done).length;
    const currentIdx = steps.findIndex(s => !s.done);
    const pct = steps.length ? Math.round(doneCount / steps.length * 100) : 0;
    let rows = '';
    steps.forEach((s, i) => {
      const isCur = i === currentIdx;
      const chip = isCur ? '<span class="rd-path-step__chip">Start here</span>'
        : (s.done ? '<span class="rd-path-step__chip rd-path-step__chip--done">Done</span>' : '');
      rows +=
        '<button type="button" class="rd-path-step' + (isCur ? ' is-current' : '') + (s.done ? ' is-done' : '') + '" onclick="' + s.act + '">' +
        '<span class="rd-path-step__badge' + (s.done ? ' rd-path-step__badge--done' : (isCur ? ' rd-path-step__badge--cur' : '')) + '">' +
        (s.done ? '✓' : String(i + 1)) + '</span>' +
        '<span class="rd-path-step__main">' +
        '<span class="rd-path-step__title">' + esc(s.title) + '</span>' +
        '<span class="rd-path-step__body">' + esc(s.body) + '</span>' +
        '<span class="rd-path-step__cta">' + esc(s.cta) + ' →</span></span>' + chip + '</button>';
    });
    return '<div class="rd-setup-band rd-getstarted-path" id="rd-sec-path">' +
      '<div class="rd-setup-band__head">' +
      '<span>Your path</span>' +
      '<span class="rd-setup-band__meta">You\'re all set — here\'s what\'s next</span>' +
      '<span class="rd-setup-band__meta rd-getstarted-path__count">' + doneCount + ' of ' + steps.length + ' areas started</span></div>' +
      '<div class="rd-getstarted-path__intro">' +
      '<p>Work down this path at your own pace. Each step opens the page you need — nothing has to be done today. Steps check off automatically as you fill each area.</p>' +
      '<div class="rd-progressmeter">' +
      '<div class="rd-progressmeter__top"><span>Planning progress</span><span>' + doneCount + ' of ' + steps.length + '</span></div>' +
      '<div class="rd-track"><div class="rd-fill" style="width:' + pct + '%"></div></div></div></div>' +
      '<div class="rd-path-flow">' + rows +
      '<button type="button" class="rd-path-step rd-path-step--finish" onclick="typeof showPanel===\'function\'&&showPanel(\'packets\')">' +
      '<span class="rd-path-step__badge rd-path-step__badge--finish">◆</span>' +
      '<span class="rd-path-step__main"><span class="rd-path-step__title">Hand off when it\'s rolling</span>' +
      '<span class="rd-path-step__body">Use <b>Share Packets</b> &amp; <b>Print Centre</b> to give your coordinator and vendors what they need.</span></span></button></div></div>';
  }

  function renderBeforeStartSection() {
    const d = (typeof getCovenantPlannerData === 'function' ? getCovenantPlannerData() : window.data) || {};
    const simpleOn = !!(d.setup && d.setup.simpleMode);
    const toggleLabel = simpleOn ? 'Switch to Full Planner' : 'Turn On Essentials View';
    const hubLinks = (typeof ESSENTIALS_HUB_LINKS !== 'undefined' ? ESSENTIALS_HUB_LINKS : [
      { id: 'setup', label: 'Wedding Setup', note: 'Names, date & budget' },
      { id: 'guests', label: 'Guest List', note: 'RSVPs & headcount' },
      { id: 'budget', label: 'Budget', note: 'Spending & categories' },
      { id: 'calendar', label: 'Smart Calendar', note: 'Dates in one place' },
      { action: 'startHereBackup()', label: 'Download Backup', note: 'Protect your work' }
    ]).map(l => {
      const action = l.action || "typeof showPanel==='function'&&showPanel('" + l.id + "')";
      return '<button type="button" class="rd-hub-link" onclick="' + action + '"><span class="rd-hub-link__label">' + esc(l.label) + '</span><span class="rd-hub-link__note">' + esc(l.note) + '</span></button>';
    }).join('');
    let checklistHtml = '';
    if (typeof computeSetupChecklist === 'function') {
      const st = computeSetupChecklist();
      const rows = st.steps.map(s => {
        const action = s.action || "typeof showPanel==='function'&&showPanel('" + s.page + "')";
        return '<button type="button" class="rd-checklist-step' + (s.done ? ' is-done' : '') + '" onclick="' + action + '">' +
          '<span class="rd-checklist-step__box">' + (s.done ? '✓' : '') + '</span>' +
          '<span class="rd-checklist-step__label">' + esc(s.label) + '</span></button>';
      }).join('');
      checklistHtml =
        '<div class="rd-progressmeter rd-getstarted-checklist__meter">' +
        '<div class="rd-progressmeter__top"><span>Essentials ready</span><span>' + st.done + ' of ' + st.total + '</span></div>' +
        '<div class="rd-track"><div class="rd-fill" style="width:' + st.pct + '%"></div></div></div>' +
        '<div class="rd-checklist-grid">' + rows + '</div>';
    }
    return '<div class="rd-getstarted-split rd-getstarted-beforestart" id="rd-sec-beforestart">' +
      '<section class="rd-getstarted-panel">' +
      '<div class="rd-setup-band__head"><span>Before you start</span><span class="rd-setup-band__meta">Essentials View when the menu feels big</span></div>' +
      '<div class="rd-getstarted-panel__body">' +
      '<p class="rd-getstarted-beforestart__lead">Hide advanced pages and focus on guests, budget, timeline, and backup. Nothing is deleted — open <b>Profile &amp; Display</b> anytime for a Focus preset.</p>' +
      '<div class="rd-getstarted-beforestart__actions">' +
      '<button type="button" class="rd-btn rd-btn--primary" onclick="typeof toggleSimpleMode===\'function\'&&toggleSimpleMode()">' + esc(toggleLabel) + '</button></div>' +
      '<div class="rd-hub-grid">' + hubLinks + '</div></div></section>' +
      '<section class="rd-getstarted-panel">' +
      '<div class="rd-setup-band__head"><span>Setup checklist</span><span class="rd-setup-band__meta">Horizontal completion tracker</span>' +
      '<button type="button" class="rd-setup-band__link" onclick="typeof openSetupWizard===\'function\'&&openSetupWizard()">Run setup wizard</button></div>' +
      '<div class="rd-getstarted-panel__body">' + (checklistHtml || '<p class="rd-getstarted-beforestart__lead">Open Wedding Setup to begin the essentials checklist.</p>') +
      '</div></section></div>';
  }

  function renderOrganisedSection() {
    const tabs = [
      ['Overview', 'Dashboard · Get Started · Notes'],
      ['Planning', 'Timeline · Calendar · Appointments'],
      ['People', 'Guests · Party · Tables'],
      ['Money', 'Budget · Payments · Contracts'],
      ['Vendors', 'Venue · Catering · Entertainment'],
      ['The Day', 'Ceremony · Timeline · Logistics'],
      ['Covenant', 'Vision · Prayer · Counseling'],
      ['Documents', 'Print · Packets · Email']
    ];
    const tabHtml = tabs.map(t =>
      '<div class="rd-organised-tab"><span class="rd-organised-tab__k">' + esc(t[0]) + '</span><span class="rd-organised-tab__v">' + esc(t[1]) + '</span></div>'
    ).join('');
    const templates = (typeof STYLE_TEMPLATES !== 'undefined' ? STYLE_TEMPLATES : []).slice(0, 4);
    const catHtml = templates.map(t =>
      '<article class="rd-organised-cat">' +
      '<div class="rd-organised-cat__head"><span class="rd-organised-cat__icon">' + esc(t.icon || '◆') + '</span><h4>' + esc(t.name) + '</h4></div>' +
      '<p>' + esc(t.purpose || t.desc || '') + '</p>' +
      '<button type="button" class="rd-setup-band__link" onclick="typeof applyStyleTemplate===\'function\'&&applyStyleTemplate(\'' + String(t.id).replace(/'/g, "\\'") + '\')">Apply category</button></article>'
    ).join('');
    return '<div class="rd-setup-band rd-getstarted-organised" id="rd-sec-organised">' +
      '<div class="rd-setup-band__head"><span>How the planner is organised</span>' +
      '<span class="rd-setup-band__meta">Eight tabs · thirty-one pages · one database</span>' +
      '<button type="button" class="rd-setup-band__link" onclick="typeof showPanel===\'function\'&&showPanel(\'guide\',true)">Open the Page-by-Page Guide</button></div>' +
      '<div class="rd-organised-tabs">' + tabHtml + '</div>' +
      (catHtml ? '<div class="rd-setup-band__head rd-getstarted-organised__sub"><span>Planning categories</span>' +
        '<span class="rd-setup-band__meta">Starter rows — not colour themes</span></div><div class="rd-organised-cats">' + catHtml + '</div>' : '') +
      '</div>';
  }

  function renderActionsSection() {
    return '<div class="rd-setup-band rd-getstarted-actions" id="rd-sec-actions">' +
      '<div class="rd-setup-band__head"><span>Try, reset &amp; continue</span>' +
      '<span class="rd-setup-band__meta">Optional — your real work stays until you reset</span></div>' +
      '<div class="rd-grid-3 rd-getstarted-actions__grid">' +
      '<article class="rd-cta-card"><h3>See a filled-in example</h3>' +
      '<p>Load sample wedding data to see how every section works together.</p>' +
      '<button type="button" class="rd-btn rd-btn--primary" onclick="typeof loadSampleData===\'function\'&&loadSampleData()">Load sample data</button>' +
      '<p class="rd-help">Replaces current planner contents.</p></article>' +
      '<article class="rd-cta-card"><h3>Reset all data</h3>' +
      '<p>Clear the planner and begin fresh when you are ready for your own plan.</p>' +
      '<button type="button" class="rd-btn" onclick="typeof openResetModal===\'function\'&&openResetModal()">Reset all data</button>' +
      '<p class="rd-help">Download a backup first — this cannot be undone.</p></article>' +
      '<article class="rd-cta-card"><h3>Compatibility &amp; privacy</h3>' +
      '<p>Runs offline in Chrome, Edge, Firefox, and Safari. No login, no cloud, no uploads.</p>' +
      '<button type="button" class="rd-btn" onclick="typeof showPanel===\'function\'&&showPanel(\'dashboard\')">Continue to Dashboard →</button></article>' +
      '</div></div>';
  }

  function renderClosingSection() {
    return '<div class="rd-getstarted-closing" id="rd-sec-closing">' +
      '<div class="rd-getstarted-closing__rule"></div>' +
      '<p class="rd-getstarted-closing__quote">“Commit thy works unto the Lord, and thy thoughts shall be established.”</p>' +
      '<p class="rd-getstarted-closing__ref">Proverbs 16:3</p>' +
      '<p class="rd-getstarted-closing__note">This planner is a personal planning tool — not legal, financial, pastoral, or professional counseling advice.</p></div>';
  }

  function buildGetStartedHtml() {
    const d = (typeof getCovenantPlannerData === 'function') ? getCovenantPlannerData() : (window.data || {});
    const hourSteps = firstHourSteps(d);
    const hourDone = hourSteps.filter(s => s[2]).length;
    return '' +
      '<div class="rd-getstarted-hero" id="rd-sec-before">' +
      '<div class="rd-getstarted-hero__main">' +
      '<div class="rd-getstarted-hero__rule"></div>' +
      '<p class="rd-getstarted-lead">This planner runs entirely on your own computer. Everything you type saves automatically to a private database in this browser. Nothing is uploaded, and nothing is kept anywhere else unless you download a backup yourself.</p>' +
      '<p class="rd-getstarted-sub">That is the whole promise of the product, and it is also the one risk. Read the next box before you type anything you would be upset to lose.</p>' +
      '</div>' +
      '<aside class="rd-getstarted-readfirst">' +
      '<div class="rd-getstarted-readfirst__k">Read this first</div>' +
      '<p>If you clear your browser history, cookies or site data — or open the planner on another device without restoring a backup — <strong>your saved work will not be there.</strong></p>' +
      '<p class="rd-getstarted-readfirst__note">Wait a few seconds after opening the planner before your first backup, so the database finishes loading.</p>' +
      backupMetaHtml() +
      '<div class="rd-getstarted-readfirst__actions">' +
      '<button type="button" class="rd-btn rd-btn--primary" onclick="rdGuideBackup()">Download backup</button>' +
      '<button type="button" class="rd-btn" onclick="rdSetupRestore()">Restore</button></div></aside></div>' +
      '<div class="rd-setup-band" id="rd-sec-connects"><div class="rd-setup-band__head"><span>How the planner connects</span>' +
      '<span class="rd-setup-band__meta">Six links that mean you never type the same detail twice</span>' +
      '<button type="button" class="rd-setup-band__link" onclick="typeof showPanel===\'function\'&&showPanel(\'datahub\',true)">Open the Database Hub</button></div>' +
      '<div class="rd-grid-3 rd-getstarted-concepts">' +
      conceptCard('01', 'Setup personalises everything', 'Your names, date, venues, budget and time zone feed the Dashboard, the countdown, the calendar and every printable.', 'Wedding Setup → 31 pages') +
      conceptCard('02', 'Money flows one direction', 'Payments feed Budget. Catering creates managed budget lines. Contracts carry their own instalments. Nothing is typed twice.', 'Payments → Budget') +
      conceptCard('03', 'People fan outward', 'Guest List feeds Table Layout, catering headcount, meal counts, the calendar, share packets and the wedding party.', 'Guest List → 7 pages') +
      conceptCard('04', 'Dates gather in one place', 'Tasks, appointments, payments and timeline items all appear together in Month, Week and Agenda views.', '5 sources → Smart Calendar') +
      conceptCard('05', 'Data health watches the joins', 'The Dashboard flags a payment with no vendor, a guest on a deleted table, or a calendar item whose source is gone.', '6 checks · 4 open') +
      conceptCard('06', 'Covenant pages sit alongside', 'Vision, Prayer Journal, Counseling and Marriage Rhythms are part of the plan, not an appendix to it.', '4 pages · Class B print') +
      '</div></div>' +
      '<div class="rd-getstarted-split">' +
      '<section class="rd-getstarted-panel" id="rd-sec-editing"><div class="rd-setup-band__head"><span>Editing &amp; navigation</span><span class="rd-setup-band__meta">How to use the planner like a workbook</span></div>' +
      '<div class="rd-getstarted-panel__body">' +
      tipBlock('Two ways to edit a record', 'Click a row to open the side drawer for a quick change, or Full editor for all the fields at once. Both write to the same record.') +
      tipBlock('Tables edit in place', 'Type in a cell, tick rows for bulk edits, and use the last row to add. Long text wraps and can be dragged taller.') +
      tipBlock('Focus when it feels big', 'Profile &amp; Display → Focus on essentials hides advanced pages without deleting anything. Wedding Setup has the full list.') +
      tipBlock('Undo, redo and the change log', 'Undo and redo cover the last 15 changes. <b>Planner History</b> keeps a day-by-day log of what changed — it is view-only, so it tells you what happened without offering to roll back.') +
      '</div></section>' +
      '<section class="rd-getstarted-panel" id="rd-sec-partner"><div class="rd-setup-band__head"><span>Planning with your partner</span><span class="rd-setup-band__meta">No account, no cloud — three files</span>' +
      '<button type="button" class="rd-setup-band__link" onclick="typeof showPanel===\'function\'&&showPanel(\'packets\',true)">Open Share Packets</button></div>' +
      '<div class="rd-getstarted-panel__body"><div class="rd-partner-flow">' +
      '<div><div class="rd-partner-flow__k">You</div><div>Download backup</div><code>.sqlite</code></div>' +
      '<div><div class="rd-partner-flow__k">Partner</div><div>Restores it</div><code>same file</code></div>' +
      '<div><div class="rd-partner-flow__k">Partner</div><div>Sends one back</div><code>.sqlite</code></div>' +
      '<div><div class="rd-partner-flow__k">You</div><div>Import packet</div><code>merges</code></div>' +
      '</div><p class="rd-getstarted-partner-note">A partner packet merges RSVP updates and new tasks — it never deletes what you already have. Use a <b>Share Packet</b> instead when someone only needs to read details, not edit them.</p></div></section></div>' +
      '<div class="rd-setup-band" id="rd-sec-cannot"><div class="rd-setup-band__head"><span>What this planner cannot do</span><span class="rd-setup-band__meta">Said plainly, so it is not discovered late</span>' +
      '<button type="button" class="rd-setup-band__link" onclick="typeof showPanel===\'function\'&&showPanel(\'emails\',true)">Open Email Templates</button></div>' +
      '<div class="rd-getstarted-cannot">' +
      cannotCard('It cannot send email', 'No invitations, no RSVP reminders, no vendor mail. Email Templates writes the letters and you send them from your own mail app.') +
      cannotCard('It cannot collect RSVPs', 'There is no web form. Replies are entered on the Guest List by whoever hears them.') +
      cannotCard('It cannot sync between devices', 'Two devices means two planners. The backup file is the only bridge.') +
      cannotCard('It cannot recover a cleared browser', 'If site data goes without a backup, the planner is gone. This is the only unrecoverable failure.') +
      '</div></div>' +
      '<div class="rd-setup-band" id="rd-sec-firsthour"><div class="rd-setup-band__head"><span>Your first hour</span>' +
      '<span class="rd-setup-band__meta">Seven steps · ' + hourDone + ' done</span>' +
      (hourDone < 7 ? '<span class="rd-setup-band__link">Continue at step ' + (hourDone + 1) + '</span>' : '') +
      '</div><div class="rd-steps">' + firstHourStepsHtml(hourSteps) + '</div></div>' +
      renderPathSection() +
      renderBeforeStartSection() +
      renderOrganisedSection() +
      renderActionsSection() +
      renderClosingSection();
  }

  function buildGetStartedBody(panel) {
    let host = panel.querySelector('#rd-getstarted-body');
    if (!host) {
      host = document.createElement('div');
      host.id = 'rd-getstarted-body';
      host.className = 'rd-getstarted-body';
      const head = panel.querySelector('.rd-guide-pagehead');
      if (head && head.nextSibling) panel.insertBefore(host, head.nextSibling);
      else panel.appendChild(host);
    }
    host.innerHTML = buildGetStartedHtml();
  }
  function conceptCard(num, title, body, mono) {
    return '<article class="rd-concept"><div class="rd-concept__head"><span class="rd-concept__num">' + num + '</span><h3 class="rd-concept__title">' + esc(title) + '</h3></div>' +
      '<p class="rd-concept__body">' + esc(body) + '</p><code class="rd-concept__mono">' + esc(mono) + '</code></article>';
  }
  function tipBlock(title, body) {
    return '<div class="rd-tip"><h4>' + esc(title) + '</h4><p>' + body + '</p></div>';
  }
  function cannotCard(title, body) {
    return '<article class="rd-cannot-card"><h4>' + esc(title) + '</h4><p>' + esc(body) + '</p></article>';
  }

  /* ── Page-by-Page Guide (15d + 33i table + 33j print) ────────────────── */

  function contractForPage(name) {
    return PAGE_CONTRACT.find(r => String(r[0]).toLowerCase() === String(name).toLowerCase()) || null;
  }

  function guideTabLabel(cat, title) {
    const row = contractForPage(title);
    if (row) return row[1] === 'no-tab' ? 'Overview' : row[1];
    if (cat === 'Finances') return 'Money';
    return cat || 'Overview';
  }

  function guideDoesLine(title, body, row) {
    if (GUIDE_BLURBS[title]) return GUIDE_BLURBS[title];
    if (row && row[2] && row[2] !== '—') {
      const owns = row[2];
      if (/^Nothing/i.test(owns)) return owns.replace(/^Nothing — /, '').replace(/^Nothing · /, '');
      return owns.length > 96 ? owns.slice(0, 93) + '…' : owns;
    }
    const text = String(body || '').replace(/<[^>]+>/g, ' ').replace(/\s+/g, ' ').trim();
    const m = text.match(/(?:Overview[^.]*\.\s*)?([^.]{20,120}\.)/);
    return m ? m[1] : (text.slice(0, 96) + (text.length > 96 ? '…' : ''));
  }

  function guideContractStats() {
    const tabs = new Set(PAGE_CONTRACT.map(r => r[1]).filter(t => t !== 'no-tab'));
    const owning = PAGE_CONTRACT.filter(r => r[2] && !/^Nothing/i.test(r[2])).length;
    const derived = PAGE_CONTRACT.filter(r => r[2] && /^Nothing/i.test(r[2])).length;
    const cls = guidePrintClassCounts();
    const printables = PAGE_CONTRACT.filter(r => /class [ab]/i.test(r[5])).length;
    return { pages: PAGE_CONTRACT.length, tabs: tabs.size, owning, derived, printables, classA: cls.a, classB: cls.b };
  }

  function renderGuideAccordion() {
    const host = document.getElementById('guide-accordion');
    if (!host || typeof PAGE_GUIDE === 'undefined') return;
    const filter = window._guideFilterTab || 'all';
    const filterMap = {
      overview: 'Overview', planning: 'Planning', people: 'People', money: 'Money',
      vendors: 'Vendors', theday: 'The Day', covenant: 'Covenant', documents: 'Documents'
    };
    const expanded = window._guideExpanded || new Set();
    let entries = PAGE_GUIDE.map((entry, i) => ({ entry: entry, i: i }));
    if (window._guideSortTab) {
      entries.sort((a, b) => {
        const ta = guideTabLabel(a.entry[1], a.entry[0]);
        const tb = guideTabLabel(b.entry[1], b.entry[0]);
        return ta.localeCompare(tb) || a.entry[0].localeCompare(b.entry[0]);
      });
    }
    let html =
      '<div class="rd-guide-acc-head">' +
      '<span class="rd-guide-acc-head__sp"></span>' +
      '<span class="rd-guide-acc-head__page">Page</span>' +
      '<span class="rd-guide-acc-head__tab">Tab</span>' +
      '<span class="rd-guide-acc-head__does">What it does</span></div>';
    entries.forEach(({ entry, i }) => {
      const title = entry[0];
      const cat = entry[1];
      const body = entry[2];
      const tab = guideTabLabel(cat, title);
      if (filter !== 'all' && filterMap[filter] && tab !== filterMap[filter]) return;
      const row = contractForPage(title);
      const oneLine = guideDoesLine(title, body, row);
      const isOpen = expanded.has(i);
      html +=
        '<div class="rd-guide-acc-item' + (isOpen ? ' is-open' : '') + '">' +
        '<button type="button" class="rd-guide-acc-row" onclick="rdGuideToggleEntry(' + i + ')">' +
        '<span class="rd-guide-acc-caret" aria-hidden="true">' + (isOpen ? '▾' : '▸') + '</span>' +
        '<span class="rd-guide-acc-page">' + esc(title) + '</span>' +
        '<span class="rd-guide-acc-tab">' + esc(tab) + '</span>' +
        '<span class="rd-guide-acc-does">' + esc(oneLine) + '</span></button>';
      if (isOpen) {
        const syncItems = row && row[4] && row[4] !== '—'
          ? row[4].split(',').map(s => s.trim()).filter(Boolean) : [];
        html +=
          '<div class="rd-guide-acc-detail">' +
          '<div><div class="rd-guide-acc-k">What it does</div><p>' + esc(oneLine) + '</p></div>' +
          '<div><div class="rd-guide-acc-k">What syncs</div>' +
          (syncItems.length
            ? '<div class="rd-guide-acc-syncs">' + syncItems.map(s =>
              '<div class="rd-guide-acc-sync"><span>' + esc(s) + '</span></div>').join('') + '</div>'
            : '<p class="rd-guide-acc-empty">—</p>') +
          '</div><div><div class="rd-guide-acc-k">When to use it</div><div class="rd-guide-acc-when">' + body + '</div></div></div>';
      }
      html += '</div>';
    });
    host.innerHTML = html;
    host.className = 'rd-guide-accordion';
  }

  function renderGuide() {
    const panel = ensureHead('panel-guide', 'Overview · start planning',
      'Page-by-Page Guide', 'Open Get Started', "typeof showPanel==='function'&&showPanel('instructions',true)",
      '<button type="button" class="rd-btn" onclick="rdGuideExpandAll()">Expand all</button>' +
      '<button type="button" class="rd-btn" onclick="typeof printActivePanel===\'function\'&&printActivePanel()">Print guide</button>' +
      '<button type="button" class="rd-btn" onclick="typeof rdOpenFullEditor===\'function\'&&rdOpenFullEditor()">Full editor</button>' +
      '<button type="button" class="rd-btn" onclick="typeof printActivePanel===\'function\'&&printActivePanel()">Print the guide</button>');
    if (!panel) return;
    let host = panel.querySelector('#rd-guide-viewhost');
    if (!host) {
      const bar = document.createElement('div');
      bar.className = 'rd-toolbar rd-guide-toolbar';
      bar.id = 'rd-guide-toolbar';
      const accordion = panel.querySelector('#guide-accordion');
      host = document.createElement('div');
      host.id = 'rd-guide-viewhost';
      /* Keep the existing accordion as the Entries view, wrapped so we can
         toggle it against the Table/Print views. */
      const entries = document.createElement('div');
      entries.id = 'rd-guide-entries';
      entries.className = 'rd-guide-view';
      if (accordion && accordion.parentElement) {
        const card = accordion.closest('.inst-card') || accordion.parentElement;
        entries.appendChild(card);
      }
      const table = document.createElement('div');
      table.id = 'rd-guide-table'; table.className = 'rd-guide-view'; table.hidden = true;
      const printv = document.createElement('div');
      printv.id = 'rd-guide-print'; printv.className = 'rd-guide-view'; printv.hidden = true;
      host.appendChild(entries); host.appendChild(table); host.appendChild(printv);
      const head = panel.querySelector('.rd-guide-pagehead');
      if (head) panel.insertBefore(bar, head.nextSibling);
      if (bar.nextSibling) panel.insertBefore(host, bar.nextSibling); else panel.appendChild(host);
    }
    renderGuideToolbar();
    applyGuideView();
    if (typeof renderPageGuide === 'function') renderPageGuide();
    renderGuideAccordion();
    renderGuideTable();
    renderGuidePrint();
    renderGuideDrawer();
    if (typeof renderContextSidebar === 'function') renderContextSidebar('guide');
  }

  function guidePrintClassCounts() {
    let a = 0;
    let b = 0;
    PAGE_CONTRACT.forEach(r => {
      if (/class a/i.test(r[5])) a++;
      else if (/class b/i.test(r[5])) b++;
    });
    return { a: a, b: b };
  }

  function renderGuideToolbar() {
    const bar = document.getElementById('rd-guide-toolbar');
    if (!bar) return;
    const v = window._guideView || 'entries';
    const cls = guidePrintClassCounts();
    const stats = guideContractStats();
    bar.innerHTML =
      '<div class="rd-guide-toolbar__left">' +
      (v === 'entries'
        ? '<div class="rd-guide-filterrow">' +
          '<span class="rd-guide-filterchip">Tab: all</span>' +
          '<span class="rd-guide-filterchip">Type: all</span>' +
          '<button type="button" class="rd-guide-sortlink" onclick="rdGuideSortTab()">Sort by tab</button>' +
          '</div>'
        : v === 'table'
          ? '<div class="rd-guide-filterrow">' +
            '<span class="rd-guide-filterchip">Tab: all</span>' +
            '<span class="rd-guide-filterchip">Prints: all</span>' +
            '<button type="button" class="rd-guide-filterchip' + (document.getElementById('panel-guide')?.classList.contains('rd-guide-owning') ? ' is-on' : '') + '" onclick="rdGuideToggleOwnership()">Show ownership</button>' +
            '<button type="button" class="rd-guide-sortlink" onclick="rdGuideSortTab()">Sort by tab order</button>' +
            '<span class="rd-guide-filtermeta">' + stats.classA + ' class A · ' + stats.classB + ' class B</span>' +
            '</div>'
          : '<span class="rd-guide-count">' + PAGE_CONTRACT.length + ' pages · only one page owns any given field</span>') +
      '</div>' +
      '<div class="rd-toolbar__right">' +
      (v === 'table'
        ? '<button type="button" class="rd-btn rd-btn--quiet" onclick="rdGuideExportMap()">Export the map</button>'
        : '') +
      '<div class="rd-viewswitch" role="group" aria-label="Guide view">' +
      '<button type="button" class="rd-viewswitch__item' + (v === 'entries' ? ' is-active' : '') + '" onclick="rdGuideSetView(\'entries\')">Accordion</button>' +
      '<button type="button" class="rd-viewswitch__item' + (v === 'table' ? ' is-active' : '') + '" onclick="rdGuideSetView(\'table\')">Table</button>' +
      '<button type="button" class="rd-viewswitch__item' + (v === 'print' ? ' is-active' : '') + '" onclick="rdGuideSetView(\'print\')">Print view</button>' +
      '</div></div>';
  }
  function applyGuideView() {
    const v = window._guideView || 'entries';
    [['entries', 'rd-guide-entries'], ['table', 'rd-guide-table'], ['print', 'rd-guide-print']].forEach(([name, id]) => {
      const el = document.getElementById(id);
      if (el) el.hidden = name !== v;
    });
  }
  function guideTableRows() {
    if (!window._guideSortTab) return PAGE_CONTRACT;
    return PAGE_CONTRACT.slice().sort((a, b) => a[1].localeCompare(b[1]) || a[0].localeCompare(b[0]));
  }

  function renderGuideTable() {
    const host = document.getElementById('rd-guide-table');
    if (!host) return;
    const rows = guideTableRows();
    const stats = guideContractStats();
    let html =
      '<div class="rd-guide-stats">' +
      statCell('Pages', stats.pages) +
      statCell('Tabs', stats.tabs) +
      statCell('Pages that own data', stats.owning) +
      statCell('Derived views', stats.derived, 'own nothing') +
      statCell('Printables', stats.printables, stats.classA + ' class A · ' + stats.classB + ' class B') +
      '</div>' +
      '<div class="rd-guide-table-head"><div><strong>Every page, one row</strong>' +
      '<span>' + PAGE_CONTRACT.length + ' pages · what each owns versus what it borrows · A = working print, B = keepsake</span></div>' +
      '<button type="button" class="rd-setup-band__link" onclick="rdGuideExportMap()">Export the map</button></div>' +
      '<div class="ued-table-wrap rd-guide-table-wrap"><table class="rd-guide-contract rd-guide-contract--map"><thead><tr>' +
      '<th class="rd-guide-th-page">Page</th><th>Tab</th><th class="rd-guide-th-owns">Owns</th><th>Reads from</th><th>Feeds</th><th>Prints</th>' +
      '</tr></thead><tbody>';
    rows.forEach((row, i) => {
      const srcIdx = PAGE_CONTRACT.indexOf(row);
      html += '<tr class="rd-guide-crow" onclick="rdGuideOpenEntry(' + srcIdx + ')">' +
        '<td class="rd-guide-cpage">' + esc(row[0]) + '</td>' +
        '<td>' + esc(row[1] === 'no-tab' ? 'Overview' : row[1]) + '</td>' +
        '<td class="rd-guide-owns">' + esc(row[2]) + '</td>' +
        '<td>' + esc(row[3]) + '</td>' +
        '<td>' + esc(row[4]) + '</td>' +
        '<td>' + esc(row[5]) + '</td>' +
        '</tr>';
    });
    html += '</tbody></table></div>' +
      '<p class="rd-help rd-guide-tablenote">The most common misuse is typing a number into a page that only reads it. The <b>Owns</b> column names the one page that may.</p>';
    host.innerHTML = html;
  }
  function statCell(label, value, sub) {
    return '<div class="rd-guide-stat"><div class="rd-guide-stat__k">' + esc(label) + '</div>' +
      '<div class="rd-guide-stat__v">' + esc(String(value)) + '</div>' +
      (sub ? '<div class="rd-guide-stat__sub">' + esc(sub) + '</div>' : '') +
      '</div>';
  }
  function renderGuidePrint() {
    const host = document.getElementById('rd-guide-print');
    if (!host) return;
    const byTab = {};
    PAGE_CONTRACT.forEach(r => { (byTab[r[1]] = byTab[r[1]] || []).push(r); });
    let html = '<div class="rd-guide-printsheet"><div class="rd-guide-printsheet__head">' +
      '<span>Page-by-Page Guide</span><span>Class A · working reference · grouped by tab · one line per page</span></div>';
    Object.keys(byTab).sort().forEach(tab => {
      html += '<div class="rd-guide-printgroup"><h4>' + esc(tab) + ' <span class="rd-guide-printcount">· ' + byTab[tab].length + ' pages</span></h4>';
      byTab[tab].forEach(r => {
        html += '<div class="rd-guide-printrow"><b>' + esc(r[0]) + '</b><span>Owns ' + esc(r[2]) + '</span></div>';
      });
      html += '</div>';
    });
    html += '<div class="rd-guide-printfoot">Printed ' + new Date().toLocaleDateString('en-GB', { day: 'numeric', month: 'long', year: 'numeric' }) + '</div>';
    html += '</div>';
    host.innerHTML = html;
  }

  /* Guide-entry drawer (Entry · Steps · Links · History). */
  function renderGuideDrawer() {
    let slot = document.getElementById('rd-guide-drawer');
    const panel = document.getElementById('panel-guide');
    if (!panel) return;
    if (!slot) { slot = document.createElement('div'); slot.id = 'rd-guide-drawer'; panel.appendChild(slot); }
    const i = window._guideDrawer;
    const row = (i == null) ? null : PAGE_CONTRACT[i];
    if (!row) { slot.innerHTML = ''; slot.classList.remove('is-open'); return; }
    const tab = Math.max(0, Math.min(DRAWER_TABS.length - 1, parseInt(window._guideDrawerTab, 10) || 0));
    const entry = (typeof PAGE_GUIDE !== 'undefined') ? PAGE_GUIDE.find(e => String(e[0] || '').toLowerCase() === row[0].toLowerCase()) : null;
    let body = '';
    if (tab === 0) {
      body = '<div class="rd-drawer__field"><span>Page</span><strong>' + esc(row[0]) + '</strong></div>' +
        '<div class="rd-drawer__field"><span>Tab</span><strong>' + esc(row[1]) + '</strong></div>' +
        (entry && entry[2] ? '<div class="rd-guide-rich">' + entry[2] + '</div>'
          : '<p class="rd-drawer__note">Help text is a record like any other — one entry of the Page-by-Page Guide, opened for editing.</p>');
    } else if (tab === 1) {
      body = '<div class="rd-drawer__section-title">First three things to do here</div>' +
        '<ol class="rd-guide-steps"><li>Open ' + esc(row[0]) + ' from the ' + esc(row[1]) + ' tab.</li>' +
        '<li>Fill only what this page <b>owns</b>: ' + esc(row[2]) + '.</li>' +
        '<li>Everything else is read from ' + esc(row[3] === '—' ? 'nowhere — it stands alone' : row[3]) + '.</li></ol>';
    } else if (tab === 2) {
      body = '<div class="rd-drawer__field"><span>Feeds</span><strong>' + esc(row[4]) + '</strong></div>' +
        '<div class="rd-drawer__field"><span>Prints</span><strong>' + esc(row[5]) + '</strong></div>' +
        '<button type="button" class="rd-btn" onclick="rdGuideCloseDrawer();typeof showPanel===\'function\'&&showPanel(\'faq\',true)">Related FAQ answers →</button>';
    } else {
      body = '<div class="rd-drawer__hist"><strong>—</strong> · Planner<div>Guide entry written</div></div>' +
        '<p class="rd-drawer__note">Edits to the help text are logged, because out-of-date help is worse than none.</p>';
    }
    slot.classList.add('is-open');
    slot.innerHTML =
      '<div class="rd-guide-drawer__scrim" onclick="rdGuideCloseDrawer()"></div>' +
      '<aside class="rd-drawer rd-guide-drawer" aria-label="Guide entry">' +
      '<div class="rd-drawer__head">' +
      '<button type="button" class="rd-drawer__close" onclick="rdGuideCloseDrawer()" aria-label="Close">×</button>' +
      '<div class="rd-drawer__eyebrow">Guide entry</div>' +
      '<h2 class="rd-drawer__title">' + esc(row[0]) + '</h2>' +
      '<div class="rd-drawer__tabs" role="tablist">' +
      DRAWER_TABS.map((label, k) => '<button type="button" class="rd-drawer__tab' + (k === tab ? ' is-active' : '') + '" onclick="rdGuideSetDrawerTab(' + k + ')">' + esc(label) + '</button>').join('') +
      '</div></div>' +
      '<div class="rd-drawer__body">' + body + '</div>' +
      '<div class="rd-drawer__foot"><button type="button" class="rd-btn rd-btn--primary" onclick="rdGuideCloseDrawer()">Done</button></div>' +
      '</aside>';
  }

  /* ── FAQ (15c) ───────────────────────────────────────────────────────── */

  function renderFaq() {
    const panel = ensureHead('panel-faq', 'Overview · start planning',
      'FAQ', 'Open Get Started', "typeof showPanel==='function'&&showPanel('instructions',true)",
      '<button type="button" class="rd-btn" onclick="typeof printActivePanel===\'function\'&&printActivePanel()">Print section</button>' +
      '<button type="button" class="rd-btn" onclick="typeof rdOpenFullEditor===\'function\'&&rdOpenFullEditor()">Full editor</button>' +
      '<button type="button" class="rd-btn" onclick="typeof printActivePanel===\'function\'&&printActivePanel()">Print this page</button>');
    if (!panel) return;
    panel.querySelectorAll('.faq-title-wrap').forEach(el => el.classList.add('rd-guide-legacy-hide'));
    const search = panel.querySelector('.faq-search-wrap');
    const cat = panel.querySelector('#faq-cat-bar');
    let layout = panel.querySelector('.rd-faq-layout');
    const list = panel.querySelector('#faq-list');
    const aside = panel.querySelector('.faq-side');
    if (!layout && list) {
      layout = document.createElement('div');
      layout.className = 'rd-faq-layout';
      list.parentElement.insertBefore(layout, list);
      layout.appendChild(list);
    }
    if (layout && aside && !layout.contains(aside)) layout.appendChild(aside);
    if (aside) {
      aside.classList.remove('rd-guide-legacy-hide');
      aside.innerHTML =
        '<div class="rd-faq-quick rd-faq-quick--master">' +
        '<div class="rd-faq-quick__head"><div class="rd-faq-quick__title">Quick answers</div>' +
        '<div class="rd-faq-quick__subtitle">The five things everyone asks</div></div>' +
        FAQ_QUICK.map(q =>
          '<div class="rd-faq-quick__item rd-faq-quick__item--check">' +
          '<span class="rd-faq-quick__icon" aria-hidden="true">✓</span>' +
          '<div><b>' + esc(q[0]) + '</b><p>' + esc(q[1]) + '</p></div></div>').join('') +
        '<div class="rd-faq-quick__stuck">' +
        '<div class="rd-faq-quick__title">Still stuck</div>' +
        '<div class="rd-faq-quick__links">' +
        '<button type="button" class="rd-setup-band__link" onclick="typeof showPanel===\'function\'&&showPanel(\'instructions\',true)">Read Get Started →</button>' +
        '<button type="button" class="rd-setup-band__link" onclick="typeof showPanel===\'function\'&&showPanel(\'guide\',true)">Open the Page-by-Page Guide →</button>' +
        '<button type="button" class="rd-setup-band__link" onclick="typeof showPanel===\'function\'&&showPanel(\'datahub\',true)">Check the Database Hub for broken links →</button>' +
        '<button type="button" class="rd-setup-band__link" onclick="typeof openFooterConnect===\'function\'&&openFooterConnect(\'support\')">Contact support →</button>' +
        '</div></div></div>';
    }
    if (typeof renderFAQ === 'function') renderFAQ();
    if (typeof renderContextSidebar === 'function') renderContextSidebar('faq');
  }

  /* ── actions ─────────────────────────────────────────────────────────── */

  function rdGuideExportMap() {
    const rows = [['Page', 'Tab', 'Owns', 'Reads from', 'Feeds', 'Prints']]
      .concat(PAGE_CONTRACT.map(r => r.slice()));
    const csv = rows.map(r => r.map(c => '"' + String(c).replace(/"/g, '""') + '"').join(',')).join('\n');
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8' });
    const a = document.createElement('a');
    a.href = URL.createObjectURL(blob);
    a.download = 'page-by-page-guide-map.csv';
    a.click();
    URL.revokeObjectURL(a.href);
    if (typeof showToast === 'function') showToast('Guide map exported.');
  }
  function rdGuideToggleOwnership() {
    document.getElementById('panel-guide')?.classList.toggle('rd-guide-owning');
    renderGuideToolbar();
    if (typeof showToast === 'function') showToast('Owns column highlighted.');
  }
  function rdGuideSortTab() {
    window._guideSortTab = !window._guideSortTab;
    renderGuideTable();
    renderGuideAccordion();
    if (typeof showToast === 'function') showToast(window._guideSortTab ? 'Sorted by tab order.' : 'Default order restored.');
  }
  function rdGuideToggleEntry(i) {
    const set = window._guideExpanded || new Set();
    if (set.has(i)) set.delete(i); else set.add(i);
    window._guideExpanded = set;
    renderGuideAccordion();
  }
  function rdGuideExpandAll() {
    if (typeof PAGE_GUIDE === 'undefined') return;
    window._guideExpanded = new Set(PAGE_GUIDE.map((_, i) => i));
    renderGuideAccordion();
    if (typeof showToast === 'function') showToast('All guide entries expanded.');
  }
  function rdGuideFilterRail(sectionId) {
    if (sectionId === 'started' && typeof showPanel === 'function') { showPanel('instructions', true); return; }
    if (sectionId === 'faq' && typeof showPanel === 'function') { showPanel('faq', true); return; }
    if (sectionId === 'setup' && typeof showPanel === 'function') { showPanel('setup', true); return; }
    window._guideFilterTab = sectionId;
    window._railToc_guide = sectionId;
    renderGuideAccordion();
    if (typeof renderContextSidebar === 'function') renderContextSidebar('guide');
  }

  function rdGuideBackup() {
    if (typeof downloadSqliteBackup === 'function') downloadSqliteBackup();
    else if (typeof exportData === 'function') exportData();
    else if (typeof showToast === 'function') showToast('Use Backup in the top bar to download a copy.');
  }
  function rdGuideSetView(v) { window._guideView = v; renderGuideToolbar(); applyGuideView(); }
  function rdGuideOpenEntry(i) { window._guideDrawer = i; window._guideDrawerTab = 0; renderGuideDrawer(); }
  function rdGuideCloseDrawer() { window._guideDrawer = null; const s = document.getElementById('rd-guide-drawer'); if (s) { s.innerHTML = ''; s.classList.remove('is-open'); } }
  function rdGuideSetDrawerTab(k) { window._guideDrawerTab = k; renderGuideDrawer(); }

  window.rdGuideExportMap = rdGuideExportMap;
  window.rdGuideToggleEntry = rdGuideToggleEntry;
  window.rdGuideExpandAll = rdGuideExpandAll;
  window.rdGuideFilterRail = rdGuideFilterRail;
  window.rdGuideToggleOwnership = rdGuideToggleOwnership;
  window.rdGuideSortTab = rdGuideSortTab;
  window.rdGuideBackup = rdGuideBackup;
  window.rdGuideSetView = rdGuideSetView;
  window.rdGuideOpenEntry = rdGuideOpenEntry;
  window.rdGuideCloseDrawer = rdGuideCloseDrawer;
  window.rdGuideSetDrawerTab = rdGuideSetDrawerTab;
  window.renderGuideRd = renderGuide;
  window.renderGetStartedRd = renderGetStarted;
  window.renderFaqRd = renderFaq;

  function decorate(id) {
    if (id === 'instructions') renderGetStarted();
    else if (id === 'guide') renderGuide();
    else if (id === 'faq') renderFaq();
  }
  function hook() {
    if (window.SYSTEM_PANEL_RENDERERS) {
      ['instructions', 'guide', 'faq'].forEach(id => {
        const prev = window.SYSTEM_PANEL_RENDERERS[id];
        window.SYSTEM_PANEL_RENDERERS[id] = function () {
          if (typeof prev === 'function') { try { prev.apply(this, arguments); } catch (e) { /* keep going */ } }
          decorate(id);
        };
      });
    }
  }
  hook();
  var _showPanelGuide = window.showPanel;
  if (typeof _showPanelGuide === 'function') {
    window.showPanel = function (id, forceOpen) {
      var out = _showPanelGuide.call(window, id, forceOpen);
      hook();
      if (id === 'instructions' || id === 'guide' || id === 'faq') {
        requestAnimationFrame(function () { decorate(id); });
      }
      return out;
    };
  }
})();
