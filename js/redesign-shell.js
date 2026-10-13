/* ═══════════════════════════════════════════════════════════════════════
   REDESIGN SHELL — Phase 3 harvest
   ───────────────────────────────────────────────────────────────────────
   Builds the redesign's chrome (top bar 52 · tabs 46 · sub-nav 40) from
   Redesign/pages/*.html and RELOCATES the planner's existing live controls
   into it.

   Why relocate instead of re-author: 18 top-bar ids are load-bearing in
   planner.js (#last-saved, #gs-input, #gs-results, #topbar-notifications-*,
   #quick-jump-drop, #csv-export-select, #print-target-select, #heroPhotoInput
   …). appendChild MOVES a node and keeps its listeners, so every handler and
   every getElementById in planner.js still resolves. Nothing is re-typed,
   so nothing can be mistyped.

   Spec: §06 navigation · §07 page anatomy · §10 (twelve gold buttons become
   four elements and a command palette) · §17 viewer preferences.
   ═══════════════════════════════════════════════════════════════════════ */
(function () {
  'use strict';

  /* ── §06: eight tabs · full planning IA (guide §3 + live shells).
     Households / Contacts / Vision / First-Month / Print Centre / Homecoming
     are first-class panels — derive, never store duplicates. ───────────── */
  var TABS = [
    { id: 'overview',  label: 'Overview',  pages: [['dashboard','Dashboard'], ['notes','Notes']] },
    { id: 'planning',  label: 'Planning',  pages: [['tasks','Timeline & Tasks'], ['calendar','Smart Calendar'], ['appointments','Appointments'], ['data-hub','Database Hub']] },
    { id: 'people',    label: 'People',    pages: [['guests','Guest List'], ['households','Households'], ['contacts','Contacts'], ['party','Wedding Party'], ['tables','Table Layout'], ['gifts','Gifts']] },
    { id: 'money',     label: 'Money',     pages: [['budget','Budget'], ['payments','Payments'], ['contracts','Contracts & Invoices']] },
    { id: 'vendors',   label: 'Vendors',   pages: [['vendors','Venue & Vendors'], ['venue','Venue Comparison'], ['catering','Catering & Menu'], ['entertainment','Entertainment'], ['shotlist','Shot Lists']] },
    { id: 'theday',    label: 'The Day',   pages: [['timeline','Wedding Day Timeline'], ['ceremony','Ceremony & Reception'], ['logistics','Weekend Logistics'], ['homecoming','Newlywed Homecoming'], ['honeymoon','Honeymoon & After']] },
    { id: 'covenant',  label: 'Covenant',  pages: [['vision','Vision & Foundation'], ['prayer','Prayer Journal'], ['counseling','Premarital Counseling'], ['firstmonth','First-Month Rhythms']], dot: true },
    { id: 'documents', label: 'Documents', pages: [['packets','Share Packets'], ['emails','Email Templates'], ['print-centre','Print Centre'], ['mood','Vision Board'], ['essentials','Essentials Checklist']] }
  ];

  /* Reached from the top bar or help, never from a tab (§06). */
  var UNTABBED = ['history', 'setup', 'instructions', 'guide', 'faq', 'ui-system', 'reflect'];

  var SVG = 'viewBox="0 0 24 24" aria-hidden="true" style="width:1em;height:1em;fill:none;stroke:currentColor;stroke-width:1.7;stroke-linecap:round;stroke-linejoin:round"';

  function el(html) {
    var d = document.createElement('div');
    d.innerHTML = html.trim();
    return d.firstElementChild;
  }
  function panelOf(id) { return document.getElementById('panel-' + id); }
  function tabFor(panel) {
    for (var i = 0; i < TABS.length; i++) {
      for (var j = 0; j < TABS[i].pages.length; j++) {
        if (TABS[i].pages[j][0] === panel) return TABS[i];
      }
    }
    return null;
  }

  function build() {
    if (document.querySelector('.rd-topbar')) return;      /* already built */
    var legacyBar = document.getElementById('topbar');
    if (!legacyBar) return;

    /* ─── top bar ─────────────────────────────────────────────────────── */
    var bar = el(
      '<header class="rd-topbar">' +
        '<div class="rd-topbar__brand">' +
          '<span class="rd-topbar__mark">&#10022;</span>' +
          '<span class="rd-topbar__name">The Covenant Wedding Planner</span>' +
        '</div>' +
        '<button type="button" class="rd-topbar__wedding" id="rd-wedding-btn">' +
          '<span class="rd-topbar__avatar" id="rd-profile-initials">--</span>' +
          '<span id="rd-wedding-label">Your wedding</span>' +
          '<svg ' + SVG + '><path d="m6 9 6 6 6-6"/></svg>' +
        '</button>' +
        '<div class="rd-topbar__searchslot"></div>' +
        '<div class="rd-topbar__right">' +
          '<div class="rd-topbar__undoslot"></div>' +
          '<div class="rd-topbar__saveslot"></div>' +
          '<div class="rd-topbar__bellslot"></div>' +
          '<button type="button" class="rd-topbar__gear" id="rd-gear-btn" aria-label="Viewer preferences" aria-haspopup="true" aria-expanded="false">' +
            '<svg ' + SVG + '><circle cx="12" cy="12" r="3"/><path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 1 1-2.83 2.83l-.06-.06A1.65 1.65 0 0 0 15 19.4a1.65 1.65 0 0 0-1 1.51V21a2 2 0 1 1-4 0v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 1 1-2.83-2.83l.06-.06A1.65 1.65 0 0 0 4.6 15a1.65 1.65 0 0 0-1.51-1H3a2 2 0 1 1 0-4h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 1 1 2.83-2.83l.06.06A1.65 1.65 0 0 0 9 4.6a1.65 1.65 0 0 0 1-1.51V3a2 2 0 1 1 4 0v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 1 1 2.83 2.83l-.06.06A1.65 1.65 0 0 0 19.4 9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 1 1 0 4h-.09a1.65 1.65 0 0 0-1.51 1Z"/></svg>' +
          '</button>' +
        '</div>' +
        '<div class="rd-prefs" id="rd-prefs" hidden></div>' +
      '</header>');

    /* ─── tabs + sub-nav ──────────────────────────────────────────────── */
    var tabs = el('<nav class="rd-tabs" aria-label="Sections"></nav>');
    TABS.forEach(function (t) {
      var b = el('<button type="button" class="rd-tab" data-tab="' + t.id + '">' +
                 (t.dot ? '<span class="rd-tab__dot"></span>' : '') + t.label + '</button>');
      b.addEventListener('click', function () {
        var first = t.pages.filter(function (p) { return panelOf(p[0]); })[0];
        /* forceOpen: Essentials View must not rewrite redesign nav to Dashboard */
        if (first && typeof showPanel === 'function') showPanel(first[0], true);
      });
      tabs.appendChild(b);
    });
    var subnav = el('<nav class="rd-subnav" aria-label="Pages"></nav>');

    legacyBar.parentNode.insertBefore(bar, legacyBar);
    bar.parentNode.insertBefore(tabs, legacyBar);
    tabs.parentNode.insertBefore(subnav, legacyBar);

    /* ─── relocate the live controls (moves nodes, keeps listeners) ───── */
    function move(node, intoSelector) {
      var slot = bar.querySelector(intoSelector);
      if (node && slot) slot.appendChild(node);
    }
    var search = document.getElementById('global-search');
    var save   = legacyBar.querySelector('.top-save-status');
    var bell   = document.getElementById('topbar-notifications-wrap');
    move(search, '.rd-topbar__searchslot');
    move(save,   '.rd-topbar__saveslot');
    move(bell,   '.rd-topbar__bellslot');

    var undoSlot = bar.querySelector('.rd-topbar__undoslot');
    ['undo-btn', 'redo-btn'].forEach(function (id) {
      var b = document.getElementById(id);
      if (b && undoSlot) { b.classList.add('rd-undo'); undoSlot.appendChild(b); }
    });

    /* §17: everything that changes only what THIS viewer sees moves behind
       the gear — theme, dark mode, font, display, backup, restore, help,
       CSV, print, auto-fit. They keep their ids and their handlers. */
    var prefs = bar.querySelector('#rd-prefs');
    var overflow = document.getElementById('topbar-overflow');
    ['profile-drawer-btn', 'dark-mode-btn', 'data-hub-btn', 'save-btn'].forEach(function (id) {
      var b = document.getElementById(id);
      if (b && prefs) prefs.appendChild(b);
    });
    if (overflow && prefs) {
      while (overflow.firstChild) prefs.appendChild(overflow.firstChild);
    }
    /* the quick-jump dropdown is superseded by the command palette, but
       planner.js still writes into it — keep the node, park it in prefs. */
    var qj = document.getElementById('quick-jump-wrap');
    if (qj && prefs) prefs.appendChild(qj);

    document.getElementById('rd-gear-btn').addEventListener('click', function (e) {
      e.stopPropagation();
      var open = prefs.hasAttribute('hidden');
      if (open) prefs.removeAttribute('hidden'); else prefs.setAttribute('hidden', '');
      this.setAttribute('aria-expanded', open ? 'true' : 'false');
    });
    document.addEventListener('click', function (e) {
      if (!prefs.hasAttribute('hidden') && !prefs.contains(e.target) && e.target.id !== 'rd-gear-btn') {
        prefs.setAttribute('hidden', '');
        var g = document.getElementById('rd-gear-btn');
        if (g) g.setAttribute('aria-expanded', 'false');
      }
    });
    document.getElementById('rd-wedding-btn').addEventListener('click', function () {
      if (typeof toggleProfileDrawer === 'function') toggleProfileDrawer();
    });

    /* Furniture · Trash · Views S10 — from the avatar/prefs menu */
    if (prefs && !prefs.querySelector('[data-rd-trash]')) {
      var trashBtn = el('<button type="button" class="rd-prefs__trash" data-rd-trash>Trash · 30 days</button>');
      trashBtn.addEventListener('click', function () {
        prefs.setAttribute('hidden', '');
        var g = document.getElementById('rd-gear-btn');
        if (g) g.setAttribute('aria-expanded', 'false');
        if (typeof RdFurniture !== 'undefined' && RdFurniture.openTrash) {
          var items = [];
          try {
            var trash = (typeof data !== 'undefined' && data && Array.isArray(data.trash)) ? data.trash : [];
            items = trash.map(function (t, i) {
              return {
                id: String(t._id || i),
                title: t.title || t.name || t.label || 'Deleted record',
                meta: (t.type || t.entity || 'Record') + (t.deletedAt ? ' · ' + t.deletedAt : ''),
                daysLeft: t.daysLeft != null ? t.daysLeft : 30
              };
            });
          } catch (e) { items = []; }
          RdFurniture.openTrash({ items: items });
        }
      });
      prefs.insertBefore(trashBtn, prefs.firstChild);
    }

    /* ─── retire the legacy chrome ────────────────────────────────────── */
    legacyBar.setAttribute('hidden', '');
    legacyBar.setAttribute('aria-hidden', 'true');
    var catBar = document.getElementById('nav-category-bar');
    if (catBar) { catBar.setAttribute('hidden', ''); catBar.setAttribute('aria-hidden', 'true'); }
    document.body.classList.add('rd-scope');

    sync();
  }

  /* ─── keep tabs + sub-nav in step with showPanel() ─────────────────── */
  function sync() {
    var active = document.body.getAttribute('data-active-panel') || 'dashboard';
    var tab = tabFor(active);
    var tabsEl = document.querySelector('.rd-tabs');
    var subnav = document.querySelector('.rd-subnav');
    if (!tabsEl || !subnav) return;

    tabsEl.querySelectorAll('.rd-tab').forEach(function (b) {
      var on = tab && b.dataset.tab === tab.id;
      b.classList.toggle('is-active', !!on);
      if (on) b.setAttribute('aria-current', 'page'); else b.removeAttribute('aria-current');
    });

    /* §06: a page with no tab shows nothing lit and says where it sits. */
    subnav.innerHTML = '';
    if (!tab) {
      if (UNTABBED.indexOf(active) > -1) {
        subnav.appendChild(el('<span class="rd-subnav__note">Reached from the top bar</span>'));
      }
      return;
    }
    tab.pages.forEach(function (p) {
      if (!panelOf(p[0])) return;
      var b = el('<button type="button" class="rd-subnav__item' +
                 (p[0] === active ? ' is-active' : '') + '">' + p[1] + '</button>');
      if (p[0] === active) b.setAttribute('aria-current', 'page');
      b.addEventListener('click', function () {
        /* forceOpen: Essentials View must not rewrite redesign nav to Dashboard */
        if (typeof showPanel === 'function') showPanel(p[0], true);
      });
      subnav.appendChild(b);
    });
    syncDrawerSlot();
    /* Roles · Views #43a — Covenant tab visibility / role chrome */
    if (window.RdRoles && typeof window.RdRoles.afterSync === 'function') {
      try { window.RdRoles.afterSync(); } catch (e) { /* soft */ }
    }
  }

  /* ═══════════════════════════════════════════════════════════════════════
     §11 / §16 — THE 360px RECORD DRAWER
     ───────────────────────────────────────────────────────────────────────
     This is NOT a new editor. It is an INLINE MOUNT for the planner's
     existing record editor, exactly like the inline editors it replaces:

       covInlineLoad(key, index, 'record-drawer-body')   loads a record
       renderInlineRecordEditor()                        fills the body
       saveInlineRecordEditor() / recordEditorDelete()   commit it

     renderInlineRecordEditor() looks for a `.record-editor-inline-shell`
     ancestor and five [data-inline-editor-*] nodes inside it. The drawer
     supplies exactly those hooks, so every code path above runs unchanged
     and no editing logic is duplicated or re-implemented.

     "Full editor" hands off to openRecordEditor() — same record, §16 / 5a
     forest chrome, left rail, multi-column groups, 1140px window.
     ═══════════════════════════════════════════════════════════════════════ */

  var DRAWER_ID   = 'record-drawer';
  var DRAWER_BODY = 'record-drawer-body';

  function syncDrawerSlot() {
    var taskSlot = document.getElementById('task-drawer-slot');
    var apptSlot = document.getElementById('appointment-drawer-slot');
    var logSlot = document.getElementById('logistics-drawer-slot');
    var guestSlot = document.getElementById('guest-drawer-slot');
    var partySlot = document.getElementById('party-drawer-slot');
    var giftsSlot = document.getElementById('gifts-drawer-slot');
    var tablesSlot = document.getElementById('tables-drawer-slot');
    var vendorsSlot = document.getElementById('vendors-drawer-slot');
    var venueSlot = document.getElementById('venue-drawer-slot');
    var cateringSlot = document.getElementById('catering-drawer-slot');
    var entertainmentSlot = document.getElementById('entertainment-drawer-slot');
    var shotlistSlot = document.getElementById('shotlist-drawer-slot');
    var timelineSlot = document.getElementById('timeline-drawer-slot');
    var ceremonySlot = document.getElementById('ceremony-drawer-slot');
    var honeymoonSlot = document.getElementById('honeymoon-drawer-slot');
    var prayerSlot = document.getElementById('prayer-drawer-slot');
    var counselingSlot = document.getElementById('counseling-drawer-slot');
    var moodSlot = document.getElementById('mood-drawer-slot');
    var essentialsSlot = document.getElementById('essentials-drawer-slot');
    var packetsSlot = document.getElementById('packets-drawer-slot');
    var emailsSlot = document.getElementById('emails-drawer-slot');
    var notesSlot = document.getElementById('notes-drawer-slot');
    var dataHubSlot = document.getElementById('data-hub-drawer-slot');
    var d = document.getElementById(DRAWER_ID);
    if (!d) return;
    /* Closed drawer must stay out of layout flow even if CSS loses [hidden]. */
    var open = !d.hasAttribute('hidden');
    if (!open) {
      d.setAttribute('hidden', '');
      d.setAttribute('aria-hidden', 'true');
    } else {
      d.removeAttribute('aria-hidden');
    }
    var panel = document.body.getAttribute('data-active-panel') || '';
    var slot = null;
    if (panel === 'tasks') slot = taskSlot;
    else if (panel === 'appointments') slot = apptSlot;
    else if (panel === 'logistics') slot = logSlot;
    else if (panel === 'guests') slot = guestSlot;
    else if (panel === 'party') slot = partySlot;
    else if (panel === 'gifts') slot = giftsSlot;
    else if (panel === 'tables') slot = tablesSlot;
    else if (panel === 'vendors') slot = vendorsSlot;
    else if (panel === 'catering') slot = cateringSlot;
    else if (panel === 'entertainment') slot = entertainmentSlot;
    else if (panel === 'shotlist') slot = shotlistSlot;
    else if (panel === 'timeline') slot = timelineSlot;
    else if (panel === 'ceremony') slot = ceremonySlot;
    else if (panel === 'honeymoon') slot = honeymoonSlot;
    else if (panel === 'prayer') slot = prayerSlot;
    else if (panel === 'counseling') slot = counselingSlot;
    else if (panel === 'mood') slot = moodSlot;
    else if (panel === 'essentials') slot = essentialsSlot;
    else if (panel === 'packets') slot = packetsSlot;
    else if (panel === 'emails') slot = emailsSlot;
    else if (panel === 'notes') slot = notesSlot;
    else if (panel === 'data-hub') slot = dataHubSlot;
    /* Venue Comparison uses a page-local drawer (no §16 venue entity). Do not
       park #record-drawer into #venue-drawer-slot — that would clear is-open. */

    if (taskSlot && d.parentElement === taskSlot) taskSlot.classList.remove('is-open');
    if (apptSlot && d.parentElement === apptSlot) apptSlot.classList.remove('is-open');
    if (logSlot && d.parentElement === logSlot) logSlot.classList.remove('is-open');
    if (guestSlot && d.parentElement === guestSlot) guestSlot.classList.remove('is-open');
    if (partySlot && d.parentElement === partySlot) partySlot.classList.remove('is-open');
    if (giftsSlot && d.parentElement === giftsSlot) giftsSlot.classList.remove('is-open');
    if (tablesSlot && d.parentElement === tablesSlot) tablesSlot.classList.remove('is-open');
    if (vendorsSlot && d.parentElement === vendorsSlot) vendorsSlot.classList.remove('is-open');
    if (cateringSlot && d.parentElement === cateringSlot) cateringSlot.classList.remove('is-open');
    if (entertainmentSlot && d.parentElement === entertainmentSlot) entertainmentSlot.classList.remove('is-open');
    if (shotlistSlot && d.parentElement === shotlistSlot) shotlistSlot.classList.remove('is-open');
    if (timelineSlot && d.parentElement === timelineSlot) timelineSlot.classList.remove('is-open');
    if (ceremonySlot && d.parentElement === ceremonySlot) ceremonySlot.classList.remove('is-open');
    if (honeymoonSlot && d.parentElement === honeymoonSlot) honeymoonSlot.classList.remove('is-open');
    if (prayerSlot && d.parentElement === prayerSlot) prayerSlot.classList.remove('is-open');
    if (counselingSlot && d.parentElement === counselingSlot) counselingSlot.classList.remove('is-open');
    if (moodSlot && d.parentElement === moodSlot) moodSlot.classList.remove('is-open');
    if (essentialsSlot && d.parentElement === essentialsSlot) essentialsSlot.classList.remove('is-open');
    if (packetsSlot && d.parentElement === packetsSlot) packetsSlot.classList.remove('is-open');
    if (emailsSlot && d.parentElement === emailsSlot) emailsSlot.classList.remove('is-open');
    if (notesSlot && d.parentElement === notesSlot) notesSlot.classList.remove('is-open');
    if (dataHubSlot && d.parentElement === dataHubSlot) dataHubSlot.classList.remove('is-open');

    if (slot) {
      if (d.parentElement !== slot) slot.appendChild(d);
      slot.classList.toggle('is-open', open);
    } else {
      /* Park closed drawer off the live flex row when not on a drawer page. */
      var layoutPark = document.getElementById('layout');
      if (layoutPark && d.parentElement !== layoutPark) layoutPark.appendChild(d);
      if (taskSlot) taskSlot.classList.remove('is-open');
      if (apptSlot) apptSlot.classList.remove('is-open');
      if (logSlot) logSlot.classList.remove('is-open');
      if (guestSlot) guestSlot.classList.remove('is-open');
      if (partySlot) partySlot.classList.remove('is-open');
      if (giftsSlot) giftsSlot.classList.remove('is-open');
      if (tablesSlot) tablesSlot.classList.remove('is-open');
      if (vendorsSlot) vendorsSlot.classList.remove('is-open');
      if (cateringSlot) cateringSlot.classList.remove('is-open');
      if (entertainmentSlot) entertainmentSlot.classList.remove('is-open');
      if (shotlistSlot) shotlistSlot.classList.remove('is-open');
      if (timelineSlot) timelineSlot.classList.remove('is-open');
      if (ceremonySlot) ceremonySlot.classList.remove('is-open');
      if (honeymoonSlot) honeymoonSlot.classList.remove('is-open');
      if (prayerSlot) prayerSlot.classList.remove('is-open');
      if (counselingSlot) counselingSlot.classList.remove('is-open');
      if (moodSlot) moodSlot.classList.remove('is-open');
      if (essentialsSlot) essentialsSlot.classList.remove('is-open');
      if (packetsSlot) packetsSlot.classList.remove('is-open');
      if (emailsSlot) emailsSlot.classList.remove('is-open');
      if (notesSlot) notesSlot.classList.remove('is-open');
      if (dataHubSlot) dataHubSlot.classList.remove('is-open');
    }
    /* Keep venue custom drawer open state intact when shared drawer parks away. */
    if (venueSlot && venueSlot.querySelector('.rd-ven-drawer')) {
      venueSlot.classList.add('is-open');
    }
    if (cateringSlot && cateringSlot.querySelector('.rd-cat-drawer') && !(d.parentElement === cateringSlot && open)) {
      cateringSlot.classList.add('is-open');
    }
    if (entertainmentSlot && entertainmentSlot.querySelector('.rd-ent-drawer') && !(d.parentElement === entertainmentSlot && open)) {
      entertainmentSlot.classList.add('is-open');
    }
    if (shotlistSlot && shotlistSlot.querySelector('.rd-shot-drawer') && !(d.parentElement === shotlistSlot && open)) {
      shotlistSlot.classList.add('is-open');
    }
    if (timelineSlot && timelineSlot.querySelector('.rd-wday-drawer') && !(d.parentElement === timelineSlot && open)) {
      timelineSlot.classList.add('is-open');
    }
    if (ceremonySlot && ceremonySlot.querySelector('.rd-cer-drawer') && !(d.parentElement === ceremonySlot && open)) {
      ceremonySlot.classList.add('is-open');
    }
    if (honeymoonSlot && honeymoonSlot.querySelector('.rd-hm-drawer') && !(d.parentElement === honeymoonSlot && open)) {
      honeymoonSlot.classList.add('is-open');
    }
    if (prayerSlot && prayerSlot.querySelector('.rd-pr-drawer') && !(d.parentElement === prayerSlot && open)) {
      prayerSlot.classList.add('is-open');
    }
    if (counselingSlot && counselingSlot.querySelector('.rd-cou-drawer') && !(d.parentElement === counselingSlot && open)) {
      counselingSlot.classList.add('is-open');
    }
    if (moodSlot && moodSlot.querySelector('.rd-mood-drawer') && !(d.parentElement === moodSlot && open)) {
      moodSlot.classList.add('is-open');
    }
    if (essentialsSlot && essentialsSlot.querySelector('.rd-ess-drawer') && !(d.parentElement === essentialsSlot && open)) {
      essentialsSlot.classList.add('is-open');
    }
    if (packetsSlot && packetsSlot.querySelector('.rd-pkt-drawer') && !(d.parentElement === packetsSlot && open)) {
      packetsSlot.classList.add('is-open');
    }
    if (emailsSlot && emailsSlot.querySelector('.rd-et-drawer') && !(d.parentElement === emailsSlot && open)) {
      emailsSlot.classList.add('is-open');
    }
    if (notesSlot && notesSlot.querySelector('.rd-notes-drawer') && !(d.parentElement === notesSlot && open)) {
      notesSlot.classList.add('is-open');
    }
    if (dataHubSlot && dataHubSlot.querySelector('.rd-dh-drawer') && !(d.parentElement === dataHubSlot && open)) {
      dataHubSlot.classList.add('is-open');
    }
  }

  function ensureDrawerDepthChrome(d) {
    if (!d) return;
    var head = d.querySelector('.rd-drawer__head');
    if (!head) return;
    var actionsRow = head.querySelector('.rd-drawer__actions-row');
    if (actionsRow && !actionsRow.querySelector('[data-drawer-nav]')) {
      var nav = el(
        '<div class="rd-drawer__nav" data-drawer-nav hidden>' +
          '<button type="button" class="rd-drawer__nav-btn" data-drawer-prev aria-label="Previous record" title="⌥↑">&#8593;</button>' +
          '<button type="button" class="rd-drawer__nav-btn" data-drawer-next aria-label="Next record" title="⌥↓">&#8595;</button>' +
          '<span class="rd-drawer__position" data-drawer-position></span>' +
        '</div>'
      );
      actionsRow.insertBefore(nav, actionsRow.firstChild);
    }
    if (!head.querySelector('[data-drawer-crumb]')) {
      var crumb = el('<div class="rd-drawer__crumb" data-drawer-crumb hidden></div>');
      var afterActions = actionsRow ? actionsRow.nextSibling : head.firstChild;
      head.insertBefore(crumb, afterActions);
    }
    if (!head.querySelector('[data-drawer-identity]')) {
      var title = head.querySelector('[data-inline-editor-mode]');
      var identity = el(
        '<div class="rd-drawer__identity" data-drawer-identity>' +
          '<span class="rd-avatar rd-avatar--lg" data-drawer-avatar aria-hidden="true">?</span>' +
          '<div class="rd-drawer__identity-text"></div>' +
        '</div>'
      );
      var idText = identity.querySelector('.rd-drawer__identity-text');
      if (title) idText.appendChild(title);
      else idText.appendChild(el('<div class="rd-drawer__title" data-inline-editor-mode>No record selected</div>'));
      var pills = head.querySelector('.rd-drawer__pills');
      head.insertBefore(identity, pills || head.querySelector('[data-drawer-tabs]') || null);
    }
    if (!head.querySelector('[data-drawer-quick]')) {
      var quick = el('<div class="rd-drawer__quick" data-drawer-quick hidden></div>');
      var tabsEl = head.querySelector('[data-drawer-tabs]');
      head.insertBefore(quick, tabsEl || head.querySelector('[data-drawer-toolbar]') || null);
    }
  }

  function ensureDrawer() {
    var d = document.getElementById(DRAWER_ID);
    if (d) {
      /* Migrate older heads → top row = close only; Save/Add + Mark complete under tabs. */
      if (d.querySelector('.rd-drawer__head') && !d.querySelector('.rd-drawer__toolbar')) {
        migrateDrawerHead(d);
      }
      ensureDrawerDepthChrome(d);
      bindDrawerChrome(d);
      syncDrawerSlot();
      return d;
    }
    var layout = document.getElementById('layout');
    if (!layout) return null;

    d = el(
      '<aside class="rd-drawer record-editor-inline-shell" id="' + DRAWER_ID + '" hidden ' +
             'aria-label="Record editor">' +
        /* Head: close-only top row, then eyebrow / title / pills / tabs,
           then full-width Save/Add + Mark complete under the tab strip. */
        '<div class="rd-drawer__head">' +
          /* Nav + close on the top row (Depth · drawer). */
          '<div class="rd-drawer__actions-row">' +
            '<div class="rd-drawer__nav" data-drawer-nav hidden>' +
              '<button type="button" class="rd-drawer__nav-btn" data-drawer-prev aria-label="Previous record" title="⌥↑">&#8593;</button>' +
              '<button type="button" class="rd-drawer__nav-btn" data-drawer-next aria-label="Next record" title="⌥↓">&#8595;</button>' +
              '<span class="rd-drawer__position" data-drawer-position></span>' +
            '</div>' +
            '<button type="button" class="rd-drawer__close" data-drawer-close aria-label="Close">&#10005;</button>' +
          '</div>' +
          '<div class="rd-drawer__crumb" data-drawer-crumb hidden></div>' +
          '<div class="rd-drawer__eyebrowrow" data-drawer-eyebrow>' +
            '<span class="rd-drawer__eyebrow"></span>' +
          '</div>' +
          '<div class="rd-drawer__identity" data-drawer-identity>' +
            '<span class="rd-avatar rd-avatar--lg" data-drawer-avatar aria-hidden="true">?</span>' +
            '<div class="rd-drawer__identity-text">' +
              '<div class="rd-drawer__title" data-inline-editor-mode>No record selected</div>' +
            '</div>' +
          '</div>' +
          '<div class="rd-drawer__pills">' +
            '<span class="rd-drawer__pos" data-inline-editor-position></span>' +
          '</div>' +
          '<div class="rd-drawer__quick" data-drawer-quick hidden></div>' +
          '<div class="rd-drawer__tabs" data-drawer-tabs hidden></div>' +
          /* Same data-inline-editor-save / data-drawer-action hooks as before. */
          '<div class="rd-drawer__toolbar" data-drawer-toolbar>' +
            '<button type="button" class="rd-btn rd-btn--primary" data-inline-editor-save>Save</button>' +
            '<button type="button" class="rd-btn" data-drawer-action hidden></button>' +
          '</div>' +
        '</div>' +
        '<div class="rd-drawer__body" id="' + DRAWER_BODY + '"></div>' +
        /* No foot: primary actions live under the tabs. Delete stays
           in the bulk bar / full editor. renderInlineRecordEditor() guards
           every hook with `if (node)`, so omitting delete/cancel is safe. */
      '</aside>');

    layout.appendChild(d);
    bindDrawerChrome(d);
    syncDrawerSlot();
    return d;
  }

  function migrateDrawerHead(d) {
    var head = d.querySelector('.rd-drawer__head');
    if (!head || head.querySelector('.rd-drawer__toolbar')) return;
    var save = head.querySelector('[data-inline-editor-save]');
    var action = head.querySelector('[data-drawer-action]');
    var close = head.querySelector('[data-drawer-close]');
    var eyebrowEl = head.querySelector('.rd-drawer__eyebrow');
    var eyebrowText = eyebrowEl ? eyebrowEl.textContent : '';

    /* Top row: close only (right). */
    var actionsRow = head.querySelector('.rd-drawer__actions-row');
    if (!actionsRow) {
      actionsRow = document.createElement('div');
      actionsRow.className = 'rd-drawer__actions-row';
    } else {
      /* Empty the top row (Save/Mark move to toolbar); keep only close. */
      while (actionsRow.firstChild) actionsRow.removeChild(actionsRow.firstChild);
    }
    if (close) actionsRow.appendChild(close);

    /* Eyebrow full-width under close row. */
    var brow = head.querySelector('.rd-drawer__eyebrowrow');
    if (!brow) {
      brow = document.createElement('div');
      brow.className = 'rd-drawer__eyebrowrow';
      brow.setAttribute('data-drawer-eyebrow', '');
      var browSpan = document.createElement('span');
      browSpan.className = 'rd-drawer__eyebrow';
      browSpan.textContent = eyebrowText;
      brow.appendChild(browSpan);
    }

    /* Toolbar under tabs: Save/Add + Mark complete (same hooks). */
    var toolbar = document.createElement('div');
    toolbar.className = 'rd-drawer__toolbar';
    toolbar.setAttribute('data-drawer-toolbar', '');
    if (save) toolbar.appendChild(save);
    if (action) toolbar.appendChild(action);
    if (!save) {
      save = document.createElement('button');
      save.type = 'button';
      save.className = 'rd-btn rd-btn--primary';
      save.setAttribute('data-inline-editor-save', '');
      save.textContent = 'Save';
      toolbar.appendChild(save);
    }
    if (!action) {
      action = document.createElement('button');
      action.type = 'button';
      action.className = 'rd-btn';
      action.setAttribute('data-drawer-action', '');
      action.setAttribute('hidden', '');
      toolbar.appendChild(action);
    }

    var tabs = head.querySelector('.rd-drawer__tabs');
    var title = head.querySelector('.rd-drawer__title');
    var pills = head.querySelector('.rd-drawer__pills');

    /* Rebuild head order: actions → eyebrow → title → pills → tabs → toolbar */
    head.insertBefore(actionsRow, head.firstChild);
    if (brow.parentNode !== head) {
      var afterClose = actionsRow.nextSibling;
      head.insertBefore(brow, afterClose);
    } else if (brow.previousSibling !== actionsRow) {
      head.insertBefore(brow, actionsRow.nextSibling);
    }
    if (title) head.appendChild(title);
    if (pills) head.appendChild(pills);
    if (tabs) head.appendChild(tabs);
    head.appendChild(toolbar);
  }

  function drawerStep(delta) {
    var st = window.recordEditorState;
    if (!st || st.isNew || st.inlineMount !== DRAWER_BODY) return;
    if (typeof recordEditorRows !== 'function') return;
    var rows = recordEditorRows(st.key) || [];
    var idx = Number(st.index);
    if (!isFinite(idx)) return;
    var next = idx + delta;
    if (next < 0 || next >= rows.length) return;
    openDrawer(st.key, next);
  }

  function bindDrawerChrome(d) {
    var closeBtn = d.querySelector('[data-drawer-close]');
    var saveBtn = d.querySelector('[data-inline-editor-save]');
    var actionBtn = d.querySelector('[data-drawer-action]');
    if (closeBtn && !closeBtn._rdBound) {
      closeBtn._rdBound = true;
      closeBtn.addEventListener('click', closeDrawer);
    }
    if (saveBtn && !saveBtn._rdBound) {
      saveBtn._rdBound = true;
      saveBtn.addEventListener('click', function () {
        if (typeof saveInlineRecordEditor === 'function') saveInlineRecordEditor(false);
      });
    }
    if (actionBtn && !actionBtn._rdBound) {
      actionBtn._rdBound = true;
      actionBtn.addEventListener('click', function () {
        var st = window.recordEditorState;
        if (!st) return;
        if (st.key === 'guests') {
          if (typeof rdGuestFullEditor === 'function') rdGuestFullEditor();
          return;
        }
        if (st.key === 'party') {
          if (typeof rdPartyFullEditor === 'function') rdPartyFullEditor();
          return;
        }
        if (st.key === 'gifts') {
          if (typeof rdGiftsFullEditor === 'function') rdGiftsFullEditor();
          return;
        }
        if (st.key === 'tables') {
          if (typeof rdTablesFullEditor === 'function') rdTablesFullEditor();
          return;
        }
        if (st.key !== 'tasks' || typeof recordEditorSet !== 'function') return;
        recordEditorSet('status', 'Complete');
        if (typeof saveInlineRecordEditor === 'function') saveInlineRecordEditor(false);
      });
    }

    var prevBtn = d.querySelector('[data-drawer-prev]');
    var nextBtn = d.querySelector('[data-drawer-next]');
    if (prevBtn && !prevBtn._rdBound) {
      prevBtn._rdBound = true;
      prevBtn.addEventListener('click', function () { drawerStep(-1); });
    }
    if (nextBtn && !nextBtn._rdBound) {
      nextBtn._rdBound = true;
      nextBtn.addEventListener('click', function () { drawerStep(1); });
    }
    if (!document._rdDrawerNavKeys) {
      document._rdDrawerNavKeys = true;
      document.addEventListener('keydown', function (ev) {
        if (!ev.altKey) return;
        if (ev.key !== 'ArrowUp' && ev.key !== 'ArrowDown') return;
        var drawer = document.getElementById(DRAWER_ID);
        if (!drawer || drawer.hasAttribute('hidden')) return;
        var st = window.recordEditorState;
        if (!st || st.inlineMount !== DRAWER_BODY) return;
        ev.preventDefault();
        drawerStep(ev.key === 'ArrowUp' ? -1 : 1);
      });
    }

    /* renderInlineRecordEditor() replaces the body wholesale on every load
       and every re-render. Watch for that rather than patching planner.js. */
    var body = d.querySelector('#' + DRAWER_BODY);
    if (body && !body._rdObserved) {
      body._rdObserved = true;
      try {
        new MutationObserver(decorate)
          .observe(body, { childList: true });
      } catch (e) { /* tabs simply stay collapsed */ }
    }
  }

  /* ─────────────────────────────────────────────────────────────────────
     openRecordEditor() is the SAME record at full width. §16: the drawer
     tabs by field group, the pop-out shows every group at once — one
     editor at two densities, not two editors.
     ───────────────────────────────────────────────────────────────────── */
  function openFullEditor() {
    var st = window.recordEditorState;
    if (!st || typeof openRecordEditor !== 'function') return;
    var key = st.key, idx = st.index;
    closeDrawer(true);
    openRecordEditor(key, idx);
  }

  function esc(s) {
    return String(s == null ? '' : s).replace(/[&<>"]/g, function (c) {
      return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c];
    });
  }

  /* History is not a field group — the record editor doesn't emit it.
     Built here as .record-editor-section so it joins the same tab strip.
     Tasks already emit an editable Links section (full-editor parity), so
     only History is synthetic for tasks. Other entities may still need a
     read-only Links summary if the editor doesn't emit one. */
  function linksSectionHtml(st) {
    var d = (st && st.draft) || {};
    var rows = [];
    function row(label, text, present) {
      rows.push('<div class="rd-field-row"><span class="rd-field-row__label">' + esc(label) +
                '</span><span class="rd-field-row__value' + (present ? '' : ' is-empty') + '">' +
                esc(text) + '</span></div>');
    }
    var vendor = (typeof findRecordById === 'function' && d.vendorId)
      ? findRecordById('vendors', d.vendorId) : null;
    var budget = (typeof findRecordById === 'function' && d.budgetCategoryId)
      ? findRecordById('budget', d.budgetCategoryId) : null;

    row('Vendor', vendor ? (vendor.name || '(untitled)') : 'Not linked', !!vendor);
    if (budget) {
      var amt = budget.planned || budget.target || budget.actual;
      row('Budget line', (budget.cat || '') + (amt ? ' · $' + Number(amt).toLocaleString() : ''), true);
    } else {
      row('Budget line', 'Not linked', false);
    }
    if (d.assigned) row('Owner', d.assigned, true);
    return '<section class="record-editor-section rd-drawer-fields" data-drawer-synth="Links" data-drawer-group="links"><h4>Links</h4>' +
           rows.join('') + '</section>';
  }

  function historySectionHtml(st) {
    var entries = (typeof recordHistoryFor === 'function' && st && st.draft)
      ? recordHistoryFor(st.key, st.draft._id) : [];
    if (!entries.length) {
      return '<section class="record-editor-section" data-drawer-synth="History" data-drawer-group="history"><h4>History</h4>' +
             '<div class="rd-empty">No changes recorded for this record yet.</div></section>';
    }
    var html = entries.slice(0, 20).map(function (e) {
      var changes = (e.changes || []).map(function (c) {
        return '<div class="rd-hist__change"><span class="rd-hist__field">' + esc(c.label) +
               '</span><span class="rd-hist__from">' + esc(c.from) + '</span>' +
               '<span class="rd-hist__arrow">&#8594;</span>' +
               '<span class="rd-hist__to">' + esc(c.to) + '</span></div>';
      }).join('');
      return '<div class="rd-hist"><div class="rd-hist__top">' + esc(e.action) +
             '<span class="rd-hist__when">' + esc(e.date) + ' · ' + esc(e.time) + '</span></div>' +
             changes + '</div>';
    }).join('');
    return '<section class="record-editor-section" data-drawer-synth="History" data-drawer-group="history"><h4>History</h4>' +
           html + '</section>';
  }

  var DRAWER_PAGE_CRUMB = {
    guests: 'Guest List / Guest',
    party: 'Wedding Party / Member',
    gifts: 'Gifts / Gift',
    tables: 'Table Layout / Table',
    tasks: 'Timeline & Tasks / Task',
    appointments: 'Appointments / Appointment',
    vendors: 'Venue & Vendors / Vendor',
    venue: 'Venue Comparison / Venue',
    catering: 'Catering & Menu / Menu item',
    menu: 'Catering & Menu / Menu item',
    entertainment: 'Entertainment / Song',
    recSongs: 'Entertainment / Song',
    receptionPlaylist: 'Entertainment / Song',
    doNotPlay: 'Entertainment / Song',
    mustPlay: 'Entertainment / Song',
    shotlist: 'Shot Lists / Shot',
    videoShots: 'Shot Lists / Shot',
    videoShotlist: 'Shot Lists / Shot',
    timeline: 'Wedding Day Timeline / Event',
    wdayTimeline: 'Wedding Day Timeline / Event',
    ceremonyOrder: 'Ceremony & Reception / Element',
    ceremonyReceptionDetails: 'Ceremony & Reception / Element',
    scriptures: 'Ceremony & Reception / Element',
    ceremonyVows: 'Ceremony & Reception / Element',
    speeches: 'Ceremony & Reception / Element',
    honeyDetails: 'Honeymoon & After / Booking',
    honeyTransport: 'Honeymoon & After / Booking',
    honeyItinerary: 'Honeymoon & After / Itinerary',
    packing: 'Honeymoon & After / Packing',
    hmBudgetItems: 'Honeymoon & After / Budget line',
    hmJournal: 'Honeymoon & After / Journal',
    prayer: 'Prayer Journal / Entry',
    counseling: 'Premarital Counseling / Session',
    moodItems: 'Vision Board / Pin',
    moodPhotos: 'Vision Board / Pin',
    palettes: 'Vision Board / Palette',
    essentials: 'Essentials Checklist / Item',
    packets: 'Share Packets / Packet',
    emailTemplates: 'Email Templates / Template',
    notesDetails: 'Notes / Note',
    'data-hub': 'Database Hub / Hub table',
    weekendTimeline: 'Weekend Logistics / Movement',
    hotelBlocks: 'Weekend Logistics / Hotel block',
    travelAccommodations: 'Weekend Logistics / Travel',
    transportation: 'Weekend Logistics / Route',
    vipCare: 'Weekend Logistics / VIP care'
  };

  function formatDrawerDate(iso) {
    if (!iso) return '—';
    try {
      if (typeof humanDate === 'function') {
        return humanDate(String(iso).slice(0, 10), { day: 'numeric', month: 'short', year: 'numeric' }) || String(iso).slice(0, 10);
      }
    } catch (e) { /* fall through */ }
    return String(iso).slice(0, 10);
  }

  function drawerActorInitials() {
    try {
      var el = document.getElementById('rd-profile-initials');
      var t = el && el.textContent ? el.textContent.trim() : '';
      if (t && t !== '--') return t;
    } catch (e) { /* soft */ }
    return 'You';
  }

  function applyDrawerDepthHead(d, st, draft) {
    ensureDrawerDepthChrome(d);
    var nav = d.querySelector('[data-drawer-nav]');
    var posEl = d.querySelector('[data-drawer-position]');
    var crumb = d.querySelector('[data-drawer-crumb]');
    var avatar = d.querySelector('[data-drawer-avatar]');
    var quick = d.querySelector('[data-drawer-quick]');
    var browRow = d.querySelector('[data-drawer-eyebrow]');

    if (crumb && st) {
      crumb.textContent = DRAWER_PAGE_CRUMB[st.key] || ((typeof recordEditorTitle === 'function' ? recordEditorTitle(st.key) : st.key) + ' / Record');
      crumb.hidden = false;
    } else if (crumb) {
      crumb.hidden = true;
    }

    if (avatar) {
      var name =
        (draft && (draft.name || draft.task || draft.title || draft.desc || draft.from || draft.event || draft.hotel || draft.guest)) ||
        (st && st.isNew ? 'New' : '?');
      avatar.textContent = (typeof RdDepth !== 'undefined' && RdDepth.initials)
        ? RdDepth.initials(name)
        : String(name).charAt(0).toUpperCase();
    }

    if (nav && posEl && st && !st.isNew && typeof recordEditorRows === 'function') {
      var rows = recordEditorRows(st.key) || [];
      var idx = Number(st.index);
      if (rows.length && isFinite(idx) && idx >= 0) {
        posEl.textContent = (idx + 1) + ' of ' + rows.length;
        nav.hidden = false;
        var prev = nav.querySelector('[data-drawer-prev]');
        var next = nav.querySelector('[data-drawer-next]');
        if (prev) prev.disabled = idx <= 0;
        if (next) next.disabled = idx >= rows.length - 1;
      } else {
        nav.hidden = true;
      }
    } else if (nav) {
      nav.hidden = true;
    }

    /* Contact quick actions for person-bearing records. */
    var showQuick = st && (st.key === 'guests' || st.key === 'party' || st.key === 'gifts' || st.key === 'vendors' || st.key === 'contacts');
    if (quick) {
      if (showQuick && typeof RdDepth !== 'undefined' && RdDepth.quickActionsHtml) {
        quick.outerHTML = RdDepth.quickActionsHtml(draft);
        quick = d.querySelector('[data-drawer-quick]');
        if (quick) quick.hidden = false;
      } else {
        quick.hidden = true;
        quick.innerHTML = '';
      }
    }

    /* Eyebrow text still set by decorate(); keep row for sub-context under crumb when no identity role. */
    if (browRow && crumb && !crumb.hidden) {
      /* Prefer crumb + identity; leave eyebrow as secondary context when it has content. */
    }
  }

  function guestRelatedBlocksHtml(draft) {
    if (typeof RdDepth === 'undefined' || !RdDepth.relatedBlock) return '';
    var name = String(draft && draft.name || '').trim().toLowerCase();
    var gifts = [];
    try {
      (typeof safeArray === 'function' ? safeArray(window.data && window.data.gifts) : (window.data && window.data.gifts) || [])
        .forEach(function (g) {
          if (name && String(g.from || '').trim().toLowerCase() === name) {
            gifts.push({ left: g.desc || 'Gift', right: g.thankyou ? 'Note sent' : 'Note due' });
          }
        });
    } catch (e) { /* soft */ }
    var appts = [];
    try {
      (typeof safeArray === 'function' ? safeArray(window.data && window.data.appointments) : (window.data && window.data.appointments) || [])
        .forEach(function (a) {
          var who = String(a.contact || a.title || '').toLowerCase();
          if (name && who.indexOf(name.split(/\s+/)[0]) !== -1) {
            appts.push({ left: a.title || 'Appointment', right: a.date || '' });
          }
        });
    } catch (e2) { /* soft */ }
    return (
      RdDepth.relatedBlock({
        id: 'gifts',
        title: 'Gifts · ' + gifts.length,
        page: 'gifts',
        pageLabel: 'Open Gifts',
        addLabel: 'Add gift',
        addKey: 'gifts',
        rows: gifts.slice(0, 5),
        empty: 'No gifts from this guest yet.'
      }) +
      RdDepth.relatedBlock({
        id: 'appointments',
        title: 'Appointments · ' + appts.length,
        page: 'appointments',
        pageLabel: 'Open Appointments',
        addLabel: 'Add…',
        addKey: 'appointments',
        rows: appts.slice(0, 5),
        empty: 'No appointments touch this guest.'
      })
    );
  }

  function activityEntriesFromHistory(st) {
    if (!st || !st.draft || typeof recordHistoryFor !== 'function') return [];
    var entries = recordHistoryFor(st.key, st.draft._id) || [];
    return entries.slice(0, 12).map(function (e) {
      var changes = e.changes || [];
      var text = e.action || 'Updated';
      var consequence = false;
      var effect = '';
      changes.forEach(function (c) {
        var lab = String(c.label || c.field || '').toLowerCase();
        text = (c.label || c.field || 'Field') + ' → ' + (c.to || '—');
        if (/rsvp|reply|accepted|declined/.test(lab) || /yes|accept/i.test(String(c.to || ''))) {
          consequence = true;
          if (/yes|accept/i.test(String(c.to || ''))) effect = '+1 cover';
          if (/no|declin|regret/i.test(String(c.to || ''))) effect = '−1 cover';
        }
        if (/table|seat/.test(lab)) {
          consequence = true;
          effect = effect || 'seating changed';
        }
        if (/status|complete|paid/.test(lab)) consequence = true;
      });
      return {
        text: text,
        when: (e.date || '') + (e.time ? ' · ' + e.time : ''),
        consequence: consequence,
        effect: effect
      };
    });
  }

  function applyDrawerDepthBody(d, st, draft, body) {
    if (!body || !st) return;
    if (typeof RdDepth !== 'undefined' && RdDepth.decorateEmptyFields) {
      RdDepth.decorateEmptyFields(body);
    }

    /* Related + comments + activity + provenance once per body paint (not inside History tab only). */
    if (!body.querySelector('[data-rd-depth-extras]')) {
      var extras = document.createElement('div');
      extras.setAttribute('data-rd-depth-extras', '1');
      extras.className = 'rd-drawer-depth-extras';
      var parts = '';
      if (st.key === 'guests') parts += guestRelatedBlocksHtml(draft);
      if (typeof RdDepth !== 'undefined') {
        if (RdDepth.commentsBlock) {
          parts += RdDepth.commentsBlock(draft && draft.comments);
        }
        if (RdDepth.activityBlock) {
          parts += RdDepth.activityBlock(activityEntriesFromHistory(st));
        }
        if (RdDepth.provenanceLine) {
          var hist = (typeof recordHistoryFor === 'function' && draft && draft._id)
            ? (recordHistoryFor(st.key, draft._id) || []) : [];
          var created = hist.length ? hist[hist.length - 1] : null;
          var modified = hist.length ? hist[0] : created;
          parts += RdDepth.provenanceLine({
            created: created ? formatDrawerDate(created.date) : formatDrawerDate(draft && draft.createdAt),
            createdBy: (created && created.by) || drawerActorInitials(),
            modified: modified ? formatDrawerDate(modified.date) : formatDrawerDate((window.data && window.data.updatedAt) || ''),
            modifiedBy: (modified && modified.by) || drawerActorInitials()
          });
        }
      }
      extras.innerHTML = parts;
      body.appendChild(extras);

      extras.querySelectorAll('[data-rd-related-page]').forEach(function (a) {
        a.addEventListener('click', function (ev) {
          ev.preventDefault();
          var page = a.getAttribute('data-rd-related-page');
          if (page && typeof showPanel === 'function') showPanel(page, true);
        });
      });
      extras.querySelectorAll('[data-rd-related-add]').forEach(function (btn) {
        btn.addEventListener('click', function () {
          var key = btn.getAttribute('data-rd-related-add');
          if (!key) return;
          if (typeof showPanel === 'function') {
            var page = key === 'gifts' ? 'gifts' : key === 'appointments' ? 'appointments' : key;
            showPanel(page, true);
          }
        });
      });
    }
  }

  /* ─────────────────────────────────────────────────────────────────────
     §16: the drawer tabs by FIELD GROUP. Task editor emits Task / Schedule /
     Links / Subtasks / Notes with data-drawer-group. History is synthetic.
     Task tab stacks Task+Schedule+Notes (too many short tabs for 360px);
     Subtasks / Links / History keep dedicated tabs — every field reachable.
     ───────────────────────────────────────────────────────────────────── */
  var DECORATING = false;
  var TASK_DRAWER_TABS = ['Task', 'Subtasks', 'Links', 'History'];
  var TASK_DRAWER_TAB_MAX = TASK_DRAWER_TABS.length - 1;
  /* 14a: Appointment · Travel · Who · History */
  var APPT_DRAWER_TABS = ['Appointment', 'Travel', 'Who', 'History'];
  var APPT_DRAWER_TAB_MAX = APPT_DRAWER_TABS.length - 1;
  /* 11d: Movement · People · Transport · History */
  var LOG_DRAWER_TABS = ['Movement', 'People', 'Transport', 'History'];
  var LOG_DRAWER_TAB_MAX = LOG_DRAWER_TABS.length - 1;
  /* 3b: Identity · Response · Contact · Invitation · Party · Note · History */
  var GUEST_DRAWER_TABS = ['Identity', 'Response', 'Contact', 'Invitation', 'Party', 'Note', 'History'];
  var GUEST_DRAWER_TAB_MAX = GUEST_DRAWER_TABS.length - 1;
  var LOG_DRAWER_KEYS = {
    weekendTimeline: 1, hotelBlocks: 1, travelAccommodations: 1,
    transportation: 1, vipCare: 1
  };

  function taskDrawerTabLabel(section) {
    var g = section.getAttribute('data-drawer-group');
    if (g === 'schedule') return 'Schedule';
    if (g === 'notes') return 'Notes';
    if (g === 'links') return 'Links';
    if (g === 'history') return 'History';
    if (g === 'subtasks') return 'Subtasks';
    if (g === 'task') return 'Task';
    var h4 = section.querySelector('h4');
    var raw = (h4 && h4.textContent.trim()) || '';
    if (/^Subtasks/i.test(raw)) return 'Subtasks';
    if (raw === 'Notes') return 'Notes';
    if (raw === 'Schedule') return 'Schedule';
    var map = { 'Task Details': 'Task', 'Task': 'Task', 'Subtasks': 'Subtasks', 'Links': 'Links', 'History': 'History' };
    return map[raw] || raw.replace(/\s*Details$/i, '');
  }

  function taskDrawerSectionGroup(section) {
    var g = section.getAttribute('data-drawer-group');
    if (g) return g;
    var synth = section.getAttribute('data-drawer-synth');
    if (synth) return synth.toLowerCase();
    return 'task';
  }

  /* Class hide must beat redesign-overrides `display: flex !important` on
     .record-editor-section — plain style.display = 'none' loses that fight. */
  function setDrawerSectionVisible(section, show) {
    if (!section || !section.classList) return;
    section.classList.toggle('is-drawer-tab-hidden', !show);
  }

  /* Task tab: Task + Schedule + Notes. Dedicated tabs for the rest. */
  function showTaskDrawerSections(sections, tabIndex) {
    sections.forEach(function (s) {
      var g = taskDrawerSectionGroup(s);
      var show = false;
      if (tabIndex === 0) show = (g === 'task' || g === 'schedule' || g === 'notes');
      else if (tabIndex === 1) show = (g === 'subtasks');
      else if (tabIndex === 2) show = (g === 'links');
      else if (tabIndex === 3) show = (g === 'history');
      setDrawerSectionVisible(s, show);
    });
  }

  function apptDrawerSectionGroup(section) {
    var g = section.getAttribute('data-drawer-group');
    if (g) return g;
    var synth = section.getAttribute('data-drawer-synth');
    if (synth) return synth.toLowerCase();
    var h4 = section.querySelector('h4');
    var raw = (h4 && h4.textContent.trim()) || '';
    if (/travel/i.test(raw)) return 'travel';
    if (/who|attend/i.test(raw)) return 'who';
    if (/history/i.test(raw)) return 'history';
    return 'appointment';
  }

  function showApptDrawerSections(sections, tabIndex) {
    sections.forEach(function (s) {
      var g = apptDrawerSectionGroup(s);
      var show = false;
      if (tabIndex === 0) show = (g === 'appointment' || g === 'calendar' || !g ||
        (g !== 'travel' && g !== 'who' && g !== 'history'));
      else if (tabIndex === 1) show = (g === 'travel');
      else if (tabIndex === 2) show = (g === 'who');
      else if (tabIndex === 3) show = (g === 'history');
      setDrawerSectionVisible(s, show);
    });
  }

  function logisticsDrawerSectionGroup(section) {
    var g = section.getAttribute('data-drawer-group');
    if (g) return g;
    var synth = section.getAttribute('data-drawer-synth');
    if (synth) return synth.toLowerCase();
    var h4 = section.querySelector('h4');
    var raw = (h4 && h4.textContent.trim()) || '';
    if (/people/i.test(raw)) return 'people';
    if (/transport|route/i.test(raw)) return 'transport';
    if (/history/i.test(raw)) return 'history';
    return 'movement';
  }

  function showLogDrawerSections(sections, tabIndex) {
    sections.forEach(function (s) {
      var g = logisticsDrawerSectionGroup(s);
      var show = false;
      if (tabIndex === 0) show = (g === 'movement' || (!g && g !== 'people' && g !== 'transport' && g !== 'history'));
      else if (tabIndex === 1) show = (g === 'people');
      else if (tabIndex === 2) show = (g === 'transport');
      else if (tabIndex === 3) show = (g === 'history');
      setDrawerSectionVisible(s, show);
    });
  }

  /* 3b: one sole field pane (re-rendered per tab in planner) + synthetic History */
  function guestDrawerSectionGroup(section) {
    var g = section.getAttribute('data-drawer-group');
    if (g) return g;
    var synth = section.getAttribute('data-drawer-synth');
    if (synth) return String(synth).toLowerCase();
    if (section.getAttribute('data-guest-drawer-pane')) return 'identity';
    return 'identity';
  }

  function showGuestDrawerSections(sections, tabIndex) {
    sections.forEach(function (s) {
      var g = guestDrawerSectionGroup(s);
      var isHist = g === 'history';
      var isSole = s.getAttribute('data-guest-drawer-pane');
      var isSynth = s.getAttribute('data-drawer-synth');
      /* Mock 21 continued: sole pane re-renders per tab, including History. */
      if (isSole) {
        setDrawerSectionVisible(s, true);
      } else if (isSynth || isHist) {
        setDrawerSectionVisible(s, false);
      } else {
        setDrawerSectionVisible(s, true);
      }
    });
  }

  function showGroupedDrawerSections(sections, tabIndex) {
    sections.forEach(function (s, si) {
      setDrawerSectionVisible(s, si === tabIndex);
    });
  }

  function readDrawerTab(d, max) {
    var n = parseInt(d && d.dataset ? d.dataset.drawerTab : '0', 10);
    if (!isFinite(n) || n < 0) n = 0;
    if (typeof max === 'number' && n > max) n = 0;
    return n;
  }

  function writeDrawerTab(d, tabIndex) {
    if (d && d.dataset) d.dataset.drawerTab = String(tabIndex);
  }

  function decorate() {
    if (DECORATING) return;                    /* our own appends re-fire the observer */
    var d = document.getElementById(DRAWER_ID);
    if (!d) return;
    var body = d.querySelector('#' + DRAWER_BODY);
    var strip = d.querySelector('[data-drawer-tabs]');
    if (!body || !strip) return;
    var st = window.recordEditorState;
    d.classList.toggle('is-guest-drawer', !!(st && st.key === 'guests'));
    d.classList.toggle('is-party-drawer', !!(st && st.key === 'party'));
    d.classList.toggle('is-gifts-drawer', !!(st && st.key === 'gifts'));

    /* A record arriving in the mount is the signal to show the drawer —
       bindRoPreviewInline() calls covInlineLoad() directly, so a row click
       reaches the drawer without going through openDrawer().
       Only unhide for a real inline mount in this drawer (not leftover state
       or other mount points), or an empty white flex drawer covers Tasks. */
    var mountedHere = st && st.inlineMount === DRAWER_BODY;
    if (mountedHere) d.removeAttribute('hidden');
    else if (!mountedHere && d.parentElement &&
             (d.parentElement.id === 'task-drawer-slot' ||
              d.parentElement.id === 'appointment-drawer-slot' ||
              d.parentElement.id === 'logistics-drawer-slot' ||
              d.parentElement.id === 'guest-drawer-slot' ||
              d.parentElement.id === 'party-drawer-slot' ||
              d.parentElement.id === 'gifts-drawer-slot' ||
              d.parentElement.id === 'tables-drawer-slot')) {
      /* Keep closed while editor targets another mount or nothing. */
      if (!st || st.inlineMount !== DRAWER_BODY) d.setAttribute('hidden', '');
    }
    syncDrawerSlot();

    DECORATING = true;
    try {
      /* ── head: eyebrow · title · pills ───────────────────────────────── */
      var eyebrow = d.querySelector('[data-drawer-eyebrow] .rd-drawer__eyebrow') ||
                    d.querySelector('[data-drawer-eyebrow] span') ||
                    d.querySelector('[data-drawer-eyebrow]');
      var titleEl = d.querySelector('[data-inline-editor-mode]');
      var pills = d.querySelector('.rd-drawer__pills');
      var draft = (st && st.draft) || {};

      /* New record (or key change) → start on first tab; same record re-render keeps tab. */
      var recordKey = st ? (String(st.key || '') + ':' + String(draft._id || (st.isNew ? 'new' : st.index))) : '';
      if (recordKey !== (d.dataset.drawerRecordKey || '')) {
        d.dataset.drawerRecordKey = recordKey;
        writeDrawerTab(d, 0);
      }

      if (eyebrow) {
        var type = (st && typeof recordEditorTitle === 'function') ? recordEditorTitle(st.key) : '';
        var monthBit = '';
        if (st && st.key === 'appointments' && draft.date && typeof humanDate === 'function') {
          try {
            var md = humanDate(draft.date, { month: 'long' });
            if (md && md !== '—') monthBit = ' · ' + md;
          } catch (eM) { monthBit = ''; }
        } else if (draft.phase) {
          monthBit = ' · ' + draft.phase;
        }
        eyebrow.textContent = (type + monthBit).trim();
      }
      if (titleEl && st && st.key === 'tasks') {
        titleEl.textContent = st.isNew ? 'New task' : (draft.task || 'Untitled task');
      }
      if (titleEl && st && st.key === 'appointments') {
        titleEl.textContent = st.isNew ? 'New appointment' : (draft.title || 'Untitled appointment');
      }
      if (titleEl && st && st.key === 'guests') {
        titleEl.textContent = st.isNew ? 'New guest' : (draft.name || 'Untitled guest');
      }
      if (titleEl && st && st.key === 'party') {
        titleEl.textContent = st.isNew ? 'New member' : (draft.name || 'Untitled member');
      }
      if (titleEl && st && st.key === 'gifts') {
        titleEl.textContent = st.isNew ? 'New gift' : (draft.desc || 'Untitled gift');
      }
      if (titleEl && st && st.key === 'tables') {
        var tIdx = st.index != null ? Number(st.index) : -1;
        var tCode = (typeof tableCode === 'function' && tIdx >= 0) ? tableCode(draft, tIdx)
          : (typeof guestTableLabelShort === 'function' ? guestTableLabelShort(draft.name) : (draft.name || 'Table'));
        var tName = (typeof tableDisplayName === 'function') ? tableDisplayName(draft) : (draft.label || draft.name || 'Table');
        titleEl.textContent = st.isNew ? 'New table' : (tCode + ' · ' + tName);
      }
      if (eyebrow && st && st.key === 'guests') {
        var gHh = String(draft.household || '').trim();
        if (gHh && !/household$/i.test(gHh)) gHh = gHh + ' household';
        eyebrow.textContent = gHh ? ('Guest · ' + gHh) : 'Guest';
      }
      if (eyebrow && st && st.key === 'party') {
        var pSide = (typeof partyMemberSide === 'function') ? partyMemberSide(draft) : (draft.side || 'Bride');
        var sideLab = String(pSide).toLowerCase() === 'groom' ? 'groom\u2019s side' : 'bride\u2019s side';
        eyebrow.textContent = 'Wedding party · ' + sideLab;
      }
      if (eyebrow && st && st.key === 'gifts') {
        var gTypeLab = (typeof giftType === 'function') ? giftType(draft) : (draft.category || 'Gift');
        eyebrow.textContent = 'Gift · ' + String(gTypeLab || 'gift').toLowerCase();
      }
      if (eyebrow && st && st.key === 'tables') {
        var tCap = parseInt(draft.capacity || draft.cap, 10) || 0;
        eyebrow.textContent = 'Table · ' + (tCap || '?') + ' seats';
      }

      /* Depth · drawer: avatar, crumb, nav position, quick actions */
      applyDrawerDepthHead(d, st, draft);

      /* Mock 21d: sub-line under name (role) · plus-one as head pill */
      var subEl = d.querySelector('[data-drawer-sub]');
      var guestSubTxt = '';
      var guestPlusPill = false;
      if (st && st.key === 'guests') {
        if (!subEl) {
          subEl = el('<div class="rd-drawer__sub" data-drawer-sub></div>');
          var idText = d.querySelector('.rd-drawer__identity-text') || d.querySelector('[data-inline-editor-mode]')?.parentNode;
          var titleNode = d.querySelector('[data-inline-editor-mode]');
          if (idText && titleNode && titleNode.parentNode === idText) idText.appendChild(subEl);
          else if (titleNode && titleNode.parentNode) titleNode.parentNode.insertBefore(subEl, titleNode.nextSibling);
        }
        if (typeof guestNameSubline === 'function') guestSubTxt = guestNameSubline(draft) || '';
        if (!guestSubTxt && draft.role) guestSubTxt = String(draft.role);
        guestPlusPill = /plus one/i.test(guestSubTxt);
        if (guestPlusPill) {
          subEl.hidden = true;
          subEl.textContent = '';
        } else {
          subEl.textContent = guestSubTxt.replace(/^·\s*/, '');
          subEl.hidden = !guestSubTxt;
        }
      } else if (subEl) {
        subEl.hidden = true;
        subEl.textContent = '';
      }
      if (titleEl && st && LOG_DRAWER_KEYS[st.key]) {
        if (st.isNew) {
          titleEl.textContent = st.key === 'hotelBlocks' ? 'New hotel block'
            : st.key === 'transportation' ? 'New route'
            : st.key === 'travelAccommodations' ? 'New travel row'
            : st.key === 'vipCare' ? 'New VIP care item'
            : 'New movement';
        } else {
          titleEl.textContent = draft.event || draft.hotel || draft.guest || draft.pickup || draft.person || 'Untitled';
        }
      }
      if (eyebrow && st && LOG_DRAWER_KEYS[st.key]) {
        var dayBit = '';
        if (draft.date && typeof humanDate === 'function') {
          try {
            dayBit = ' · ' + humanDate(draft.date, { weekday: 'long' });
          } catch (eD) { dayBit = ''; }
        }
        var typeLab = st.key === 'hotelBlocks' ? 'Hotel block'
          : st.key === 'transportation' ? 'Route'
          : st.key === 'travelAccommodations' ? 'Travel'
          : st.key === 'vipCare' ? 'VIP care'
          : 'Movement';
        eyebrow.textContent = (typeLab + dayBit).trim();
      }
      if (pills) {
        var pos = pills.querySelector('[data-inline-editor-position]');
        if (pos) pos.style.display = 'none';
        var chips = '';
        if (draft.status) {
          /* pillSchemeFor takes the VALUE first — passing the entity key
             silently returned the neutral fallback and painted every
             "Complete" gray, which §02 reserves for inert states.
             Screen 9a sentence-cases the label ("In progress"). */
          var scheme = (typeof pillSchemeFor === 'function')
            ? (pillSchemeFor(draft.status) || 'gray') : 'gray';
          var statusLabel = String(draft.status)
            .replace(/^In Progress$/i, 'In progress')
            .replace(/^Not Started$/i, 'Not started');
          if (st && st.key === 'appointments' && draft.date) {
            var whenLabel = draft.date;
            try {
              if (typeof humanDate === 'function') {
                whenLabel = humanDate(draft.date, { month: 'short', day: 'numeric' });
                if (draft.time && typeof humanTime === 'function') whenLabel += ' · ' + humanTime(draft.time);
              }
            } catch (eW) { /* keep ISO */ }
            chips += '<span class="status-pill" data-pillscheme="blue">' + esc(whenLabel) + '</span>';
          }
          chips += '<span class="status-pill" data-pillscheme="' + esc(scheme) + '">' + esc(statusLabel) + '</span>';
        }
        /* Derived, never stored — §07 and the appendix data contract. */
        if (typeof taskIsOverdue === 'function' && st && st.key === 'tasks' && taskIsOverdue(draft)) {
          var days = Math.floor((Date.now() - new Date(draft.date + 'T00:00:00')) / 86400000);
          chips += '<span class="status-pill" data-pillscheme="red">Overdue ' + days +

                   (days === 1 ? ' day' : ' days') + '</span>';
        }
        if (st && st.key === 'guests') {
          var rsvpLab = draft.rsvp || (draft.invited === false ? 'Not invited' : 'Pending');
          if (!(draft.invited || (typeof guestIsInvited === 'function' && guestIsInvited(draft))) &&
              (!String(draft.rsvp || '').trim() || /pending/i.test(String(draft.rsvp || '')))) {
            rsvpLab = 'Not invited';
          }
          var rsvpScheme = /yes|accept/i.test(rsvpLab) ? 'green'
            : /no|declin|regret/i.test(rsvpLab) ? 'red'
            : /not invited/i.test(rsvpLab) ? 'neutral'
            : 'amber';
          chips += '<span class="status-pill" data-pillscheme="' + esc(rsvpScheme) + '">' + esc(rsvpLab) + '</span>';
          var seatLab = (typeof guestDrawerSeatDisplay === 'function') ? guestDrawerSeatDisplay(draft) : '';
          if (seatLab) {
            chips += '<span class="status-pill" data-pillscheme="blue">' + esc(seatLab) + '</span>';
          } else if (guestPlusPill && guestSubTxt) {
            chips += '<span class="status-pill" data-pillscheme="blue">' + esc(guestSubTxt.replace(/^·\s*/, '')) + '</span>';
          }
        }
        if (st && st.key === 'party') {
          if (draft.role) {
            chips += '<span class="status-pill" data-pillscheme="blue">' + esc(draft.role) + '</span>';
          }
          var attLab = (typeof partyAttireStatus === 'function') ? partyAttireStatus(draft) : (draft.attireStatus || '');
          if (attLab) {
            var attScheme = attLab === 'Fitted & paid' ? 'green' : (attLab === 'Deposit only' ? 'amber' : 'neutral');
            chips += '<span class="status-pill" data-pillscheme="' + esc(attScheme) + '">' + esc(attLab) + '</span>';
          }
        }
        if (st && st.key === 'gifts') {
          var giftVal = parseFloat(draft.value) || 0;
          if (giftVal) {
            var valTxt = (typeof fmt === 'function') ? fmt(giftVal) : ('$' + giftVal.toLocaleString());
            chips += '<span class="status-pill" data-pillscheme="blue">' + esc(valTxt) + '</span>';
          }
          var thankLab = (typeof giftThankStatus === 'function') ? giftThankStatus(draft)
            : (draft.thankyou ? 'Note sent' : 'Note due');
          if (thankLab === 'Sent') thankLab = 'Note sent';
          else if (thankLab === 'Not started') thankLab = 'Note due';
          else if (thankLab === 'Drafted') thankLab = 'Drafted';
          var thankScheme = /sent/i.test(thankLab) ? 'green' : (/draft/i.test(thankLab) ? 'amber' : 'red');
          chips += '<span class="status-pill" data-pillscheme="' + esc(thankScheme) + '">' + esc(thankLab) + '</span>';
        }
        if (st && st.key === 'tables') {
          var tCap2 = parseInt(draft.capacity || draft.cap, 10) || 0;
          var tSeated = (typeof tableSeatedCount === 'function') ? tableSeatedCount(draft) : 0;
          var tFree = Math.max(0, tCap2 - tSeated);
          if (tFree > 0) {
            chips += '<span class="status-pill" data-pillscheme="amber">' + tFree + ' free seat' + (tFree === 1 ? '' : 's') + '</span>';
          }
          if (tCap2) {
            chips += '<span class="status-pill" data-pillscheme="neutral">' + tSeated + ' of ' + tCap2 + '</span>';
          }
        }
        pills.innerHTML = chips;
      }

      /* ── body: synthetic History (+ Links only when editor doesn't emit it) */
      var isTasks = st && st.key === 'tasks';
      var isAppts = st && st.key === 'appointments';
      var isGuests = st && st.key === 'guests';
      var isParty = st && st.key === 'party';
      var isGifts = st && st.key === 'gifts';
      var isTables = st && st.key === 'tables';
      var isLogs = st && LOG_DRAWER_KEYS[st.key];
      if (st && st.key !== 'guests' && st.key !== 'party' && st.key !== 'gifts' && st.key !== 'tables' && !body.querySelector('[data-drawer-synth="History"]')) {
        var synth = historySectionHtml(st);
        /* Guests mock 3b has no Links tab — History only after Note */
        if (!isTasks && !isAppts && !isLogs && !body.querySelector('[data-drawer-group="links"]')) {
          synth = linksSectionHtml(st) + synth;
        }
        body.insertAdjacentHTML('beforeend', synth);
      }

      applyDrawerDepthBody(d, st, draft, body);

      /* ── the tab strip ───────────────────────────────────────────────── */
      var sections = [].slice.call(body.children).filter(function (n) {
        return n.classList && n.classList.contains('record-editor-section');
      });
      /* Capture selection before rebuild so MutationObserver re-decorate
         (field edits, synth inject) does not snap back to tab 0. */
      var activeTab = readDrawerTab(d, isTasks ? TASK_DRAWER_TAB_MAX : (isAppts ? APPT_DRAWER_TAB_MAX : (isLogs ? LOG_DRAWER_TAB_MAX : (isGuests ? Math.max(0, ((typeof guestDrawerShellTabs === 'function' ? guestDrawerShellTabs() : GUEST_DRAWER_TABS).length - 1)) : (isParty ? Math.max(0, ((typeof partyDrawerShellTabs === 'function' ? partyDrawerShellTabs() : ['Role','Attire','Duties','Contact','History']).length - 1)) : (isGifts ? Math.max(0, ((typeof giftsDrawerShellTabs === 'function' ? giftsDrawerShellTabs() : ['Gift','Giver','Thank-you','History']).length - 1)) : (isTables ? Math.max(0, ((typeof tablesDrawerShellTabs === 'function' ? tablesDrawerShellTabs() : ['Table','Seats','Notes','History']).length - 1)) : Math.max(0, sections.length - 1))))))));

      strip.innerHTML = '';
      if (sections.length < 2 && !isGuests && !isParty && !isGifts && !isTables) {
        strip.setAttribute('hidden', '');
        strip.classList.remove('is-guest-tabs');
        strip.classList.remove('is-party-tabs');
        strip.classList.remove('is-gifts-tabs');
        strip.classList.remove('is-tables-tabs');
        sections.forEach(function (s) { setDrawerSectionVisible(s, true); });
        writeDrawerTab(d, 0);
      } else {
        strip.removeAttribute('hidden');
        if (!isGuests && !isParty && !isGifts && !isTables) strip.classList.remove('is-guest-tabs', 'is-party-tabs', 'is-gifts-tabs', 'is-tables-tabs');
        if (isTasks) {
          if (activeTab > TASK_DRAWER_TAB_MAX) activeTab = 0;
          TASK_DRAWER_TABS.forEach(function (label, i) {
            var b = el('<button type="button"' + (i === activeTab ? ' class="is-active"' : '') + '>' +
                       esc(label) + '</button>');
            b.addEventListener('click', function (ev) {
              if (ev && typeof ev.preventDefault === 'function') ev.preventDefault();
              writeDrawerTab(d, i);
              [].slice.call(strip.children).forEach(function (x, xi) {
                x.classList.toggle('is-active', xi === i);
              });
              showTaskDrawerSections(sections, i);
            });
            strip.appendChild(b);
          });
          sections.forEach(function (section) {
            var h4 = section.querySelector('h4');
            if (!h4) return;
            /* Task tab stacks three groups — keep their section eyebrows.
               Links/History titles live in the tab strip. Subtasks keep the
               count eyebrow. */
            var label = taskDrawerTabLabel(section);
            var keepH4 = (label === 'Task' || label === 'Schedule' || label === 'Notes' || label === 'Subtasks');
            h4.style.display = keepH4 ? '' : 'none';
          });
          writeDrawerTab(d, activeTab);
          showTaskDrawerSections(sections, activeTab);
        } else if (isAppts) {
          if (activeTab > APPT_DRAWER_TAB_MAX) activeTab = 0;
          APPT_DRAWER_TABS.forEach(function (label, i) {
            var b = el('<button type="button"' + (i === activeTab ? ' class="is-active"' : '') + '>' +
                       esc(label) + '</button>');
            b.addEventListener('click', function (ev) {
              if (ev && typeof ev.preventDefault === 'function') ev.preventDefault();
              writeDrawerTab(d, i);
              [].slice.call(strip.children).forEach(function (x, xi) {
                x.classList.toggle('is-active', xi === i);
              });
              showApptDrawerSections(sections, i);
            });
            strip.appendChild(b);
          });
          sections.forEach(function (section) {
            var h4 = section.querySelector('h4');
            if (h4) h4.style.display = '';
          });
          writeDrawerTab(d, activeTab);
          showApptDrawerSections(sections, activeTab);
        } else if (isLogs) {
          if (activeTab > LOG_DRAWER_TAB_MAX) activeTab = 0;
          LOG_DRAWER_TABS.forEach(function (label, i) {
            var b = el('<button type="button"' + (i === activeTab ? ' class="is-active"' : '') + '>' +
                       esc(label) + '</button>');
            b.addEventListener('click', function (ev) {
              if (ev && typeof ev.preventDefault === 'function') ev.preventDefault();
              writeDrawerTab(d, i);
              [].slice.call(strip.children).forEach(function (x, xi) {
                x.classList.toggle('is-active', xi === i);
              });
              showLogDrawerSections(sections, i);
            });
            strip.appendChild(b);
          });
          sections.forEach(function (section) {
            var h4 = section.querySelector('h4');
            if (h4) h4.style.display = '';
          });
          writeDrawerTab(d, activeTab);
          showLogDrawerSections(sections, activeTab);
        } else if (isGuests) {
          /* Mock 21 continued: 6 or 7 tabs; Party hidden for non–wedding-party guests. */
          var guestTabs = (typeof guestDrawerShellTabs === 'function') ? guestDrawerShellTabs() : GUEST_DRAWER_TABS;
          var guestTabMax = Math.max(0, guestTabs.length - 1);
          if (activeTab > guestTabMax) activeTab = 0;
          if (strip) strip.classList.add('is-guest-tabs');
          guestTabs.forEach(function (label, i) {
            var tabLabel = (typeof guestDrawerTabStripLabel === 'function')
              ? guestDrawerTabStripLabel(label, i === activeTab) : label;
            var b = el('<button type="button"' + (i === activeTab ? ' class="is-active"' : '') + '>' +
                       esc(tabLabel) + '</button>');
            b.addEventListener('click', function (ev) {
              if (ev && typeof ev.preventDefault === 'function') ev.preventDefault();
              writeDrawerTab(d, i);
              [].slice.call(strip.children).forEach(function (x, xi) {
                x.classList.toggle('is-active', xi === i);
              });
              if (typeof guestDrawerSelectTab === 'function') {
                guestDrawerSelectTab(i);
                return;
              }
              showGuestDrawerSections(sections, i);
            });
            strip.appendChild(b);
          });
          sections.forEach(function (section) {
            var h4 = section.querySelector('h4');
            if (h4) h4.style.display = 'none';
          });
          writeDrawerTab(d, activeTab);
          showGuestDrawerSections(sections, activeTab);
          if (typeof guestDrawerRefreshTabStripLabels === 'function') guestDrawerRefreshTabStripLabels(activeTab);
        } else if (isParty) {
          var partyTabs = (typeof partyDrawerShellTabs === 'function') ? partyDrawerShellTabs() : ['Role', 'Attire', 'Duties', 'Contact', 'History'];
          var partyTabMax = Math.max(0, partyTabs.length - 1);
          if (activeTab > partyTabMax) activeTab = 0;
          if (strip) strip.classList.add('is-guest-tabs', 'is-party-tabs');
          partyTabs.forEach(function (label, i) {
            var b = el('<button type="button"' + (i === activeTab ? ' class="is-active"' : '') + '>' +
                       esc(label) + '</button>');
            b.addEventListener('click', function (ev) {
              if (ev && typeof ev.preventDefault === 'function') ev.preventDefault();
              writeDrawerTab(d, i);
              [].slice.call(strip.children).forEach(function (x, xi) {
                x.classList.toggle('is-active', xi === i);
              });
              if (typeof partyDrawerSelectTab === 'function') partyDrawerSelectTab(i);
            });
            strip.appendChild(b);
          });
          sections.forEach(function (section) {
            var h4 = section.querySelector('h4');
            if (h4) h4.style.display = 'none';
          });
          writeDrawerTab(d, activeTab);
          showGuestDrawerSections(sections, activeTab);
        } else if (isGifts) {
          var giftsTabs = (typeof giftsDrawerShellTabs === 'function') ? giftsDrawerShellTabs() : ['Gift', 'Giver', 'Thank-you', 'History'];
          var giftsTabMax = Math.max(0, giftsTabs.length - 1);
          if (activeTab > giftsTabMax) activeTab = 0;
          if (strip) strip.classList.add('is-guest-tabs', 'is-gifts-tabs');
          giftsTabs.forEach(function (label, i) {
            var b = el('<button type="button"' + (i === activeTab ? ' class="is-active"' : '') + '>' +
                       esc(label) + '</button>');
            b.addEventListener('click', function (ev) {
              if (ev && typeof ev.preventDefault === 'function') ev.preventDefault();
              writeDrawerTab(d, i);
              [].slice.call(strip.children).forEach(function (x, xi) {
                x.classList.toggle('is-active', xi === i);
              });
              if (typeof giftsDrawerSelectTab === 'function') giftsDrawerSelectTab(i);
            });
            strip.appendChild(b);
          });
          sections.forEach(function (section) {
            var h4 = section.querySelector('h4');
            if (h4) h4.style.display = 'none';
          });
          writeDrawerTab(d, activeTab);
          showGuestDrawerSections(sections, activeTab);
        } else if (isTables) {
          var tablesTabs = (typeof tablesDrawerShellTabs === 'function') ? tablesDrawerShellTabs() : ['Table', 'Seats', 'Notes', 'History'];
          var tablesTabMax = Math.max(0, tablesTabs.length - 1);
          if (activeTab > tablesTabMax) activeTab = 0;
          if (strip) strip.classList.add('is-guest-tabs', 'is-tables-tabs');
          tablesTabs.forEach(function (label, i) {
            var b = el('<button type="button"' + (i === activeTab ? ' class="is-active"' : '') + '>' +
                       esc(label) + '</button>');
            b.addEventListener('click', function (ev) {
              if (ev && typeof ev.preventDefault === 'function') ev.preventDefault();
              writeDrawerTab(d, i);
              [].slice.call(strip.children).forEach(function (x, xi) {
                x.classList.toggle('is-active', xi === i);
              });
              if (typeof tablesDrawerSelectTab === 'function') tablesDrawerSelectTab(i);
            });
            strip.appendChild(b);
          });
          sections.forEach(function (section) {
            var h4 = section.querySelector('h4');
            if (h4) h4.style.display = 'none';
          });
          writeDrawerTab(d, activeTab);
          showGuestDrawerSections(sections, activeTab);
        } else {
          if (activeTab >= sections.length) activeTab = 0;
          sections.forEach(function (section, i) {
            var h4 = section.querySelector('h4');
            var label = ((h4 && h4.textContent.trim()) || ('Group ' + (i + 1))).replace(/\s*Details$/i, '');
            var b = el('<button type="button"' + (i === activeTab ? ' class="is-active"' : '') + '>' +
                       esc(label) + '</button>');
            b.addEventListener('click', function (ev) {
              if (ev && typeof ev.preventDefault === 'function') ev.preventDefault();
              writeDrawerTab(d, i);
              [].slice.call(strip.children).forEach(function (x, xi) {
                x.classList.toggle('is-active', xi === i);
              });
              showGroupedDrawerSections(sections, i);
            });
            strip.appendChild(b);
            if (h4) h4.style.display = 'none';
          });
          writeDrawerTab(d, activeTab);
          showGroupedDrawerSections(sections, activeTab);
        }
      }

      /* ── toolbar under tabs: Save / Add + Mark complete (same hooks as former foot/head) ── */
      var save = d.querySelector('[data-inline-editor-save]');
      if (save) {
        save.textContent = (st && st.isNew) ? 'Add' : 'Save';
        save.classList.add('rd-btn', 'rd-btn--primary');
      }
      var act = d.querySelector('[data-drawer-action]');
      if (act) {
        if (st && st.key === 'tasks') {
          var canComplete = draft.status !== 'Complete';
          act.textContent = 'Mark complete';
          act.classList.add('rd-btn');
          if (canComplete) act.removeAttribute('hidden'); else act.setAttribute('hidden', '');
        } else if (st && st.key === 'guests') {
          /* Batch 21 continued: Save + Full editor */
          act.textContent = 'Full editor';
          act.classList.add('rd-btn');
          if (!st.isNew) act.removeAttribute('hidden'); else act.setAttribute('hidden', '');
        } else if (st && st.key === 'party') {
          act.textContent = 'Open full editor';
          act.classList.add('rd-btn');
          if (!st.isNew) act.removeAttribute('hidden'); else act.setAttribute('hidden', '');
        } else if (st && st.key === 'gifts') {
          act.textContent = 'Open full editor';
          act.classList.add('rd-btn');
          if (!st.isNew) act.removeAttribute('hidden'); else act.setAttribute('hidden', '');
        } else if (st && st.key === 'tables') {
          act.textContent = 'Full editor';
          act.classList.add('rd-btn');
          if (!st.isNew) act.removeAttribute('hidden'); else act.setAttribute('hidden', '');
        } else {
          act.setAttribute('hidden', '');
        }
      }
    } finally {
      DECORATING = false;
    }
    if (typeof rdApplyTaskDrawerRowFocus === 'function') rdApplyTaskDrawerRowFocus();
    if (typeof rdApplyApptDrawerRowFocus === 'function') rdApplyApptDrawerRowFocus();
    if (typeof rdApplyLogDrawerRowFocus === 'function') rdApplyLogDrawerRowFocus();
    if (typeof rdApplyGuestDrawerRowFocus === 'function') rdApplyGuestDrawerRowFocus();
    if (typeof rdApplyPartyDrawerRowFocus === 'function') rdApplyPartyDrawerRowFocus();
    if (typeof rdApplyGiftsDrawerRowFocus === 'function') rdApplyGiftsDrawerRowFocus();
  }

  /* Open a record in the drawer. scroll:false because a fixed 360px panel
     must not drag the work surface around underneath it. */
  function openDrawer(key, index, seed) {
    if (typeof covInlineLoad !== 'function') return;
    var d = ensureDrawer();
    if (!d) return;
    d.removeAttribute('hidden');
    syncDrawerSlot();
    /* decorate() fills the eyebrow from the loaded record — writing it here
       would overwrite the row that holds the close button. */
    covInlineLoad(key, index, DRAWER_BODY, seed || null, { scroll: false });
  }

  /* Prefer the 360px record drawer for +Add when redesign chrome is live.
     Falls back to false so callers can open the full editor / inline mount. */
  function openNewInDrawer(key, seed) {
    if (!document.body.classList.contains('rd-scope')) return false;
    if (!document.getElementById(DRAWER_BODY)) return false;
    openDrawer(key, null, seed || null);
    return true;
  }

  function closeDrawer(force) {
    var d = document.getElementById(DRAWER_ID);
    if (!d) return;
    /* closeRecordEditor() owns the dirty check and the draft cleanup. Let it
       run and only hide once it has actually cleared the state, so a
       cancelled "discard changes?" leaves the drawer open with the edits. */
    if (!force && typeof closeRecordEditor === 'function' && window.recordEditorState) {
      Promise.resolve(closeRecordEditor()).then(function () {
        if (!window.recordEditorState) {
          d.setAttribute('hidden', '');
          syncDrawerSlot();
        }
      });
      return;
    }
    d.setAttribute('hidden', '');
    syncDrawerSlot();
  }

  /* ─────────────────────────────────────────────────────────────────────
     A one-of-many picker. Prefers the branded cov-modal (same shell as
     Set owner / Set due date) so bulk choosers stay centered mid-screen.
     Falls back to an inline overlay if covChoose is unavailable.
     ───────────────────────────────────────────────────────────────────── */
  function rdChoose(title, options) {
    if (typeof window.covChoose === 'function') {
      return window.covChoose('', options, { title: title || 'Choose' });
    }
    return new Promise(function (resolve) {
      var overlay = document.createElement('div');
      overlay.className = 'cov-modal-overlay cov-modal-overlay--open';
      overlay.setAttribute('role', 'dialog');
      overlay.setAttribute('aria-modal', 'true');
      overlay.style.cssText =
        'display:flex;position:fixed;inset:0;z-index:2147483646;' +
        'align-items:center;justify-content:center;padding:1.25rem;' +
        'background:rgba(42,42,42,.55);margin:0;box-sizing:border-box;';

      var modal = document.createElement('div');
      modal.className = 'cov-modal';
      modal.setAttribute('role', 'document');
      modal.style.cssText =
        'width:100%;max-width:460px;max-height:calc(100vh - 2.5rem);overflow:auto;' +
        'background:var(--ivory,#F9F7F4);border:1px solid var(--border,rgba(184,153,104,.30));' +
        'border-radius:14px;box-shadow:0 18px 48px rgba(42,42,42,.28);padding:1.5rem 1.5rem 1.25rem;';
      modal.innerHTML =
        '<h2 class="cov-modal__title" style="margin:0 0 .6rem;font:600 1.5rem/1.2 var(--font-serif,Georgia,serif);color:var(--forest,#2D4A3E)">' +
          esc(title || 'Choose') +
        '</h2>' +
        '<div class="cov-modal__choices" style="display:flex;flex-direction:column;gap:.4rem;margin-top:.25rem;max-height:min(50vh,320px);overflow:auto"></div>' +
        '<div class="cov-modal__footer" style="display:flex;justify-content:flex-end;gap:.6rem;margin-top:1.4rem">' +
          '<button type="button" class="cov-modal__btn cov-modal__btn--ghost" data-cancel>Cancel</button>' +
        '</div>';

      var body = modal.querySelector('.cov-modal__choices');
      var list = Array.isArray(options) ? options : (options ? [].slice.call(options) : []);
      if (!list.length) {
        var empty = document.createElement('div');
        empty.className = 'cov-modal__choices-empty';
        empty.textContent = 'No options available.';
        empty.style.cssText = 'padding:.35rem 0;color:var(--text-muted,#6b7168);font-size:.9rem';
        body.appendChild(empty);
      }
      list.forEach(function (opt) {
        var label = opt == null ? '' : String(opt);
        var b = document.createElement('button');
        b.type = 'button';
        b.className = 'cov-modal__choice';
        b.textContent = label;
        b.style.cssText =
          'text-align:left;width:100%;cursor:pointer;font:500 .92rem/1.4 var(--font-ui,system-ui);' +
          'padding:.55rem .75rem;border:1px solid rgba(42,42,42,.12);border-radius:8px;background:#fff;color:#2A2A2A';
        b.addEventListener('click', function (e) {
          e.preventDefault();
          e.stopPropagation();
          done(label);
        });
        body.appendChild(b);
      });

      var settled = false;
      function done(v) {
        if (settled) return;
        settled = true;
        document.removeEventListener('keydown', onKey, true);
        if (overlay.parentNode) overlay.parentNode.removeChild(overlay);
        resolve(v == null || v === '' ? null : v);
      }
      function onKey(e) {
        if (e.key === 'Escape') {
          e.preventDefault();
          done(null);
        }
      }
      var cancel = modal.querySelector('[data-cancel]');
      if (cancel) cancel.addEventListener('click', function (e) {
        e.preventDefault();
        e.stopPropagation();
        done(null);
      });
      overlay.addEventListener('click', function (e) {
        if (e.target === overlay) done(null);
      });
      document.addEventListener('keydown', onKey, true);
      overlay.appendChild(modal);
      document.body.appendChild(overlay);
      var first = body.querySelector('button');
      if (first) {
        try { first.focus(); } catch (err) { /* focus not required */ }
      }
    });
  }

  /* ── Collapsible planner footer (redesign-step10g) ─────────────────── */
  var FOOTER_COLLAPSE_KEY = 'covenant_footer_collapsed';

  function readFooterCollapsedPref() {
    try {
      return localStorage.getItem(FOOTER_COLLAPSE_KEY) === '1';
    } catch (e) {
      return false;
    }
  }

  function writeFooterCollapsedPref(collapsed) {
    try {
      localStorage.setItem(FOOTER_COLLAPSE_KEY, collapsed ? '1' : '0');
    } catch (e) { /* private mode / quota */ }
  }

  function applyFooterCollapsed(collapsed) {
    var footer = document.getElementById('planner-footer');
    var tab = document.getElementById('footer-toggle-tab');
    var panel = document.getElementById('footer-panel');
    if (!footer || !tab) return;

    footer.classList.toggle('planner-footer--collapsed', !!collapsed);
    document.documentElement.classList.toggle('planner-footer-collapsed-early', !!collapsed);
    document.body.classList.toggle('planner-footer-collapsed', !!collapsed);

    tab.setAttribute('aria-expanded', collapsed ? 'false' : 'true');
    tab.setAttribute('aria-label', collapsed ? 'Show footer' : 'Hide footer');
    tab.setAttribute('title', collapsed ? 'Show footer' : 'Hide footer');

    if (panel) {
      if (collapsed) {
        panel.setAttribute('hidden', '');
        panel.setAttribute('aria-hidden', 'true');
        try { panel.inert = true; } catch (e) { /* older browsers */ }
      } else {
        panel.removeAttribute('hidden');
        panel.removeAttribute('aria-hidden');
        try { panel.inert = false; } catch (e) { /* older browsers */ }
      }
    }
  }

  function togglePlannerFooter() {
    var footer = document.getElementById('planner-footer');
    if (!footer) return;
    var next = !footer.classList.contains('planner-footer--collapsed');
    applyFooterCollapsed(next);
    writeFooterCollapsedPref(next);
  }

  function initFooterToggle() {
    var tab = document.getElementById('footer-toggle-tab');
    if (!tab || tab._rdFooterToggleBound) return;
    tab._rdFooterToggleBound = true;
    tab.addEventListener('click', function (e) {
      e.preventDefault();
      togglePlannerFooter();
    });
    /* Prefer stored preference; fall back to early class if storage is empty
       but the FOUC script already collapsed. */
    var pref = readFooterCollapsedPref();
    if (!pref && document.documentElement.classList.contains('planner-footer-collapsed-early')) {
      pref = true;
    }
    applyFooterCollapsed(!!pref);
  }

  window.togglePlannerFooter = togglePlannerFooter;
  window.applyPlannerFooterCollapsed = applyFooterCollapsed;

  /* Export chooser BEFORE start() so a shell-build error never starves bulk actions. */
  window.rdChoose         = rdChoose;
  window.rdOpenDrawer     = openDrawer;
  window.rdCloseDrawer    = closeDrawer;
  window.rdOpenFullEditor = openFullEditor;
  window.rdOpenNewInDrawer = openNewInDrawer;
  window.covenantShell = {
    rebuild: build,
    sync: sync,
    tabs: TABS,
    drawer: ensureDrawer,
    initFooterToggle: initFooterToggle,
    toggleFooter: togglePlannerFooter
  };

  function start() {
    try {
      build();
      ensureDrawer();
      initFooterToggle();
      /* CWP's default row-click opens the full pop-out. On Tasks / Appointments /
         Logistics / Guests, route to the 360px drawer instead — Full editor still
         reaches openRecordEditor(). */
      if (typeof window.cwpOpenEditor === 'function' && !window.cwpOpenEditor._rdTasksDrawer) {
        var _cwpOpenEditor = window.cwpOpenEditor;
        window.cwpOpenEditor = function (entity, id) {
          var logKeys = { weekendTimeline:1, hotelBlocks:1, travelAccommodations:1, transportation:1, vipCare:1 };
          if ((entity === 'tasks' || entity === 'appointments' || entity === 'guests' || entity === 'vendors' || logKeys[entity]) && document.getElementById(DRAWER_BODY)) {
            var rows = (typeof recordEditorRows === 'function')
              ? recordEditorRows(entity)
              : ((window.data && window.data[entity]) || []);
            var i = -1;
            for (var n = 0; n < rows.length; n++) {
              if (rows[n] && String(rows[n]._id) === String(id)) { i = n; break; }
            }
            if (i > -1) {
              if (entity === 'vendors' && typeof rdVndOpenDrawer === 'function') {
                rdVndOpenDrawer(String(id));
                return;
              }
              openDrawer(entity, i);
              return;
            }
          }
          return _cwpOpenEditor(entity, id);
        };
        window.cwpOpenEditor._rdTasksDrawer = true;
      }
      try {
        new MutationObserver(sync).observe(document.body, {
          attributes: true, attributeFilter: ['data-active-panel']
        });
      } catch (e) { /* no observer; nav still renders on load */ }
    } catch (err) {
      if (typeof console !== 'undefined' && console.warn) {
        console.warn('redesign-shell start failed', err);
      }
    }
  }

  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', start);
  else start();
})();
