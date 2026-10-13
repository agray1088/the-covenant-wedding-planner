/* ════════════════════════════════════════════════════════════════════════
   HELP PAGES — §07 shells · All.dc 15b (Get Started) · 15d (Page-by-Page
   Guide) · 15c (FAQ). Untabbed — opened from the Help menu / Settings, never
   from a tab. Mocks: Redesign/pages/instructions.html, guide.html, faq.html.
   Mounts: #panel-instructions · #panel-guide · #panel-faq.
   Rails: CONTEXT_BUILDERS.instructions/guide/faq in planner-context-sidebar.js.
   Registers SYSTEM_PANEL_RENDERERS + overrides the legacy renderStartHere() /
   renderPageGuide() / renderFAQ() globals so initAll()'s direct calls (boot,
   before any showPanel) land on these shells too. ════════════════════════ */
(function () {
  'use strict';

  var esc = function (s) {
    return (typeof escapeHtml === 'function') ? escapeHtml(s == null ? '' : String(s)) : String(s == null ? '' : s);
  };
  var arr = function (v) {
    return (typeof safeArray === 'function') ? safeArray(v) : (Array.isArray(v) ? v : []);
  };
  function plannerData() {
    try { if (typeof data !== 'undefined' && data) return data; } catch (e) { /* cross-script let binding */ }
    return {};
  }

  /* ── shared bits ──────────────────────────────────────────────────────── */
  function pageheadHtml(eyebrow, title, actionsHtml) {
    return '<div class="rd-pagehead"><div><div class="rd-pagehead__eyebrow">' + esc(eyebrow) + '</div>' +
      '<h1 class="rd-pagehead__title">' + esc(title) + '</h1></div>' +
      '<div class="rd-pagehead__actions">' + actionsHtml + '</div></div>';
  }
  function sectionHead(eyebrow, help, trailingHtml) {
    return '<div class="rd-section__head"><div class="rd-pagehead__eyebrow">' + esc(eyebrow) + '</div>' +
      '<p class="rd-help">' + esc(help) + '</p>' + (trailingHtml || '') + '</div>';
  }

  /* ════════════════════════════════════════════════════════════════════
     GET STARTED — All.dc 15b. No stats, no toolbar, no bulk, no drawer.
     Rail is a TOC of the six steps (see buildInstructionsContext).
     ════════════════════════════════════════════════════════════════════ */

  function gsHasContract(v) {
    if (!v) return false;
    if (v.contract === true || v.contractSigned) return true;
    return /signed|^yes$|^1$/i.test(String(v.contract || '').trim());
  }

  function gsSteps() {
    var d = plannerData();
    var setup = d.setup || {};
    var guests = arr(d.guests);
    var budget = arr(d.budget);
    var vendors = arr(d.vendors);
    var timeline = arr(d.timeline);
    var party = arr(d.party);
    var vendorsWithContract = vendors.filter(gsHasContract).length;
    return [
      {
        id: 'setup', n: 1, title: 'Name the wedding',
        desc: 'Couple, date and venue. Every printed sheet and the top bar read from it.',
        panel: 'setup', cta: 'Open Wedding Setup',
        done: !!(setup.bride && setup.groom && setup.date),
        detail: (setup.bride && setup.groom) ? (esc(setup.bride) + ' & ' + esc(setup.groom)) : ''
      },
      {
        id: 'guests', n: 2, title: 'Bring your spreadsheet in',
        desc: 'Import your guests before seating, so you are not doing the seating chart twice.',
        panel: 'guests', cta: 'Open Guest List',
        done: guests.length > 0,
        detail: guests.length ? (guests.length + ' guest' + (guests.length === 1 ? '' : 's') + ' imported') : ''
      },
      {
        id: 'budget', n: 3, title: 'Set the money rules',
        desc: 'Whether pledged money counts as income or a cost offset. Changing it later re-derives every category.',
        panel: 'budget', cta: 'Open Budget',
        done: budget.length > 0 || Number(setup.totalBudget) > 0,
        detail: budget.length ? (budget.length + ' categor' + (budget.length === 1 ? 'y' : 'ies') + ' started') : ''
      },
      {
        id: 'vendors', n: 4, title: 'Add your vendors and their contracts',
        desc: 'A vendor without a contract on file has no authoritative total, so the budget stays a guess.',
        panel: 'vendors', cta: 'Open Venue & Vendors',
        done: vendors.length > 0 && vendorsWithContract > 0,
        detail: vendors.length ? (vendorsWithContract + ' of ' + vendors.length + ' have a contract on file') : ''
      },
      {
        id: 'timeline', n: 5, title: 'Build the day',
        desc: 'Run sheet, then the vendor blocks that hang off it. The day drives four printed documents.',
        panel: 'timeline', cta: 'Open Wedding Day Timeline',
        done: timeline.length > 0,
        detail: timeline.length ? (timeline.length + ' event' + (timeline.length === 1 ? '' : 's') + ' on the run sheet') : ''
      },
      {
        id: 'party', n: 6, title: 'Invite the couple and your helpers',
        desc: 'Roles decide what each of them sees. Covenant is granted by the couple, not claimed by you.',
        panel: 'party', cta: 'Open Wedding Party',
        done: party.length > 0,
        detail: party.length ? (party.length + ' helper' + (party.length === 1 ? '' : 's') + ' listed') : ''
      }
    ];
  }
  window.rdGsSteps = gsSteps;

  function gsConcepts() {
    return [
      {
        title: 'Everything is local',
        body: 'Your planner saves to a private SQLite database in this browser, with a localStorage mirror for crash safety. Nothing uploads anywhere — which means backup is your job, not ours.'
      },
      {
        title: 'Pages feed each other',
        body: 'Setup personalizes the whole app. Guests feed Table Layout, catering counts, and the calendar. Payments and Budget stay reconciled automatically, so you rarely type the same number twice.'
      },
      {
        title: 'Nothing sends itself',
        body: 'No email account, no cloud, no vendor marketplace. Email Templates and Share Packets prepare the words — you copy or open them in your own mail app and press send yourself.'
      }
    ];
  }

  function gsPageheadActions() {
    return '<button type="button" class="rd-btn" onclick="showPanel(\'guide\')">Page-by-Page Guide</button>' +
      '<button type="button" class="rd-btn" onclick="window.print()">Print section</button>' +
      '<button type="button" class="rd-btn" onclick="showPanel(\'faq\')">FAQ</button>' +
      '<button type="button" class="rd-btn rd-btn--primary" onclick="loadSampleData()">Load Sample Data</button>';
  }

  function gsStepHtml(step, doneFlags, firstIncompleteN, anyDoneAtAll) {
    var chip = step.done ? '<span class="rd-step__chip rd-step__chip--done" aria-hidden="true">&#10003;</span>'
      : '<span class="rd-step__chip">' + step.n + '</span>';
    var tail;
    if (step.done) {
      tail = '<span class="rd-step__tag rd-step__tag--done">Done</span>';
    } else {
      /* The next actionable step reads "Continue" once anything else is
         already under way; steps not yet reached always read "Start". */
      var label = (step.n === firstIncompleteN && anyDoneAtAll) ? 'Continue' : 'Start';
      tail = '<button type="button" class="rd-btn rd-btn--quiet" onclick="showPanel(\'' + esc(step.panel) + '\')">' + esc(label) + '</button>';
    }
    return '<div class="rd-step' + (step.done ? ' is-done' : '') + '">' + chip +
      '<div class="rd-step__body"><div class="rd-step__title">' + esc(step.title) + '</div>' +
      '<div class="rd-step__desc">' + esc(step.desc) + (step.detail ? ' <span class="rd-step__detail">— ' + esc(step.detail) + '</span>' : '') + '</div></div>' +
      '<div class="rd-step__tail">' + tail + '</div></div>';
  }

  function renderInstructionsRd() {
    var panel = document.getElementById('panel-instructions');
    if (!panel) return;
    var steps = gsSteps();
    var doneFlags = steps.map(function (s) { return s.done; });
    var doneCount = doneFlags.filter(Boolean).length;
    var pct = Math.round((doneCount / steps.length) * 100);
    var d = plannerData();
    var setup = d.setup || {};
    var coupleLine = (setup.bride && setup.groom) ? (esc(setup.bride) + ' &amp; ' + esc(setup.groom)) : 'your wedding';

    var firstIncomplete = steps.filter(function (s) { return !s.done; })[0];
    var firstIncompleteN = firstIncomplete ? firstIncomplete.n : null;
    var stepsHtml = steps.map(function (s) { return gsStepHtml(s, doneFlags, firstIncompleteN, doneCount > 0); }).join('');
    var conceptsHtml = gsConcepts().map(function (c) {
      return '<div class="rd-concept"><h3 class="rd-concept__title">' + esc(c.title) + '</h3>' +
        '<p class="rd-concept__body">' + esc(c.body) + '</p></div>';
    }).join('');

    panel.classList.add('ued-scope');
    panel.innerHTML =
      '<div class="rd-page rd-page--instructions">' +
      pageheadHtml('Help', 'Get Started', gsPageheadActions()) +
      '<div class="rd-surface">' +
        '<div class="rd-prose">' +
          '<p>This page explains how ' + coupleLine + '\u2019s planner works: where the data lives, how the pages connect, and the order that saves the most re-typing later. Nothing on it is a record — it does not hold any of your wedding.</p>' +
        '</div>' +
        '<div class="rd-progressmeter">' +
          '<div class="rd-progressmeter__top"><span>' + doneCount + ' of ' + steps.length + ' steps done</span><span>' + pct + '%</span></div>' +
          '<div class="rd-track"><div class="rd-fill" style="width:' + pct + '%"></div></div>' +
        '</div>' +
        sectionHead('Six steps', 'In the order that saves the most re-typing later.',
          '<button type="button" class="rd-btn rd-btn--quiet" style="margin-left:auto" onclick="showPanel(\'setup\')">Open Wedding Setup</button>') +
        '<div class="rd-steps">' + stepsHtml + '</div>' +
        sectionHead('How the planner thinks', 'Three ideas that explain most of it.', '') +
        '<div class="rd-grid-3">' + conceptsHtml + '</div>' +
        '<div class="rd-grid-2 rd-gs-ctas">' +
          '<div class="rd-cta-card">' +
            '<h3>Want to see a filled-in example first?</h3>' +
            '<p>Load a complete sample wedding — guests, budget, vendors, and a day-of run sheet — to see how every page connects before you start your own.</p>' +
            '<button type="button" class="rd-btn rd-btn--primary" onclick="loadSampleData()">Load Sample Data</button>' +
            '<p class="rd-help">Heads up: loading the sample replaces anything currently in the planner.</p>' +
          '</div>' +
          '<div class="rd-cta-card">' +
            '<h3>Protect your work</h3>' +
            '<p>Everything saves to this browser only. Download a portable <code>.sqlite</code> file before clearing browser data, switching browsers, or moving to another device.</p>' +
            '<button type="button" class="rd-btn rd-btn--primary" onclick="downloadSqliteBackup()">Download Backup</button>' +
            '<p class="rd-help">Wait a few seconds after opening the planner before your first backup, so SQLite finishes loading.</p>' +
          '</div>' +
        '</div>' +
      '</div>' +
      '</div>';
  }

  /* ════════════════════════════════════════════════════════════════════
     PAGE-BY-PAGE GUIDE — All.dc 15d. Table · Print (views 33i/33j).
     ════════════════════════════════════════════════════════════════════ */

  var GUIDE_ROWS = [
    ['Dashboard', 'Overview', 'Card grid', 'Nothing — reads every page'],
    ['Notes', 'Overview', 'List · cards · timeline', 'Note'],
    ['Timeline & Tasks', 'Planning', 'Table, grouped by phase', 'Task'],
    ['Smart Calendar', 'Planning', 'Calendar', 'Nothing — aggregates 12 date sources'],
    ['Appointments', 'Planning', 'Table + calendar', 'Appointment'],
    ['Database Hub', 'Planning', 'Full tables, every column', 'Any record — bulk edit workspace'],
    ['Guest List', 'People', 'Table', 'Guest'],
    ['Households', 'People', 'Grouped list', 'Household'],
    ['Contacts', 'People', 'Table', 'Contact'],
    ['Wedding Party', 'People', 'Table', 'Party member'],
    ['Table Layout', 'People', 'Floor-plan canvas + table', 'Table \u00b7 seat'],
    ['Gifts', 'People', 'Table', 'Gift'],
    ['Budget', 'Money', 'Table, by category', 'Line item'],
    ['Payments', 'Money', 'Table + calendar', 'Payment'],
    ['Contracts, Invoices & Rentals', 'Money', 'Table', 'Contract'],
    ['Venue & Vendors', 'Vendors', 'Table', 'Vendor'],
    ['Venue Comparison', 'Vendors', 'Comparison cards', 'Venue candidate'],
    ['Catering & Menu', 'Vendors', 'Table', 'Menu item'],
    ['Entertainment', 'Vendors', 'Table', 'Entertainment vendor \u00b7 cue'],
    ['Shot Lists', 'Vendors', 'Checklist', 'Shot'],
    ['Wedding Day Timeline', 'The Day', 'Gantt', 'Event block'],
    ['Ceremony & Reception', 'The Day', 'Table + cards', 'Moment \u00b7 tradition'],
    ['Weekend Logistics', 'The Day', 'Table', 'Logistics item'],
    ['Newlywed Homecoming', 'The Day', 'Checklist', 'Homecoming task'],
    ['Honeymoon & After', 'The Day', 'Table + itinerary', 'Honeymoon item'],
    ['Vision & Foundation', 'Covenant', 'Cards', 'Vision entry'],
    ['Prayer Journal', 'Covenant', 'List', 'Prayer entry'],
    ['Premarital Counseling', 'Covenant', 'Table', 'Session'],
    ['First-Month Rhythms', 'Covenant', 'Checklist', 'Rhythm'],
    ['Share Packets', 'Documents', 'Auto-filled packet', 'Packet'],
    ['Email Templates', 'Documents', 'Card list', 'Template'],
    ['Print Centre', 'Documents', 'Print sheet', 'Nothing — assembles other pages'],
    ['Vision Board', 'Documents', 'Gallery + palette builder', 'Palette \u00b7 inspiration image'],
    ['Essentials Checklist', 'Documents', 'Checklist', 'Essentials item'],
    ['Wedding Setup', 'Outside the tabs', 'Form', 'Wedding profile'],
    ['Get Started', 'Outside the tabs', 'Steps', 'Nothing — reference only'],
    ['Page-by-Page Guide', 'Outside the tabs', 'Table', 'Nothing — reference only'],
    ['FAQ', 'Outside the tabs', 'Accordion', 'Nothing — reference only'],
    ['Planner History', 'Outside the tabs', 'Log table', 'Nothing — read-only log']
  ];
  var GUIDE_TABS = ['Overview', 'Planning', 'People', 'Money', 'Vendors', 'The Day', 'Covenant', 'Documents', 'Outside the tabs'];
  window.rdGuideRows = function () { return GUIDE_ROWS; };

  window._guideView = window._guideView || 'table';
  window._guideTabFilter = window._guideTabFilter || 'all';
  window._guideSearch = window._guideSearch || '';
  window._guideCollapsed = (window._guideCollapsed instanceof Object) ? window._guideCollapsed : {};

  function guideRows() {
    var q = String(window._guideSearch || '').trim().toLowerCase();
    var tabFilter = window._guideTabFilter || 'all';
    return GUIDE_ROWS.filter(function (r) {
      if (tabFilter !== 'all' && r[1] !== tabFilter) return false;
      if (!q) return true;
      return (r[0] + ' ' + r[1] + ' ' + r[2] + ' ' + r[3]).toLowerCase().indexOf(q) > -1;
    });
  }

  window.rdGuideSetView = function (v) {
    window._guideView = v;
    if (typeof renderRegisteredPanel === 'function') renderRegisteredPanel('guide'); else renderGuideRd();
  };
  window.rdGuideSetTab = function (t) {
    window._guideTabFilter = t;
    renderGuideRd();
    if (typeof renderContextSidebar === 'function') renderContextSidebar('guide');
  };
  window.rdGuideSearch = function (val) {
    window._guideSearch = val || '';
    renderGuideRd();
  };
  window.rdGuideToggleGroup = function (tab) {
    window._guideCollapsed[tab] = !window._guideCollapsed[tab];
    renderGuideRd();
  };
  window.rdGuideExpandAll = function (collapse) {
    GUIDE_TABS.forEach(function (t) { window._guideCollapsed[t] = !!collapse; });
    renderGuideRd();
  };

  function guidePageheadActions() {
    return '<button type="button" class="rd-btn" onclick="showPanel(\'instructions\')">Get Started</button>' +
      '<button type="button" class="rd-btn" onclick="window.print()">Print section</button>' +
      '<button type="button" class="rd-btn" onclick="showPanel(\'faq\')">FAQ</button>' +
      '<button type="button" class="rd-btn rd-btn--primary" onclick="rdGuideSetView(\'print\');window.print()">Print the guide</button>';
  }

  function guideTableHtml() {
    var rows = guideRows();
    if (!rows.length) return '<div class="rd-empty">No pages match that search.</div>';
    var byTab = {};
    rows.forEach(function (r) { (byTab[r[1]] = byTab[r[1]] || []).push(r); });
    var html = '<div class="rd-table-wrap"><table class="rd-table rd-table--guide"><thead><tr><th>Page</th><th>Tab</th><th>Work surface</th><th>Owns</th></tr></thead><tbody>';
    GUIDE_TABS.forEach(function (tab) {
      var tabRows = byTab[tab];
      if (!tabRows || !tabRows.length) return;
      var collapsed = !!window._guideCollapsed[tab];
      html += '<tr class="is-group" onclick="rdGuideToggleGroup(\'' + esc(tab) + '\')"><td colspan="4">' +
        '<span class="rd-table__caret">' + (collapsed ? '\u25b8' : '\u25be') + '</span> ' + esc(tab) +
        ' <span class="rd-table__groupcount">' + tabRows.length + '</span></td></tr>';
      if (!collapsed) {
        tabRows.forEach(function (r) {
          html += '<tr><td>' + esc(r[0]) + '</td><td class="rd-table__muted">' + esc(r[1]) + '</td>' +
            '<td class="rd-table__gold">' + esc(r[2]) + '</td><td>' + esc(r[3]) + '</td></tr>';
        });
      }
    });
    html += '</tbody></table></div>';
    return html;
  }

  function guidePrintHtml() {
    var rows = guideRows();
    var byTab = {};
    rows.forEach(function (r) { (byTab[r[1]] = byTab[r[1]] || []).push(r); });
    var cols = GUIDE_TABS.filter(function (t) { return byTab[t] && byTab[t].length; }).map(function (tab) {
      var items = byTab[tab].map(function (r) {
        return '<li><b>' + esc(r[0]) + '</b> \u2014 ' + esc(r[2]) + ' \u00b7 owns ' + esc(r[3]) + '</li>';
      }).join('');
      return '<div class="rd-printsheet__col"><h4>' + esc(tab) + '</h4><ul>' + items + '</ul></div>';
    }).join('');
    return '<div class="rd-printsheet"><div class="rd-printsheet__paper rd-printsheet__paper--guide">' +
      '<h2>Page-by-Page Guide</h2>' +
      '<p class="rd-help">One line per page: which tab it sits under, what work surface it uses, and which record it owns.</p>' +
      '<div class="rd-printsheet__cols">' + cols + '</div>' +
      '</div></div>';
  }

  function renderGuideRd() {
    var panel = document.getElementById('panel-guide');
    if (!panel) return;
    var view = window._guideView || 'table';
    var tabFilter = window._guideTabFilter || 'all';

    panel.classList.add('ued-scope');
    panel.innerHTML =
      '<div class="rd-page rd-page--guide">' +
      pageheadHtml('Help', 'Page-by-Page Guide', guidePageheadActions()) +
      '<div class="rd-toolbar">' +
        '<button type="button" class="rd-chip' + (tabFilter === 'all' ? '' : ' is-active') + '" onclick="rdGuideCycleTab()">Tab: ' + esc(tabFilter === 'all' ? 'all' : tabFilter) + '</button>' +
        '<input type="search" class="rd-search-input" placeholder="Search the guide\u2026" aria-label="Search the guide" value="' + esc(window._guideSearch || '') + '" oninput="rdGuideSearch(this.value)">' +
        '<button type="button" class="rd-chip rd-chip--ghost" onclick="rdGuideExpandAll(false)">Expand all</button>' +
        '<button type="button" class="rd-chip rd-chip--ghost" onclick="rdGuideExpandAll(true)">Collapse all</button>' +
        '<div class="rd-toolbar__right">' +
          '<div class="rd-viewswitch">' +
            '<button type="button" class="rd-viewswitch__item' + (view === 'table' ? ' is-active' : '') + '" onclick="rdGuideSetView(\'table\')">Table</button>' +
            '<button type="button" class="rd-viewswitch__item' + (view === 'print' ? ' is-active' : '') + '" onclick="rdGuideSetView(\'print\')">Print</button>' +
          '</div>' +
        '</div>' +
      '</div>' +
      '<div class="rd-surface">' +
        (view === 'print' ? guidePrintHtml() : guideTableHtml()) +
        (view === 'table' ? (
          sectionHead('What owns what', 'If two pages disagree, this table says which one is right.',
            '<button type="button" class="rd-btn rd-btn--quiet" style="margin-left:auto" onclick="rdGuideSetView(\'print\')">Print the guide</button>') +
          '<div class="rd-help">Read the last column first: a page that owns no record is a reader, and editing that data happens somewhere else — the Database Hub if you need every row at once.</div>'
        ) : '') +
      '</div>' +
      '</div>';
  }
  window.rdGuideCycleTab = function () {
    var opts = ['all'].concat(GUIDE_TABS);
    var i = opts.indexOf(window._guideTabFilter || 'all');
    window.rdGuideSetTab(opts[(i + 1) % opts.length]);
  };

  /* ════════════════════════════════════════════════════════════════════
     FAQ — All.dc 15c. Search + category chips + accordion + 360px aside.
     ════════════════════════════════════════════════════════════════════ */

  var FAQ_CATS_RD = ['Everything', 'Numbers', 'The file', 'Limits', 'Printing', 'Saving'];

  var FAQ_ITEMS_RD = [
    ['Numbers', 'Why can\u2019t I type this number?',
      'It is derived. Confirmed guests, category totals, and outstanding balances are calculated from the records beneath them \u2014 typing one would make two figures disagree. Edit the record it comes from; the drawer names it.'],
    ['Numbers', 'How do budget totals update on the Dashboard?',
      'The dashboard reads straight from Budget and Payments. Edit \u201cActual\u201d spending or a payment status and the Budget Used %, Remaining, and the charts recalculate instantly \u2014 nothing to refresh.'],
    ['Numbers', 'How do plus-ones and children count toward my totals?',
      'Tick +1, enter children, tick Family, or use Add Companions under a guest. Companions roll into your guest count, kids count, seating, meal counts, and the Catering & Budget estimates automatically \u2014 every page that reads the guest list sees them too.'],
    ['Numbers', 'Someone is paying for part of our wedding as a gift \u2014 how do I track that?',
      'Open a Budget line item\u2019s Gift / contribution section: enter the amount, who it\u2019s from, and whether it\u2019s Pledged or Paid. The item keeps its full cost, but the gifted portion is removed from your budget. Budget Reconciliation then shows total value, gifts, your share, and a by-contributor list for thank-you notes.'],
    ['Numbers', 'How does the itemized Budget roll up?',
      'Each category has its own line items \u2014 type a cost for any item and it instantly rolls into the category total, the top budget boxes, and the donut + bar showing that category\u2019s share of your overall budget.'],
    ['The file', 'Where is my planner stored?',
      'In one file on this device, in plain SQLite, with a localStorage mirror for crash safety. No account, no cloud, nothing uploaded. That is why Download Backup is the only way to move your plan to another machine.'],
    ['The file', 'Will my edits stay if I close the browser tab?',
      'Yes \u2014 everything saves automatically as you type. Clearing browser history or site data erases it, though, so download a portable .sqlite backup regularly and reopen the planner in the same browser unless you restore from one.'],
    ['The file', 'What is the easiest way to move to another laptop?',
      'On your current device, click Download Backup to save the .sqlite file. Copy it to the other laptop (USB, email, or cloud storage), open the planner there, click Restore, and select the file. Your whole planner comes with it.'],
    ['The file', 'Can I plan more than one wedding in the same file?',
      'Yes. Use the wedding profile menu in the top bar to create separate, independent planners. Each profile saves on its own and has its own backup \u2014 switching never mixes data between them.'],
    ['The file', 'Why did backup say it is still loading, or download JSON instead of .sqlite?',
      'Backup is gated until SQLite finishes booting for your active profile. If you click Download Backup in the first few seconds after opening the file, wait a moment and retry. If SQLite is unavailable in your browser session, the planner falls back to a legacy .json export and says so explicitly \u2014 it never silently substitutes one for the other.'],
    ['Limits', 'Can this planner send invitations, RSVPs, or vendor emails for me?',
      'No, and that is intentional. This is an offline, privacy-first planner with no mail server. Email Templates prepares copy-ready messages you paste into your own mail app; Share Packets and Print Section hand off read-only details to vendors or family.'],
    ['Limits', 'Does this planner upload my information anywhere?',
      'No. It runs entirely on your device with no account, no cloud, and no internet required. Nothing \u2014 including any photo you add \u2014 leaves your computer unless you choose to export a backup or CSV yourself.'],
    ['Limits', 'Can I share a read-only copy without live hosting?',
      'Because this is a local, downloadable planner, it cannot do live collaboration. Export a backup for yourself, print or save PDF packets for vendors and family, or turn on Preview Mode in Wedding Setup before sharing a copy \u2014 a local preview lock, not bank-level security.'],
    ['Limits', 'How can my partner, family, or coordinator help without live collaboration?',
      'Through handoff files rather than live sync: a full .sqlite backup they restore and send back, a lightweight Partner Sync Packet for guests/tasks/budget updates, or a Share Packet for read-ready vendor and wedding-party details. Not real-time, but private and portable.'],
    ['Limits', 'What happens if my storage runs out?',
      'Browsers cap local storage. Uploading many large images \u2014 especially on the Vision Board \u2014 can hit that limit. A red warning banner appears if a save fails; download a backup immediately and remove some images to free space.'],
    ['Printing', 'Is there a shorter onboarding PDF I can hand someone?',
      'Open Get Started and click Print section, then choose \u201cSave as PDF.\u201d That gives a concise, printable quick-start without the top bar, rail, or buttons.'],
    ['Printing', 'How do I print just one page or section?',
      'Use Print Section in the top bar (or the Print section button on most pages) to choose a specific page, then save it as a PDF from your browser\u2019s print dialog.'],
    ['Printing', 'Can I print the Page-by-Page Guide as a one-sheet reference?',
      'Yes \u2014 open Page-by-Page Guide, switch to the Print view, and click Print the guide. It lays every page out in tab columns on a single sheet for a coordinator to carry.'],
    ['Printing', 'Do printed pages include the sidebar and toolbar buttons?',
      'No. Printing strips the top bar, tabs, rail, toolbar, and page-header buttons automatically \u2014 only the page content prints, in black on white.'],
    ['Saving', 'What does the Save button do if everything auto-saves already?',
      'Your work already saves automatically as you type. Save is a reassurance \u2014 click it to write immediately and refresh the \u201cSaved\u2026\u201d time. It does the same thing as the automatic save.'],
    ['Saving', 'How can I turn off backup prompts?',
      'You cannot fully disable them, because your data lives only in this browser \u2014 the occasional nudge is the only reminder that a .sqlite backup is overdue. Download one now and then and the banners stay quiet.'],
    ['Saving', 'How do I see what a finished planner looks like before entering my own data?',
      'Click Load Sample Data on Get Started to fill every section with an example wedding. When you are ready for your own plan, use Reset All Data to clear it \u2014 download a backup of your own work first if you have started one.'],
    ['Saving', 'Are there keyboard shortcuts for saving and undo?',
      'Yes \u2014 Ctrl/Cmd+S saves now, Ctrl/Cmd+Z undoes, and Ctrl/Cmd+Y (or Cmd+Shift+Z on Mac) redoes. The full shortcut list lives in the page sidebar under Keyboard shortcuts.'],
    ['Saving', 'What is the fastest way to protect my work before a big change?',
      'Click Download Backup in the top bar before importing a large CSV, resetting data, or handing the file to someone else. It takes a few seconds and it is the only copy that survives clearing browser data.']
  ];

  window.rdFaqItems = function () { return FAQ_ITEMS_RD; };

  var FAQ_ASIDE_RD = [
    ['Auto-Save', 'Your work saves automatically in this browser using SQLite.'],
    ['Backup Regularly', 'Download a .sqlite backup to protect your planner.'],
    ['Print Beautifully', 'Use Print Section to save any page as PDF or paper.'],
    ['Edit Anytime', 'Every section stays editable and updates totals live.'],
    ['Need More Help?', 'Open Get Started or the Page-by-Page Guide anytime.']
  ];

  var FAQ_TROUBLESHOOT_RD = [
    ['Storage is full', 'Download a backup immediately, then remove some Vision Board images or old inspiration photos to free space.'],
    ['Backup keeps saying it is still loading', 'Wait a few seconds after opening the planner for SQLite to finish booting for your profile, then try Download Backup again.'],
    ['I don\u2019t see my changes after reopening', 'Confirm you are in the same browser and wedding profile. If you switched devices or browsers, restore from your most recent .sqlite backup.']
  ];

  window._faqCatRd = window._faqCatRd || 'Everything';
  window._faqSearchRd = window._faqSearchRd || '';
  window._faqOpenRd = (window._faqOpenRd instanceof Object) ? window._faqOpenRd : {};

  function faqCatCount(cat) {
    if (cat === 'Everything') return FAQ_ITEMS_RD.length;
    return FAQ_ITEMS_RD.filter(function (it) { return it[0] === cat; }).length;
  }
  function faqFilteredRd() {
    var cat = window._faqCatRd || 'Everything';
    var q = String(window._faqSearchRd || '').trim().toLowerCase();
    return FAQ_ITEMS_RD.filter(function (it, i) {
      if (cat !== 'Everything' && it[0] !== cat) return false;
      if (!q) return true;
      return (it[1] + ' ' + it[2]).toLowerCase().indexOf(q) > -1;
    }).map(function (it) { return { cat: it[0], q: it[1], a: it[2], i: FAQ_ITEMS_RD.indexOf(it) }; });
  }

  window.rdFaqSetCat = function (cat) {
    window._faqCatRd = cat;
    renderFaqRd();
  };
  window.rdFaqSearch = function (val) {
    window._faqSearchRd = val || '';
    renderFaqRd();
  };
  window.rdFaqToggle = function (i) {
    window._faqOpenRd[i] = !window._faqOpenRd[i];
    var body = document.getElementById('faq-a-' + i);
    var btn = document.getElementById('faq-q-' + i);
    if (body) body.hidden = !window._faqOpenRd[i];
    if (btn) btn.setAttribute('aria-expanded', window._faqOpenRd[i] ? 'true' : 'false');
  };

  function faqPageheadActions() {
    return '<button type="button" class="rd-btn" onclick="showPanel(\'instructions\')">Get Started</button>' +
      '<button type="button" class="rd-btn" onclick="window.print()">Print section</button>' +
      '<button type="button" class="rd-btn" onclick="showPanel(\'guide\')">Page-by-Page Guide</button>' +
      '<button type="button" class="rd-btn rd-btn--primary" onclick="downloadSqliteBackup()">Download a backup</button>';
  }

  function faqAccordionHtml() {
    var items = faqFilteredRd();
    if (!items.length) return '<div class="rd-empty">No questions match that search.</div>';
    return '<div class="rd-faq">' + items.map(function (it) {
      var open = !!window._faqOpenRd[it.i];
      return '<div class="rd-faq__item' + (open ? ' is-open' : '') + '">' +
        '<button type="button" class="rd-faq__q" id="faq-q-' + it.i + '" aria-expanded="' + (open ? 'true' : 'false') + '" aria-controls="faq-a-' + it.i + '" onclick="rdFaqToggle(' + it.i + ')">' +
        '<span class="rd-faq__caret" aria-hidden="true">\u25b8</span><span>' + esc(it.q) + '</span>' +
        '<span class="rd-faq__catlabel">' + esc(it.cat) + '</span></button>' +
        '<div class="rd-faq__a" id="faq-a-' + it.i + '"' + (open ? '' : ' hidden') + '>' + esc(it.a) + '</div>' +
        '</div>';
    }).join('') + '</div>';
  }

  function faqAsideHtml() {
    return '<aside class="rd-faq-aside" aria-label="Quick answers">' +
      '<h3 class="rd-faq-aside__title">Quick Answers</h3>' +
      FAQ_ASIDE_RD.map(function (a) {
        return '<div class="rd-faq-aside__item"><strong>' + esc(a[0]) + '</strong><p>' + esc(a[1]) + '</p></div>';
      }).join('') +
      '</aside>';
  }

  function renderFaqRd() {
    var panel = document.getElementById('panel-faq');
    if (!panel) return;
    var cat = window._faqCatRd || 'Everything';

    panel.classList.add('ued-scope');
    panel.innerHTML =
      '<div class="rd-page rd-page--faq">' +
      pageheadHtml('Help', 'FAQ', faqPageheadActions()) +
      '<div class="rd-toolbar">' +
        FAQ_CATS_RD.map(function (c) {
          return '<button type="button" class="rd-chip' + (cat === c ? ' is-active' : '') + '" onclick="rdFaqSetCat(\'' + esc(c) + '\')">' + esc(c) + ' <span class="rd-chip__count">' + faqCatCount(c) + '</span></button>';
        }).join('') +
        '<input type="search" class="rd-search-input" placeholder="Search for help\u2026" aria-label="Search FAQ" value="' + esc(window._faqSearchRd || '') + '" oninput="rdFaqSearch(this.value)">' +
      '</div>' +
      '<div class="rd-surface rd-faq-layout">' +
        '<div class="rd-faq-main">' +
          faqAccordionHtml() +
          sectionHead('If something has gone wrong', 'Start here before anything else.',
            '<button type="button" class="rd-btn rd-btn--quiet" style="margin-left:auto" onclick="downloadSqliteBackup()">Download a backup</button>') +
          '<div class="rd-grid-3">' + FAQ_TROUBLESHOOT_RD.map(function (t) {
            return '<div class="rd-cta-card rd-cta-card--quiet"><h3>' + esc(t[0]) + '</h3><p>' + esc(t[1]) + '</p></div>';
          }).join('') + '</div>' +
        '</div>' +
        faqAsideHtml() +
      '</div>' +
      '</div>';
  }

  /* ── register renderers ───────────────────────────────────────────────
     SYSTEM_PANEL_RENDERERS covers showPanel() navigation; the window.render*
     overrides cover initAll()'s direct boot-time calls (the active panel on
     first load never routes through showPanel). Both must point here. */
  window.SYSTEM_PANEL_RENDERERS = window.SYSTEM_PANEL_RENDERERS || {};
  window.SYSTEM_PANEL_RENDERERS.instructions = renderInstructionsRd;
  window.SYSTEM_PANEL_RENDERERS.guide = renderGuideRd;
  window.SYSTEM_PANEL_RENDERERS.faq = renderFaqRd;
  window.renderStartHere = renderInstructionsRd;
  window.renderPageGuide = renderGuideRd;
  window.renderFAQ = renderFaqRd;
  window.setFaqCat = function (cat) { window.rdFaqSetCat(cat); };
})();
