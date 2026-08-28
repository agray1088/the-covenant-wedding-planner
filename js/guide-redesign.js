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
    ['Is my data saved?', 'Yes — automatically, in this browser. Download a backup from Get Started to keep a copy or move devices.'],
    ['How do I move to a new device?', 'Download a backup here, then Restore it on the other device from Wedding Setup.'],
    ['Why can’t I edit this number?', 'It is derived — another page owns it. The Page-by-Page Guide names the owner of every field.'],
    ['How do I print a clean copy?', 'Every page has Print section; the Print Centre collects the whole day-of pack.'],
    ['Who can see a share link?', 'Only people you send it to, until you revoke it. Covenant pages are never shared.']
  ];

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

  function renderGetStarted() {
    const panel = ensureHead('panel-instructions', 'Overview · start planning',
      'Get Started', 'Download backup', 'rdGuideBackup()',
      '<button type="button" class="rd-btn" onclick="typeof showPanel===\'function\'&&showPanel(\'guide\',true)">Open the guide</button>' +
      '<button type="button" class="rd-btn" onclick="typeof printActivePanel===\'function\'&&printActivePanel()">Print section</button>');
    if (!panel) return;
    panel.querySelectorAll('.inst-title-wrap, .inst-grid-3, .inst-wide-row, .inst-partner-handoff, .inst-welcome, #start-here-card').forEach(el => {
      el.classList.add('rd-guide-legacy-hide');
    });
    if (!panel.querySelector('#rd-guide-backupwarn')) {
      const warn = document.createElement('div');
      warn.id = 'rd-guide-backupwarn';
      warn.className = 'rd-guide-backupwarn';
      warn.innerHTML =
        '<div><strong>Everything saves in this browser only.</strong>' +
        '<p>Clear the site data or lose the device and the plan is gone. Download a <code>.sqlite</code> backup now, and again after every big session — it is the one step nothing else can undo.</p></div>' +
        '<button type="button" class="rd-btn rd-btn--primary" onclick="rdGuideBackup()">Download backup</button>';
      const head = panel.querySelector('.rd-guide-pagehead');
      if (head && head.nextSibling) panel.insertBefore(warn, head.nextSibling);
      else panel.appendChild(warn);
    }
    buildGetStartedBody(panel);
  }

  function buildGetStartedBody(panel) {
    if (panel.querySelector('#rd-getstarted-body')) return;
    const d = (typeof getCovenantPlannerData === 'function') ? getCovenantPlannerData() : (window.data || {});
    const guests = Array.isArray(d.guests) ? d.guests.length : 0;
    const target = parseInt((d.setup && d.setup.guests) || 0, 10) || 0;
    const steps = [
      ['Fill in Wedding Setup', 'Names, date, venues, budget, guest target', !!(d.setup && d.setup.bride && d.setup.date)],
      ['Download your first backup', 'Before typing anything else', false],
      ['Add your households', 'Addresses first, guests follow', Array.isArray(d.households) && d.households.length > 0],
      ['Set the budget target and categories', 'Eight categories, one target', Array.isArray(d.budget) && d.budget.length > 0],
      ['Enter the guest list', (target ? target + ' to go' : 'Guests') + ' · ' + guests + ' entered', guests > 0, 'guests'],
      ['Book the venue and log the contract', 'Venue & Vendors', Array.isArray(d.vendors) && d.vendors.some(v => /book/i.test(String(v.status || '')))],
      ['Print the day-of pack', 'Nine documents, one job', false, 'print']
    ];
    const done = steps.filter(s => s[2]).length;
    let stepsHtml = '';
    steps.forEach((s, i) => {
      const isDone = s[2];
      const isNext = !isDone && steps.slice(0, i).every(x => x[2]);
      stepsHtml +=
        '<div class="rd-step' + (isDone ? ' is-done' : '') + '">' +
        '<span class="rd-step__chip' + (isDone ? ' rd-step__chip--done' : '') + '">' + (isDone ? '✓' : '') + '</span>' +
        '<span class="rd-step__num">' + String(i + 1).padStart(2, '0') + '</span>' +
        '<span class="rd-step__title' + (isDone ? ' rd-step__title--done' : '') + '">' + esc(s[0]) + '</span>' +
        '<span class="rd-step__desc rd-step__detail">' + esc(s[1]) + '</span>' +
        (isNext && s[3] === 'guests' ? '<button type="button" class="rd-btn rd-btn--primary rd-step__cta" onclick="typeof showPanel===\'function\'&&showPanel(\'guests\',true)">Start</button>' : '') +
        (isNext && s[3] === 'print' ? '<button type="button" class="rd-btn rd-btn--primary rd-step__cta" onclick="typeof showPanel===\'function\'&&showPanel(\'print\',true)">Print</button>' : '') +
        '</div>';
    });
    const host = document.createElement('div');
    host.id = 'rd-getstarted-body';
    host.className = 'rd-getstarted-body';
    host.innerHTML =
      '<div class="rd-getstarted-hero">' +
      '<div class="rd-getstarted-hero__main">' +
      '<div class="rd-getstarted-hero__rule"></div>' +
      '<p class="rd-getstarted-lead">This planner runs entirely on your own computer. Everything you type saves automatically to a private database in this browser. Nothing is uploaded, and nothing is kept anywhere else unless you download a backup yourself.</p>' +
      '<p class="rd-getstarted-sub">That is the whole promise of the product, and it is also the one risk. Read the backup warning above before you type anything you would be upset to lose.</p>' +
      '</div>' +
      '<aside class="rd-getstarted-readfirst">' +
      '<div class="rd-getstarted-readfirst__k">Read this first</div>' +
      '<p>If you clear your browser history, cookies or site data — or open the planner on another device without restoring a backup — <strong>your saved work will not be there.</strong></p>' +
      '<p class="rd-getstarted-readfirst__note">Wait a few seconds after opening the planner before your first backup, so the database finishes loading.</p>' +
      '<div class="rd-getstarted-readfirst__actions">' +
      '<button type="button" class="rd-btn rd-btn--primary" onclick="rdGuideBackup()">Download backup</button>' +
      '<button type="button" class="rd-btn" onclick="rdSetupRestore()">Restore</button></div></aside></div>' +
      '<div class="rd-setup-band"><div class="rd-setup-band__head"><span>How the planner connects</span>' +
      '<span class="rd-setup-band__meta">Six links that mean you never type the same detail twice</span>' +
      '<button type="button" class="rd-setup-band__link" onclick="typeof showPanel===\'function\'&&showPanel(\'datahub\',true)">Open the Database Hub</button></div>' +
      '<div class="rd-grid-3 rd-getstarted-concepts">' +
      conceptCard('01', 'Setup personalises everything', 'Your names, date, venues, budget and time zone feed the Dashboard, the countdown, the calendar and every printable.', 'Wedding Setup → 31 pages') +
      conceptCard('02', 'Money flows one direction', 'Payments feed Budget. Catering creates managed budget lines. Contracts carry their own instalments.', 'Payments → Budget') +
      conceptCard('03', 'People fan outward', 'Guest List feeds Table Layout, catering headcount, meal counts, the calendar, share packets and the wedding party.', 'Guest List → 7 pages') +
      conceptCard('04', 'Dates gather in one place', 'Tasks, appointments, payments and timeline items all appear together in Month, Week and Agenda views.', '5 sources → Smart Calendar') +
      conceptCard('05', 'Data health watches the joins', 'The Dashboard flags a payment with no vendor, a guest on a deleted table, or a calendar item whose source is gone.', '6 checks · open alerts') +
      conceptCard('06', 'Covenant pages sit alongside', 'Vision, Prayer Journal, Counseling and Marriage Rhythms are part of the plan, not an appendix to it.', '4 pages · Class B print') +
      '</div></div>' +
      '<div class="rd-getstarted-split">' +
      '<section class="rd-getstarted-panel"><div class="rd-setup-band__head"><span>Editing &amp; navigation</span><span class="rd-setup-band__meta">How to use the planner like a workbook</span></div>' +
      '<div class="rd-getstarted-panel__body">' +
      tipBlock('Two ways to edit a record', 'Click a row to open the side drawer for a quick change, or Full editor for all the fields at once. Both write to the same record.') +
      tipBlock('Tables edit in place', 'Type in a cell, tick rows for bulk edits, and use the last row to add. Long text wraps and can be dragged taller.') +
      tipBlock('Focus when it feels big', 'Profile &amp; Display → Focus on essentials hides advanced pages without deleting anything.') +
      tipBlock('Undo, redo and the change log', '<b>Planner History</b> keeps a day-by-day log of what changed — view-only, so it tells you what happened without offering to roll back.') +
      '</div></section>' +
      '<section class="rd-getstarted-panel"><div class="rd-setup-band__head"><span>Planning with your partner</span><span class="rd-setup-band__meta">No account, no cloud — three files</span>' +
      '<button type="button" class="rd-setup-band__link" onclick="typeof showPanel===\'function\'&&showPanel(\'packets\',true)">Open Share Packets</button></div>' +
      '<div class="rd-getstarted-panel__body"><div class="rd-partner-flow">' +
      '<div><div class="rd-partner-flow__k">You</div><div>Download backup</div><code>.sqlite</code></div>' +
      '<div><div class="rd-partner-flow__k">Partner</div><div>Restores it</div><code>same file</code></div>' +
      '<div><div class="rd-partner-flow__k">Partner</div><div>Sends one back</div><code>.sqlite</code></div>' +
      '<div><div class="rd-partner-flow__k">You</div><div>Import packet</div><code>merges</code></div>' +
      '</div><p class="rd-getstarted-partner-note">A partner packet merges RSVP updates and new tasks — it never deletes what you already have.</p></div></section></div>' +
      '<div class="rd-setup-band"><div class="rd-setup-band__head"><span>What this planner cannot do</span><span class="rd-setup-band__meta">Said plainly, so it is not discovered late</span></div>' +
      '<div class="rd-getstarted-cannot">' +
      cannotCard('It cannot send email', 'No invitations, no RSVP reminders, no vendor mail. Email Templates writes the letters and you send them from your own mail app.') +
      cannotCard('It cannot collect RSVPs', 'There is no web form. Replies are entered on the Guest List by whoever hears them.') +
      cannotCard('It cannot sync between devices', 'Two devices means two planners. The backup file is the only bridge.') +
      cannotCard('It cannot recover a cleared browser', 'If site data goes without a backup, the planner is gone. This is the only unrecoverable failure.') +
      '</div></div>' +
      '<div class="rd-setup-band"><div class="rd-setup-band__head"><span>Your first hour</span>' +
      '<span class="rd-setup-band__meta">Seven steps · ' + done + ' done</span>' +
      (done < 7 ? '<span class="rd-setup-band__link">Continue at step ' + (done + 1) + '</span>' : '') +
      '</div><div class="rd-steps">' + stepsHtml + '</div></div>';
    const warn = panel.querySelector('#rd-guide-backupwarn');
    if (warn && warn.nextSibling) panel.insertBefore(host, warn.nextSibling);
    else panel.appendChild(host);
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

  function renderGuide() {
    const panel = ensureHead('panel-guide', 'Overview · start planning',
      'Page-by-Page Guide', 'Open Get Started', "typeof showPanel==='function'&&showPanel('instructions',true)",
      '<button type="button" class="rd-btn" onclick="typeof printActivePanel===\'function\'&&printActivePanel()">Print section</button>');
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
    renderGuideTable();
    renderGuidePrint();
    renderGuideDrawer();
  }

  function renderGuideToolbar() {
    const bar = document.getElementById('rd-guide-toolbar');
    if (!bar) return;
    const v = window._guideView || 'entries';
    bar.innerHTML =
      '<span class="rd-guide-count">' + PAGE_CONTRACT.length + ' pages · only one page owns any given field</span>' +
      '<div class="rd-toolbar__right"><div class="rd-viewswitch" role="group" aria-label="Guide view">' +
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
  function renderGuideTable() {
    const host = document.getElementById('rd-guide-table');
    if (!host) return;
    let html = '<div class="rd-guide-table-head"><div><strong>Every page, one row</strong>' +
      '<span>' + PAGE_CONTRACT.length + ' pages · what each owns versus what it borrows</span></div></div>' +
      '<div class="ued-table-wrap rd-guide-table-wrap"><table class="rd-guide-contract"><thead><tr>' +
      '<th class="rd-guide-th-page">Page</th><th>Tab</th><th class="rd-guide-th-owns">Owns</th><th>Reads from</th><th>Feeds</th><th>Prints</th>' +
      '</tr></thead><tbody>';
    PAGE_CONTRACT.forEach((row, i) => {
      html += '<tr class="rd-guide-crow" onclick="rdGuideOpenEntry(' + i + ')">' +
        '<td class="rd-guide-cpage">' + esc(row[0]) + '</td>' +
        '<td>' + esc(row[1]) + '</td>' +
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
      '<button type="button" class="rd-btn" onclick="typeof printActivePanel===\'function\'&&printActivePanel()">Print section</button>');
    if (!panel) return;
    panel.querySelectorAll('.faq-title-wrap, .faq-side').forEach(el => el.classList.add('rd-guide-legacy-hide'));
    if (!panel.querySelector('.rd-faq-layout')) {
      const search = panel.querySelector('.faq-search-wrap');
      const cat = panel.querySelector('#faq-cat-bar');
      const list = panel.querySelector('#faq-list');
      const layout = document.createElement('div');
      layout.className = 'rd-faq-layout';
      if (list && list.parentElement) {
        list.parentElement.insertBefore(layout, list);
        layout.appendChild(list);
      }
    }
    if (!panel.querySelector('#rd-faq-quick')) {
      const aside = document.createElement('aside');
      aside.id = 'rd-faq-quick';
      aside.className = 'rd-faq-quick';
      aside.innerHTML = '<div class="rd-faq-quick__title">Quick answers</div>' +
        FAQ_QUICK.map(q => '<div class="rd-faq-quick__item"><b>' + esc(q[0]) + '</b><p>' + esc(q[1]) + '</p></div>').join('') +
        '<p class="rd-faq-quick__note">The five things people ask most. This column is a plain aside — no record is open behind it.</p>';
      const layout = panel.querySelector('.rd-faq-layout');
      if (layout) layout.appendChild(aside);
      else panel.appendChild(aside);
    }
    if (typeof renderContextSidebar === 'function') renderContextSidebar('faq');
  }

  /* ── actions ─────────────────────────────────────────────────────────── */

  function rdGuideBackup() {
    if (typeof downloadSqliteBackup === 'function') downloadSqliteBackup();
    else if (typeof exportData === 'function') exportData();
    else if (typeof showToast === 'function') showToast('Use Backup in the top bar to download a copy.');
  }
  function rdGuideSetView(v) { window._guideView = v; renderGuideToolbar(); applyGuideView(); }
  function rdGuideOpenEntry(i) { window._guideDrawer = i; window._guideDrawerTab = 0; renderGuideDrawer(); }
  function rdGuideCloseDrawer() { window._guideDrawer = null; const s = document.getElementById('rd-guide-drawer'); if (s) { s.innerHTML = ''; s.classList.remove('is-open'); } }
  function rdGuideSetDrawerTab(k) { window._guideDrawerTab = k; renderGuideDrawer(); }

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
