/* Viewer Preferences — Master s37 · 16a (avatar menu) + 48a/48b (Viewer preferences page)
   + Viewer drawer (Viewer · Access · Alerts · History).

   Honesty rules: pages a viewer cannot use are absent from their count, not
   greyed; Money and Notes are listed first because they are the two groups most
   often shared by accident. */
(function () {
  'use strict';

  window._vaView = window._vaView || 'summary';
  window._vaDrawer = window._vaDrawer || null;
  window._vaDrawerTab = window._vaDrawerTab || 0;

  var DRAWER_TABS = ['Viewer', 'Access', 'Alerts', 'History'];
  var FOCUS_OPTS = [
    { key: 'full', label: 'Full planner', run: function () { if (typeof applyFocusPreset === 'function') applyFocusPreset('full'); } },
    { key: 'essentials', label: 'Essentials', run: function () { if (typeof applyPlanningView === 'function') applyPlanningView('essentials'); } },
    { key: 'planning', label: 'Planning core', run: function () { if (typeof applyFocusPreset === 'function') applyFocusPreset('planning'); } },
    { key: 'guests', label: 'Guests & seating', run: function () { if (typeof applyFocusPreset === 'function') applyFocusPreset('guests'); } },
    { key: 'money', label: 'Money', run: function () { if (typeof applyFocusPreset === 'function') applyFocusPreset('money'); } },
    { key: 'weekend', label: 'Wedding weekend', run: function () { if (typeof applyFocusPreset === 'function') applyFocusPreset('weekend'); } }
  ];
  var DISPLAY_OPTS = [
    { key: 'compact', label: 'Compact', cls: 'rd-gaps-compact' },
    { key: 'default', label: 'Default', cls: '' },
    { key: 'large', label: 'Large', cls: 'rd-gaps-font-large' }
  ];

  var VIEWERS = [
    { id: 'ama', name: 'Ama Osei', role: 'Planner · owner of the file', band: 'Full', pages: '37 of 37 pages', money: 'Full', access: ['Money', 'Notes', 'Guests', 'Vendors', 'The Day', 'Covenant', 'Documents', 'Overview', 'Planning'], expiry: 'No link — owner', last: 'Now', status: 'Full' },
    { id: 'kwesi', name: 'Kwesi Boateng', role: 'Groom · full access', band: 'Full', pages: '37 of 37 pages', money: 'Full', access: ['Money', 'Notes', 'Guests', 'Vendors', 'The Day', 'Covenant', 'Documents', 'Overview', 'Planning'], expiry: 'No link — owner', last: 'Today', status: 'Full' },
    { id: 'efua', name: 'Efua Mensah', role: 'Mother of the bride · read only', band: 'Partial', pages: '9 of 37 · money hidden', money: 'Hidden', access: ['Guests', 'The Day', 'Documents', 'Overview'], expiry: 'Expires 20 Nov', last: '2 days ago', status: 'Viewer' },
    { id: 'adjei', name: 'Rev. Adjei', role: 'Officiant · ceremony only', band: 'Partial', pages: '3 of 37', money: '—', access: ['The Day', 'Covenant'], expiry: 'Expires 9 Nov', last: 'Not yet', status: 'Viewer' },
    { id: 'adom', name: 'Adom Bakery', role: 'Vendor · portal, not the planner', band: 'Partial', pages: 'Portal only', money: '—', access: ['Vendors'], expiry: 'Portal link', last: '5 days ago', status: 'Vendor' },
    { id: 'yaa', name: 'Yaa Boateng', role: 'Revoked 2 Jul · link emailed in error', band: 'Revoked', pages: '—', money: '—', access: [], expiry: 'Revoked', last: '—', status: 'Revoked' },
    { id: 'oldphoto', name: 'Old photographer shortlist', role: 'Revoked 28 Jun · vendor not booked', band: 'Revoked', pages: '—', money: '—', access: [], expiry: 'Revoked', last: '—', status: 'Revoked' }
  ];

  var PERM_GROUPS = [
    { section: 'Money · Budget, Payments, Contracts', note: 'Most sensitive group in the file', rows: [
      { name: 'Budget', holders: 'Ama, Kwesi', count: '2 of 5', level: 'Restricted' },
      { name: 'Payments', holders: 'Ama, Kwesi', count: '2 of 5', level: 'Restricted' },
      { name: 'Contracts & Invoices', holders: 'Ama, Kwesi', count: '2 of 5', level: 'Restricted' }
    ]},
    { section: 'Notes & private thinking', note: '', rows: [
      { name: 'Notes', holders: 'Ama only', count: '1 of 5', level: 'Restricted', sensitive: true },
      { name: 'Prayer Journal', holders: 'Ama, Kwesi', count: '2 of 5', level: 'Restricted' },
      { name: 'Premarital Counseling', holders: 'Ama, Kwesi, Rev. Adjei', count: '3 of 5', level: 'Shared' }
    ]},
    { section: 'People & addresses', note: '', rows: [
      { name: 'Guest List', holders: 'Ama, Kwesi, Efua — addresses hidden from Efua', count: '3 of 5', level: 'Shared' },
      { name: 'Households', holders: 'Ama, Kwesi, Efua', count: '3 of 5', level: 'Shared' },
      { name: 'Contacts', holders: 'Ama, Kwesi, Efua, Rev. Adjei', count: '4 of 5', level: 'Shared' }
    ]},
    { section: 'The day itself', note: 'Widely shared on purpose', rows: [
      { name: 'Ceremony & Reception', holders: 'Everyone except vendors', count: '4 of 5', level: 'Open' },
      { name: 'Wedding Day Timeline', holders: 'Everyone; vendors see their own rows only', count: '5 of 5', level: 'Open' }
    ]}
  ];

  var esc = function (s) {
    return (typeof escapeHtml === 'function'
      ? escapeHtml(s == null ? '' : String(s))
      : String(s == null ? '' : s).replace(/[&<>"']/g, function (ch) {
        return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[ch];
      }));
  };

  function setup() {
    try { return (typeof data !== 'undefined' && data && data.setup) ? data.setup : {}; } catch (e) { return {}; }
  }

  function counts() {
    var active = VIEWERS.filter(function (v) { return v.band !== 'Revoked'; });
    var revoked = VIEWERS.filter(function (v) { return v.band === 'Revoked'; });
    return { active: active.length, revoked: revoked.length };
  }

  function viewerPerson() {
    var s = setup();
    var name = String(s.plannerName || s.bride || 'Mary Osei').trim();
    if (name.indexOf(' ') < 0 && s.bride) name = String(s.bride).trim() + ' Osei';
    var inits = name.split(/\s+/).map(function (p) { return p[0] || ''; }).join('').slice(0, 2).toUpperCase() || 'MO';
    return { name: name, role: 'Planner · full access', inits: inits };
  }

  function appearanceMode() {
    var s = setup();
    if (typeof s.darkMode === 'boolean') return s.darkMode ? 'dark' : 'light';
    return 'auto';
  }

  function displaySizeKey() {
    if (document.body.classList.contains('rd-gaps-compact')) return 'compact';
    if (document.body.classList.contains('rd-gaps-font-large')) return 'large';
    return 'default';
  }

  function focusKey() {
    var s = setup();
    if (s.simpleMode || s.planningView === 'essentials') return 'essentials';
    var fp = s.focusPreset || 'full';
    if (fp === 'full' && !s.hiddenMenuPages?.length) return 'full';
    return FOCUS_OPTS.some(function (o) { return o.key === fp; }) ? fp : 'full';
  }

  function relBackup() {
    try {
      var ob = (typeof ensureOnboardData === 'function' ? ensureOnboardData() : {}) || {};
      if (!ob.lastBackupTime) return 'never';
      var mins = Math.max(0, Math.round((Date.now() - new Date(ob.lastBackupTime).getTime()) / 60000));
      if (mins < 60) return mins + ' minute' + (mins === 1 ? '' : 's') + ' ago';
      var hrs = Math.round(mins / 60);
      if (hrs < 48) return hrs + ' hour' + (hrs === 1 ? '' : 's') + ' ago';
      var days = Math.round(hrs / 24);
      return days + ' day' + (days === 1 ? '' : 's') + ' ago';
    } catch (e) { return '3 days ago'; }
  }

  function histMeta() {
    try {
      var u = (typeof undoStack !== 'undefined' && undoStack) ? undoStack.length : 3;
      var r = (typeof redoStack !== 'undefined' && redoStack) ? redoStack.length : 0;
      return u + ' undo · ' + r + ' redo';
    } catch (e) { return '3 undo · 0 redo'; }
  }

  function segHtml(label, options, activeKey, onclickPrefix) {
    return '<div class="rd-va-menu__row"><span class="rd-va-menu__label">' + esc(label) + '</span>' +
      '<div class="rd-va-menu__seg" role="group">' +
      options.map(function (o) {
        var k = o.key || o;
        var lab = o.label || o;
        return '<button type="button" class="rd-va-menu__segopt' + (k === activeKey ? ' is-active' : '') +
          '" onclick="' + onclickPrefix + '(\'' + k + '\')">' + esc(lab) + '</button>';
      }).join('') +
      '</div></div>';
  }

  /* ── 16a · avatar menu ─────────────────────────────────────────────────── */
  function ensureAvatarBtn() {
    var bar = document.querySelector('.rd-topbar__row--actions .rd-topbar__right');
    if (!bar || document.getElementById('rd-avatar-btn')) return;
    var person = viewerPerson();
    var btn = document.createElement('button');
    btn.type = 'button';
    btn.id = 'rd-avatar-btn';
    btn.className = 'rd-topbar__avatar-btn';
    btn.setAttribute('aria-label', 'Viewer preferences');
    btn.setAttribute('aria-haspopup', 'true');
    btn.setAttribute('aria-expanded', 'false');
    btn.innerHTML = '<span class="rd-topbar__avatar-initials" id="rd-avatar-initials">' + esc(person.inits) + '</span>' +
      '<svg viewBox="0 0 24 24" width="14" height="14" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linecap="round"><path d="m6 9 6 6 6-6"/></svg>';
    btn.addEventListener('click', function (e) {
      e.stopPropagation();
      toggleAvatarMenu();
    });
    var gear = document.getElementById('rd-gear-btn');
    bar.insertBefore(btn, gear || null);
  }

  function ensureAvatarMenu() {
    if (document.getElementById('rd-avatar-menu')) return;
    var pop = document.createElement('div');
    pop.id = 'rd-avatar-menu';
    pop.className = 'rd-gaps-pop rd-avatar-menu';
    pop.setAttribute('hidden', 'hidden');
    pop.setAttribute('role', 'dialog');
    pop.setAttribute('aria-label', 'Viewer preferences');
    document.body.appendChild(pop);
  }

  function renderAvatarMenu() {
    var pop = document.getElementById('rd-avatar-menu');
    if (!pop) return;
    var person = viewerPerson();
    var previewOn = !!(setup().readOnlyPreview);
    var fontLabel = 'Inter · system';
    try {
      var fn = setup().font || 'Cormorant & Inter';
      fontLabel = fn.indexOf('Inter') >= 0 ? 'Inter · system' : fn;
    } catch (e) { /* soft */ }

    pop.innerHTML =
      '<div class="rd-menu__person">' +
      '<span class="rd-menu__ava">' + esc(person.inits) + '</span>' +
      '<div><div class="rd-menu__pname">' + esc(person.name) + '</div>' +
      '<div class="rd-menu__prole">' + esc(person.role) + '</div></div>' +
      '<button type="button" class="rd-va-menu__switch" onclick="rdVaSwitchViewer()">Switch</button></div>' +
      '<div class="rd-va-menu__body">' +
      segHtml('Appearance', [{ key: 'light', label: 'Light' }, { key: 'dark', label: 'Dark' }, { key: 'auto', label: 'Auto' }], appearanceMode(), 'rdVaSetAppearance') +
      '<div class="rd-va-menu__row rd-va-menu__row--pick">' +
      '<span class="rd-va-menu__label">Font</span>' +
      '<button type="button" class="rd-va-menu__pick" onclick="rdVaOpenProfile()">' + esc(fontLabel) + '<span aria-hidden="true">›</span></button></div>' +
      segHtml('Display size', DISPLAY_OPTS, displaySizeKey(), 'rdVaSetDisplay') +
      segHtml('Menu focus', FOCUS_OPTS, focusKey(), 'rdVaSetFocus') +
      '<p class="rd-va-menu__hint">Hides pages from the menu without deleting anything. The full list lives on Wedding Setup.</p>' +
      '<div class="rd-va-menu__row rd-va-menu__row--toggle">' +
      '<div><strong>Preview Mode</strong><span>Makes every field read-only so you can click through without changing anything.</span></div>' +
      '<button type="button" class="rd-gaps-switch' + (previewOn ? ' is-on' : '') + '" role="switch" aria-checked="' + (previewOn ? 'true' : 'false') +
      '" onclick="rdVaTogglePreview()"><span class="rd-gaps-switch__dot"></span></button></div>' +
      '<div class="rd-va-menu__grp">Keyboard</div>' +
      '<div class="rd-va-menu__kbdrow"><span>Search</span><kbd class="rd-menu__kbd">⌘K</kbd></div>' +
      '<div class="rd-va-menu__kbdrow"><span>Undo · redo — buttons in the top bar</span><kbd class="rd-menu__kbd">⌘Z</kbd><kbd class="rd-menu__kbd">⇧⌘Z</kbd></div>' +
      '<div class="rd-va-menu__kbdrow"><span>Next record</span><kbd class="rd-menu__kbd">↑↓</kbd></div>' +
      '<div class="rd-va-menu__kbdrow"><span>Close drawer</span><kbd class="rd-menu__kbd">Esc</kbd></div>' +
      '<p class="rd-va-shortcut">Undo <kbd>⌘Z</kbd> · Redo <kbd>⇧⌘Z</kbd> — now in the top bar on every screen.</p>' +
      '</div>' +
      '<div class="rd-va-menu__links">' +
      '<button type="button" class="rd-menu__row" onclick="rdVaDownloadBackup()"><span class="rd-menu__label">Download backup →</span><span class="rd-va-menu__meta">' + esc(relBackup()) + '</span></button>' +
      '<button type="button" class="rd-menu__row" onclick="rdVaOpenHistory()"><span class="rd-menu__label">Planner History →</span><span class="rd-va-menu__meta">' + esc(histMeta()) + '</span></button>' +
      '<button type="button" class="rd-menu__row" onclick="rdVaNav(\'setup\')"><span class="rd-menu__label">Wedding Setup →</span></button>' +
      '<button type="button" class="rd-menu__row" onclick="rdVaNav(\'instructions\')"><span class="rd-menu__label">Get Started →</span></button>' +
      '<button type="button" class="rd-menu__row" onclick="rdVaOpenViewerPrefsPage()"><span class="rd-menu__label">Viewer preferences →</span></button>' +
      '</div>' +
      '<p class="rd-va-note">Everything here changes only what <b>you</b> see — never a record, a total, or what a share-packet recipient receives.</p>';
  }

  function positionAvatarMenu() {
    var pop = document.getElementById('rd-avatar-menu');
    var btn = document.getElementById('rd-avatar-btn');
    if (!pop || !btn) return;
    var r = btn.getBoundingClientRect();
    pop.style.top = Math.round(r.bottom + 6) + 'px';
    pop.style.left = Math.round(Math.min(r.left, window.innerWidth - 280)) + 'px';
  }

  function openAvatarMenu() {
    ensureAvatarMenu();
    renderAvatarMenu();
    var pop = document.getElementById('rd-avatar-menu');
    var btn = document.getElementById('rd-avatar-btn');
    if (!pop) return;
    positionAvatarMenu();
    pop.removeAttribute('hidden');
    if (btn) btn.setAttribute('aria-expanded', 'true');
  }

  function closeAvatarMenu() {
    var pop = document.getElementById('rd-avatar-menu');
    var btn = document.getElementById('rd-avatar-btn');
    if (pop) pop.setAttribute('hidden', 'hidden');
    if (btn) btn.setAttribute('aria-expanded', 'false');
  }

  function toggleAvatarMenu() {
    var pop = document.getElementById('rd-avatar-menu');
    if (pop && !pop.hasAttribute('hidden')) closeAvatarMenu();
    else openAvatarMenu();
  }

  /* ── 48a/48b · Viewer preferences page ─────────────────────────────────── */
  function renderViewerPrefsPage() {
    var panel = document.getElementById('panel-viewer-prefs');
    if (!panel) return;
    var c = counts();
    var v = window._vaView || 'summary';
    var viewBody = (v === 'permission') ? byPermissionHtml() : byViewerHtml();

    panel.innerHTML =
      '<div class="rd-va-page">' +
      '<div class="rd-va-pagehead">' +
      '<div><div class="rd-pagehead__eyebrow">Overview · Viewer preferences</div>' +
      '<h1 class="rd-va-pagehead__title">Viewer preferences</h1>' +
      '<p class="rd-help">' + c.active + ' viewers · ' + c.revoked + ' revoked · the link, not the login</p></div>' +
      '<div class="rd-va-pagehead__actions">' +
      '<button type="button" class="rd-btn">Invite viewer</button>' +
      '<span class="rd-va-pagehead__chip">Access log</span>' +
      '<span class="rd-va-pagehead__chip is-active">Active links</span></div></div>' +
      '<div class="rd-va-page__switch">' +
      '<div class="rd-viewswitch" role="group" aria-label="Access view">' +
      '<button type="button" class="rd-viewswitch__item' + (v === 'summary' ? ' is-active' : '') + '" onclick="rdVaSetView(\'summary\')">Summary</button>' +
      '<button type="button" class="rd-viewswitch__item' + (v === 'viewer' ? ' is-active' : '') + '" onclick="rdVaSetView(\'viewer\')">By viewer</button>' +
      '<button type="button" class="rd-viewswitch__item' + (v === 'permission' ? ' is-active' : '') + '" onclick="rdVaSetView(\'permission\')">By permission</button>' +
      '</div></div>' +
      '<div class="rd-va-page__body">' + viewBody + '</div></div>' +
      pageDrawerHtml();
  }

  function byViewerHtml() {
    var html = '<table class="rd-va-table"><thead><tr>' +
      '<th>Viewer</th><th>Role</th><th>Pages visible</th><th>Money</th><th>Link expiry</th><th>Last opened</th>' +
      '</tr></thead><tbody>';
    ['Full', 'Partial', 'Revoked'].forEach(function (band) {
      var rows = VIEWERS.filter(function (vw) { return vw.band === band; });
      if (!rows.length) return;
      var label = band === 'Full' ? 'Full access' : band;
      var sub = band === 'Revoked' ? ' · kept for the record; the link no longer opens' : '';
      html += '<tr class="rd-va-band"><td colspan="6">' + esc(label) + ' · ' + rows.length + esc(sub) + '</td></tr>';
      rows.forEach(function (vw) {
        html += '<tr class="rd-va-row' + (vw.band === 'Revoked' ? ' is-revoked' : '') + '" onclick="rdVaOpen(\'' + vw.id + '\')">' +
          '<td class="rd-va-name">' + esc(vw.name) + '</td>' +
          '<td>' + esc(vw.role) + '</td>' +
          '<td>' + esc(vw.pages) + '</td>' +
          '<td>' + esc(vw.money) + '</td>' +
          '<td>' + esc(vw.expiry) + '</td>' +
          '<td>' + esc(vw.last) + '</td></tr>';
      });
    });
    html += '</tbody></table>';
    return html;
  }

  function byPermissionHtml() {
    var html = '<p class="rd-help rd-va-permnote">The same access read the other way round — per group, who can see it — which is how mistakes are actually found. Money and Notes come first, because they are the two groups most often shared by accident.</p>';
    PERM_GROUPS.forEach(function (grp) {
      html += '<div class="rd-va-permsec"><div class="rd-va-permsec__head">' + esc(grp.section) +
        (grp.note ? '<span class="rd-va-permsec__note">' + esc(grp.note) + '</span>' : '') + '</div>' +
        '<table class="rd-va-table"><thead><tr><th>Page / field group</th><th>Who can see it</th><th>Count</th><th></th></tr></thead><tbody>';
      grp.rows.forEach(function (row) {
        html += '<tr class="rd-va-permrow' + (row.sensitive ? ' is-sensitive' : '') + '">' +
          '<td class="rd-va-name">' + esc(row.name) + (row.sensitive ? ' <span class="rd-va-flag">watch</span>' : '') + '</td>' +
          '<td>' + esc(row.holders) + '</td>' +
          '<td>' + esc(row.count) + '</td>' +
          '<td><span class="rd-va-level">' + esc(row.level) + '</span></td></tr>';
      });
      html += '</tbody></table></div>';
    });
    return html;
  }

  /* ── Viewer drawer ─────────────────────────────────────────────────────── */
  function field(label, value) {
    return '<div class="rd-drawer__field"><span>' + esc(label) + '</span><strong>' + esc(value) + '</strong></div>';
  }

  function pageDrawerHtml() {
    var vw = VIEWERS.find(function (v) { return v.id === window._vaDrawer; });
    if (!vw) return '';
    var tab = Math.max(0, Math.min(DRAWER_TABS.length - 1, parseInt(window._vaDrawerTab, 10) || 0));
    var body = '';
    if (tab === 0) {
      body = field('Name', vw.name) + field('Role', vw.role) + field('Sees', vw.pages) +
        '<p class="rd-drawer__note">A person who has been given a way in, and what they see when they use it.</p>';
    } else if (tab === 1) {
      body = field('Pages', vw.pages) + field('Money', vw.money) +
        field('Groups', vw.access.length ? vw.access.join(', ') : '—') + field('Link expiry', vw.expiry) +
        '<p class="rd-drawer__note">Exactly which pages and which fields, and when the link stops working. Pages this viewer cannot use are absent from the count, not greyed out.</p>';
    } else if (tab === 2) {
      body = field('RSVP changes', vw.band === 'Full' ? 'On' : 'Off') +
        field('New shared packet', vw.band === 'Revoked' ? '—' : 'On') +
        '<p class="rd-drawer__note">What reaches them without them opening anything.</p>';
    } else {
      body = '<div class="rd-drawer__hist"><strong>' + esc(vw.expiry) + '</strong><div>' + esc(vw.role) + '</div></div>' +
        '<p class="rd-drawer__note">Every access change, which is the part you will want in writing later.</p>';
    }
    return '<div class="rd-va-pagedrawer' + (window._vaDrawer ? ' is-open' : '') + '">' +
      '<div class="rd-va-pagedrawer__scrim" onclick="rdVaClose()"></div>' +
      '<aside class="rd-drawer rd-va-fielddrawer" aria-label="Viewer">' +
      '<div class="rd-drawer__head">' +
      '<button type="button" class="rd-drawer__close" onclick="rdVaClose()" aria-label="Close">×</button>' +
      '<div class="rd-drawer__eyebrow">Viewer</div>' +
      '<h2 class="rd-drawer__title">' + esc(vw.name) + '</h2>' +
      '<div class="rd-drawer__chips"><span class="status-pill" data-pillscheme="' +
      (vw.band === 'Full' ? 'green' : vw.band === 'Revoked' ? 'muted' : 'gold') + '">' + esc(vw.status) + '</span></div>' +
      '<div class="rd-drawer__tabs" role="tablist">' +
      DRAWER_TABS.map(function (label, k) {
        return '<button type="button" class="rd-drawer__tab' + (k === tab ? ' is-active' : '') +
          '" onclick="rdVaSetTab(' + k + ')">' + esc(label) + '</button>';
      }).join('') +
      '</div></div><div class="rd-drawer__body">' + body + '</div>' +
      '<div class="rd-drawer__foot"><button type="button" class="rd-btn rd-btn--primary" onclick="rdVaClose()">Done</button></div>' +
      '</aside></div>';
  }

  /* ── actions ─────────────────────────────────────────────────────────────── */
  function rdVaSetView(v) {
    window._vaView = v;
    window._vaDrawer = null;
    renderViewerPrefsPage();
  }
  function rdVaOpen(id) {
    window._vaDrawer = id;
    window._vaDrawerTab = 0;
    renderViewerPrefsPage();
  }
  function rdVaClose() {
    window._vaDrawer = null;
    renderViewerPrefsPage();
  }
  function rdVaSetTab(k) {
    window._vaDrawerTab = k;
    renderViewerPrefsPage();
  }

  function rdVaSetAppearance(mode) {
    if (!data.setup) data.setup = {};
    if (mode === 'light') { data.setup.darkMode = false; if (typeof applyDarkMode === 'function') applyDarkMode(false); }
    else if (mode === 'dark') { data.setup.darkMode = true; if (typeof applyDarkMode === 'function') applyDarkMode(true); }
    else { delete data.setup.darkMode; if (typeof applyDarkMode === 'function') applyDarkMode(typeof resolveDarkModePreference === 'function' ? resolveDarkModePreference() : false); }
    if (typeof save === 'function') save();
    renderAvatarMenu();
  }

  function rdVaSetDisplay(key) {
    document.body.classList.remove('rd-gaps-compact', 'rd-gaps-font-large');
    var opt = DISPLAY_OPTS.find(function (o) { return o.key === key; });
    if (opt && opt.cls) document.body.classList.add(opt.cls);
    renderAvatarMenu();
  }

  function rdVaSetFocus(key) {
    var opt = FOCUS_OPTS.find(function (o) { return o.key === key; });
    if (opt) opt.run();
    renderAvatarMenu();
  }

  function rdVaTogglePreview() {
    if (typeof toggleReadOnlyMode === 'function') toggleReadOnlyMode();
    renderAvatarMenu();
  }

  function rdVaOpenProfile() {
    closeAvatarMenu();
    if (typeof toggleProfileDrawer === 'function') toggleProfileDrawer();
  }

  function rdVaSwitchViewer() {
    closeAvatarMenu();
    if (typeof showToast === 'function') showToast('Switch to couple view is a preview, not a login.', 'info');
  }

  function rdVaDownloadBackup() {
    closeAvatarMenu();
    if (typeof downloadSqliteBackup === 'function') downloadSqliteBackup();
  }

  function rdVaOpenHistory() {
    closeAvatarMenu();
    window._histReturnPanel = document.body.getAttribute('data-active-panel') || 'dashboard';
    if (typeof showPanel === 'function') showPanel('history', true);
  }

  function rdVaNav(id) {
    closeAvatarMenu();
    if (typeof showPanel === 'function') showPanel(id, true);
  }

  function rdVaOpenViewerPrefsPage() {
    closeAvatarMenu();
    if (typeof showPanel === 'function') showPanel('viewer-prefs', true);
  }

  window.rdVaSetView = rdVaSetView;
  window.rdVaOpen = rdVaOpen;
  window.rdVaClose = rdVaClose;
  window.rdVaSetTab = rdVaSetTab;
  window.rdVaSetAppearance = rdVaSetAppearance;
  window.rdVaSetDisplay = rdVaSetDisplay;
  window.rdVaSetFocus = rdVaSetFocus;
  window.rdVaTogglePreview = rdVaTogglePreview;
  window.rdVaOpenProfile = rdVaOpenProfile;
  window.rdVaSwitchViewer = rdVaSwitchViewer;
  window.rdVaDownloadBackup = rdVaDownloadBackup;
  window.rdVaOpenHistory = rdVaOpenHistory;
  window.rdVaNav = rdVaNav;
  window.rdVaOpenViewerPrefsPage = rdVaOpenViewerPrefsPage;
  window.openViewerAccess = rdVaOpenViewerPrefsPage;
  window.closeViewerAccess = function () { window._vaDrawer = null; };

  function onPanelChange() {
    var active = document.body.getAttribute('data-active-panel');
    if (active === 'viewer-prefs') renderViewerPrefsPage();
  }

  function boot() {
    ensureAvatarBtn();
    ensureAvatarMenu();
    onPanelChange();
  }

  document.addEventListener('click', function (e) {
    var pop = document.getElementById('rd-avatar-menu');
    var btn = document.getElementById('rd-avatar-btn');
    if (!pop || pop.hasAttribute('hidden')) return;
    if (!pop.contains(e.target) && e.target !== btn && !(btn && btn.contains(e.target))) closeAvatarMenu();
  });

  var obs = new MutationObserver(function () { onPanelChange(); });
  function watchPanel() {
    if (document.body) obs.observe(document.body, { attributes: true, attributeFilter: ['data-active-panel'] });
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', function () { setTimeout(boot, 400); watchPanel(); });
  } else {
    setTimeout(boot, 400);
    watchPanel();
  }
  setInterval(function () {
    if (document.querySelector('.rd-topbar') && !document.getElementById('rd-avatar-btn')) boot();
  }, 1200);
})();
