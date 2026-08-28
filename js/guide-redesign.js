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
      '<button type="button" class="rd-viewswitch__item' + (v === 'entries' ? ' is-active' : '') + '" onclick="rdGuideSetView(\'entries\')">Entries</button>' +
      '<button type="button" class="rd-viewswitch__item' + (v === 'table' ? ' is-active' : '') + '" onclick="rdGuideSetView(\'table\')">Table view</button>' +
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
    let html = '<div class="ued-table-wrap"><table class="rd-guide-contract"><thead><tr>' +
      '<th>Page</th><th>Tab</th><th>Owns</th><th>Reads from</th><th>Feeds</th><th>Prints</th>' +
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
      '<span>Page-by-Page Guide</span><span>Class A · working reference · grouped by tab</span></div>';
    Object.keys(byTab).forEach(tab => {
      html += '<div class="rd-guide-printgroup"><h4>' + esc(tab) + '</h4>';
      byTab[tab].forEach(r => {
        html += '<div class="rd-guide-printrow"><b>' + esc(r[0]) + '</b><span>Owns ' + esc(r[2]) + '</span></div>';
      });
      html += '</div>';
    });
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
    const legacyAside = panel.querySelector('.faq-side');
    if (legacyAside) legacyAside.classList.add('rd-guide-legacy-hide');
    if (!panel.querySelector('#rd-faq-quick')) {
      const aside = document.createElement('aside');
      aside.id = 'rd-faq-quick';
      aside.className = 'rd-faq-quick';
      aside.innerHTML = '<div class="rd-faq-quick__title">Quick answers</div>' +
        FAQ_QUICK.map(q => '<div class="rd-faq-quick__item"><b>' + esc(q[0]) + '</b><p>' + esc(q[1]) + '</p></div>').join('') +
        '<p class="rd-faq-quick__note">The five things people ask most. This column is a plain aside — no record is open behind it.</p>';
      panel.appendChild(aside);
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
