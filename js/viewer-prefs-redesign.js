/* Viewer Preferences — Master s37 · 16a (the avatar menu) + 48a/48b access views
   16a is the existing gear/"Viewer preferences" menu (#rd-prefs): everything in
   it changes only what YOU see. This file adds the undo/redo shortcut reminder
   the drawing calls for, and a "Viewer access" surface — By viewer (48a) and
   By permission (48b) — with the Viewer·Access·Alerts·History drawer, opened as
   an overlay so no new nav-registered panel is needed.

   Honesty rules: pages a viewer cannot use are absent from their count, not
   greyed; Money and Notes are listed first because they are the two groups most
   often shared by accident. */
(function () {
  'use strict';

  window._vaView = window._vaView || 'viewer';
  window._vaDrawer = window._vaDrawer || null;
  window._vaDrawerTab = window._vaDrawerTab || 0;

  const DRAWER_TABS = ['Viewer', 'Access', 'Alerts', 'History'];
  const GROUP_ORDER = ['Money', 'Notes', 'Guests', 'Vendors', 'The Day', 'Covenant', 'Documents', 'Overview', 'Planning'];

  /* Drawn 48a viewers. `access` is the field groups they can actually reach —
     the count is that, not the greyed-out rest. */
  const VIEWERS = [
    { id: 'ama', name: 'Ama Osei', role: 'Planner · owner of the file', band: 'Full', pages: '37 of 37 pages', money: 'Full', access: GROUP_ORDER.slice(), expiry: 'No link — owner', last: 'Now', status: 'Full' },
    { id: 'kwesi', name: 'Kwesi Boateng', role: 'Groom · full access', band: 'Full', pages: '37 of 37 pages', money: 'Full', access: GROUP_ORDER.slice(), expiry: 'No link — owner', last: 'Today', status: 'Full' },
    { id: 'efua', name: 'Efua Mensah', role: 'Mother of the bride · read only', band: 'Partial', pages: '9 of 37 · money hidden', money: 'Hidden', access: ['Guests', 'The Day', 'Documents', 'Overview'], expiry: 'Expires 20 Nov', last: '2 days ago', status: 'Viewer' },
    { id: 'adjei', name: 'Rev. Adjei', role: 'Officiant · ceremony only', band: 'Partial', pages: '3 of 37', money: '—', access: ['The Day', 'Covenant'], expiry: 'Expires 9 Nov', last: 'Not yet', status: 'Viewer' },
    { id: 'adom', name: 'Adom Bakery', role: 'Vendor · portal, not the planner', band: 'Partial', pages: 'Portal only', money: '—', access: ['Vendors'], expiry: 'Portal link', last: '5 days ago', status: 'Vendor' },
    { id: 'yaa', name: 'Yaa Boateng', role: 'Revoked 2 Jul · link emailed in error', band: 'Revoked', pages: '—', money: '—', access: [], expiry: 'Revoked', last: '—', status: 'Revoked' },
    { id: 'oldphoto', name: 'Old photographer shortlist', role: 'Revoked 28 Jun · vendor not booked', band: 'Revoked', pages: '—', money: '—', access: [], expiry: 'Revoked', last: '—', status: 'Revoked' }
  ];

  const esc = s => (typeof escapeHtml === 'function'
    ? escapeHtml(s == null ? '' : String(s))
    : String(s == null ? '' : s).replace(/[&<>"']/g, ch => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[ch])));

  function counts() {
    const active = VIEWERS.filter(v => v.band !== 'Revoked');
    const revoked = VIEWERS.filter(v => v.band === 'Revoked');
    return { active: active.length, revoked: revoked.length };
  }

  /* ── 16a: enhance the existing gear / Viewer-preferences menu ─────────── */
  function enhancePrefsMenu() {
    const prefs = document.getElementById('rd-prefs');
    if (!prefs || prefs.querySelector('#rd-va-open')) return;
    const wrap = document.createElement('div');
    wrap.className = 'rd-va-prefsblock';
    wrap.innerHTML =
      '<div class="rd-va-shortcut">Undo <kbd>⌘Z</kbd> · Redo <kbd>⇧⌘Z</kbd> — now in the top bar on every screen.</div>' +
      '<button type="button" class="rd-prefs__history" id="rd-va-open" onclick="openViewerAccess()">Viewer access →</button>' +
      '<p class="rd-va-note">Everything here changes only what <b>you</b> see — never a record, a total, or what a share-packet recipient receives.</p>';
    prefs.appendChild(wrap);
  }

  /* ── 48a/48b: the Viewer access overlay ──────────────────────────────── */
  function openViewerAccess() {
    let ov = document.getElementById('rd-va-overlay');
    if (!ov) { ov = document.createElement('div'); ov.id = 'rd-va-overlay'; document.body.appendChild(ov); }
    renderOverlay();
    const prefs = document.getElementById('rd-prefs');
    if (prefs) prefs.setAttribute('hidden', 'hidden');
  }
  function closeViewerAccess() {
    const ov = document.getElementById('rd-va-overlay');
    if (ov) { ov.innerHTML = ''; ov.classList.remove('is-open'); }
    window._vaDrawer = null;
  }

  function renderOverlay() {
    const ov = document.getElementById('rd-va-overlay');
    if (!ov) return;
    const c = counts();
    const v = window._vaView || 'viewer';
    ov.classList.add('is-open');
    ov.innerHTML =
      '<div class="rd-va-scrim" onclick="closeViewerAccess()"></div>' +
      '<div class="rd-va-sheet" role="dialog" aria-label="Viewer access">' +
      '<div class="rd-va-head">' +
      '<div><div class="rd-pagehead__eyebrow">Access log · active links</div>' +
      '<h2 class="rd-va-title">Viewer access</h2>' +
      '<p class="rd-help">' + c.active + ' viewer' + (c.active === 1 ? '' : 's') + ' · ' + c.revoked + ' revoked · the link, not the login</p></div>' +
      '<div class="rd-va-headright">' +
      '<div class="rd-viewswitch" role="group" aria-label="Access view">' +
      '<button type="button" class="rd-viewswitch__item' + (v === 'viewer' ? ' is-active' : '') + '" onclick="rdVaSetView(\'viewer\')">By viewer</button>' +
      '<button type="button" class="rd-viewswitch__item' + (v === 'permission' ? ' is-active' : '') + '" onclick="rdVaSetView(\'permission\')">By permission</button>' +
      '</div>' +
      '<button type="button" class="rd-drawer__close" onclick="closeViewerAccess()" aria-label="Close">×</button>' +
      '</div></div>' +
      '<div class="rd-va-body">' + (v === 'permission' ? byPermissionHtml() : byViewerHtml()) + '</div>' +
      '</div>' +
      drawerHtml();
  }

  function byViewerHtml() {
    let html = '<table class="rd-va-table"><thead><tr>' +
      '<th>Viewer</th><th>Role</th><th>Pages visible</th><th>Money</th><th>Link expiry</th><th>Last opened</th>' +
      '</tr></thead><tbody>';
    ['Full', 'Partial', 'Revoked'].forEach(band => {
      const rows = VIEWERS.filter(v => v.band === band);
      if (!rows.length) return;
      const label = band === 'Full' ? 'Full access' : band;
      const sub = band === 'Revoked' ? ' · kept for the record; the link no longer opens' : '';
      html += '<tr class="rd-va-band"><td colspan="6">' + esc(label) + ' · ' + rows.length + esc(sub) + '</td></tr>';
      rows.forEach(vw => {
        html += '<tr class="rd-va-row' + (vw.band === 'Revoked' ? ' is-revoked' : '') + '" onclick="rdVaOpen(\'' + vw.id + '\')">' +
          '<td class="rd-va-name">' + esc(vw.name) + '</td>' +
          '<td>' + esc(vw.role) + '</td>' +
          '<td>' + esc(vw.pages) + '</td>' +
          '<td>' + esc(vw.money) + '</td>' +
          '<td>' + esc(vw.expiry) + '</td>' +
          '<td>' + esc(vw.last) + '</td>' +
          '</tr>';
      });
    });
    html += '</tbody></table>';
    return html;
  }

  function byPermissionHtml() {
    let html = '<p class="rd-help rd-va-permnote">The same access read the other way round — per group, who can see it — which is how mistakes are actually found. Money and Notes come first, because they are the two groups most often shared by accident.</p>' +
      '<table class="rd-va-table"><thead><tr><th>Page / field group</th><th>Who can see it</th><th>Count</th></tr></thead><tbody>';
    GROUP_ORDER.forEach(group => {
      const holders = VIEWERS.filter(v => v.band !== 'Revoked' && v.access.indexOf(group) >= 0);
      const sensitive = (group === 'Money' || group === 'Notes');
      html += '<tr class="rd-va-permrow' + (sensitive ? ' is-sensitive' : '') + '">' +
        '<td class="rd-va-name">' + esc(group) + (sensitive ? ' <span class="rd-va-flag">watch</span>' : '') + '</td>' +
        '<td>' + (holders.length ? holders.map(h => esc(h.name)).join(', ') : '<span class="rd-va-none">Nobody outside the couple</span>') + '</td>' +
        '<td>' + holders.length + '</td>' +
        '</tr>';
    });
    html += '</tbody></table>';
    return html;
  }

  /* ── Viewer drawer (Viewer · Access · Alerts · History) ──────────────── */
  function drawerHtml() {
    const vw = VIEWERS.find(v => v.id === window._vaDrawer);
    if (!vw) return '';
    const tab = Math.max(0, Math.min(DRAWER_TABS.length - 1, parseInt(window._vaDrawerTab, 10) || 0));
    let body = '';
    if (tab === 0) {
      body = field('Name', vw.name) + field('Role', vw.role) + field('Sees', vw.pages) +
        '<p class="rd-drawer__note">A person who has been given a way in, and what they see when they use it.</p>';
    } else if (tab === 1) {
      body = field('Pages', vw.pages) + field('Money', vw.money) +
        field('Groups', vw.access.length ? vw.access.join(', ') : '—') + field('Link expiry', vw.expiry) +
        '<p class="rd-drawer__note">Exactly which pages and which fields, and when the link stops working. Pages this viewer cannot use are absent from the count, not greyed out.</p>';
    } else if (tab === 2) {
      body = field('RSVP changes', vw.band === 'Full' ? 'On' : 'Off') + field('New shared packet', vw.band === 'Revoked' ? '—' : 'On') +
        '<p class="rd-drawer__note">What reaches them without them opening anything.</p>';
    } else {
      body = '<div class="rd-drawer__hist"><strong>' + esc(vw.expiry) + '</strong><div>' + esc(vw.role) + '</div></div>' +
        '<p class="rd-drawer__note">Every access change, which is the part you will want in writing later.</p>';
    }
    return '<div class="rd-va-drawer' + (window._vaDrawer ? ' is-open' : '') + '">' +
      '<div class="rd-va-drawer__scrim" onclick="rdVaClose()"></div>' +
      '<aside class="rd-drawer rd-va-fielddrawer" aria-label="Viewer">' +
      '<div class="rd-drawer__head">' +
      '<button type="button" class="rd-drawer__close" onclick="rdVaClose()" aria-label="Close">×</button>' +
      '<div class="rd-drawer__eyebrow">Viewer</div>' +
      '<h2 class="rd-drawer__title">' + esc(vw.name) + '</h2>' +
      '<div class="rd-drawer__chips"><span class="status-pill" data-pillscheme="' + (vw.band === 'Full' ? 'green' : vw.band === 'Revoked' ? 'muted' : 'gold') + '">' + esc(vw.status) + '</span></div>' +
      '<div class="rd-drawer__tabs" role="tablist">' +
      DRAWER_TABS.map((label, k) => '<button type="button" class="rd-drawer__tab' + (k === tab ? ' is-active' : '') + '" onclick="rdVaSetTab(' + k + ')">' + esc(label) + '</button>').join('') +
      '</div></div>' +
      '<div class="rd-drawer__body">' + body + '</div>' +
      '<div class="rd-drawer__foot"><button type="button" class="rd-btn rd-btn--primary" onclick="rdVaClose()">Done</button></div>' +
      '</aside></div>';
  }
  function field(label, value) {
    return '<div class="rd-drawer__field"><span>' + esc(label) + '</span><strong>' + esc(value) + '</strong></div>';
  }

  function rdVaSetView(v) { window._vaView = v; window._vaDrawer = null; renderOverlay(); }
  function rdVaOpen(id) { window._vaDrawer = id; window._vaDrawerTab = 0; renderOverlay(); }
  function rdVaClose() { window._vaDrawer = null; renderOverlay(); }
  function rdVaSetTab(k) { window._vaDrawerTab = k; renderOverlay(); }

  window.openViewerAccess = openViewerAccess;
  window.closeViewerAccess = closeViewerAccess;
  window.rdVaSetView = rdVaSetView;
  window.rdVaOpen = rdVaOpen;
  window.rdVaClose = rdVaClose;
  window.rdVaSetTab = rdVaSetTab;

  function tick() { enhancePrefsMenu(); }
  document.addEventListener('click', function (e) {
    if (e.target && (e.target.id === 'rd-gear-btn' || (e.target.closest && e.target.closest('#rd-gear-btn')))) {
      setTimeout(tick, 0);
    }
  }, true);
  if (document.readyState !== 'loading') setTimeout(tick, 400);
  else document.addEventListener('DOMContentLoaded', function () { setTimeout(tick, 400); });
})();
