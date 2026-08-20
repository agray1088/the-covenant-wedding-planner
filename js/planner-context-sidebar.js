/* Planner context sidebar — page context + quick access (single scroll) */
(function () {
  'use strict';

  function plannerData() {
    if (typeof getCovenantPlannerData === 'function') return getCovenantPlannerData();
    try {
      if (typeof data !== 'undefined') return data;
    } catch (e) { /* cross-script let binding */ }
    return null;
  }

  function esc(v) {
    return typeof escapeHtml === 'function' ? escapeHtml(v == null ? '' : v) : String(v == null ? '' : v);
  }

  function panelLabel(id) {
    return (typeof QJ_PAGES !== 'undefined' && QJ_PAGES[id]) ? QJ_PAGES[id] : id;
  }

  function isActive() {
    return document.body.classList.contains('context-sidebar-mode');
  }

  function pcsHead(title, kicker) {
    return '<div class="pcs-head"><div class="pcs-head__kicker">' + esc(kicker || 'This page') + '</div><h2 class="pcs-head__title">' + esc(title) + '</h2></div>';
  }

  function pcsStats(stats) {
    if (!stats || !stats.length) return '';
    return '<div class="pcs-block"><div class="pcs-stat-row">' + stats.map(function (s) {
      return '<div class="pcs-stat"><div class="pcs-stat__val">' + esc(s.val) + '</div><div class="pcs-stat__lbl">' + esc(s.lbl) + '</div></div>';
    }).join('') + '</div></div>';
  }

  function pcsLinks(rows) {
    if (!rows || !rows.length) return '';
    return '<div class="pcs-block"><div class="pcs-block__title">Related</div>' + rows.map(function (r) {
      var action = r.panel ? "showPanel('" + r.panel + "')" : (r.action || '');
      return '<div class="pcs-sync-row"><span>' + esc(r.label) + '</span><button type="button" onclick="' + action + '">Open</button></div>';
    }).join('') + '</div>';
  }

  /* Guests rail — mock 3b: Views · By side · Group by (224px Tasks pattern) */
  function buildGuestContext() {
    var d = plannerData() || {};
    var guests = typeof safeArray === 'function' ? safeArray(d.guests) : [];
    var activeView = 'all';
    if (typeof getSavedView === 'function') activeView = getSavedView('guests', 'all');
    else if (typeof window._guestRailView === 'string' && window._guestRailView) activeView = window._guestRailView;
    window._guestRailView = activeView;
    if (typeof getSavedView === 'function') {
      window._guestRailGroupBy = getSavedView('guestsGroupBy', window._guestRailGroupBy || 'side');
    }
    var activeGroup = (typeof window._guestRailGroupBy === 'string' && window._guestRailGroupBy) || 'side';

    function isPending(g) {
      if (typeof guestIsPendingRsvp === 'function') return guestIsPendingRsvp(g);
      return !/yes|accepted|no|declined/i.test(g.rsvp || '');
    }
    function isAccepted(g) { return /yes|accepted/i.test(g.rsvp || ''); }
    function hasAddress(g) {
      if (typeof guestHasAddress === 'function') return guestHasAddress(g);
      return !!(String(g.address1 || g.address || '').trim() || String(g.city || '').trim() || String(g.zip || '').trim());
    }
    function isSeated(g) {
      if (typeof guestIsSeated === 'function') return guestIsSeated(g);
      return !!String(g.table || '').trim();
    }
    function needsMeal(g) {
      if (typeof guestNeedsMeal === 'function') return guestNeedsMeal(g);
      return isAccepted(g) && !String(g.meal || '').trim();
    }
    function notInvited(g) {
      return !(g.invited || (typeof guestIsInvited === 'function' && guestIsInvited(g)));
    }
    function thankYouPending(g) {
      if (typeof guestMatchesRailView === 'function') return guestMatchesRailView(g, 'thankyou-pending');
      return g.thankyou === false;
    }

    var nAll = guests.length;
    var nUnconfirmed = guests.filter(isPending).length;
    var nNoMeal = guests.filter(needsMeal).length;
    var nNotInvited = guests.filter(notInvited).length;
    var nNeedsAddress = guests.filter(function (g) { return !hasAddress(g); }).length;
    var nUnseated = guests.filter(function (g) { return !isSeated(g); }).length;
    var nThankYou = guests.filter(thankYouPending).length;
    var nBride = guests.filter(function (g) { return String(g.side || '') === 'Bride'; }).length;
    var nGroom = guests.filter(function (g) { return String(g.side || '') === 'Groom'; }).length;
    var nBoth = guests.filter(function (g) {
      var s = String(g.side || 'Both');
      return s === 'Both' || s === 'Family' || !g.side;
    }).length;

    function viewItem(id, label, count, opts) {
      opts = opts || {};
      var warn = opts.warn && count > 0;
      return '<button type="button" class="rd-rail__item' + (activeView === id ? ' is-active' : '') + '"' +
        ' data-guest-rail-view="' + esc(id) + '"' +
        ' onclick="applyGuestRailView(\'' + id + '\')">' +
        esc(label) +
        '<span class="rd-rail__count' + (warn ? ' rd-rail__count--warn' : '') + '">' + count + '</span></button>';
    }

    var viewsHtml =
      '<div class="rd-rail__section">' +
      '<div class="rd-rail__title">Views<span class="rd-rail__title-add" aria-hidden="true">+</span></div>' +
      '<div class="rd-rail__list" role="list">' +
      viewItem('all', 'All guests', nAll) +
      viewItem('unconfirmed', 'Unconfirmed', nUnconfirmed, { warn: true }) +
      viewItem('no-meal', 'No meal chosen', nNoMeal, { warn: true }) +
      viewItem('not-invited', 'Not invited yet', nNotInvited) +
      viewItem('needs-address', 'Needs address', nNeedsAddress, { warn: true }) +
      viewItem('unseated', 'Unseated', nUnseated, { warn: true }) +
      viewItem('thankyou-pending', 'Thank-you pending', nThankYou) +
      '</div></div>';

    var jumpActive = (typeof window._guestJumpTarget === 'string' && window._guestJumpTarget) || '';
    if (!jumpActive && typeof rdGetGuestView === 'function' && rdGetGuestView() === 'table') {
      jumpActive = 'guest-view-host';
    }
    function jumpItem(id, label, onClick) {
      var active = jumpActive === id;
      return '<button type="button" class="rd-rail__item' + (active ? ' is-active' : '') + '"' +
        ' data-guest-jump="' + esc(id) + '" onclick="' + onClick + '">' + esc(label) + '</button>';
    }
    var jumpHtml =
      '<div class="rd-rail__section">' +
      '<div class="rd-rail__title">Jump to</div>' +
      '<div class="rd-rail__list" role="list">' +
      jumpItem('guest-costs-section', 'Headcount costs', "guestJumpTo('guest-costs-section')") +
      jumpItem('guest-seating-section', 'Seating count', "guestJumpTo('guest-seating-section')") +
      jumpItem('guest-events-section', 'Event invitations', "guestJumpTo('guest-events-section')") +
      jumpItem('guest-workflow-section', 'Invitation workflow', "guestJumpTo('guest-workflow-section')") +
      jumpItem('guest-view-host', 'Guest table', "rdSetGuestView('table');guestJumpTo('guest-view-host')") +
      jumpItem('guest-companions-section', 'Companions', "rdSetGuestView('table');guestJumpTo('guest-companions-section')") +
      '</div></div>';

    function sideMeter(id, label, count) {
      var pct = nAll > 0 ? Math.round((count / nAll) * 100) : 0;
      var active = activeView === id;
      return '<button type="button" class="rd-rail__meter' + (active ? ' is-active' : '') + '"' +
        ' data-guest-rail-view="' + esc(id) + '"' +
        ' onclick="applyGuestRailView(\'' + id + '\')">' +
        '<div class="rd-rail__meter-top"><span>' + esc(label) + '</span>' +
        '<span class="rd-rail__count">' + count + '</span></div>' +
        '<div class="rd-track"><div class="rd-fill" style="width:' + pct + '%"></div></div>' +
        '</button>';
    }
    var sideHtml =
      '<div class="rd-rail__section">' +
      '<div class="rd-rail__title">By side</div>' +
      '<div class="rd-rail__meters" role="list">' +
      sideMeter('side-bride', 'Bride', nBride) +
      sideMeter('side-groom', 'Groom', nGroom) +
      sideMeter('side-both', 'Both', nBoth) +
      '</div></div>';

    function groupItem(id, label) {
      return '<button type="button" class="rd-rail__item' + (activeGroup === id ? ' is-active' : '') + '"' +
        ' data-guest-rail-group="' + esc(id) + '"' +
        ' onclick="applyGuestRailGroupBy(\'' + id + '\')">' + esc(label) + '</button>';
    }
    /* Group by: Side (primary) · Household · Group · Table · RSVP */
    var groupHtml =
      '<div class="rd-rail__section">' +
      '<div class="rd-rail__title">Group by</div>' +
      '<div class="rd-rail__list" role="list">' +
      groupItem('side', 'Side') +
      groupItem('household', 'Household') +
      groupItem('group', 'Group') +
      groupItem('table', 'Table') +
      groupItem('rsvp', 'RSVP') +
      '</div></div>';

    return '<div class="rd-rail__stack" data-page-rail="guests">' + viewsHtml + jumpHtml + sideHtml + groupHtml + '</div>';
  }

  /* Wedding Party rail — mock 10a */
  function buildPartyContext() {
    var d = plannerData() || {};
    var rows = typeof safeArray === 'function' ? safeArray(d.party) : (d.party || []);
    var activeView = 'all';
    if (typeof getSavedView === 'function') activeView = getSavedView('party', 'all');
    else if (typeof window._partyRailView === 'string' && window._partyRailView) activeView = window._partyRailView;
    window._partyRailView = activeView;
    if (typeof getSavedView === 'function') {
      window._partyRailGroupBy = getSavedView('partyGroupBy', window._partyRailGroupBy || 'side');
    }
    var activeGroup = (typeof window._partyRailGroupBy === 'string' && window._partyRailGroupBy) || 'side';

    function sideOf(r) {
      if (typeof partyMemberSide === 'function') return partyMemberSide(r);
      return String(r.side || 'Bride');
    }
    function attireSt(r) {
      if (typeof partyAttireStatus === 'function') return partyAttireStatus(r);
      return r.attireStatus || 'Not measured';
    }
    function isSpeaking(r) {
      if (typeof partyHasSpeakingDuty === 'function') return partyHasSpeakingDuty(r);
      return /speech|toast/i.test(String(r.dutyLabels || r.duties || ''));
    }

    var nAll = rows.length;
    var nBride = rows.filter(function (r) { return sideOf(r) === 'Bride'; }).length;
    var nGroom = rows.filter(function (r) { return sideOf(r) === 'Groom'; }).length;
    var nAttire = rows.filter(function (r) { return attireSt(r) !== 'Fitted & paid'; }).length;
    var nSpeak = rows.filter(isSpeaking).length;
    var nFitted = rows.filter(function (r) { return attireSt(r) === 'Fitted & paid'; }).length;
    var nDeposit = rows.filter(function (r) { return attireSt(r) === 'Deposit only'; }).length;
    var nNotMeas = rows.filter(function (r) { return attireSt(r) === 'Not measured'; }).length;
    var pct = nAll ? Math.round((nFitted / nAll) * 100) : 0;

    function viewItem(id, label, count, opts) {
      opts = opts || {};
      var warn = opts.warn && count > 0;
      return '<button type="button" class="rd-rail__item' + (activeView === id ? ' is-active' : '') + '"' +
        ' onclick="applyPartyRailView(\'' + id + '\')">' + esc(label) +
        '<span class="rd-rail__count' + (warn ? ' rd-rail__count--warn' : '') + '">' + count + '</span></button>';
    }

    var viewsHtml =
      '<div class="rd-rail__section">' +
      '<div class="rd-rail__title">Views<span class="rd-rail__title-add" aria-hidden="true">+</span></div>' +
      '<div class="rd-rail__list" role="list">' +
      viewItem('all', 'Everyone', nAll) +
      viewItem('bride', 'Bride\u2019s side', nBride) +
      viewItem('groom', 'Groom\u2019s side', nGroom) +
      viewItem('attire-outstanding', 'Attire outstanding', nAttire, { warn: true }) +
      viewItem('speaking', 'Speaking', nSpeak) +
      '</div></div>';

    var metersHtml =
      '<div class="rd-rail__section">' +
      '<div class="rd-rail__title">Attire</div>' +
      '<div class="rd-rail__meters">' +
      '<div class="rd-rail__meter">' +
      '<div class="rd-rail__meter-top"><span>Fitted &amp; paid</span><span class="rd-rail__count">' + nFitted + ' of ' + nAll + '</span></div>' +
      '<div class="rd-track"><div class="rd-fill" style="width:' + pct + '%"></div></div></div>' +
      '<div class="rd-rail__meter-top"><span>Deposit only</span><span class="rd-rail__count">' + nDeposit + '</span></div>' +
      '<div class="rd-rail__meter-top"><span>Not measured</span><span class="rd-rail__count">' + nNotMeas + '</span></div>' +
      '<div class="rd-rail__meter-top"><span>Group deadline</span><span class="rd-rail__count">12 Sep</span></div>' +
      '</div></div>';

    function groupItem(id, label) {
      return '<button type="button" class="rd-rail__item' + (activeGroup === id ? ' is-active' : '') + '"' +
        ' onclick="applyPartyRailGroupBy(\'' + id + '\')">' + esc(label) + '</button>';
    }
    var groupHtml =
      '<div class="rd-rail__section">' +
      '<div class="rd-rail__title">Group by</div>' +
      '<div class="rd-rail__list" role="list">' +
      groupItem('side', 'Side') +
      groupItem('role', 'Role') +
      groupItem('attire', 'Attire status') +
      '</div></div>';

    var noteHtml =
      '<p class="rd-rail__note">Every member is also a guest record. Changing a name here changes it on the Guest List.</p>';

    return '<div class="rd-rail__stack" data-page-rail="party">' + viewsHtml + metersHtml + groupHtml + noteHtml + '</div>';
  }

  /* Gifts rail — mock 10b */
  function buildGiftsContext() {
    var d = plannerData() || {};
    var rows = typeof safeArray === 'function' ? safeArray(d.gifts) : (d.gifts || []);
    var activeView = 'all';
    if (typeof getSavedView === 'function') activeView = getSavedView('gifts', 'all');
    else if (typeof window._giftsRailView === 'string' && window._giftsRailView) activeView = window._giftsRailView;
    window._giftsRailView = activeView;
    if (typeof getSavedView === 'function') {
      window._giftsRailGroupBy = getSavedView('giftsGroupBy', window._giftsRailGroupBy || 'type');
    }
    var activeGroup = (typeof window._giftsRailGroupBy === 'string' && window._giftsRailGroupBy) || 'type';

    function gType(r) {
      if (typeof giftType === 'function') return giftType(r);
      if (typeof inferGiftCategory === 'function') return inferGiftCategory(r);
      return r.category || 'Registry';
    }
    function thankSt(r) {
      if (typeof giftThankStatus === 'function') return giftThankStatus(r);
      if (r.thankyouStatus) return r.thankyouStatus;
      return r.thankyou ? 'Sent' : 'Not started';
    }

    var nAll = rows.length;
    var nDue = rows.filter(function (r) { return thankSt(r) !== 'Sent'; }).length;
    var nSent = rows.filter(function (r) { return thankSt(r) === 'Sent'; }).length;
    var nCash = rows.filter(function (r) { return gType(r) === 'Cash'; }).length;
    var nReg = rows.filter(function (r) { return gType(r) === 'Registry'; }).length;
    var nDrafted = rows.filter(function (r) { return thankSt(r) === 'Drafted'; }).length;
    var nNot = rows.filter(function (r) { return thankSt(r) === 'Not started'; }).length;
    var pct = nAll ? Math.round((nSent / nAll) * 100) : 0;

    function viewItem(id, label, count, opts) {
      opts = opts || {};
      var warn = opts.warn && count > 0;
      return '<button type="button" class="rd-rail__item' + (activeView === id ? ' is-active' : '') + '"' +
        ' onclick="applyGiftsRailView(\'' + id + '\')">' + esc(label) +
        '<span class="rd-rail__count' + (warn ? ' rd-rail__count--warn' : '') + '">' + count + '</span></button>';
    }

    var viewsHtml =
      '<div class="rd-rail__section">' +
      '<div class="rd-rail__title">Views<span class="rd-rail__title-add" aria-hidden="true">+</span></div>' +
      '<div class="rd-rail__list" role="list">' +
      viewItem('all', 'All gifts', nAll) +
      viewItem('due', 'Thank-you due', nDue, { warn: true }) +
      viewItem('sent', 'Sent', nSent) +
      viewItem('cash', 'Cash & transfers', nCash) +
      viewItem('registry', 'Registry', nReg) +
      '</div></div>';

    var metersHtml =
      '<div class="rd-rail__section">' +
      '<div class="rd-rail__title">Thank-you notes</div>' +
      '<div class="rd-rail__meters">' +
      '<div class="rd-rail__meter">' +
      '<div class="rd-rail__meter-top"><span>Written &amp; sent</span><span class="rd-rail__count">' + nSent + ' of ' + nAll + '</span></div>' +
      '<div class="rd-track"><div class="rd-fill" style="width:' + pct + '%"></div></div></div>' +
      '<div class="rd-rail__meter-top"><span>Drafted</span><span class="rd-rail__count">' + nDrafted + '</span></div>' +
      '<div class="rd-rail__meter-top"><span>Not started</span><span class="rd-rail__count">' + nNot + '</span></div>' +
      '<div class="rd-rail__meter-top"><span>Target</span><span class="rd-rail__count">within 3 weeks</span></div>' +
      '</div></div>';

    function groupItem(id, label) {
      return '<button type="button" class="rd-rail__item' + (activeGroup === id ? ' is-active' : '') + '"' +
        ' onclick="applyGiftsRailGroupBy(\'' + id + '\')">' + esc(label) + '</button>';
    }
    var groupHtml =
      '<div class="rd-rail__section">' +
      '<div class="rd-rail__title">Group by</div>' +
      '<div class="rd-rail__list" role="list">' +
      groupItem('type', 'Type') +
      groupItem('giver', 'Giver') +
      groupItem('date', 'Date received') +
      '</div></div>';

    var noteHtml =
      '<p class="rd-rail__note">Givers are guest records. A gift logged here shows on the guest&rsquo;s drawer and the household row.</p>';

    return '<div class="rd-rail__stack" data-page-rail="gifts">' + viewsHtml + metersHtml + groupHtml + noteHtml + '</div>';
  }

  /* Table Layout rail — mock 8a */
  function buildTablesContext() {
    var s = (typeof tablesStatsData === 'function') ? tablesStatsData() : { tables: 0, hasFree: 0, full: 0, unseated: 0, assigned: 0, seats: 0, shortBy: 0, roomFor: 40 };
    var activeView = 'all';
    if (typeof getSavedView === 'function') activeView = getSavedView('tables', 'all');
    else if (typeof window._tablesRailView === 'string' && window._tablesRailView) activeView = window._tablesRailView;
    window._tablesRailView = activeView;

    function viewItem(id, label, count, opts) {
      opts = opts || {};
      var warn = opts.warn && count > 0;
      return '<button type="button" class="rd-rail__item' + (activeView === id ? ' is-active' : '') + '"' +
        ' onclick="applyTablesRailView(\'' + id + '\')">' + esc(label) +
        '<span class="rd-rail__count' + (warn ? ' rd-rail__count--warn' : '') + '">' + count + '</span></button>';
    }

    var viewsHtml =
      '<div class="rd-rail__section">' +
      '<div class="rd-rail__title">Views<span class="rd-rail__title-add" aria-hidden="true">+</span></div>' +
      '<div class="rd-rail__list" role="list">' +
      viewItem('all', 'All tables', s.tables) +
      viewItem('free', 'Has free seats', s.hasFree) +
      viewItem('full', 'Full', s.full) +
      viewItem('unseated', 'Unseated guests', s.unseated, { warn: true }) +
      '</div></div>';

    var whyHtml =
      '<div class="rd-rail__section">' +
      '<div class="rd-rail__title">Why ' + s.unseated + ' are unseated</div>' +
      '<div class="rd-rail__meters">' +
      '<div class="rd-rail__meter-top"><span>Not invited yet</span><span class="rd-rail__count">12</span></div>' +
      '<div class="rd-rail__meter-top"><span>No address on file</span><span class="rd-rail__count">9</span></div>' +
      '<div class="rd-rail__meter-top"><span>Unnamed plus-ones</span><span class="rd-rail__count">3</span></div>' +
      '<p class="rd-rail__note">A guest can\u2019t take a seat until they have a name and an invitation.</p>' +
      '</div></div>';

    var pct = s.seats ? Math.round((s.assigned / s.seats) * 100) : 0;
    var capHtml =
      '<div class="rd-rail__section">' +
      '<div class="rd-rail__title">Capacity</div>' +
      '<div class="rd-rail__meters">' +
      '<div class="rd-rail__meter">' +
      '<div class="rd-rail__meter-top"><span>Seats used</span><span class="rd-rail__count">' + s.assigned + ' / ' + s.seats + '</span></div>' +
      '<div class="rd-track"><div class="rd-fill" style="width:' + pct + '%"></div></div></div>' +
      '<div class="rd-rail__meter-top"><span>Venue maximum</span><span class="rd-rail__count">160</span></div>' +
      '<div class="rd-rail__meter-top"><span>Room for</span><span class="rd-rail__count">' + (s.roomFor || 0) + ' more</span></div>' +
      '<p class="rd-rail__note">Grace Hall seats 160, so the shortfall is tables and linens, not space.</p>' +
      '</div></div>';

    return '<div class="rd-rail__stack" data-page-rail="tables">' + viewsHtml + whyHtml + capHtml + '</div>';
  }

  function buildDashboardContext() {
    /* All.dc #3a / Dark.dc — jump links (not saved views) + Foundation meters + scripture */
    var activeJump = window._dashJump || 'dash-next-step';
    var jumps = typeof window.dashboardRailJumps === 'function'
      ? window.dashboardRailJumps()
      : [
        ['dash-next-step', 'Next best step'],
        ['dash-needs', 'Needs attention'],
        ['dash-budget-health', 'Budget health'],
        ['dash-guest-response', 'Guest response'],
        ['dash-day-preview', 'Wedding day preview']
      ];
    var meters = typeof window.dashboardFoundationMeters === 'function'
      ? window.dashboardFoundationMeters()
      : { visionPct: 0, counselingDone: 0, counselingTotal: 8, setupDone: 0, setupTotal: 7 };

    var jumpHtml = jumps.map(function (j) {
      var id = j[0];
      var label = j[1];
      return '<button type="button" class="rd-rail__item' + (activeJump === id ? ' is-active' : '') + '"' +
        ' onclick="rdDashJumpTo(\'' + id + '\')">' + esc(label) + '</button>';
    }).join('');

    var verseEl = document.getElementById('banner-verse');
    var refEl = document.getElementById('banner-ref');
    var verse = (verseEl && verseEl.value && verseEl.value.trim())
      ? verseEl.value.trim()
      : 'And a threefold cord is not quickly broken.';
    var ref = (refEl && refEl.value && refEl.value.trim())
      ? refEl.value.trim()
      : 'Ecclesiastes 4:12';

    return '<div class="rd-rail__stack" data-page-rail="dashboard">' +
      '<div class="rd-rail__section">' +
      '<div class="rd-rail__title">On this page</div>' +
      '<div class="rd-rail__list" role="list">' + jumpHtml + '</div></div>' +
      '<div class="rd-rail__section">' +
      '<div class="rd-rail__title">Foundation</div>' +
      '<div class="rd-rail__meters">' +
      '<div class="rd-rail__meter-top"><span>Vision &amp; foundation</span><span class="rd-rail__count">' +
      (meters.visionPct || 0) + '%</span></div>' +
      '<div class="rd-rail__meter-top"><span>Counseling</span><span class="rd-rail__count">' +
      (meters.counselingDone || 0) + '/' + (meters.counselingTotal || 8) + '</span></div>' +
      '<div class="rd-rail__meter-top"><span>Setup complete</span><span class="rd-rail__count">' +
      (meters.setupDone || 0) + '/' + (meters.setupTotal || 7) + '</span></div>' +
      '</div></div>' +
      '<p class="rd-rail__note">“' + esc(verse) + '”<br><b>' + esc(ref) + '</b></p>' +
      '</div>';
  }

  /* Budget rail — mock 4a: saved views, in-page jump list, and a "where it
     goes" meter strip, closed by Proverbs 3:9. */
  function buildBudgetContext() {
    var d = plannerData() || {};
    var list = typeof safeArray === 'function' ? safeArray(d.budget) : (d.budget || []);
    var money = function (v) {
      var n = Math.round(parseFloat(v) || 0);
      return '$' + n.toLocaleString();
    };
    var spentOf = typeof window.budgetCatSpentOf === 'function' ? window.budgetCatSpentOf
      : function (c) { return typeof catSpent === 'function' ? catSpent(c) : 0; };
    var targetOf = typeof window.budgetCatTargetOf === 'function' ? window.budgetCatTargetOf
      : function (c) { return typeof catPlanned === 'function' ? catPlanned(c) : 0; };

    var activeView = 'all';
    if (typeof getSavedView === 'function') activeView = getSavedView('budget', 'all');
    else if (typeof window._budgetRailView === 'string' && window._budgetRailView) activeView = window._budgetRailView;
    window._budgetRailView = activeView;

    var counts = typeof window.budgetRailCounts === 'function' ? window.budgetRailCounts() : {
      all: list.length, over: 0, empty: 0, payments: 0, catering: 0, gratuity: 0
    };

    function viewItem(id, label, count, warn) {
      return '<button type="button" class="rd-rail__item' + (activeView === id ? ' is-active' : '') + '"' +
        ' onclick="applyBudgetRailView(\'' + id + '\')">' + esc(label) +
        '<span class="rd-rail__count' + (warn && count > 0 ? ' rd-rail__count--warn' : '') + '">' + count + '</span></button>';
    }

    var viewsHtml =
      '<div class="rd-rail__section">' +
      '<div class="rd-rail__title">Views<span class="rd-rail__title-add" aria-hidden="true">+</span></div>' +
      '<div class="rd-rail__list" role="list">' +
      viewItem('all', 'All categories', counts.all) +
      viewItem('over', 'Over target', counts.over, true) +
      viewItem('empty', 'Nothing spent', counts.empty) +
      viewItem('payments', 'Linked from Payments', counts.payments) +
      viewItem('catering', 'Owned by Catering', counts.catering) +
      viewItem('gratuity', 'Gratuity planned', counts.gratuity) +
      '</div></div>';

    var activeIdx = (typeof activeBudgetCategoryIndex !== 'undefined') ? activeBudgetCategoryIndex : 0;
    var activeCat = list[activeIdx];
    /* Mock 4a: one continuous scroll — Jump to scrolls the body to each section. */
    var activeJump = typeof window.budgetJumpSection === 'function'
      ? window.budgetJumpSection()
      : (window._budgetJumpSection || 'bgt-sect-categories');
    var jumps = [
      ['bgt-sect-categories', 'Budget by category'],
      ['bgt-sect-recon', 'Reconciliation'],
      ['bgt-sect-truetotal', 'True Total'],
      ['bgt-sect-logic', 'Budget Logic'],
      ['bgt-sect-tipping', 'Tipping Etiquette'],
      ['bgt-sect-itemized', 'Itemized · ' + ((activeCat && activeCat.cat) || 'all')]
    ];
    var jumpHtml =
      '<div class="rd-rail__section">' +
      '<div class="rd-rail__title">Jump to</div>' +
      '<div class="rd-rail__list" role="list">' +
      jumps.map(function (j) {
        return '<button type="button" class="rd-rail__item' + (j[0] === activeJump ? ' is-active' : '') + '"' +
          ' onclick="rdBudgetJumpTo(\'' + j[0] + '\')">' + esc(j[1]) + '</button>';
      }).join('') +
      '</div></div>';

    /* Biggest four categories by committed spend — the same bars as the cards. */
    var top = list.slice().sort(function (a, b) { return spentOf(b) - spentOf(a); }).slice(0, 4);
    var metersHtml = top.length
      ? '<div class="rd-rail__section">' +
        '<div class="rd-rail__title">Where it goes</div>' +
        '<div class="rd-rail__meters">' +
        top.map(function (c) {
          var spent = spentOf(c);
          var target = targetOf(c);
          var pct = target > 0 ? Math.min(100, Math.round((spent / target) * 100)) : 0;
          var tone = target > 0 && spent > target ? ' rd-fill--over' : (pct >= 90 ? ' rd-fill--warn' : '');
          return '<div class="rd-rail__meter">' +
            '<div class="rd-rail__meter-top"><span>' + esc(c.cat || 'Category') + '</span>' +
            '<span class="rd-rail__count">' + money(spent) + '</span></div>' +
            '<div class="rd-track"><div class="rd-fill' + tone + '" style="width:' + pct + '%"></div></div></div>';
        }).join('') +
        '</div></div>'
      : '';

    var scripture =
      '<div class="rd-rail__scripture">' +
      '&ldquo;Honour the Lord with thy substance, and with the firstfruits of all thine increase.&rdquo;' +
      '<span class="rd-rail__scripture-ref">Proverbs 3:9</span>' +
      '</div>';

    return '<div class="rd-rail__stack" data-page-rail="budget">' +
      viewsHtml + jumpHtml + metersHtml + scripture + '</div>';
  }

  /* Screen 4b Rail · 224px — saved views over the payment list, then cash out by
     month. The meters read the same month buckets the table groups by, so the
     rail and the table can never disagree about what leaves the account when. */
  function buildPaymentsContext() {
    var d = plannerData() || {};
    var rows = typeof safeArray === 'function' ? safeArray(d.payments) : [];
    var money = function (v) {
      return '$' + Math.round(parseFloat(v) || 0).toLocaleString();
    };

    var activeView = 'all';
    if (typeof getSavedView === 'function') activeView = getSavedView('payments', 'all');
    else if (typeof window._payRailView === 'string' && window._payRailView) activeView = window._payRailView;
    window._payRailView = activeView;

    var counts = typeof window.paymentRailCounts === 'function' ? window.paymentRailCounts() : {
      all: rows.length, due30: 0, unpaid: 0, deposits: 0, nogratuity: 0, nocategory: 0
    };

    function viewItem(id, label, count, warn) {
      return '<button type="button" class="rd-rail__item' + (activeView === id ? ' is-active' : '') + '"' +
        ' onclick="applyPaymentsRailView(\'' + id + '\')">' + esc(label) +
        '<span class="rd-rail__count' + (warn && count > 0 ? ' rd-rail__count--warn' : '') + '">' + count + '</span></button>';
    }

    var viewsHtml =
      '<div class="rd-rail__section">' +
      '<div class="rd-rail__title">Views<span class="rd-rail__title-add" aria-hidden="true">+</span></div>' +
      '<div class="rd-rail__list" role="list">' +
      viewItem('all', 'All payments', counts.all) +
      viewItem('due30', 'Due in 30 days', counts.due30, true) +
      viewItem('unpaid', 'Unpaid', counts.unpaid) +
      viewItem('deposits', 'Deposits only', counts.deposits) +
      viewItem('nogratuity', 'Gratuity not planned', counts.nogratuity) +
      viewItem('nocategory', 'No budget category', counts.nocategory) +
      '</div></div>';

    var figures = typeof window.paymentFigures === 'function' ? window.paymentFigures() : { months: [], monthMax: 0 };
    var months = (figures.months || []).slice(0, 6);
    var max = figures.monthMax || 0;
    var monthsHtml = months.length
      ? '<div class="rd-rail__section">' +
        '<div class="rd-rail__title">Cash out by month</div>' +
        '<div class="rd-rail__meters">' +
        months.map(function (m) {
          var pct = max > 0 ? Math.max(2, Math.round((m.amount / max) * 100)) : 0;
          return '<div class="rd-rail__meter">' +
            '<div class="rd-rail__meter-top"><span>' + esc(String(m.label).replace(/\s+\d{4}$/, '')) + '</span>' +
            '<span class="rd-rail__count">' + money(m.amount) + '</span></div>' +
            '<div class="rd-track"><div class="rd-fill" style="width:' + pct + '%"></div></div></div>';
        }).join('') +
        '</div></div>'
      : '';

    var jumps = [
      ['pay-sect-tracker', 'Payment schedule tracker'],
      ['pay-sect-table', 'Payments by due month']
    ];
    var jumpHtml =
      '<div class="rd-rail__section">' +
      '<div class="rd-rail__title">Jump to</div>' +
      '<div class="rd-rail__list" role="list">' +
      jumps.map(function (j) {
        return '<button type="button" class="rd-rail__item" onclick="rdPayJumpTo(\'' + j[0] + '\')">' + esc(j[1]) + '</button>';
      }).join('') +
      '</div></div>';

    /* No rail verse here: the planner already injects Romans 13:8 under the
       pagehead for this panel, and 4b's rail is Views + Cash out by month. */
    return '<div class="rd-rail__stack" data-page-rail="payments">' +
      viewsHtml + monthsHtml + jumpHtml + '</div>';
  }

  /* Venue & Vendors rail — All.dc 4c / Views 30f */
  function buildVendorsContext() {
    var money = function (v) {
      return '$' + Math.round(parseFloat(v) || 0).toLocaleString();
    };
    var activeView = 'all';
    if (typeof getSavedView === 'function') activeView = getSavedView('vendors', 'all');
    else if (typeof window._vndRailView === 'string' && window._vndRailView) activeView = window._vndRailView;
    window._vndRailView = activeView;

    var counts = typeof window.vendorRailCounts === 'function' ? window.vendorRailCounts() : {
      all: 0, booked: 0, shortlist: 0, nocontract: 0, balance: 0
    };
    var figures = typeof window.vendorFigures === 'function' ? window.vendorFigures() : {
      bookedValue: 0, paid: 0
    };

    function viewItem(id, label, count, warn) {
      return '<button type="button" class="rd-rail__item' + (activeView === id ? ' is-active' : '') + '"' +
        ' onclick="applyVendorsRailView(\'' + id + '\')">' + esc(label) +
        '<span class="rd-rail__count' + (warn && count > 0 ? ' rd-rail__count--warn' : '') + '">' + count + '</span></button>';
    }

    var viewsHtml =
      '<div class="rd-rail__section">' +
      '<div class="rd-rail__title">Views<button type="button" class="rd-rail__add" onclick="typeof saveVendorView===\'function\'&&saveVendorView()" aria-label="Save view">+</button></div>' +
      '<div class="rd-rail__list" role="list">' +
      viewItem('all', 'All vendors', counts.all) +
      viewItem('booked', 'Booked', counts.booked) +
      viewItem('shortlist', 'Shortlist', counts.shortlist) +
      viewItem('nocontract', 'No contract on file', counts.nocontract, true) +
      viewItem('balance', 'Balance outstanding', counts.balance) +
      '</div></div>';

    var mode = window._vndMode || 'table';
    var metersHtml = '';
    if (mode === 'compare' && typeof window.vendorCoverageMeters === 'function') {
      var coverage = window.vendorCoverageMeters() || [];
      metersHtml =
        '<div class="rd-rail__section">' +
        '<div class="rd-rail__title">Coverage</div>' +
        '<div class="rd-rail__list" role="list">' +
        coverage.map(function (c) {
          return '<div class="rd-rail__item rd-rail__item--static"><span>' + esc(c.label) +
            '</span><span class="rd-rail__count">' + esc(c.status) + '</span></div>';
        }).join('') +
        '</div></div>';
    } else {
      var bookedValue = figures.bookedValue || 0;
      var paid = figures.paid || 0;
      var outstanding = Math.max(0, bookedValue - paid);
      var pct = bookedValue > 0 ? Math.max(0, Math.min(100, Math.round((paid / bookedValue) * 100))) : 0;
      metersHtml =
        '<div class="rd-rail__section">' +
        '<div class="rd-rail__title">Booked</div>' +
        '<div class="rd-rail__meters">' +
        '<div class="rd-rail__meter">' +
        '<div class="rd-rail__meter-top"><span>Booked value</span><span class="rd-rail__count">' + money(bookedValue) + '</span></div>' +
        '<div class="rd-track"><div class="rd-fill" style="width:' + pct + '%"></div></div></div>' +
        '<div class="rd-rail__meter-top"><span>Paid to date</span><span class="rd-rail__count">' + money(paid) + '</span></div>' +
        '<div class="rd-rail__meter-top"><span>Outstanding</span><span class="rd-rail__count">' + money(outstanding) + '</span></div>' +
        '<div class="rd-rail__meter-top"><span>No contract</span><span class="rd-rail__count">' + (counts.nocontract || 0) + '</span></div>' +
        '</div></div>';
    }

    var noteHtml =
      '<p class="rd-rail__note">Quote, deposit, balance and rating are columns; pros and cons live in the drawer. Booked value counts booked vendors only.</p>';

    return '<div class="rd-rail__stack" data-page-rail="vendors">' + viewsHtml + metersHtml + noteHtml + '</div>';
  }

  /* Screen 10c Rail · 224px — Views + Committed meters + Group by. */
  function buildContractsContext() {
    var d = plannerData() || {};
    var list = typeof safeArray === 'function' ? safeArray(d.contracts) : (d.contracts || []);
    var money = function (v) {
      return '$' + Math.round(parseFloat(v) || 0).toLocaleString();
    };

    var activeView = 'all';
    if (typeof getSavedView === 'function') activeView = getSavedView('contracts', 'all');
    else if (typeof window._conRailView === 'string' && window._conRailView) activeView = window._conRailView;
    window._conRailView = activeView;

    var counts = typeof window.contractRailCounts === 'function' ? window.contractRailCounts() : {
      all: list.length, signed: 0, awaiting: 0, cancel: 0, needschedule: 0
    };
    var figures = typeof window.contractFigures === 'function' ? window.contractFigures() : {
      contracted: 0, paid: 0, outstanding: 0, docs: 0, pct: 0
    };

    function viewItem(id, label, count, warn) {
      var warnClass = '';
      if (warn === 'red' && count > 0) warnClass = ' rd-rail__count--warn';
      else if (warn === 'gold' && count > 0) warnClass = ' rd-rail__count--gold';
      return '<button type="button" class="rd-rail__item' + (activeView === id ? ' is-active' : '') + '"' +
        ' onclick="applyContractsRailView(\'' + id + '\')">' + esc(label) +
        '<span class="rd-rail__count' + warnClass + '">' + count + '</span></button>';
    }

    var viewsHtml =
      '<div class="rd-rail__section">' +
      '<div class="rd-rail__title">Views<span class="rd-rail__title-add" aria-hidden="true">+</span></div>' +
      '<div class="rd-rail__list" role="list">' +
      viewItem('all', 'All contracts', counts.all) +
      viewItem('signed', 'Signed', counts.signed) +
      viewItem('awaiting', 'Awaiting signature', counts.awaiting) +
      viewItem('cancel', 'Cancellation window open', counts.cancel, 'gold') +
      viewItem('needschedule', 'Needs schedule', counts.needschedule, 'red') +
      '</div></div>';

    var pct = Math.max(0, Math.min(100, figures.pct || 0));
    var metersHtml =
      '<div class="rd-rail__section">' +
      '<div class="rd-rail__title">Committed</div>' +
      '<div class="rd-rail__meters">' +
      '<div class="rd-rail__meter">' +
      '<div class="rd-rail__meter-top"><span>Contracted</span><span class="rd-rail__count">' + money(figures.contracted) + '</span></div>' +
      '<div class="rd-track"><div class="rd-fill" style="width:' + pct + '%"></div></div></div>' +
      '<div class="rd-rail__meter-top"><span>Paid to date</span><span class="rd-rail__count">' + money(figures.paid) + '</span></div>' +
      '<div class="rd-rail__meter-top"><span>Outstanding</span><span class="rd-rail__count">' + money(figures.outstanding) + '</span></div>' +
      '<div class="rd-rail__meter-top"><span>Documents</span><span class="rd-rail__count">' + (figures.docs || 0) + '</span></div>' +
      '</div></div>';

    var groupBy = window._conGroupBy || 'vendor';
    function groupItem(id, label) {
      return '<button type="button" class="rd-rail__item' + (groupBy === id ? ' is-active' : '') + '"' +
        ' onclick="applyContractsGroupBy(\'' + id + '\')">' + esc(label) + '</button>';
    }
    var groupHtml =
      '<div class="rd-rail__section">' +
      '<div class="rd-rail__title">Group by</div>' +
      '<div class="rd-rail__list" role="list">' +
      groupItem('vendor', 'Vendor') +
      groupItem('due', 'Due date') +
      groupItem('status', 'Status') +
      '</div></div>';

    var note = '<p class="rd-rail__note">Contract totals feed the Budget as committed money. Instalments expand inside the row.</p>';

    return '<div class="rd-rail__stack" data-page-rail="contracts">' +
      viewsHtml + metersHtml + groupHtml + note + '</div>';
  }

  /* Screen 9a / §14 Rail · 224px — Views + Phases meters + Group by.
     Live counts; soft view filters via applyTaskRailView / _taskRailView. */
  function taskRailPhaseLabel(phase) {
    var map = {
      '12+ Months Before': '12+ months',
      '9-12 Months Before': '9–12 months',
      '6-9 Months Before': '6–9 months',
      '3 Months Before': '3 months',
      '1 Month Before': '1 month',
      '1 Week Before': 'Wedding week',
      'Wedding Day': 'Wedding day',
      'After the Wedding': 'After the day'
    };
    var p = String(phase || '').trim();
    if (!p) return 'Unassigned';
    return map[p] || p;
  }

  function taskRailIsWaiting(t) {
    if (!t || t.status === 'Complete') return false;
    if (t.vendorId) return true;
    var blob = [t.status, t.notes, t.cat, t.task].join(' ').toLowerCase();
    return /wait|vendor|block|on hold|hold\b/.test(blob);
  }

  function taskRailDueThisMonth(t) {
    if (!t || !t.date) return false;
    var d = new Date(String(t.date) + 'T00:00:00');
    if (isNaN(d.getTime())) return false;
    var now = new Date();
    return d.getFullYear() === now.getFullYear() && d.getMonth() === now.getMonth();
  }

  function taskRailIsUnassigned(t) {
    return !String(t && t.assigned || '').trim();
  }

  function buildTasksContext() {
    var d = plannerData() || {};
    var tasks = typeof safeArray === 'function' ? safeArray(d.tasks) : [];
    var activeView = 'all';
    if (typeof getSavedView === 'function') activeView = getSavedView('tasks', 'all');
    else if (typeof window._taskRailView === 'string' && window._taskRailView) activeView = window._taskRailView;
    window._taskRailView = activeView;
    if (typeof getSavedView === 'function') {
      window._taskRailGroupBy = getSavedView('tasksGroupBy', window._taskRailGroupBy || 'phase');
    }
    var activeGroup = (typeof window._taskRailGroupBy === 'string' && window._taskRailGroupBy) || 'phase';

    var nAll = tasks.length;
    var nDueMonth = tasks.filter(taskRailDueThisMonth).length;
    var nOverdue = typeof taskIsOverdue === 'function'
      ? tasks.filter(function (t) { return taskIsOverdue(t); }).length
      : 0;
    var nUnassigned = tasks.filter(taskRailIsUnassigned).length;
    var nWaiting = tasks.filter(taskRailIsWaiting).length;
    var nComplete = tasks.filter(function (t) { return t.status === 'Complete'; }).length;

    function viewItem(id, label, count, opts) {
      opts = opts || {};
      var warn = opts.warn && count > 0;
      return '<button type="button" class="rd-rail__item' + (activeView === id ? ' is-active' : '') + '"' +
        ' data-task-rail-view="' + esc(id) + '"' +
        ' onclick="applyTaskRailView(\'' + id + '\')">' +
        esc(label) +
        '<span class="rd-rail__count' + (warn ? ' rd-rail__count--warn' : '') + '">' + count + '</span></button>';
    }

    var viewsHtml =
      '<div class="rd-rail__section">' +
      '<div class="rd-rail__title">Views<span class="rd-rail__title-add" aria-hidden="true">+</span></div>' +
      '<div class="rd-rail__list" role="list">' +
      viewItem('all', 'All tasks', nAll) +
      viewItem('due_month', 'Due this month', nDueMonth) +
      viewItem('overdue', 'Overdue', nOverdue, { warn: true }) +
      viewItem('unassigned', 'Unassigned', nUnassigned) +
      viewItem('waiting', 'Waiting on vendor', nWaiting) +
      viewItem('complete', 'Complete', nComplete) +
      '</div></div>';

    var phases = (typeof PLAN_PHASES !== 'undefined' && PLAN_PHASES && PLAN_PHASES.length)
      ? PLAN_PHASES
      : ['12+ Months Before', '9-12 Months Before', '6-9 Months Before', '3 Months Before', '1 Month Before'];
    /* Prefer phases that appear in data, then fall back to the full phase ladder. */
    var seenPhases = {};
    tasks.forEach(function (t) {
      var ph = String(t.phase || '').trim();
      if (ph) seenPhases[ph] = true;
    });
    var phaseOrder = phases.slice();
    Object.keys(seenPhases).forEach(function (ph) {
      if (phaseOrder.indexOf(ph) < 0) phaseOrder.push(ph);
    });
    var phaseRows = phaseOrder.map(function (ph) {
      var list = tasks.filter(function (t) { return String(t.phase || '').trim() === ph; });
      if (!list.length && !seenPhases[ph] && phaseOrder.indexOf(ph) >= phases.length) return '';
      /* Always show the standard ladder even when empty (9a sample does). */
      var total = list.length;
      var done = list.filter(function (t) { return t.status === 'Complete'; }).length;
      var pct = total ? Math.round((done / total) * 100) : 0;
      var bar = total ? Math.max(pct, done ? 4 : 0) : 0;
      if (total && done === 0) bar = 4; /* 9a minimal fill when 0/n */
      if (total === 0) bar = 0;
      return '<button type="button" class="rd-rail__meter" data-task-phase="' + esc(ph) + '"' +
        ' onclick="applyTaskRailPhaseFilter(\'' + String(ph).replace(/\\/g, '\\\\').replace(/'/g, "\\'") + '\')">' +
        '<div class="rd-rail__meter-top"><span>' + esc(taskRailPhaseLabel(ph)) + '</span>' +
        '<span class="rd-rail__count">' + done + '/' + total + '</span></div>' +
        '<div class="rd-track" aria-hidden="true"><div class="rd-fill" style="width:' + bar + '%"></div></div>' +
        '</button>';
    }).join('');

    var phasesHtml =
      '<div class="rd-rail__section">' +
      '<div class="rd-rail__title">Phases</div>' +
      '<div class="rd-rail__meters" role="list">' + phaseRows + '</div></div>';

    function groupItem(id, label) {
      return '<button type="button" class="rd-rail__item' + (activeGroup === id ? ' is-active' : '') + '"' +
        ' data-task-rail-group="' + esc(id) + '"' +
        ' onclick="applyTaskRailGroupBy(\'' + id + '\')">' + esc(label) + '</button>';
    }

    var groupHtml =
      '<div class="rd-rail__section">' +
      '<div class="rd-rail__title">Group by</div>' +
      '<div class="rd-rail__list" role="list">' +
      groupItem('phase', 'Phase') +
      groupItem('assigned', 'Owner') +
      groupItem('priority', 'Priority') +
      '</div></div>';

    return '<div class="rd-rail__stack" data-page-rail="tasks">' + viewsHtml + phasesHtml + groupHtml + '</div>';
  }

  /* Appointments rail — mock 14a: Views · Next 30 days meters · Group by */
  function buildAppointmentsContext() {
    var d = plannerData() || {};
    var rows = typeof safeArray === 'function' ? safeArray(d.appointments) : [];
    var activeView = 'all';
    if (typeof getSavedView === 'function') activeView = getSavedView('appointments', 'all');
    else if (typeof window._apptRailView === 'string' && window._apptRailView) activeView = window._apptRailView;
    window._apptRailView = activeView;
    if (typeof getSavedView === 'function') {
      window._apptRailGroupBy = getSavedView('appointmentsGroupBy', window._apptRailGroupBy || 'month');
    }
    var activeGroup = (typeof window._apptRailGroupBy === 'string' && window._apptRailGroupBy) || 'month';

    var today = null;
    try {
      if (typeof todayISO === 'function' && typeof dateFromISO === 'function') today = dateFromISO(todayISO());
    } catch (e0) { today = null; }
    if (!today) today = new Date(); today.setHours(0, 0, 0, 0);
    var in30 = new Date(today); in30.setDate(in30.getDate() + 30);

    function isPast(r) {
      if (typeof appointmentIsPast === 'function') return appointmentIsPast(r);
      return false;
    }
    function isNeeds(r) {
      if (typeof appointmentIsNeedsConfirm === 'function') return appointmentIsNeedsConfirm(r);
      return /pending|unconfirm/i.test(String(r.status || ''));
    }
    function apptDate(r) {
      try { return typeof dateFromISO === 'function' ? dateFromISO(r.date) : null; } catch (e) { return null; }
    }

    var nAll = rows.length;
    var nNext30 = rows.filter(function (r) {
      var dt = apptDate(r);
      return dt && dt >= today && dt <= in30 && !/cancel/i.test(String(r.status || ''));
    }).length;
    var nNeeds = rows.filter(isNeeds).length;
    var nClash = 0;
    try {
      if (typeof appointmentClashCount === 'function') nClash = appointmentClashCount();
    } catch (e1) { nClash = 0; }
    var nPast = rows.filter(isPast).length;

    var nNextConfirmed = rows.filter(function (r) {
      var dt = apptDate(r);
      return dt && dt >= today && dt <= in30 && /confirm/i.test(String(r.status || ''));
    }).length;
    var travelMins = 0;
    rows.filter(function (r) {
      var dt = apptDate(r);
      return dt && dt >= today && dt <= in30;
    }).forEach(function (r) {
      if (typeof appointmentTravelMins === 'function') travelMins += appointmentTravelMins(r);
      else travelMins += Number((d.appointmentPrefs && d.appointmentPrefs.travelBuffer) || 30) || 0;
    });
    var travelLabel = typeof formatTravelTotalMins === 'function'
      ? formatTravelTotalMins(travelMins)
      : (travelMins + 'm');

    var next = null;
    var lastHeld = null;
    try {
      if (typeof appointmentStatsData === 'function') {
        var s = appointmentStatsData();
        next = s.next;
        lastHeld = s.lastHeld;
      }
    } catch (e2) { /* soft */ }

    function viewItem(id, label, count, opts) {
      opts = opts || {};
      var warn = opts.warn && count > 0;
      var danger = opts.danger && count > 0;
      return '<button type="button" class="rd-rail__item' + (activeView === id ? ' is-active' : '') + '"' +
        ' data-appt-rail-view="' + esc(id) + '"' +
        ' onclick="applyAppointmentRailView(\'' + id + '\')">' +
        esc(label) +
        '<span class="rd-rail__count' + (danger ? ' rd-rail__count--danger' : warn ? ' rd-rail__count--warn' : '') + '">' + count + '</span></button>';
    }

    var viewsHtml =
      '<div class="rd-rail__section">' +
      '<div class="rd-rail__title">Views<span class="rd-rail__title-add" aria-hidden="true">+</span></div>' +
      '<div class="rd-rail__list" role="list">' +
      viewItem('all', 'All appointments', nAll) +
      viewItem('next30', 'Next 30 days', nNext30) +
      viewItem('needs', 'Needs confirming', nNeeds, { warn: true }) +
      viewItem('clashes', 'Clashes', nClash, { danger: true }) +
      viewItem('past', 'Past', nPast) +
      '</div></div>';

    var nextHuman = next && next.date
      ? ((typeof humanDate === 'function' ? humanDate(next.date, { month: 'short', day: 'numeric' }) : next.date) +
        (next.title ? ' · ' + String(next.title).slice(0, 18) : ''))
      : '—';
    var lastHuman = lastHeld && lastHeld.date
      ? ((typeof humanDate === 'function' ? humanDate(lastHeld.date, { month: 'short', day: 'numeric' }) : lastHeld.date) +
        (lastHeld.title ? ' · ' + String(lastHeld.title).slice(0, 14) : ''))
      : '—';
    var confirmPct = nNext30 ? Math.round((nNextConfirmed / nNext30) * 100) : 0;

    var metersHtml =
      '<div class="rd-rail__section">' +
      '<div class="rd-rail__title">Next 30 days</div>' +
      '<div class="rd-rail__meters">' +
      '<div class="rd-rail__meter">' +
      '<div class="rd-rail__meter-top"><span>Confirmed</span><span class="rd-rail__count">' + nNextConfirmed + ' of ' + nNext30 + '</span></div>' +
      '<div class="rd-track" aria-hidden="true"><div class="rd-fill" style="width:' + confirmPct + '%"></div></div>' +
      '</div>' +
      '<div class="rd-rail__meter-top"><span>Travel time booked</span><span class="rd-rail__count">' + esc(travelLabel) + '</span></div>' +
      '<div class="rd-rail__meter-top"><span>Next</span><span class="rd-rail__count">' + esc(nextHuman) + '</span></div>' +
      '<div class="rd-rail__meter-top"><span>Last held</span><span class="rd-rail__count">' + esc(lastHuman) + '</span></div>' +
      '</div></div>';

    function groupItem(id, label) {
      return '<button type="button" class="rd-rail__item' + (activeGroup === id ? ' is-active' : '') + '"' +
        ' data-appt-rail-group="' + esc(id) + '"' +
        ' onclick="applyAppointmentRailGroupBy(\'' + id + '\')">' + esc(label) + '</button>';
    }

    var groupHtml =
      '<div class="rd-rail__section">' +
      '<div class="rd-rail__title">Group by</div>' +
      '<div class="rd-rail__list" role="list">' +
      groupItem('month', 'Month') +
      groupItem('vendor', 'Vendor') +
      groupItem('who', 'Who attends') +
      '</div></div>';

    var note = '<p class="rd-rail__note">Every appointment appears on the Smart Calendar. Travel allowance is added there as a shaded margin, not as a second event.</p>';

    return '<div class="rd-rail__stack" data-page-rail="appointments">' + viewsHtml + metersHtml + groupHtml + note + '</div>';
  }

  function applyAppointmentRailView(viewId) {
    window._apptRailView = viewId || 'all';
    if (typeof setSavedView === 'function') setSavedView('appointments', window._apptRailView);
    if (typeof smartAppointmentFilters === 'object' && smartAppointmentFilters) {
      if (viewId === 'next30') smartAppointmentFilters.range = 'Next 30 Days';
      else smartAppointmentFilters.range = 'All Dates';
    }
    if (typeof renderAppointments === 'function') renderAppointments();
    if (typeof renderContextSidebar === 'function') renderContextSidebar('appointments');
  }

  function applyAppointmentRailGroupBy(groupId) {
    window._apptRailGroupBy = groupId || 'month';
    if (typeof setSavedView === 'function') setSavedView('appointmentsGroupBy', window._apptRailGroupBy);
    if (typeof renderAppointments === 'function') renderAppointments();
    if (typeof renderContextSidebar === 'function') renderContextSidebar('appointments');
  }

  /* ── Weekend Logistics rail (mock 11d) ─────────────────────────────── */
  function buildLogisticsContext() {
    var d = plannerData() || {};
    var moves = typeof safeArray === 'function' ? safeArray(d.weekendTimeline) : (d.weekendTimeline || []);
    var hotels = typeof safeArray === 'function' ? safeArray(d.hotelBlocks) : (d.hotelBlocks || []);
    var activeView = 'all';
    if (typeof getSavedView === 'function') activeView = getSavedView('logistics', 'all');
    else if (typeof window._logRailView === 'string' && window._logRailView) activeView = window._logRailView;
    window._logRailView = activeView;
    if (typeof getSavedView === 'function') {
      window._logRailGroupBy = getSavedView('logisticsGroupBy', window._logRailGroupBy || 'day');
    }
    var activeGroup = (typeof window._logRailGroupBy === 'string' && window._logRailGroupBy) || 'day';

    function dayKey(r) {
      return typeof logisticsRowDayKey === 'function' ? logisticsRowDayKey(r) : 'other';
    }
    function isUnowned(r) {
      return typeof logisticsRowIsUnowned === 'function' ? logisticsRowIsUnowned(r) : !(r && String(r.host || '').trim());
    }

    var nAll = moves.length;
    var nFri = moves.filter(function (r) { return dayKey(r) === 'friday'; }).length;
    var nSat = moves.filter(function (r) { return dayKey(r) === 'saturday'; }).length;
    var nSun = moves.filter(function (r) { return dayKey(r) === 'sunday'; }).length;
    var nUnowned = moves.filter(isUnowned).length;

    var reserved = hotels.reduce(function (s, h) { return s + (parseInt(h.reserved || 0, 10) || 0); }, 0);
    var booked = hotels.reduce(function (s, h) { return s + (parseInt(h.booked || 0, 10) || 0); }, 0);
    var held = Math.max(reserved, booked);
    var roomsPct = reserved ? Math.min(100, Math.round((booked / reserved) * 100)) : 0;
    var earliestCutoff = '';
    hotels.forEach(function (h) {
      if (h.cutoff && (!earliestCutoff || String(h.cutoff) < earliestCutoff)) earliestCutoff = String(h.cutoff);
    });
    var cutoffLabel = earliestCutoff
      ? (typeof humanDate === 'function' ? humanDate(earliestCutoff, { month: 'short', day: 'numeric' }) : earliestCutoff)
      : '—';

    function viewItem(id, label, count, opts) {
      opts = opts || {};
      var warn = opts.warn && count > 0;
      return '<button type="button" class="rd-rail__item' + (activeView === id ? ' is-active' : '') + '"' +
        ' data-log-rail-view="' + esc(id) + '"' +
        ' onclick="applyLogisticsRailView(\'' + id + '\')">' +
        esc(label) +
        '<span class="rd-rail__count' + (warn ? ' rd-rail__count--warn' : '') + '">' + count + '</span></button>';
    }

    var viewsHtml =
      '<div class="rd-rail__section">' +
      '<div class="rd-rail__title">Views<span class="rd-rail__title-add" aria-hidden="true">+</span></div>' +
      '<div class="rd-rail__list" role="list">' +
      viewItem('all', 'Whole weekend', nAll) +
      viewItem('friday', 'Friday', nFri) +
      viewItem('saturday', 'Saturday', nSat) +
      viewItem('sunday', 'Sunday · wedding day', nSun) +
      viewItem('unowned', 'Unowned', nUnowned, { warn: true }) +
      '</div></div>';

    var metersHtml =
      '<div class="rd-rail__section">' +
      '<div class="rd-rail__title">Accommodation</div>' +
      '<div class="rd-rail__meters">' +
      '<div class="rd-rail__meter">' +
      '<div class="rd-rail__meter-top"><span>Rooms held</span><span class="rd-rail__count">' + booked + ' of ' + (reserved || held || 0) + '</span></div>' +
      '<div class="rd-track" aria-hidden="true"><div class="rd-fill" style="width:' + roomsPct + '%"></div></div>' +
      '</div>' +
      '<div class="rd-rail__meter-top"><span>Confirmed guests</span><span class="rd-rail__count">' + booked + '</span></div>' +
      '<div class="rd-rail__meter-top"><span>Awaiting reply</span><span class="rd-rail__count">' + Math.max(0, reserved - booked) + '</span></div>' +
      '<div class="rd-rail__meter-top"><span>Block releases</span><span class="rd-rail__count">' + esc(cutoffLabel) + '</span></div>' +
      '</div></div>';

    function groupItem(id, label) {
      return '<button type="button" class="rd-rail__item' + (activeGroup === id ? ' is-active' : '') + '"' +
        ' data-log-rail-group="' + esc(id) + '"' +
        ' onclick="applyLogisticsRailGroupBy(\'' + id + '\')">' + esc(label) + '</button>';
    }
    var groupHtml =
      '<div class="rd-rail__section">' +
      '<div class="rd-rail__title">Group by</div>' +
      '<div class="rd-rail__list" role="list">' +
      groupItem('day', 'Day') +
      groupItem('owner', 'Owner') +
      groupItem('type', 'Type') +
      '</div></div>';

    var noteHtml = '<p class="rd-rail__note">Movements with a Sunday time also appear on the Wedding Day Timeline. Editing one edits both.</p>';

    return '<div class="rd-rail__stack" data-page-rail="logistics">' + viewsHtml + metersHtml + groupHtml + noteHtml + '</div>';
  }

  function applyLogisticsRailView(viewId) {
    window._logRailView = viewId || 'all';
    if (typeof setSavedView === 'function') setSavedView('logistics', window._logRailView);
    if (typeof setLogisticsDayFilter === 'function') setLogisticsDayFilter(window._logRailView);
    else if (typeof renderLogisticsPage === 'function') renderLogisticsPage();
    if (typeof renderContextSidebar === 'function') renderContextSidebar('logistics');
  }

  function applyLogisticsRailGroupBy(groupId) {
    window._logRailGroupBy = groupId || 'day';
    if (typeof setSavedView === 'function') setSavedView('logisticsGroupBy', window._logRailGroupBy);
    if (typeof renderLogisticsPage === 'function') renderLogisticsPage();
    if (typeof renderContextSidebar === 'function') renderContextSidebar('logistics');
  }

  /* Smart Calendar rail — mock 6x: VIEWS · ALL DATES · SOURCES · NEEDS A DATE.
     224px Tasks-pattern (.rd-rail). Live counts from buildSmartCalendarEvents. */
  var CAL_RAIL_SOURCE_ORDER = [
    'Tasks', 'Appointments', 'Payments', 'Timeline', 'Vendors', 'Weekend',
    'Budget', 'Planning', 'Honeymoon', 'Rentals', 'Gifts', 'Manual'
  ];
  /* Mock swatches (square, soft radius) — independent of chip hex so rail matches visual direction. */
  var CAL_RAIL_SOURCE_SWATCH = {
    Tasks: '#2F4F3E',
    Appointments: '#3F5F8A',
    Payments: '#C4A06A',
    Timeline: '#3D8A82',
    Vendors: '#6B7A8A',
    Weekend: '#8B5E3C',
    Budget: '#B45A45',
    Planning: '#7A8F6A',
    Honeymoon: '#8A7A6A',
    Rentals: '#8A7A6A',
    Gifts: '#8A7A6A',
    Manual: '#8A7A6A'
  };

  function calRailSmallWord(n) {
    var words = ['zero', 'one', 'two', 'three', 'four', 'five', 'six', 'seven', 'eight', 'nine',
      'ten', 'eleven', 'twelve', 'thirteen', 'fourteen', 'fifteen', 'sixteen', 'seventeen', 'eighteen', 'nineteen', 'twenty'];
    if (n >= 0 && n < words.length) return words[n];
    return String(n);
  }
  function calRailCapWord(n) {
    var w = calRailSmallWord(n);
    return w.charAt(0).toUpperCase() + w.slice(1);
  }

  function paymentLacksDate(p) {
    if (!p) return true;
    if (Array.isArray(p.installments) && p.installments.length) {
      return !p.installments.some(function (inst) { return inst && String(inst.due || '').trim(); });
    }
    return !String(p.date || '').trim();
  }

  function buildCalendarContext() {
    var events = [];
    try {
      if (typeof buildSmartCalendarEvents === 'function') events = buildSmartCalendarEvents() || [];
    } catch (e) { events = []; }

    var activeView = (typeof window._calRailView === 'string' && window._calRailView)
      ? window._calRailView
      : 'everything';
    window._calRailView = activeView;

    var monthStart = null;
    var monthEnd = null;
    var monthLabel = 'This month';
    try {
      if (typeof smartCalendarMonth !== 'undefined' && smartCalendarMonth) {
        monthStart = new Date(smartCalendarMonth.getFullYear(), smartCalendarMonth.getMonth(), 1);
        monthEnd = new Date(smartCalendarMonth.getFullYear(), smartCalendarMonth.getMonth() + 1, 0);
        monthLabel = smartCalendarMonth.toLocaleDateString('en-US', { month: 'long' });
      }
    } catch (e2) { /* soft */ }
    if (!monthStart) {
      var now = new Date();
      monthStart = new Date(now.getFullYear(), now.getMonth(), 1);
      monthEnd = new Date(now.getFullYear(), now.getMonth() + 1, 0);
      monthLabel = now.toLocaleDateString('en-US', { month: 'long' });
    }

    function inViewedMonth(e) {
      if (!e || !e.date) return false;
      var d = typeof dateFromISO === 'function' ? dateFromISO(e.date) : new Date(String(e.date) + 'T00:00:00');
      return d && !isNaN(d.getTime()) && d >= monthStart && d <= monthEnd;
    }
    function countSource(src) {
      return events.filter(function (e) { return e && e.source === src; }).length;
    }
    function isVendorArrival(e) {
      return e && e.source === 'Vendors' &&
        (/arrival/i.test(e.category || '') || /arrival/i.test(e.title || '') || e.sourceType === 'vendorArrival');
    }
    var nVendorArrivals = events.filter(isVendorArrival).length;
    if (!nVendorArrivals) nVendorArrivals = countSource('Vendors');

    var nConflicts = 0;
    try {
      if (typeof detectCalendarConflicts === 'function') {
        nConflicts = (detectCalendarConflicts(events) || []).length;
      } else if (typeof getConflictDates === 'function') {
        nConflicts = (getConflictDates(events) || new Set()).size;
      }
    } catch (e3) { nConflicts = 0; }

    function viewItem(id, label, count, opts) {
      opts = opts || {};
      var warn = opts.warn && count > 0;
      return '<button type="button" class="rd-rail__item' + (activeView === id ? ' is-active' : '') + '"' +
        ' data-cal-rail-view="' + esc(id) + '"' +
        ' onclick="applyCalendarRailView(\'' + id + '\')">' +
        esc(label) +
        '<span class="rd-rail__count' + (warn ? ' rd-rail__count--warn' : '') + '">' + count + '</span></button>';
    }

    var viewsHtml =
      '<div class="rd-rail__section">' +
      '<div class="rd-rail__title">Views · All dates<span class="rd-rail__title-add" aria-hidden="true">+</span></div>' +
      '<div class="rd-rail__list" role="list">' +
      viewItem('everything', 'Everything', events.length) +
      viewItem('month', monthLabel, events.filter(inViewedMonth).length) +
      viewItem('appointments', 'Appointments', countSource('Appointments')) +
      viewItem('payments', 'Payments due', countSource('Payments')) +
      viewItem('tasks', 'Tasks with dates', countSource('Tasks')) +
      viewItem('vendors', 'Vendor arrivals', nVendorArrivals) +
      viewItem('conflicts', 'Conflicts', nConflicts, { warn: true }) +
      '</div></div>';

    var sources = (typeof SMART_SOURCES !== 'undefined' && SMART_SOURCES && SMART_SOURCES.length)
      ? SMART_SOURCES.slice()
      : CAL_RAIL_SOURCE_ORDER.slice();
    var railSources = [];
    CAL_RAIL_SOURCE_ORDER.forEach(function (s) {
      if (sources.indexOf(s) > -1 || CAL_RAIL_SOURCE_ORDER.indexOf(s) > -1) {
        if (railSources.indexOf(s) < 0) railSources.push(s);
      }
    });
    sources.forEach(function (s) {
      if (railSources.indexOf(s) < 0) railSources.push(s);
    });

    var emptyCount = 0;
    var unstartedWhenEmpty = { Honeymoon: 1, Rentals: 1, Gifts: 1 };
    var sourceRows = railSources.map(function (src) {
      var n = countSource(src);
      var unstartedEmpty = n === 0 && !!unstartedWhenEmpty[src];
      if (unstartedEmpty) emptyCount += 1;
      var on = true;
      try {
        if (typeof smartCalendarSources === 'object' && smartCalendarSources) {
          on = smartCalendarSources[src] !== false;
        }
      } catch (e4) { on = true; }
      var hex = CAL_RAIL_SOURCE_SWATCH[src] ||
        (typeof smartEventSourceHex === 'function' ? smartEventSourceHex(src) : '#8A7A6A');
      var swClass = 'rd-rail__swatch';
      if (unstartedEmpty) swClass += ' is-empty';
      if (!on) swClass += ' is-off';
      /* Hollow outline only for unstarted empty pages; other zeros keep a soft filled swatch. */
      var swStyle = unstartedEmpty
        ? ''
        : ' style="background:' + esc(hex) + ';border-color:' + esc(hex) +
          (n === 0 ? ';opacity:0.55' : '') + '"';
      var itemClass = 'rd-rail__item rd-rail__item--source';
      if (n === 0) itemClass += ' is-empty';
      if (!on) itemClass += ' is-source-off';
      var pressed = on ? 'true' : 'false';
      return '<button type="button" class="' + itemClass + '"' +
        ' data-cal-rail-source="' + esc(src) + '"' +
        ' aria-pressed="' + pressed + '"' +
        ' title="' + esc(on ? 'Hide ' + src : 'Show ' + src) + '"' +
        ' onclick="toggleCalendarRailSource(\'' + String(src).replace(/\\/g, '\\\\').replace(/'/g, "\\'") + '\')">' +
        '<span class="rd-rail__source-main">' +
        '<span class="' + swClass + '"' + swStyle + ' aria-hidden="true"></span>' +
        '<span class="rd-rail__source-label">' + esc(src) + '</span></span>' +
        '<span class="rd-rail__count">' + n + '</span></button>';
    }).join('');

    var srcTotal = railSources.length;
    var sourcesNote = calRailCapWord(srcTotal) + ' sources, toggled on and off.' +
      (emptyCount
        ? ' ' + calRailCapWord(emptyCount) +
          (emptyCount === 1
            ? ' is empty because that page hasn\u2019t been started.'
            : ' are empty because those pages haven\u2019t been started.')
        : ' All of the starter pages have at least one dated entry.');

    var sourcesHtml =
      '<div class="rd-rail__section">' +
      '<div class="rd-rail__title">Sources · All dates</div>' +
      '<div class="rd-rail__list" role="list">' + sourceRows + '</div>' +
      '<p class="rd-rail__note rd-rail__note--inline">' + esc(sourcesNote) + '</p>' +
      '</div>';

    var d = plannerData() || {};
    var tasks = typeof safeArray === 'function' ? safeArray(d.tasks) : [];
    var payments = typeof safeArray === 'function' ? safeArray(d.payments) : [];
    var nTasks = tasks.length;
    var nTasksDated = tasks.filter(function (t) { return t && String(t.date || '').trim(); }).length;
    var nTasksUndated = nTasks - nTasksDated;
    var nPayUndated = payments.filter(paymentLacksDate).length;

    function needsItem(id, label, count, opts) {
      opts = opts || {};
      var warn = opts.warn && count > 0;
      return '<button type="button" class="rd-rail__item"' +
        ' data-cal-rail-needs="' + esc(id) + '"' +
        ' onclick="applyCalendarRailNeedsDate(\'' + id + '\')">' +
        esc(label) +
        '<span class="rd-rail__count' + (warn ? ' rd-rail__count--warn' : '') + '">' + count + '</span></button>';
    }

    var needsNote = 'Undated records stay off the calendar rather than being guessed onto it. ' +
      nTasksDated + ' of ' + nTasks + ' task' + (nTasks === 1 ? '' : 's') + ' carry a date.';

    var needsHtml =
      '<div class="rd-rail__section">' +
      '<div class="rd-rail__title">Needs a date</div>' +
      '<div class="rd-rail__list" role="list">' +
      needsItem('tasks', 'Tasks undated', nTasksUndated, { warn: true }) +
      needsItem('payments', 'Payments undated', nPayUndated, { warn: true }) +
      '</div>' +
      '<p class="rd-rail__note rd-rail__note--inline">' + esc(needsNote) + '</p>' +
      '</div>';

    return '<div class="rd-rail__stack" data-page-rail="calendar">' + viewsHtml + sourcesHtml + needsHtml + '</div>';
  }

  function applyCalendarRailView(viewId) {
    window._calRailView = viewId || 'everything';
    /* Clear source-chip isolation so rail views control the slice. */
    var f = window._smartFilters;
    if (f && f.source && f.source !== 'All Sources' && f.source !== 'Source: all') {
      f.source = 'All Sources';
    }
    if (viewId === 'conflicts') {
      try {
        var all = typeof buildSmartCalendarEvents === 'function' ? buildSmartCalendarEvents() : [];
        var conflicts = typeof detectCalendarConflicts === 'function' ? detectCalendarConflicts(all) : [];
        if (conflicts.length && conflicts[0].date) {
          if (typeof selectSmartDate === 'function') selectSmartDate(conflicts[0].date);
          else {
            if (typeof dateFromISO === 'function') {
              var d = dateFromISO(conflicts[0].date);
              if (d && typeof smartCalendarMonth !== 'undefined') {
                smartCalendarMonth = new Date(d.getFullYear(), d.getMonth(), 1);
              }
            }
            if (typeof smartSelectedDate !== 'undefined') smartSelectedDate = conflicts[0].date;
          }
        }
      } catch (e) { /* soft */ }
    }
    if (typeof renderSmartCalendar === 'function') renderSmartCalendar();
    if (typeof renderContextSidebar === 'function') renderContextSidebar('calendar');
  }

  function toggleCalendarRailSource(src) {
    if (!src) return;
    if (typeof toggleSmartSource === 'function') {
      toggleSmartSource(src);
      return;
    }
    if (typeof smartCalendarSources === 'object' && smartCalendarSources) {
      smartCalendarSources[src] = smartCalendarSources[src] === false ? true : false;
    }
    if (typeof renderSmartCalendar === 'function') renderSmartCalendar();
    if (typeof renderContextSidebar === 'function') renderContextSidebar('calendar');
  }

  function applyCalendarRailNeedsDate(kind) {
    if (kind === 'payments') {
      if (typeof showPanel === 'function') showPanel('payments');
      return;
    }
    /* Default: undated tasks — open Planning Timeline where dates are assigned. */
    if (typeof applyTaskRailView === 'function') {
      /* no dedicated undated view yet — send to All tasks */
      try { applyTaskRailView('all'); } catch (e) { /* soft */ }
    }
    if (typeof showPanel === 'function') showPanel('tasks');
  }

  function applyCalendarRailShow(showId) {
    /* Back-compat: map old source “Shows” ids onto VIEWS or source toggles. */
    if (!showId || showId === 'everything') {
      applyCalendarRailView('everything');
      return;
    }
    var viewMap = {
      Appointments: 'appointments',
      Payments: 'payments',
      Tasks: 'tasks',
      Vendors: 'vendors'
    };
    if (viewMap[showId]) {
      applyCalendarRailView(viewMap[showId]);
      return;
    }
    applyCalendarRailView('everything');
    toggleCalendarRailSource(showId);
  }

  function applyCalendarRailMode(modeId) {
    if (typeof setSmartCalendarMode === 'function') setSmartCalendarMode(modeId || 'month');
    else if (typeof renderSmartCalendar === 'function') renderSmartCalendar();
    if (typeof renderContextSidebar === 'function') renderContextSidebar('calendar');
  }

  function onSmartSourceFilterChange() {
    var f = window._smartFilters;
    var v = f && f.source ? f.source : 'All Sources';
    /* Toolbar source chip acts as a single-source view. */
    if (!v || v === 'All Sources' || v === 'Source: all') {
      window._calRailView = 'everything';
    } else {
      var map = { Appointments: 'appointments', Payments: 'payments', Tasks: 'tasks', Vendors: 'vendors' };
      window._calRailView = map[v] || 'everything';
    }
    if (typeof renderSmartCalendar === 'function') renderSmartCalendar();
    if (typeof renderContextSidebar === 'function' &&
        document.body.getAttribute('data-active-panel') === 'calendar') {
      renderContextSidebar('calendar');
    }
  }

  /* Venue Comparison rail — All / Ceremony / Reception / Shortlist / Incomplete */
  function buildVenueContext() {
    var activeView = 'all';
    if (typeof getSavedView === 'function') activeView = getSavedView('venue', 'all');
    else if (typeof window._venRailView === 'string' && window._venRailView) activeView = window._venRailView;
    window._venRailView = activeView;

    var counts = typeof window.venueRailCounts === 'function' ? window.venueRailCounts() : {
      all: 0, ceremony: 1, reception: 1, shortlist: 0, incomplete: 0
    };
    var figures = typeof window.venueFigures === 'function' ? window.venueFigures() : {
      costSummary: '—', maxCap: null, incomplete: 0
    };

    function viewItem(id, label, count, warn) {
      return '<button type="button" class="rd-rail__item' + (activeView === id ? ' is-active' : '') + '"' +
        ' onclick="applyVenueRailView(\'' + id + '\')">' + esc(label) +
        '<span class="rd-rail__count' + (warn && count > 0 ? ' rd-rail__count--warn' : '') + '">' + count + '</span></button>';
    }

    var viewsHtml =
      '<div class="rd-rail__section">' +
      '<div class="rd-rail__title">Views</div>' +
      '<div class="rd-rail__list" role="list">' +
      viewItem('all', 'All venues', counts.all) +
      viewItem('ceremony', 'Ceremony', counts.ceremony) +
      viewItem('reception', 'Reception', counts.reception) +
      viewItem('shortlist', 'Shortlist', counts.shortlist) +
      viewItem('incomplete', 'Incomplete details', counts.incomplete, true) +
      '</div></div>';

    var metersHtml =
      '<div class="rd-rail__section">' +
      '<div class="rd-rail__title">Spaces</div>' +
      '<div class="rd-rail__meters">' +
      '<div class="rd-rail__meter-top"><span>Capacity</span><span class="rd-rail__count">' +
      esc(figures.maxCap ? String(figures.maxCap) : '—') + '</span></div>' +
      '<div class="rd-rail__meter-top"><span>Cost / deposit</span><span class="rd-rail__count">' +
      esc(figures.costSummary || '—') + '</span></div>' +
      '<div class="rd-rail__meter-top"><span>Gaps left</span><span class="rd-rail__count">' +
      (figures.incomplete || counts.incomplete || 0) + '</span></div>' +
      '</div></div>';

    var noteHtml =
      '<p class="rd-rail__note">Ceremony and reception are fixed columns; shortlist venues are for comparison only. Room details and reminders live under Details and Notes.</p>';

    return '<div class="rd-rail__stack" data-page-rail="venue">' + viewsHtml + metersHtml + noteHtml + '</div>';
  }

  /* All.dc #10d rail — Views + Coverage + Group by. */
  function buildEntertainmentContext() {
    var activeView = 'full';
    if (typeof getSavedView === 'function') activeView = getSavedView('entertainment', 'full');
    else if (typeof window._entRailView === 'string' && window._entRailView) activeView = window._entRailView;
    window._entRailView = activeView;

    var counts = typeof window.entertainmentRailCounts === 'function' ? window.entertainmentRailCounts() : {
      full: 0, must: 0, dnp: 0, unplaced: 0, ceremony: 0
    };
    var figures = typeof window.entertainmentFigures === 'function' ? window.entertainmentFigures() : {
      momentsFilled: 0, momentsTarget: 13, spend: 0
    };
    var groupBy = window._entGroupBy || 'moment';

    function viewItem(id, label, count, warn) {
      return '<button type="button" class="rd-rail__item' + (activeView === id ? ' is-active' : '') + '"' +
        ' onclick="applyEntertainmentRailView(\'' + id + '\')">' + esc(label) +
        '<span class="rd-rail__count' + (warn && count > 0 ? ' rd-rail__count--warn' : '') + '">' + count + '</span></button>';
    }

    var viewsHtml =
      '<div class="rd-rail__section">' +
      '<div class="rd-rail__title">Views<button type="button" class="rd-rail__add" aria-label="Save view">+</button></div>' +
      '<div class="rd-rail__list" role="list">' +
      viewItem('full', 'Full set list', counts.full) +
      viewItem('must', 'Must play', counts.must) +
      viewItem('dnp', 'Do not play', counts.dnp) +
      viewItem('unplaced', 'Unplaced', counts.unplaced, true) +
      viewItem('ceremony', 'Ceremony music', counts.ceremony) +
      '</div></div>';

    var coverageHtml =
      '<div class="rd-rail__section">' +
      '<div class="rd-rail__title">Coverage</div>' +
      '<div class="rd-rail__meters">' +
      '<div class="rd-rail__meter-top"><span>Moments filled</span><span class="rd-rail__count">' +
      (figures.momentsFilled || 0) + ' of ' + (figures.momentsTarget || 13) + '</span></div>' +
      '<div class="rd-rail__meter-top"><span>Music spend</span><span class="rd-rail__count">$' +
      Math.round(figures.spend || 0).toLocaleString() + '</span></div>' +
      '<div class="rd-rail__meter-top"><span>Guest requests</span><span class="rd-rail__count">—</span></div>' +
      '</div></div>';

    function groupItem(id, label) {
      return '<button type="button" class="rd-rail__item' + (groupBy === id ? ' is-active' : '') + '"' +
        ' onclick="applyEntertainmentGroupBy(\'' + id + '\')">' + esc(label) + '</button>';
    }
    var groupHtml =
      '<div class="rd-rail__section">' +
      '<div class="rd-rail__title">Group by</div>' +
      '<div class="rd-rail__list" role="list">' +
      groupItem('moment', 'Moment') +
      groupItem('performer', 'Performer') +
      groupItem('source', 'Source') +
      '</div></div>';

    var noteHtml =
      '<p class="rd-rail__note">Performers are vendor records. Their fees appear on the Budget under Music.</p>';

    return '<div class="rd-rail__stack" data-page-rail="entertainment">' + viewsHtml + coverageHtml + groupHtml + noteHtml + '</div>';
  }

  /* All.dc #11b rail — Views + By window meters + Group by. */
  function buildShotlistContext() {
    var activeView = 'all';
    if (typeof getSavedView === 'function') activeView = getSavedView('shotlist', 'all');
    else if (typeof window._shotRailView === 'string' && window._shotRailView) activeView = window._shotRailView;
    window._shotRailView = activeView;

    var counts = typeof window.shotlistRailCounts === 'function' ? window.shotlistRailCounts() : {
      all: 0, must: 0, groups: 0, risk: 0, video: 0
    };
    var figures = typeof window.shotlistFigures === 'function' ? window.shotlistFigures() : {
      byWin: { getting: 0, ceremony: 0, golden: 0, reception: 0 }
    };
    var byWin = figures.byWin || {};
    var groupBy = window._shotGroupBy || 'list';
    var total = counts.all || 1;

    function viewItem(id, label, count, warn) {
      return '<button type="button" class="rd-rail__item' + (activeView === id ? ' is-active' : '') + '"' +
        ' onclick="applyShotlistRailView(\'' + id + '\')">' + esc(label) +
        '<span class="rd-rail__count' + (warn && count > 0 ? ' rd-rail__count--warn' : '') + '">' + count + '</span></button>';
    }

    var viewsHtml =
      '<div class="rd-rail__section">' +
      '<div class="rd-rail__title">Views<button type="button" class="rd-rail__add" aria-label="Save view">+</button></div>' +
      '<div class="rd-rail__list" role="list">' +
      viewItem('all', 'All shots', counts.all) +
      viewItem('must', 'Must have', counts.must) +
      viewItem('groups', 'Group shots', counts.groups) +
      viewItem('risk', 'At risk', counts.risk, true) +
      viewItem('video', 'Video only', counts.video) +
      '</div></div>';

    function meter(label, n) {
      var pct = Math.min(100, Math.round((n / total) * 100));
      return '<div class="rd-rail__meter"><div class="rd-rail__meter-top"><span>' + esc(label) + '</span><span class="rd-rail__count">' +
        n + ' shot' + (n === 1 ? '' : 's') + '</span></div>' +
        '<div class="rd-progress"><div class="rd-progress__fill" style="width:' + pct + '%"></div></div></div>';
    }

    var metersHtml =
      '<div class="rd-rail__section">' +
      '<div class="rd-rail__title">By window</div>' +
      '<div class="rd-rail__meters">' +
      meter('Getting ready', byWin.getting || 0) +
      '<div class="rd-rail__meter-top"><span>Ceremony</span><span class="rd-rail__count">' + (byWin.ceremony || 0) + ' shots</span></div>' +
      '<div class="rd-rail__meter-top"><span>Golden hour</span><span class="rd-rail__count">' + (byWin.golden || 0) + ' shots</span></div>' +
      '<div class="rd-rail__meter-top"><span>Reception</span><span class="rd-rail__count">' + (byWin.reception || 0) + ' shots</span></div>' +
      '</div></div>';

    function groupItem(id, label) {
      return '<button type="button" class="rd-rail__item' + (groupBy === id ? ' is-active' : '') + '"' +
        ' onclick="applyShotlistGroupBy(\'' + id + '\')">' + esc(label) + '</button>';
    }
    var groupHtml =
      '<div class="rd-rail__section">' +
      '<div class="rd-rail__title">Group by</div>' +
      '<div class="rd-rail__list" role="list">' +
      groupItem('list', 'List') +
      groupItem('window', 'Window') +
      groupItem('supplier', 'Supplier') +
      '</div></div>';

    var noteHtml =
      '<p class="rd-rail__note">Group shots pull their people from guest records, so a declined RSVP shows here before the day.</p>';

    return '<div class="rd-rail__stack" data-page-rail="shotlist">' + viewsHtml + metersHtml + groupHtml + noteHtml + '</div>';
  }

  /* All.dc #7a rail — Views + Dietary needs (live from Guest List). */
  function buildCateringContext() {
    var activeView = 'full';
    if (typeof getSavedView === 'function') activeView = getSavedView('catering', 'full');
    else if (typeof window._catRailView === 'string' && window._catRailView) activeView = window._catRailView;
    window._catRailView = activeView;

    var counts = typeof window.cateringRailCounts === 'function' ? window.cateringRailCounts() : {
      full: 0, notchosen: 0, allergen: 0, cake: 0, drinks: 0, rentals: 0
    };
    var meters = typeof window.cateringDietaryMeters === 'function' ? window.cateringDietaryMeters() : [];

    function viewItem(id, label, count, warn) {
      return '<button type="button" class="rd-rail__item' + (activeView === id ? ' is-active' : '') + '"' +
        ' onclick="applyCateringRailView(\'' + id + '\')">' + esc(label) +
        '<span class="rd-rail__count' + (warn && count > 0 ? ' rd-rail__count--warn' : '') + '">' + count + '</span></button>';
    }

    var viewsHtml =
      '<div class="rd-rail__section">' +
      '<div class="rd-rail__title">Views<button type="button" class="rd-rail__add" aria-label="Save view">+</button></div>' +
      '<div class="rd-rail__list" role="list">' +
      viewItem('full', 'Full menu', counts.full) +
      viewItem('notchosen', 'Not yet chosen', counts.notchosen) +
      viewItem('allergen', 'Allergen-relevant', counts.allergen) +
      viewItem('cake', 'Cake & dessert', counts.cake, true) +
      viewItem('drinks', 'Drinks', counts.drinks) +
      viewItem('rentals', 'Rentals', counts.rentals) +
      '</div></div>';

    var dietHtml =
      '<div class="rd-rail__section">' +
      '<div class="rd-rail__title">Dietary needs</div>' +
      '<div class="rd-rail__meters">' +
      (meters.length ? meters.map(function (m) {
        return '<div class="rd-rail__meter-top"><span>' + esc(m.label) + '</span><span class="rd-rail__count">' + m.count + '</span></div>';
      }).join('') : '<div class="rd-rail__meter-top"><span>No flags yet</span><span class="rd-rail__count">0</span></div>') +
      '</div></div>';

    var noteHtml =
      '<p class="rd-rail__note">Counts read live from the Guest List — they are never typed here.</p>' +
      '<p class="rd-rail__note">This page owns Food, Cake, Drinks and Rentals in the Budget. Editing a price here updates the Catering category there.</p>';

    return '<div class="rd-rail__stack" data-page-rail="catering">' + viewsHtml + dietHtml + noteHtml + '</div>';
  }

  function buildDataHubContext() {
    var mode = window._dhMode || 'overview';
    var counts = typeof window.dhRailCounts === 'function' ? window.dhRailCounts() : {
      all: 24, with: 0, empty: 0, attention: 0, edited: 0, records: 0, dbMb: '—', tables: []
    };
    var activeView = 'all';
    if (typeof getSavedView === 'function') activeView = getSavedView('data-hub', 'all');
    else if (typeof window._dhRailView === 'string' && window._dhRailView) activeView = window._dhRailView;
    window._dhRailView = activeView;

    if (mode === 'table') {
      var activeId = window._dhTableId || 'guests';
      var tables = counts.tables || [];
      var shown = tables.slice().sort(function (a, b) { return b.count - a.count; });
      var listHtml = shown.slice(0, 16).map(function (t) {
        return '<button type="button" class="rd-rail__item' + (t.id === activeId ? ' is-active' : '') + '"' +
          ' onclick="rdDhSelectRailTable(\'' + String(t.id).replace(/'/g, "\\'") + '\')">' +
          esc(t.id) + ' · ' + t.count + '<span class="rd-rail__count"></span></button>';
      }).join('');
      if (shown.length > 16) {
        listHtml += '<button type="button" class="rd-rail__item" onclick="rdDhBackOverview()">+ ' +
          (shown.length - 16) + ' more<span class="rd-rail__count"></span></button>';
      }
      var cur = shown.find(function (t) { return t.id === activeId; }) || shown[0] || { count: 0, cols: 0, sizeKb: 0, status: { warn: false } };
      var orphans = (cur.id === 'guests' && cur.status && cur.status.warn) ? String(cur.status.label).replace(/\D/g, '') || '0' : '0';
      return '<div class="rd-rail__stack" data-page-rail="data-hub">' +
        '<div class="rd-rail__section">' +
        '<div class="rd-rail__title">Tables · ' + (counts.all || 24) + '</div>' +
        '<div class="rd-rail__list" role="list">' +
        '<button type="button" class="rd-rail__item" onclick="rdDhBackOverview()">← Overview<span class="rd-rail__count"></span></button>' +
        listHtml +
        '</div></div>' +
        '<div class="rd-rail__section">' +
        '<div class="rd-rail__title">' + esc(activeId) + '</div>' +
        '<div class="rd-rail__meters">' +
        '<div class="rd-rail__meter-top"><span>Rows</span><span class="rd-rail__count">' + (cur.count || 0) + '</span></div>' +
        '<div class="rd-rail__meter-top"><span>Columns</span><span class="rd-rail__count">' + (cur.cols || 0) + '</span></div>' +
        '<div class="rd-rail__meter-top"><span>Size</span><span class="rd-rail__count">' + (cur.sizeKb || 0) + ' KB</span></div>' +
        '<div class="rd-rail__meter-top"><span>Orphaned links</span><span class="rd-rail__count' +
        (Number(orphans) > 0 ? ' rd-rail__count--warn' : '') + '">' + orphans + '</span></div>' +
        '</div></div>' +
        '<p class="rd-rail__note">This view writes to the same records the owning page writes to. There is no separate copy — an edit here is an edit there.</p>' +
        '</div>';
    }

    function viewItem(id, label, count, warn) {
      return '<button type="button" class="rd-rail__item' + (activeView === id ? ' is-active' : '') + '"' +
        ' onclick="rdDhSetRailView(\'' + id + '\')">' + esc(label) +
        '<span class="rd-rail__count' + (warn && count > 0 ? ' rd-rail__count--warn' : '') + '">' + count + '</span></button>';
    }
    return '<div class="rd-rail__stack" data-page-rail="data-hub">' +
      '<div class="rd-rail__section">' +
      '<div class="rd-rail__title">Views<button type="button" class="rd-rail__add" aria-label="Save view">+</button></div>' +
      '<div class="rd-rail__list" role="list">' +
      viewItem('all', 'All tables', counts.all || 0) +
      viewItem('with', 'With records', counts.with || 0) +
      viewItem('empty', 'Empty', counts.empty || 0) +
      viewItem('attention', 'Needs attention', counts.attention || 0, true) +
      viewItem('edited', 'Edited this week', counts.edited || 0) +
      '</div></div>' +
      '<div class="rd-rail__section">' +
      '<div class="rd-rail__title">Storage</div>' +
      '<div class="rd-rail__meters">' +
      '<div class="rd-rail__meter-top"><span>Records</span><span class="rd-rail__count">' + (counts.records || 0) + '</span></div>' +
      '<div class="rd-rail__meter-top"><span>Database file</span><span class="rd-rail__count">' + esc(String(counts.dbMb || '—')) + ' MB</span></div>' +
      '<div class="rd-rail__meter-top"><span>Images</span><span class="rd-rail__count">—</span></div>' +
      '<div class="rd-rail__meter-top"><span>Browser limit</span><span class="rd-rail__count">~50 MB</span></div>' +
      '</div></div>' +
      '<p class="rd-rail__note">Everything is stored on this device. A downloaded <b>.sqlite</b> file is the only copy that survives clearing your browser.</p>' +
      '</div>';
  }

  function buildGenericContext(panelId) {
    var title = panelLabel(panelId);
    /* §14 rail chrome without inventing page stats — section headers + links
       match Views/Related pattern rather than the old stat-card stack. */
    return '<div class="rd-rail__stack" data-page-rail="generic">' +
      '<div class="rd-rail__section">' +
      '<div class="rd-rail__title">This page</div>' +
      '<div class="rd-rail__list">' +
      '<div class="rd-rail__item is-active" style="cursor:default">' + esc(title) + '</div>' +
      '</div></div>' +
      '<div class="rd-rail__section">' +
      '<div class="rd-rail__title">Related</div>' +
      '<div class="rd-rail__list">' +
      '<button type="button" class="rd-rail__item" onclick="openDataHub()">Database Hub</button>' +
      '<button type="button" class="rd-rail__item" onclick="showPanel(\'dashboard\')">Dashboard</button>' +
      '</div></div>' +
      '<p class="rd-rail__note">Saved views with counts, progress, and grouping appear here for pages that support them.</p>' +
      '</div>';
  }

  function applyTaskRailView(viewId) {
    window._taskRailView = viewId || 'all';
    if (typeof setSavedView === 'function') setSavedView('tasks', window._taskRailView);
    if (typeof setTaskFilter === 'function') setTaskFilter();
    else if (typeof renderTasks === 'function') renderTasks();
    if (typeof renderContextSidebar === 'function') renderContextSidebar('tasks');
  }

  function applyTaskRailGroupBy(groupId) {
    window._taskRailGroupBy = groupId || 'phase';
    if (typeof setSavedView === 'function') setSavedView('tasksGroupBy', window._taskRailGroupBy);
    if (typeof renderTasks === 'function') renderTasks();
    if (typeof renderContextSidebar === 'function') renderContextSidebar('tasks');
  }

  function applyTaskRailPhaseFilter(phase) {
    window._taskRailView = 'all';
    try {
      if (typeof taskColFilter === 'object' && taskColFilter) {
        for (var k in taskColFilter) {
          if (Object.prototype.hasOwnProperty.call(taskColFilter, k)) delete taskColFilter[k];
        }
        if (phase) taskColFilter.phase = new Set([String(phase)]);
      }
    } catch (e) { /* soft filter ok */ }
    if (typeof setTaskFilter === 'function') setTaskFilter();
    else if (typeof renderTasks === 'function') renderTasks();
    if (typeof renderContextSidebar === 'function') renderContextSidebar('tasks');
  }

  /* Wedding Day Timeline rail — Whole day / blocks / Needs an owner */
  /* All.dc #6b rail — Full day / Vendor calls / Couple / Party / Unassigned + Blocks + Checks. */
  function buildTimelineContext() {
    var activeView = 'full';
    if (typeof getSavedView === 'function') activeView = getSavedView('timeline', 'full');
    else if (typeof window._wdayRailView === 'string' && window._wdayRailView) activeView = window._wdayRailView;
    if (activeView === 'all') activeView = 'full';
    if (activeView === 'unowned') activeView = 'unassigned';
    window._wdayRailView = activeView;

    var counts = typeof window.timelineRailCounts === 'function' ? window.timelineRailCounts() : {
      full: 0, vendorCalls: 0, couple: 0, party: 0, unassigned: 0
    };
    var figures = typeof window.timelineFigures === 'function' ? window.timelineFigures() : {
      first: '—', gaps: 0, unassigned: 0, blockCounts: {}, gapList: []
    };
    var bc = figures.blockCounts || {};

    function viewItem(id, label, count, warn) {
      return '<button type="button" class="rd-rail__item' + (activeView === id ? ' is-active' : '') + '"' +
        ' onclick="applyTimelineRailView(\'' + id + '\')">' + esc(label) +
        '<span class="rd-rail__count' + (warn && count > 0 ? ' rd-rail__count--warn' : '') + '">' + count + '</span></button>';
    }

    var viewsHtml =
      '<div class="rd-rail__section">' +
      '<div class="rd-rail__title">Views<button type="button" class="rd-rail__add" aria-label="Save view">+</button></div>' +
      '<div class="rd-rail__list" role="list">' +
      viewItem('full', 'Full day', counts.full || counts.all || 0) +
      viewItem('vendorCalls', 'Vendor calls', counts.vendorCalls || 0) +
      viewItem('couple', 'Couple only', counts.couple || 0) +
      viewItem('party', 'Wedding party', counts.party || 0) +
      viewItem('unassigned', 'Unassigned', counts.unassigned || counts.unowned || 0, true) +
      '</div></div>';

    var blocksHtml =
      '<div class="rd-rail__section">' +
      '<div class="rd-rail__title">Blocks</div>' +
      '<div class="rd-rail__meters">' +
      '<div class="rd-rail__meter-top"><span>Morning prep</span><span class="rd-rail__count">' + (bc.morning || 0) + '</span></div>' +
      '<div class="rd-rail__meter-top"><span>Portraits</span><span class="rd-rail__count">' + (bc.portraits || 0) + '</span></div>' +
      '<div class="rd-rail__meter-top"><span>Ceremony</span><span class="rd-rail__count">' + (bc.ceremony || 0) + '</span></div>' +
      '<div class="rd-rail__meter-top"><span>Reception</span><span class="rd-rail__count">' + ((bc.reception || 0) + (bc.close || 0)) + '</span></div>' +
      '</div></div>';

    var gapN = figures.gaps || 0;
    var unownedN = figures.unassigned || counts.unassigned || 0;
    var checksHtml =
      '<div class="rd-rail__section">' +
      '<div class="rd-rail__title">Checks</div>' +
      '<div class="rd-rail__list">' +
      '<div class="rd-rail__item" style="cursor:default">' + (gapN ? '▲ ' + gapN + '-minute gap(s) in the day' : '✓ No large gaps') + '</div>' +
      '<div class="rd-rail__item" style="cursor:default">✓ Vendor arrivals when listed</div>' +
      '<div class="rd-rail__item" style="cursor:default">' + (unownedN ? '▲ ' + unownedN + ' event' + (unownedN === 1 ? '' : 's') + ' have no owner' : '✓ Every event has an owner') + '</div>' +
      '</div></div>';

    var noteHtml =
      '<p class="rd-rail__note">Duration is a real field — gaps between events show as rows, not notes.</p>';

    return '<div class="rd-rail__stack" data-page-rail="timeline">' + viewsHtml + blocksHtml + checksHtml + noteHtml + '</div>';
  }

  /* All.dc #11a rail — Views + Running time + Group by. */
  function buildCeremonyContext() {
    var activeView = 'both';
    if (typeof getSavedView === 'function') activeView = getSavedView('ceremony', 'both');
    else if (typeof window._cerRailView === 'string' && window._cerRailView) activeView = window._cerRailView;
    window._cerRailView = activeView;

    var counts = typeof window.ceremonyRailCounts === 'function' ? window.ceremonyRailCounts() : {
      both: 0, ceremony: 0, reception: 0, needs: 0, scripture: 0
    };
    var figures = typeof window.ceremonyFigures === 'function' ? window.ceremonyFigures() : {
      ceremonyMins: 0, receptionMins: 0, cocktailMins: 60, turnoverMins: 45
    };
    var groupBy = window._cerGroupBy || 'service';

    function fmtRailMins(n) {
      if (n == null) return '—';
      n = Math.max(0, Math.round(Number(n) || 0));
      if (n < 60) return n + ' min';
      var h = Math.floor(n / 60);
      var r = n % 60;
      return r ? (h + 'h ' + r + 'm') : (h + 'h');
    }

    function viewItem(id, label, count, warn) {
      return '<button type="button" class="rd-rail__item' + (activeView === id ? ' is-active' : '') + '"' +
        ' onclick="applyCeremonyRailView(\'' + id + '\')">' + esc(label) +
        '<span class="rd-rail__count' + (warn && count > 0 ? ' rd-rail__count--warn' : '') + '">' + count + '</span></button>';
    }

    var viewsHtml =
      '<div class="rd-rail__section">' +
      '<div class="rd-rail__title">Views<button type="button" class="rd-rail__add" aria-label="Save view">+</button></div>' +
      '<div class="rd-rail__list" role="list">' +
      viewItem('both', 'Both services', counts.both || 0) +
      viewItem('ceremony', 'Ceremony only', counts.ceremony || 0) +
      viewItem('reception', 'Reception only', counts.reception || 0) +
      viewItem('needs', 'Needs a person', counts.needs || 0, true) +
      viewItem('scripture', 'Scripture & vows', counts.scripture || 0) +
      '</div></div>';

    var metersHtml =
      '<div class="rd-rail__section">' +
      '<div class="rd-rail__title">Running time</div>' +
      '<div class="rd-rail__meters">' +
      '<div class="rd-rail__meter-top"><span>Ceremony</span><span class="rd-rail__count">' + esc(fmtRailMins(figures.ceremonyMins)) + '</span></div>' +
      '<div class="rd-rail__meter-top"><span>Cocktail hour</span><span class="rd-rail__count">' + esc(fmtRailMins(figures.cocktailMins)) + '</span></div>' +
      '<div class="rd-rail__meter-top"><span>Reception</span><span class="rd-rail__count">' + esc(fmtRailMins(figures.receptionMins)) + '</span></div>' +
      '<div class="rd-rail__meter-top"><span>Room turnover</span><span class="rd-rail__count">' + esc(fmtRailMins(figures.turnoverMins)) + '</span></div>' +
      '</div></div>';

    function groupItem(id, label) {
      return '<button type="button" class="rd-rail__item' + (groupBy === id ? ' is-active' : '') + '"' +
        ' onclick="applyCeremonyGroupBy(\'' + id + '\')">' + esc(label) + '</button>';
    }
    var groupHtml =
      '<div class="rd-rail__section">' +
      '<div class="rd-rail__title">Group by</div>' +
      '<div class="rd-rail__list" role="list">' +
      groupItem('service', 'Service') +
      groupItem('person', 'Person') +
      groupItem('type', 'Element type') +
      '</div></div>';

    var noteHtml =
      '<p class="rd-rail__note">Elements with a time appear on the Wedding Day Timeline. Editing a duration here moves the timeline block.</p>';

    return '<div class="rd-rail__stack" data-page-rail="ceremony">' + viewsHtml + metersHtml + groupHtml + noteHtml + '</div>';
  }

  /* All.dc #17b / Dark.dc #17b rail — Sections + Readiness (After the day moved to Homecoming). */
  function buildHoneymoonContext() {
    var active = 'bookings';
    if (typeof getSavedView === 'function') active = getSavedView('honeymoon', 'bookings');
    else if (typeof window._hmSection === 'string' && window._hmSection) active = window._hmSection;
    if (active === 'after') active = 'bookings';
    window._hmSection = active;

    var counts = typeof window.honeymoonRailCounts === 'function' ? window.honeymoonRailCounts() : {
      bookings: 0, itinerary: 0, packing: 0, budget: 0, journal: 0
    };
    var figures = typeof window.honeymoonFigures === 'function' ? window.honeymoonFigures() : {
      bookingsComplete: 0, bookingsTotal: 0, packed: 0, packingTotal: 0,
      itineraryPlanned: 0, itineraryTotal: 0, budgetCommitted: 0
    };

    function money0(n) {
      n = Math.round(Number(n) || 0);
      return '$' + n.toLocaleString();
    }

    function sectionItem(id, label, count) {
      return '<button type="button" class="rd-rail__item' + (active === id ? ' is-active' : '') + '"' +
        ' onclick="applyHoneymoonSection(\'' + id + '\')">' + esc(label) +
        '<span class="rd-rail__count">' + count + '</span></button>';
    }

    var sectionsHtml =
      '<div class="rd-rail__section">' +
      '<div class="rd-rail__title">Sections<button type="button" class="rd-rail__add" aria-label="Save view">+</button></div>' +
      '<div class="rd-rail__list" role="list">' +
      sectionItem('bookings', 'Details & bookings', counts.bookings || 0) +
      sectionItem('itinerary', 'Itinerary', counts.itinerary || 0) +
      sectionItem('packing', 'Packing', counts.packing || 0) +
      sectionItem('budget', 'Budget', counts.budget || 0) +
      sectionItem('journal', 'Daily journal', counts.journal || 0) +
      '</div></div>';

    var readinessHtml =
      '<div class="rd-rail__section">' +
      '<div class="rd-rail__title">Readiness</div>' +
      '<div class="rd-rail__meters">' +
      '<div class="rd-rail__meter-top"><span>Bookings complete</span><span class="rd-rail__count">' +
      (figures.bookingsComplete || 0) + ' of ' + (figures.bookingsTotal || 0) + '</span></div>' +
      '<div class="rd-rail__meter-top"><span>Packed</span><span class="rd-rail__count">' +
      (figures.packed || 0) + ' of ' + (figures.packingTotal || 0) + '</span></div>' +
      '<div class="rd-rail__meter-top"><span>Itinerary days</span><span class="rd-rail__count">' +
      (figures.itineraryPlanned || 0) + ' of ' + (figures.itineraryTotal || 0) + '</span></div>' +
      '<div class="rd-rail__meter-top"><span>Budget committed</span><span class="rd-rail__count">' +
      esc(money0(figures.budgetCommitted || 0)) + '</span></div>' +
      '</div></div>';

    var homecomingHtml =
      '<div class="rd-rail__section">' +
      '<div class="rd-rail__title">After the wedding</div>' +
      '<div class="rd-rail__list" role="list">' +
      '<button type="button" class="rd-rail__item" onclick="typeof showPanel===\'function\'&&showPanel(\'homecoming\')">Newlywed Homecoming</button>' +
      '</div></div>';

    var noteHtml =
      '<p class="rd-rail__note">The honeymoon budget is its own target — it is not part of the wedding budget and never appears on the Budget page. Post-wedding tasks live on Newlywed Homecoming.</p>';

    return '<div class="rd-rail__stack" data-page-rail="honeymoon">' + sectionsHtml + readinessHtml + homecomingHtml + noteHtml + '</div>';
  }

  /* All.dc #13b / Dark.dc #13b rail — Views + Rhythm + Group by. */
  function buildPrayerContext() {
    var activeView = 'all';
    if (typeof getSavedView === 'function') activeView = getSavedView('prayer', 'all');
    else if (typeof window._prRailView === 'string' && window._prRailView) activeView = window._prRailView;
    window._prRailView = activeView;

    var counts = typeof window.prayerRailCounts === 'function' ? window.prayerRailCounts() : {
      all: 0, answered: 0, open: 0, laid: 0, together: 0
    };
    var figures = typeof window.prayerFigures === 'function' ? window.prayerFigures() : {
      weeksWithEntry: 0, weeksWindow: 20, streak: 0, lastEntry: '—', answered: 0, entries: 0
    };
    var groupBy = window._prGroupBy || 'status';

    function viewItem(id, label, count) {
      return '<button type="button" class="rd-rail__item' + (activeView === id ? ' is-active' : '') + '"' +
        ' onclick="applyPrayerRailView(\'' + id + '\')">' + esc(label) +
        '<span class="rd-rail__count">' + count + '</span></button>';
    }

    var viewsHtml =
      '<div class="rd-rail__section">' +
      '<div class="rd-rail__title">Views<button type="button" class="rd-rail__add" aria-label="Save view">+</button></div>' +
      '<div class="rd-rail__list" role="list">' +
      viewItem('all', 'All entries', counts.all || 0) +
      viewItem('answered', 'Answered', counts.answered || 0) +
      viewItem('open', 'Still praying', counts.open || 0) +
      viewItem('laid', 'Laid down', counts.laid || 0) +
      viewItem('together', 'Written together', counts.together || 0) +
      '</div></div>';

    var rhythmHtml =
      '<div class="rd-rail__section">' +
      '<div class="rd-rail__title">Rhythm</div>' +
      '<div class="rd-rail__meters">' +
      '<div class="rd-rail__meter-top"><span>Weeks with an entry</span><span class="rd-rail__count">' +
      (figures.weeksWithEntry || 0) + ' of ' + (figures.weeksWindow || 20) + '</span></div>' +
      '<div class="rd-rail__meter-top"><span>Longest streak</span><span class="rd-rail__count">' +
      (figures.streak || 0) + ' weeks</span></div>' +
      '<div class="rd-rail__meter-top"><span>Last entry</span><span class="rd-rail__count">' +
      esc(figures.lastEntry || '—') + '</span></div>' +
      '<div class="rd-rail__meter-top"><span>Answered</span><span class="rd-rail__count">' +
      (figures.answered || 0) + ' of ' + (figures.entries || 0) + '</span></div>' +
      '</div></div>';

    function groupItem(id, label) {
      return '<button type="button" class="rd-rail__item' + (groupBy === id ? ' is-active' : '') + '"' +
        ' onclick="applyPrayerGroupBy(\'' + id + '\')">' + esc(label) + '</button>';
    }
    var groupHtml =
      '<div class="rd-rail__section">' +
      '<div class="rd-rail__title">Group by</div>' +
      '<div class="rd-rail__list" role="list">' +
      groupItem('status', 'Status') +
      groupItem('author', 'Author') +
      groupItem('month', 'Month') +
      '</div></div>';

    var noteHtml =
      '<p class="rd-rail__note">Entries are private by default. A prayer is never included in a share packet, whatever sections you pick.</p>';

    return '<div class="rd-rail__stack" data-page-rail="prayer">' + viewsHtml + rhythmHtml + groupHtml + noteHtml + '</div>';
  }

  /* All.dc #13c / Dark.dc #13c rail — Views + Progress + Group by. */
  function buildCounselingContext() {
    var activeView = 'all';
    if (typeof getSavedView === 'function') activeView = getSavedView('counseling', 'all');
    else if (typeof window._couRailView === 'string' && window._couRailView) activeView = window._couRailView;
    window._couRailView = activeView;

    var counts = typeof window.counselingRailCounts === 'function' ? window.counselingRailCounts() : {
      all: 0, complete: 0, scheduled: 0, notbooked: 0, homework: 0
    };
    var figures = typeof window.counselingFigures === 'function' ? window.counselingFigures() : {
      complete: 0, sessions: 0, hwDone: 0, hwTotal: 0, nextLabel: '—', finishes: '—'
    };
    var groupBy = window._couGroupBy || 'status';

    function viewItem(id, label, count, warn) {
      return '<button type="button" class="rd-rail__item' + (activeView === id ? ' is-active' : '') + '"' +
        ' onclick="applyCounselingRailView(\'' + id + '\')">' + esc(label) +
        '<span class="rd-rail__count' + (warn && count > 0 ? ' rd-rail__count--warn' : '') + '">' + count + '</span></button>';
    }

    var viewsHtml =
      '<div class="rd-rail__section">' +
      '<div class="rd-rail__title">Views<button type="button" class="rd-rail__add" aria-label="Save view">+</button></div>' +
      '<div class="rd-rail__list" role="list">' +
      viewItem('all', 'All sessions', counts.all || 0) +
      viewItem('complete', 'Completed', counts.complete || 0) +
      viewItem('scheduled', 'Scheduled', counts.scheduled || 0) +
      viewItem('notbooked', 'Not booked', counts.notbooked || 0) +
      viewItem('homework', 'Homework due', counts.homework || 0, true) +
      '</div></div>';

    var progressHtml =
      '<div class="rd-rail__section">' +
      '<div class="rd-rail__title">Progress</div>' +
      '<div class="rd-rail__meters">' +
      '<div class="rd-rail__meter-top"><span>Sessions done</span><span class="rd-rail__count">' +
      (figures.complete || 0) + ' of ' + (figures.sessions || 0) + '</span></div>' +
      '<div class="rd-rail__meter-top"><span>Homework done</span><span class="rd-rail__count">' +
      (figures.hwDone || 0) + ' of ' + (figures.hwTotal || 0) + '</span></div>' +
      '<div class="rd-rail__meter-top"><span>Next session</span><span class="rd-rail__count">' +
      esc(figures.nextLabel || '—') + '</span></div>' +
      '<div class="rd-rail__meter-top"><span>Finishes</span><span class="rd-rail__count">' +
      esc(figures.finishes || '—') + '</span></div>' +
      '</div></div>';

    function groupItem(id, label) {
      return '<button type="button" class="rd-rail__item' + (groupBy === id ? ' is-active' : '') + '"' +
        ' onclick="applyCounselingGroupBy(\'' + id + '\')">' + esc(label) + '</button>';
    }
    var groupHtml =
      '<div class="rd-rail__section">' +
      '<div class="rd-rail__title">Group by</div>' +
      '<div class="rd-rail__list" role="list">' +
      groupItem('status', 'Status') +
      groupItem('topic', 'Topic') +
      groupItem('month', 'Month') +
      '</div></div>';

    var noteHtml =
      '<p class="rd-rail__note">Sessions appear on the Smart Calendar. Homework rows are child records — the session bar is derived from them.</p>';

    return '<div class="rd-rail__stack" data-page-rail="counseling">' + viewsHtml + progressHtml + groupHtml + noteHtml + '</div>';
  }

  /* All.dc #8b / Dark.dc #8b rail — Views + Categories + Ecclesiastes note. */
  function buildMoodContext() {
    var activeView = 'all';
    if (typeof getSavedView === 'function') activeView = getSavedView('mood', 'all');
    else if (typeof window._moodRailView === 'string' && window._moodRailView) activeView = window._moodRailView;
    window._moodRailView = activeView;

    var counts = typeof window.moodRailCounts === 'function' ? window.moodRailCounts() : {
      all: 0, vendor: 0, budget: 0, uncategorised: 0, shared: 0
    };
    var figures = typeof window.moodFigures === 'function' ? window.moodFigures() : { byCat: {} };
    var byCat = figures.byCat || {};

    function viewItem(id, label, count, warn) {
      return '<button type="button" class="rd-rail__item' + (activeView === id ? ' is-active' : '') + '"' +
        ' onclick="applyMoodRailView(\'' + id + '\')">' + esc(label) +
        '<span class="rd-rail__count' + (warn && count > 0 ? ' rd-rail__count--warn' : '') + '">' + count + '</span></button>';
    }

    var viewsHtml =
      '<div class="rd-rail__section">' +
      '<div class="rd-rail__title">Views<button type="button" class="rd-rail__add" aria-label="Save view">+</button></div>' +
      '<div class="rd-rail__list" role="list">' +
      viewItem('all', 'All pins', counts.all || 0) +
      viewItem('vendor', 'Linked to a vendor', counts.vendor || 0) +
      viewItem('budget', 'Linked to budget', counts.budget || 0) +
      viewItem('uncategorised', 'Not categorised', counts.uncategorised || 0, true) +
      viewItem('shared', 'Shared with vendors', counts.shared || 0) +
      '</div></div>';

    var catOrder = ['Ceremony', 'Reception', 'Florals', 'Attire', 'Stationery', 'Uncategorised'];
    Object.keys(byCat).forEach(function (k) {
      if (catOrder.indexOf(k) < 0) catOrder.push(k);
    });
    var meters = '';
    catOrder.forEach(function (cat) {
      var n = byCat[cat] || 0;
      if (!n && cat !== 'Uncategorised') return;
      if (!n && cat === 'Uncategorised' && !(counts.uncategorised > 0)) return;
      meters +=
        '<div class="rd-rail__meter-top"><span>' + esc(cat) + '</span>' +
        '<span class="rd-rail__count' + (cat === 'Uncategorised' && n > 0 ? ' rd-rail__count--warn' : '') + '">' +
        n + '</span></div>';
    });
    if (!meters) {
      meters = '<div class="rd-rail__meter-top"><span>No pins yet</span><span class="rd-rail__count">0</span></div>';
    }

    var categoriesHtml =
      '<div class="rd-rail__section">' +
      '<div class="rd-rail__title">Categories</div>' +
      '<div class="rd-rail__meters">' + meters + '</div></div>';

    var noteHtml =
      '<p class="rd-rail__note">&ldquo;He hath made every thing beautiful in his time.&rdquo; Ecclesiastes 3:11</p>';

    return '<div class="rd-rail__stack" data-page-rail="mood">' + viewsHtml + categoriesHtml + noteHtml + '</div>';
  }

  /* All.dc #17a / Dark.dc #17a rail — Kits + Packed meters + Group by. */
  function buildEssentialsContext() {
    var activeView = 'all';
    if (typeof getSavedView === 'function') activeView = getSavedView('essentials', 'all');
    else if (typeof window._essRailView === 'string' && window._essRailView) activeView = window._essRailView;
    window._essRailView = activeView;

    var counts = typeof window.essRailCounts === 'function' ? window.essRailCounts() : { all: 0 };
    var figures = typeof window.essFigures === 'function' ? window.essFigures() : {
      packed: 0, items: 0, bought: 0, notBought: 0, unassigned: 0
    };
    var groupBy = window._essGroupBy || 'kit';

    var kits = [
      ['all', 'Everything'],
      ['Bride essentials', 'Bride essentials'],
      ['Groom essentials', 'Groom essentials'],
      ['Emergency kit', 'Emergency kit'],
      ['Ceremony documents', 'Ceremony documents'],
      ['Reception bag', 'Reception bag'],
      ['Beauty & medicine', 'Beauty & medicine'],
      ['Exit / send-off', 'Exit / send-off'],
      ['Tech kit', 'Tech kit']
    ];

    function viewItem(id, label, count) {
      return '<button type="button" class="rd-rail__item' + (activeView === id ? ' is-active' : '') + '"' +
        ' onclick="applyEssentialsRailView(\'' + id.replace(/'/g, "\\'") + '\')">' + esc(label) +
        '<span class="rd-rail__count">' + count + '</span></button>';
    }

    var kitsHtml =
      '<div class="rd-rail__section">' +
      '<div class="rd-rail__title">Kits<button type="button" class="rd-rail__add" aria-label="Save view">+</button></div>' +
      '<div class="rd-rail__list" role="list">' +
      kits.map(function (k) {
        return viewItem(k[0], k[1], k[0] === 'all' ? (counts.all || 0) : (counts[k[0]] || 0));
      }).join('') +
      '</div></div>';

    var packedHtml =
      '<div class="rd-rail__section">' +
      '<div class="rd-rail__title">Packed</div>' +
      '<div class="rd-rail__meters">' +
      '<div class="rd-rail__meter-top"><span>In the bag</span><span class="rd-rail__count">' +
      (figures.packed || 0) + ' of ' + (figures.items || 0) + '</span></div>' +
      '<div class="rd-rail__meter-top"><span>Bought, not packed</span><span class="rd-rail__count">' +
      (figures.bought || 0) + '</span></div>' +
      '<div class="rd-rail__meter-top"><span>Not bought</span><span class="rd-rail__count">' +
      (figures.notBought || 0) + '</span></div>' +
      '<div class="rd-rail__meter-top"><span>Unassigned</span><span class="rd-rail__count' +
      ((figures.unassigned || 0) > 0 ? ' rd-rail__count--warn' : '') + '">' +
      (figures.unassigned || 0) + '</span></div>' +
      '</div></div>';

    function groupItem(id, label) {
      return '<button type="button" class="rd-rail__item' + (groupBy === id ? ' is-active' : '') + '"' +
        ' onclick="applyEssentialsGroupBy(\'' + id + '\')">' + esc(label) + '</button>';
    }
    var groupHtml =
      '<div class="rd-rail__section">' +
      '<div class="rd-rail__title">Group by</div>' +
      '<div class="rd-rail__list" role="list">' +
      groupItem('kit', 'Kit') +
      groupItem('person', 'Person') +
      groupItem('where', 'Where it lives') +
      '</div></div>';

    var noteHtml =
      '<p class="rd-rail__note">Presets load a starter list you then edit. Nothing here syncs — this is the one table the planner does not derive from anything else.</p>';

    return '<div class="rd-rail__stack" data-page-rail="essentials">' + kitsHtml + packedHtml + groupHtml + noteHtml + '</div>';
  }

  /* All.dc #12b / Dark.dc #12b rail — Views + Activity meters + Group by. */
  function buildPacketsContext() {
    var activeView = 'all';
    if (typeof getSavedView === 'function') activeView = getSavedView('packets', 'all');
    else if (typeof window._pktRailView === 'string' && window._pktRailView) activeView = window._pktRailView;
    window._pktRailView = activeView;

    var counts = typeof window.pktRailCounts === 'function' ? window.pktRailCounts() : {
      all: 0, live: 0, expired: 0, draft: 0, week: 0
    };
    var figures = typeof window.pktFigures === 'function' ? window.pktFigures() : {
      opened: 0, packets: 0, totalOpens: 0, lastOpen: '—', never: 0
    };
    var groupBy = window._pktGroupBy || 'recipient';

    function viewItem(id, label, count) {
      return '<button type="button" class="rd-rail__item' + (activeView === id ? ' is-active' : '') + '"' +
        ' onclick="applyPacketsRailView(\'' + id + '\')">' + esc(label) +
        '<span class="rd-rail__count">' + count + '</span></button>';
    }

    var viewsHtml =
      '<div class="rd-rail__section">' +
      '<div class="rd-rail__title">Views<button type="button" class="rd-rail__add" aria-label="Save view">+</button></div>' +
      '<div class="rd-rail__list" role="list">' +
      viewItem('all', 'All packets', counts.all || 0) +
      viewItem('live', 'Live', counts.live || 0) +
      viewItem('expired', 'Expired', counts.expired || 0) +
      viewItem('draft', 'Draft', counts.draft || 0) +
      viewItem('week', 'Opened this week', counts.week || 0) +
      '</div></div>';

    var activityHtml =
      '<div class="rd-rail__section">' +
      '<div class="rd-rail__title">Activity</div>' +
      '<div class="rd-rail__meters">' +
      '<div class="rd-rail__meter-top"><span>Opened at least once</span><span class="rd-rail__count">' +
      (figures.opened || 0) + ' of ' + (figures.packets || 0) + '</span></div>' +
      '<div class="rd-rail__meter-top"><span>Total opens</span><span class="rd-rail__count">' +
      (figures.totalOpens || 0) + '</span></div>' +
      '<div class="rd-rail__meter-top"><span>Last open</span><span class="rd-rail__count">' +
      esc(figures.lastOpen || '—') + '</span></div>' +
      '<div class="rd-rail__meter-top"><span>Default expiry</span><span class="rd-rail__count">30 days</span></div>' +
      '</div></div>';

    function groupItem(id, label) {
      return '<button type="button" class="rd-rail__item' + (groupBy === id ? ' is-active' : '') + '"' +
        ' onclick="applyPacketsGroupBy(\'' + id + '\')">' + esc(label) + '</button>';
    }
    var groupHtml =
      '<div class="rd-rail__section">' +
      '<div class="rd-rail__title">Group by</div>' +
      '<div class="rd-rail__list" role="list">' +
      groupItem('recipient', 'Recipient type') +
      groupItem('status', 'Status') +
      groupItem('created', 'Created') +
      '</div></div>';

    var noteHtml =
      '<p class="rd-rail__note">Packets are snapshots by default. A live packet updates as you edit; both states are shown on the row.</p>';

    return '<div class="rd-rail__stack" data-page-rail="packets">' + viewsHtml + activityHtml + groupHtml + noteHtml + '</div>';
  }

  /* All.dc #12c / Dark.dc #12c rail — Views + Use meters + Group by. */
  function buildNotesContext() {
    var activeView = 'all';
    if (typeof getSavedView === 'function') activeView = getSavedView('notes', 'all');
    else if (typeof window._notesRailView === 'string' && window._notesRailView) activeView = window._notesRailView;
    window._notesRailView = activeView;

    var counts = typeof window.notesRailCounts === 'function' ? window.notesRailCounts() : {
      all: 0, unpinned: 0, flagged: 0, mine: 0, shared: 0, bySubject: {}
    };
    var bySubject = counts.bySubject || {};
    var groupBy = window._notesGroupBy || 'pinnedTo';

    function viewItem(id, label, count) {
      return '<button type="button" class="rd-rail__item' + (activeView === id ? ' is-active' : '') + '"' +
        ' onclick="applyNotesRailView(\'' + id.replace(/'/g, "\\'") + '\')">' + esc(label) +
        '<span class="rd-rail__count' + (id === 'flagged' && count > 0 ? ' rd-rail__count--warn' : '') + '">' + count + '</span></button>';
    }

    var viewsHtml =
      '<div class="rd-rail__section">' +
      '<div class="rd-rail__title">Views<button type="button" class="rd-rail__add" aria-label="Save view">+</button></div>' +
      '<div class="rd-rail__list" role="list">' +
      viewItem('all', 'All notes', counts.all || 0) +
      viewItem('unpinned', 'Unpinned', counts.unpinned || 0) +
      viewItem('flagged', 'Flagged', counts.flagged || 0) +
      viewItem('mine', 'Mine', counts.mine || 0) +
      viewItem('shared', 'Shared', counts.shared || 0) +
      '</div></div>';

    var subjectHtml =
      '<div class="rd-rail__section">' +
      '<div class="rd-rail__title">By subject</div>' +
      '<div class="rd-rail__meters">' +
      '<div class="rd-rail__meter-top"><span>Vendors</span><span class="rd-rail__count">' + (bySubject.Vendors || 0) + '</span></div>' +
      '<div class="rd-rail__meter-top"><span>Guests</span><span class="rd-rail__count">' + (bySubject.Guests || 0) + '</span></div>' +
      '<div class="rd-rail__meter-top"><span>Money</span><span class="rd-rail__count">' + (bySubject.Money || 0) + '</span></div>' +
      '<div class="rd-rail__meter-top"><span>The day</span><span class="rd-rail__count">' + (bySubject['The day'] || 0) + '</span></div>' +
      '<div class="rd-rail__meter-top"><span>Loose</span><span class="rd-rail__count">' + (bySubject.Loose || 0) + '</span></div>' +
      '</div></div>';

    function groupItem(id, label) {
      return '<button type="button" class="rd-rail__item' + (groupBy === id ? ' is-active' : '') + '"' +
        ' onclick="applyNotesGroupBy(\'' + id + '\')">' + esc(label) + '</button>';
    }
    var groupHtml =
      '<div class="rd-rail__section">' +
      '<div class="rd-rail__title">Group by</div>' +
      '<div class="rd-rail__list" role="list">' +
      groupItem('pinnedTo', 'Pinned to') +
      groupItem('author', 'Author') +
      groupItem('date', 'Date') +
      '</div></div>';

    var noteHtml =
      '<p class="rd-rail__note">A note is never in a share packet. Pin it to a record so it shows up where the work is.</p>';

    return '<div class="rd-rail__stack" data-page-rail="notes">' + viewsHtml + subjectHtml + groupHtml + noteHtml + '</div>';
  }

  function buildEmailsContext() {
    var activeView = 'all';
    if (typeof getSavedView === 'function') activeView = getSavedView('emails', 'all');
    else if (typeof window._etRailView === 'string' && window._etRailView) activeView = window._etRailView;
    window._etRailView = activeView;

    var counts = typeof window.etRailCounts === 'function' ? window.etRailCounts() : {
      all: 0, Guests: 0, Vendors: 0, 'Wedding party': 0, blanks: 0
    };
    var figures = typeof window.etFigures === 'function' ? window.etFigures() : {
      sentTotal: 0, mostTitle: '—', mostSent: 0, never: 0, lastSent: '—'
    };
    var groupBy = window._etGroupBy || 'audience';

    function viewItem(id, label, count) {
      return '<button type="button" class="rd-rail__item' + (activeView === id ? ' is-active' : '') + '"' +
        ' onclick="applyEmailsRailView(\'' + id.replace(/'/g, "\\'") + '\')">' + esc(label) +
        '<span class="rd-rail__count' + (id === 'blanks' && count > 0 ? ' rd-rail__count--warn' : '') + '">' + count + '</span></button>';
    }

    var viewsHtml =
      '<div class="rd-rail__section">' +
      '<div class="rd-rail__title">Views<button type="button" class="rd-rail__add" aria-label="Save view">+</button></div>' +
      '<div class="rd-rail__list" role="list">' +
      viewItem('all', 'All templates', counts.all || 0) +
      viewItem('Guests', 'Guests', counts.Guests || 0) +
      viewItem('Vendors', 'Vendors', counts.Vendors || 0) +
      viewItem('Wedding party', 'Wedding party', counts['Wedding party'] || 0) +
      viewItem('blanks', 'With blank fields', counts.blanks || 0) +
      '</div></div>';

    var useHtml =
      '<div class="rd-rail__section">' +
      '<div class="rd-rail__title">Use</div>' +
      '<div class="rd-rail__meters">' +
      '<div class="rd-rail__meter-top"><span>Sent from a template</span><span class="rd-rail__count">' +
      (figures.sentTotal || 0) + ' emails</span></div>' +
      '<div class="rd-rail__meter-top"><span>Most used</span><span class="rd-rail__count">' +
      esc((figures.mostTitle || '—') + (figures.mostSent ? (' · ' + figures.mostSent) : '')) + '</span></div>' +
      '<div class="rd-rail__meter-top"><span>Never used</span><span class="rd-rail__count">' +
      (figures.never || 0) + '</span></div>' +
      '<div class="rd-rail__meter-top"><span>Last sent</span><span class="rd-rail__count">' +
      esc(figures.lastSent || '—') + '</span></div>' +
      '</div></div>';

    function groupItem(id, label) {
      return '<button type="button" class="rd-rail__item' + (groupBy === id ? ' is-active' : '') + '"' +
        ' onclick="applyEmailsGroupBy(\'' + id + '\')">' + esc(label) + '</button>';
    }
    var groupHtml =
      '<div class="rd-rail__section">' +
      '<div class="rd-rail__title">Group by</div>' +
      '<div class="rd-rail__list" role="list">' +
      groupItem('audience', 'Audience') +
      groupItem('last', 'Last used') +
      groupItem('author', 'Author') +
      '</div></div>';

    var noteHtml =
      '<p class="rd-rail__note">Merge fields read live records. A template with an unresolved field cannot be sent until it is fixed.</p>';

    return '<div class="rd-rail__stack" data-page-rail="emails">' + viewsHtml + useHtml + groupHtml + noteHtml + '</div>';
  }

  /* All.dc #14b / Views #28 — derived households over guests. */
  function buildHouseholdsContext() {
    var activeView = 'all';
    if (typeof getSavedView === 'function') activeView = getSavedView('households', 'all');
    else if (typeof window._hhRailView === 'string' && window._hhRailView) activeView = window._hhRailView;
    window._hhRailView = activeView;
    var counts = typeof window.hhRailCounts === 'function' ? window.hhRailCounts() : {
      all: 0, invited: 0, fully: 0, partly: 0, none: 0
    };
    var figures = typeof window.hhFigures === 'function' ? window.hhFigures() : {
      invited: 0, households: 0, fully: 0, seats: 0, confirmed: 0
    };
    var groupBy = window._hhGroupBy || 'side';
    function viewItem(id, label, count, warn) {
      return '<button type="button" class="rd-rail__item' + (activeView === id ? ' is-active' : '') + '"' +
        ' onclick="applyHouseholdsRailView(\'' + id + '\')">' + esc(label) +
        '<span class="rd-rail__count' + (warn && count > 0 ? ' rd-rail__count--warn' : '') + '">' + count + '</span></button>';
    }
    var viewsHtml =
      '<div class="rd-rail__section">' +
      '<div class="rd-rail__title">Views<button type="button" class="rd-rail__add" aria-label="Save view">+</button></div>' +
      '<div class="rd-rail__list" role="list">' +
      viewItem('all', 'All households', counts.all || 0) +
      viewItem('invited', 'Invited', counts.invited || 0) +
      viewItem('fully', 'Fully replied', counts.fully || 0) +
      viewItem('partly', 'Partly replied', counts.partly || 0, true) +
      viewItem('none', 'No reply', counts.none || 0, true) +
      '</div></div>';
    var metersHtml =
      '<div class="rd-rail__section"><div class="rd-rail__title">Invitations</div><div class="rd-rail__meters">' +
      '<div class="rd-rail__meter-top"><span>Sent</span><span class="rd-rail__count">' + (figures.invited || 0) + ' of ' + (figures.households || 0) + '</span></div>' +
      '<div class="rd-rail__meter-top"><span>Replied</span><span class="rd-rail__count">' + (figures.fully || 0) + '</span></div>' +
      '<div class="rd-rail__meter-top"><span>Seats requested</span><span class="rd-rail__count">' + (figures.seats || 0) + '</span></div>' +
      '<div class="rd-rail__meter-top"><span>Seats confirmed</span><span class="rd-rail__count">' + (figures.confirmed || 0) + '</span></div>' +
      '</div></div>';
    function groupItem(id, label) {
      return '<button type="button" class="rd-rail__item' + (groupBy === id ? ' is-active' : '') + '"' +
        ' onclick="applyHouseholdsGroupBy(\'' + id + '\')">' + esc(label) + '</button>';
    }
    var groupHtml =
      '<div class="rd-rail__section"><div class="rd-rail__title">Group by</div><div class="rd-rail__list" role="list">' +
      groupItem('side', 'Side') + groupItem('city', 'City') + groupItem('reply', 'Reply status') +
      '</div></div>';
    var noteHtml = '<p class="rd-rail__note"><b>A derived view.</b> Households are grouped guest records — editing an address here edits it on every guest in that household.</p>';
    return '<div class="rd-rail__stack" data-page-rail="households">' + viewsHtml + metersHtml + groupHtml + noteHtml + '</div>';
  }

  /* All.dc #14c / Views #28 — master contact directory. */
  function buildContactsContext() {
    var activeView = 'everyone';
    if (typeof getSavedView === 'function') activeView = getSavedView('contacts', 'everyone');
    else if (typeof window._ctRailView === 'string' && window._ctRailView) activeView = window._ctRailView;
    window._ctRailView = activeView;
    var counts = typeof window.ctRailCounts === 'function' ? window.ctRailCounts() : {
      everyone: 0, vendors: 0, party: 0, family: 0, dayof: 0
    };
    var figures = typeof window.ctFigures === 'function' ? window.ctFigures() : {
      withPhone: 0, contacts: 0, withEmail: 0, neither: 0, dayof: 0
    };
    var groupBy = window._ctGroupBy || 'role';
    function viewItem(id, label, count) {
      return '<button type="button" class="rd-rail__item' + (activeView === id ? ' is-active' : '') + '"' +
        ' onclick="applyContactsRailView(\'' + id + '\')">' + esc(label) +
        '<span class="rd-rail__count">' + count + '</span></button>';
    }
    var viewsHtml =
      '<div class="rd-rail__section">' +
      '<div class="rd-rail__title">Views<button type="button" class="rd-rail__add" aria-label="Save view">+</button></div>' +
      '<div class="rd-rail__list" role="list">' +
      viewItem('everyone', 'Everyone', counts.everyone || 0) +
      viewItem('vendors', 'Vendors', counts.vendors || 0) +
      viewItem('party', 'Wedding party', counts.party || 0) +
      viewItem('family', 'Family', counts.family || 0) +
      viewItem('dayof', 'Day-of only', counts.dayof || 0) +
      '</div></div>';
    var metersHtml =
      '<div class="rd-rail__section"><div class="rd-rail__title">Reachable</div><div class="rd-rail__meters">' +
      '<div class="rd-rail__meter-top"><span>With a phone number</span><span class="rd-rail__count">' + (figures.withPhone || 0) + ' of ' + (figures.contacts || 0) + '</span></div>' +
      '<div class="rd-rail__meter-top"><span>With an email</span><span class="rd-rail__count">' + (figures.withEmail || 0) + '</span></div>' +
      '<div class="rd-rail__meter-top"><span>Neither</span><span class="rd-rail__count">' + (figures.neither || 0) + '</span></div>' +
      '<div class="rd-rail__meter-top"><span>On the day-of sheet</span><span class="rd-rail__count">' + (figures.dayof || 0) + '</span></div>' +
      '</div></div>';
    function groupItem(id, label) {
      return '<button type="button" class="rd-rail__item' + (groupBy === id ? ' is-active' : '') + '"' +
        ' onclick="applyContactsGroupBy(\'' + id + '\')">' + esc(label) + '</button>';
    }
    var groupHtml =
      '<div class="rd-rail__section"><div class="rd-rail__title">Group by</div><div class="rd-rail__list" role="list">' +
      groupItem('role', 'Role') + groupItem('side', 'Side') + groupItem('company', 'Company') +
      '</div></div>';
    var noteHtml = '<p class="rd-rail__note"><b>A derived view.</b> Contacts are vendors and guests seen through one lens — the phone number lives on the original record.</p>';
    return '<div class="rd-rail__stack" data-page-rail="contacts">' + viewsHtml + metersHtml + groupHtml + noteHtml + '</div>';
  }

  /* All.dc #13a — Vision & Foundation. */
  function buildVisionContext() {
    var activeView = 'vision';
    if (typeof getSavedView === 'function') activeView = getSavedView('vision', 'vision');
    else if (typeof window._visRailView === 'string' && window._visRailView) activeView = window._visRailView;
    window._visRailView = activeView;
    var counts = typeof window.visRailCounts === 'function' ? window.visRailCounts() : {
      vision: 0, values: 0, scriptures: 0, promises: 0, building: 0
    };
    var figures = typeof window.visFigures === 'function' ? window.visFigures() : {
      sectionsComplete: 0, sectionsTotal: 5, words: 0, lastWritten: '—'
    };
    function viewItem(id, label, count) {
      return '<button type="button" class="rd-rail__item' + (activeView === id ? ' is-active' : '') + '"' +
        ' onclick="applyVisionRailView(\'' + id + '\')">' + esc(label) +
        '<span class="rd-rail__count">' + (count || '') + '</span></button>';
    }
    var viewsHtml =
      '<div class="rd-rail__section"><div class="rd-rail__title">Sections</div><div class="rd-rail__list" role="list">' +
      viewItem('vision', 'Our vision', '') +
      viewItem('values', 'Values', counts.values || 0) +
      viewItem('scriptures', 'Scriptures', counts.scriptures || 0) +
      viewItem('promises', 'Promises', counts.promises || 0) +
      viewItem('building', 'What we are building', '') +
      '</div></div>';
    var metersHtml =
      '<div class="rd-rail__section"><div class="rd-rail__title">Written</div><div class="rd-rail__meters">' +
      '<div class="rd-rail__meter-top"><span>Sections complete</span><span class="rd-rail__count">' + (figures.sectionsComplete || 0) + ' of ' + (figures.sectionsTotal || 5) + '</span></div>' +
      '<div class="rd-rail__meter-top"><span>Words</span><span class="rd-rail__count">' + (figures.words || 0) + '</span></div>' +
      '<div class="rd-rail__meter-top"><span>Last written</span><span class="rd-rail__count">' + esc(figures.lastWritten || '—') + '</span></div>' +
      '</div></div>';
    var noteHtml = '<p class="rd-rail__note">Prints as a <b>Class B keepsake</b>: Cormorant returns, margins open, one gold hairline per page.</p>';
    return '<div class="rd-rail__stack" data-page-rail="vision">' + viewsHtml + metersHtml + noteHtml + '</div>';
  }

  /* All.dc #13d — First-Month Rhythms. Views · Since the wedding · Group by. */
  function buildFirstmonthContext() {
    var activeView = 'all';
    if (typeof getSavedView === 'function') activeView = getSavedView('firstmonth', 'all');
    else if (typeof window._fmRailView === 'string' && window._fmRailView) activeView = window._fmRailView;
    window._fmRailView = activeView;
    var counts = typeof window.fmRailCounts === 'function' ? window.fmRailCounts() : {
      all: 0, daily: 0, weekly: 0, monthly: 0, yearly: 0
    };
    var figures = typeof window.fmFigures === 'function' ? window.fmFigures() : {
      keptThisMonth: 0, rhythms: 0, longestStreak: '—', startsLong: '—', review: 'Every anniversary'
    };
    var groupBy = window._fmGroupBy || 'cadence';
    function viewItem(id, label, count) {
      return '<button type="button" class="rd-rail__item' + (activeView === id ? ' is-active' : '') + '"' +
        ' onclick="applyFirstmonthRailView(\'' + id + '\')">' + esc(label) +
        '<span class="rd-rail__count">' + count + '</span></button>';
    }
    var viewsHtml =
      '<div class="rd-rail__section"><div class="rd-rail__title">Views<button type="button" class="rd-rail__add" onclick="rdFmAdd()" aria-label="Add rhythm">+</button></div><div class="rd-rail__list" role="list">' +
      viewItem('all', 'All rhythms', counts.all || 0) +
      viewItem('daily', 'Daily', counts.daily || 0) +
      viewItem('weekly', 'Weekly', counts.weekly || 0) +
      viewItem('monthly', 'Monthly', counts.monthly || 0) +
      viewItem('yearly', 'Yearly', counts.yearly || 0) +
      '</div></div>';
    var keptPct = (figures.rhythms || 0) > 0
      ? Math.round(((figures.keptThisMonth || 0) / figures.rhythms) * 100)
      : 0;
    var metersHtml =
      '<div class="rd-rail__section"><div class="rd-rail__title">Since the wedding</div><div class="rd-rail__meters">' +
      '<div class="rd-rail__meter"><div class="rd-rail__meter-top"><span>Kept this month</span><span class="rd-rail__count">' +
      (figures.keptThisMonth || 0) + ' of ' + (figures.rhythms || 0) + '</span></div>' +
      '<div class="rd-track"><div class="rd-fill" style="width:' + keptPct + '%"></div></div></div>' +
      '<div class="rd-rail__meter-top"><span>Longest streak</span><span class="rd-rail__count">' +
      esc(figures.longestStreak || figures.streaks || '—') + '</span></div>' +
      '<div class="rd-rail__meter-top"><span>Starts</span><span class="rd-rail__count">' +
      esc(figures.startsLong || figures.beginsLong || '—') + '</span></div>' +
      '<div class="rd-rail__meter-top"><span>Review</span><span class="rd-rail__count">' +
      esc(figures.review || 'Every anniversary') + '</span></div>' +
      '</div></div>';
    function groupItem(id, label) {
      return '<button type="button" class="rd-rail__item' + (groupBy === id ? ' is-active' : '') + '"' +
        ' onclick="applyFirstmonthGroupBy(\'' + id + '\')">' + esc(label) +
        '<span class="rd-rail__count"></span></button>';
    }
    var groupHtml =
      '<div class="rd-rail__section"><div class="rd-rail__title">Group by</div><div class="rd-rail__list" role="list">' +
      groupItem('cadence', 'Cadence') + groupItem('owner', 'Owner') + groupItem('area', 'Area') +
      '</div></div>';
    var noteHtml = '<p class="rd-rail__note">Rhythms begin the day after the wedding. Nothing here appears on the Timeline — it is not wedding work.</p>';
    return '<div class="rd-rail__stack" data-page-rail="firstmonth">' + viewsHtml + metersHtml + groupHtml + noteHtml + '</div>';
  }

  /* All.dc #18b — Planner History. Filter by record · Retention · Jump to. */
  function buildHistoryContext() {
    var figures = typeof window.histFigures === 'function' ? window.histFigures() : {
      total: 0, today: 0, undo: 0, redo: 0, capacity: 0, logLimit: 200, snapLimit: 15,
      oldestShort: '—', oldestUndoShort: '—', counts: { all: 0, guests: 0, budget: 0, tasks: 0, vendors: 0, tables: 0, other: 0 }
    };
    var counts = figures.counts || {};
    var activeFilter = window._histRailFilter || 'all';
    var activeJump = window._histJump || 'all';
    function filterItem(id, label, count) {
      return '<button type="button" class="rd-rail__item' + (activeFilter === id ? ' is-active' : '') + '"' +
        ' onclick="applyHistoryRailFilter(\'' + id + '\')">' + esc(label) +
        '<span class="rd-rail__count">' + (count || 0) + '</span></button>';
    }
    var filterHtml =
      '<div class="rd-rail__section"><div class="rd-rail__title">Filter by record</div><div class="rd-rail__list" role="list">' +
      filterItem('all', 'Everything', counts.all || figures.total || 0) +
      filterItem('guests', 'Guests', counts.guests || 0) +
      filterItem('budget', 'Budget &amp; payments', counts.budget || 0) +
      filterItem('tasks', 'Tasks', counts.tasks || 0) +
      filterItem('vendors', 'Vendors', counts.vendors || 0) +
      filterItem('tables', 'Table layout', counts.tables || 0) +
      filterItem('other', 'Everything else', counts.other || 0) +
      '</div></div>';
    var logPct = figures.logLimit ? Math.min(100, Math.round(((figures.total || 0) / figures.logLimit) * 100)) : 0;
    var snapPct = figures.snapLimit ? Math.min(100, Math.round(((figures.undo || 0) / figures.snapLimit) * 100)) : 0;
    var metersHtml =
      '<div class="rd-rail__section"><div class="rd-rail__title">Retention</div><div class="rd-rail__meters">' +
      '<div class="rd-rail__meter"><div class="rd-rail__meter-top"><span>Log entries</span><span class="rd-rail__count">' +
      (figures.total || 0) + ' of ' + (figures.logLimit || 200) + '</span></div>' +
      '<div class="rd-track"><div class="rd-fill" style="width:' + logPct + '%"></div></div></div>' +
      '<div class="rd-rail__meter"><div class="rd-rail__meter-top"><span>Undo snapshots</span><span class="rd-rail__count">' +
      (figures.undo || 0) + ' of ' + (figures.snapLimit || 15) + '</span></div>' +
      '<div class="rd-track"><div class="rd-fill" style="width:' + snapPct + '%"></div></div></div>' +
      '<div class="rd-rail__meter-top"><span>Oldest entry</span><span class="rd-rail__count">' + esc(figures.oldestShort || '—') + '</span></div>' +
      '<div class="rd-rail__meter-top"><span>Oldest undo</span><span class="rd-rail__count">' + esc(figures.oldestUndoShort || '—') + '</span></div>' +
      '</div></div>';
    function jumpItem(id, label, count) {
      return '<button type="button" class="rd-rail__item' + (activeJump === id ? ' is-active' : '') + '"' +
        ' onclick="applyHistoryJump(\'' + id + '\')">' + esc(label) +
        (count != null && count !== '' ? '<span class="rd-rail__count">' + count + '</span>' : '') +
        '</button>';
    }
    var jumpHtml =
      '<div class="rd-rail__section"><div class="rd-rail__title">Jump to</div><div class="rd-rail__list" role="list">' +
      jumpItem('today', 'Today', figures.today || 0) +
      jumpItem('yesterday', 'Yesterday', '') +
      jumpItem('week', 'This week', '') +
      jumpItem('all', 'Everything', figures.total || 0) +
      '<button type="button" class="rd-rail__item" onclick="rdHistJumpDate()">Pick a date…</button>' +
      '</div></div>';
    var noteHtml = '<p class="rd-rail__note">Undo and redo restore whole snapshots. This log is the readable record of what changed — it keeps going after a snapshot has aged out.</p>';
    return '<div class="rd-rail__stack" data-page-rail="history">' + filterHtml + metersHtml + jumpHtml + noteHtml + '</div>';
  }

  /* All.dc #18a — Newlywed Homecoming. Sections · Progress (+ bars) · Group by. */
  function buildHomecomingContext() {
    var activeView = 'settling';
    if (typeof getSavedView === 'function') activeView = getSavedView('homecoming', 'settling');
    else if (typeof window._hcRailView === 'string' && window._hcRailView) activeView = window._hcRailView;
    if (activeView === 'after') activeView = 'settling';
    window._hcRailView = activeView;
    var counts = typeof window.hcRailCounts === 'function' ? window.hcRailCounts() : {
      settling: 0, namechange: 0, budget: 0, noticed: ''
    };
    var figures = typeof window.hcFigures === 'function' ? window.hcFigures() : {
      homeDone: 0, homecoming: 0, nameDone: 0, nameChange: 0,
      firstMonthStatus: 'Not started', beginsShort: '—'
    };
    var groupBy = window._hcGroupBy || 'area';
    function viewItem(id, label, count) {
      return '<button type="button" class="rd-rail__item' + (activeView === id ? ' is-active' : '') + '"' +
        ' onclick="applyHomecomingRailView(\'' + id + '\')">' + esc(label) +
        '<span class="rd-rail__count">' + (count === '' || count == null ? '' : count) + '</span></button>';
    }
    var viewsHtml =
      '<div class="rd-rail__section"><div class="rd-rail__title">Sections<button type="button" class="rd-rail__add" onclick="rdHcAddTask()" aria-label="Add">+</button></div><div class="rd-rail__list" role="list">' +
      viewItem('settling', 'Settling in', counts.settling || 0) +
      viewItem('namechange', 'Name change', counts.namechange || 0) +
      viewItem('budget', 'First month budget', counts.budget || 0) +
      viewItem('noticed', 'What we noticed', '') +
      '</div></div>';
    function pct(done, total) {
      return total > 0 ? Math.round((done / total) * 100) : 0;
    }
    var settlePct = pct(figures.homeDone || 0, figures.homecoming || 0);
    var namePct = pct(figures.nameDone || 0, figures.nameChange || 0);
    var metersHtml =
      '<div class="rd-rail__section"><div class="rd-rail__title">Progress</div><div class="rd-rail__meters">' +
      '<div class="rd-rail__meter"><div class="rd-rail__meter-top"><span>Settling in</span><span class="rd-rail__count">' +
      (figures.homeDone || 0) + ' of ' + (figures.homecoming || 0) + '</span></div>' +
      '<div class="rd-track"><div class="rd-fill" style="width:' + settlePct + '%"></div></div></div>' +
      '<div class="rd-rail__meter"><div class="rd-rail__meter-top"><span>Name change</span><span class="rd-rail__count">' +
      (figures.nameDone || 0) + ' of ' + (figures.nameChange || 0) + '</span></div>' +
      '<div class="rd-track"><div class="rd-fill" style="width:' + namePct + '%"></div></div></div>' +
      '<div class="rd-rail__meter-top"><span>First month</span><span class="rd-rail__count">' +
      esc(figures.firstMonthStatus || 'Not started') + '</span></div>' +
      '<div class="rd-rail__meter-top"><span>Begins</span><span class="rd-rail__count">' +
      esc(figures.beginsShort || '—') + '</span></div>' +
      '</div></div>';
    function groupItem(id, label) {
      return '<button type="button" class="rd-rail__item' + (groupBy === id ? ' is-active' : '') + '"' +
        ' onclick="applyHomecomingGroupBy(\'' + id + '\')">' + esc(label) +
        '<span class="rd-rail__count"></span></button>';
    }
    var groupHtml =
      '<div class="rd-rail__section"><div class="rd-rail__title">Group by</div><div class="rd-rail__list" role="list">' +
      groupItem('area', 'Area') + groupItem('owner', 'Owner') + groupItem('due', 'Due') +
      '</div></div>';
    var noteHtml = '<p class="rd-rail__note">Nothing here can be ticked before ' +
      esc(figures.beginsShort && figures.beginsShort !== '—' ? figures.beginsShort : 'the day after the wedding') +
      '. It is written now so the first month is not spent deciding what to do.</p>';
    return '<div class="rd-rail__stack" data-page-rail="homecoming">' + viewsHtml + metersHtml + groupHtml + noteHtml + '</div>';
  }

  /* All.dc #12d — Print Centre. */
  function buildPrintCentreContext() {
    var activeView = 'everything';
    if (typeof getSavedView === 'function') activeView = getSavedView('print-centre', 'everything');
    else if (typeof window._pcRailView === 'string' && window._pcRailView) activeView = window._pcRailView;
    window._pcRailView = activeView;
    var counts = typeof window.pcRailCounts === 'function' ? window.pcRailCounts() : {
      everything: 0, classA: 0, classB: 0, printed: 0, dayof: 0
    };
    var figures = typeof window.pcFigures === 'function' ? window.pcFigures() : {
      dayOfReady: 0, dayOfTotal: 0, packBlocked: 0, paper: 'Letter'
    };
    function viewItem(id, label, count) {
      return '<button type="button" class="rd-rail__item' + (activeView === id ? ' is-active' : '') + '"' +
        ' onclick="applyPrintCentreRailView(\'' + id + '\')">' + esc(label) +
        '<span class="rd-rail__count">' + count + '</span></button>';
    }
    var viewsHtml =
      '<div class="rd-rail__section"><div class="rd-rail__title">Views<button type="button" class="rd-rail__add" aria-label="Save view">+</button></div><div class="rd-rail__list" role="list">' +
      viewItem('everything', 'Everything', counts.everything || 0) +
      viewItem('classA', 'Class A · working', counts.classA || 0) +
      viewItem('classB', 'Class B · keepsakes', counts.classB || 0) +
      viewItem('printed', 'Printed already', counts.printed || 0) +
      viewItem('dayof', 'Day-of pack', counts.dayof || 0) +
      '</div></div>';
    var metersHtml =
      '<div class="rd-rail__section"><div class="rd-rail__title">Day-of pack</div><div class="rd-rail__meters">' +
      '<div class="rd-rail__meter-top"><span>Ready to print</span><span class="rd-rail__count">' + (figures.dayOfReady || 0) + ' of ' + (figures.dayOfTotal || 0) + '</span></div>' +
      '<div class="rd-rail__meter-top"><span>Blocked</span><span class="rd-rail__count">' + (figures.packBlocked || 0) + '</span></div>' +
      '</div></div>';
    var paperHtml =
      '<div class="rd-rail__section"><div class="rd-rail__title">Paper</div><div class="rd-rail__list" role="list">' +
      '<button type="button" class="rd-rail__item' + ((figures.paper || 'Letter') === 'Letter' ? ' is-active' : '') + '" onclick="setPrintCentrePaper(\'Letter\')">Letter</button>' +
      '<button type="button" class="rd-rail__item' + ((figures.paper || '') === 'A4' ? ' is-active' : '') + '" onclick="setPrintCentrePaper(\'A4\')">A4</button>' +
      '</div></div>';
    var noteHtml = '<p class="rd-rail__note"><b>Class A</b> prints black on white with repeating headers; <b>Class B</b> keeps Cormorant and gold hairlines.</p>';
    return '<div class="rd-rail__stack" data-page-rail="print-centre">' + viewsHtml + metersHtml + paperHtml + noteHtml + '</div>';
  }

  var CONTEXT_BUILDERS = {
    guests: buildGuestContext,
    households: buildHouseholdsContext,
    contacts: buildContactsContext,
    party: buildPartyContext,
    gifts: buildGiftsContext,
    tables: buildTablesContext,
    dashboard: buildDashboardContext,
    notes: buildNotesContext,
    budget: buildBudgetContext,
    payments: buildPaymentsContext,
    contracts: buildContractsContext,
    vendors: buildVendorsContext,
    venue: buildVenueContext,
    timeline: buildTimelineContext,
    ceremony: buildCeremonyContext,
    honeymoon: buildHoneymoonContext,
    homecoming: buildHomecomingContext,
    history: buildHistoryContext,
    vision: buildVisionContext,
    prayer: buildPrayerContext,
    counseling: buildCounselingContext,
    firstmonth: buildFirstmonthContext,
    mood: buildMoodContext,
    essentials: buildEssentialsContext,
    packets: buildPacketsContext,
    emails: buildEmailsContext,
    'print-centre': buildPrintCentreContext,
    tasks: buildTasksContext,
    appointments: buildAppointmentsContext,
    logistics: buildLogisticsContext,
    calendar: buildCalendarContext,
    catering: buildCateringContext,
    entertainment: buildEntertainmentContext,
    shotlist: buildShotlistContext,
    'data-hub': buildDataHubContext
  };

  function renderContextSidebarPageContext(panelId) {
    var host = document.getElementById('planner-sidebar-context');
    if (!host) return;
    var build = CONTEXT_BUILDERS[panelId] || function () { return buildGenericContext(panelId); };
    host.innerHTML = build(panelId);

    var rail = document.getElementById('planner-context-sidebar-rail');
    if (rail) rail.innerHTML = '';
  }

  function renderContextSidebarGlobal() {
    var host = document.getElementById('planner-sidebar-global');
    if (!host) return;
    var active = document.body.getAttribute('data-active-panel') || 'dashboard';
    var ob = typeof ensureOnboardData === 'function' ? ensureOnboardData() : {};
    var favs = Array.isArray(ob.favoritePages) ? ob.favoritePages.filter(function (p) { return typeof QJ_PAGES !== 'undefined' && QJ_PAGES[p]; }) : [];
    var recents = Array.isArray(ob.recentPages) ? ob.recentPages.filter(function (p) { return typeof QJ_PAGES !== 'undefined' && QJ_PAGES[p]; }).slice(0, 6) : [];

    function favRow(id) {
      return '<li><button type="button" onclick="quickJumpTo(\'' + id + '\')">' + esc(panelLabel(id)) + '</button>' +
        '<button type="button" class="pcs-star-btn is-fav" onclick="event.stopPropagation();toggleFavoritePage(\'' + id + '\');renderContextSidebarGlobal();" title="Remove favorite">★</button></li>';
    }
    function recentRow(id) {
      var isFav = favs.indexOf(id) >= 0;
      return '<li><button type="button" onclick="quickJumpTo(\'' + id + '\')">' + esc(panelLabel(id)) + '</button>' +
        '<button type="button" class="pcs-star-btn' + (isFav ? ' is-fav' : '') + '" onclick="event.stopPropagation();toggleFavoritePage(\'' + id + '\');renderContextSidebarGlobal();" title="Toggle favorite">' + (isFav ? '★' : '☆') + '</button></li>';
    }

    var favHtml = favs.length ? favs.map(favRow).join('') : '<li><p class="pcs-empty">Star pages from recents below.</p></li>';
    var recentHtml = recents.length ? recents.map(recentRow).join('') : '<li><p class="pcs-empty">Visit pages to build recents.</p></li>';
    var isFavActive = favs.indexOf(active) >= 0;

    host.innerHTML =
      '<div class="pcs-block"><div class="pcs-global-alert"><strong>Quick access</strong> — favorites, recents, and common actions. Use the category labels above for full navigation.</div></div>' +
      '<div class="pcs-block"><div class="pcs-block__title">★ Favorites</div><ul class="pcs-global-list">' + favHtml + '</ul></div>' +
      '<div class="pcs-block"><div class="pcs-block__title">Recent</div><ul class="pcs-global-list">' + recentHtml + '</ul></div>' +
      '<div class="pcs-block"><div class="pcs-block__title">Common actions</div><div class="pcs-global-actions">' +
      '<button type="button" class="ued-btn" onclick="openDataHub()">Database Hub</button>' +
      '<button type="button" class="ued-btn" onclick="showPanel(\'setup\')">Wedding Setup</button>' +
      '<button type="button" class="ued-btn" onclick="downloadSqliteBackup()">Backup</button>' +
      '<button type="button" class="ued-btn" onclick="addGuestRow();showPanel(\'guests\')">+ Guest</button>' +
      '<button type="button" class="ued-btn" onclick="showPanel(\'tasks\')">+ Task</button></div></div>' +
      '<div class="pcs-block"><button type="button" class="ued-btn" style="width:100%" onclick="toggleFavoritePage(\'' + active + '\');renderContextSidebarGlobal();">' +
      (isFavActive ? '★ Remove from favorites' : '☆ Add page to favorites') + '</button></div>';
  }

  function renderContextSidebarShortcuts() {
    var host = document.getElementById('planner-sidebar-shortcuts');
    if (!host || !isActive()) return;
    var sections = typeof getPlannerKeyboardShortcuts === 'function' ? getPlannerKeyboardShortcuts() : [];
    if (!sections.length) {
      host.innerHTML = '';
      return;
    }
    host.innerHTML = sections.map(function (section) {
      var rows = section.items.map(function (item) {
        return '<li class="pcs-shortcut-row"><kbd class="pcs-shortcut-keys">' + esc(item.keys) + '</kbd><span class="pcs-shortcut-label">' + esc(item.label) + '</span></li>';
      }).join('');
      return '<div class="pcs-shortcuts-group"><div class="pcs-shortcuts-group__title">' + esc(section.group) + '</div><ul class="pcs-shortcut-list">' + rows + '</ul></div>';
    }).join('');
  }

  function renderContextSidebarNav() {
    var host = document.getElementById('planner-sidebar-nav');
    if (!host || !isActive()) return;
    if (typeof NAV_CATEGORIES === 'undefined' || !NAV_CATEGORIES.length) {
      host.innerHTML = '';
      return;
    }
    var active = document.body.getAttribute('data-active-panel') || '';
    var d = plannerData();
    if (d) {
      if (!d.setup) d.setup = {};
      if (!d.setup.navDrawerOpen || typeof d.setup.navDrawerOpen !== 'object') d.setup.navDrawerOpen = {};
    }
    var setup = (d && d.setup) || { navDrawerOpen: {} };

    host.replaceChildren();
    NAV_CATEGORIES.forEach(function (cat) {
      var visiblePages = cat.pages.filter(function (p) {
        return typeof navCategoryPageVisible === 'function' ? navCategoryPageVisible(p) : true;
      });
      if (!visiblePages.length) return;

      var hasActive = visiblePages.some(function (p) {
        var pid = typeof navCategoryPageId === 'function' ? navCategoryPageId(p) : p.id;
        return pid === active || (pid === 'reflect' && active === 'reflect');
      });
      var isOpen = setup.navDrawerOpen[cat.id] === true || (setup.navDrawerOpen[cat.id] == null && hasActive);

      var section = document.createElement('div');
      section.className = 'nav-drawer-section';
      section.dataset.cat = cat.id;

      var catBtn = document.createElement('button');
      catBtn.type = 'button';
      catBtn.className = 'nav-drawer-cat';
      catBtn.setAttribute('aria-expanded', isOpen ? 'true' : 'false');
      catBtn.setAttribute('onclick', "toggleNavDrawerCategory('" + cat.id + "')");
      catBtn.innerHTML = (cat.icon ? '<span class="material-symbols-sharp nav-drawer-cat-icon">' + cat.icon + '</span>' : '') +
        '<span class="nav-drawer-cat-text"><span class="nav-drawer-cat-label">' + esc(cat.label) + '</span>' +
        (cat.subtitle ? '<span class="nav-drawer-cat-sub">' + esc(cat.subtitle) + '</span>' : '') + '</span>' +
        '<span class="nav-drawer-cat-chevron" aria-hidden="true">▾</span>';
      section.appendChild(catBtn);

      var pagesWrap = document.createElement('div');
      pagesWrap.className = 'nav-drawer-pages';
      if (!isOpen) pagesWrap.setAttribute('hidden', '');

      visiblePages.forEach(function (p) {
        var pid = typeof navCategoryPageId === 'function' ? navCategoryPageId(p) : p.id;
        var action = typeof navCategoryPageAction === 'function' ? navCategoryPageAction(p) : ("showPanel('" + pid + "')");
        var isActivePage = pid === active || (pid === 'reflect' && active === 'reflect');
        var locked = typeof isPageSoftLocked === 'function' && isPageSoftLocked(pid);
        var btn = document.createElement('button');
        btn.type = 'button';
        btn.className = 'nav-item' + (isActivePage ? ' active' : '') + (locked ? ' nav-item-locked' : '');
        btn.setAttribute('onclick', action);
        if (isActivePage) btn.setAttribute('aria-current', 'page');
        btn.innerHTML = '<span class="nav-item-label">' + esc(p.label) + '</span>' +
          (p.subtitle ? '<span class="nav-item-sub">' + esc(p.subtitle) + '</span>' : '');
        pagesWrap.appendChild(btn);
      });

      section.appendChild(pagesWrap);
      host.appendChild(section);
    });
  }

  function renderContextSidebar(panelId) {
    if (!isActive()) return;
    panelId = panelId || document.body.getAttribute('data-active-panel') || 'dashboard';
    renderContextSidebarPageContext(panelId);
    renderContextSidebarGlobal();
    renderContextSidebarShortcuts();
    renderContextSidebarNav();
  }

  function applyContextSidebarCollapse(collapsed, opts) {
    opts = opts || {};
    document.body.classList.toggle('context-sidebar-collapsed', !!collapsed);
    document.documentElement.classList.remove('context-sidebar-collapsed-early');
    var btn = document.getElementById('context-sidebar-collapse-btn');
    if (btn) {
      btn.setAttribute('aria-pressed', collapsed ? 'true' : 'false');
      btn.setAttribute('aria-label', collapsed ? 'Show sidebar' : 'Hide sidebar');
      btn.setAttribute('title', collapsed ? 'Show sidebar ( [ )' : 'Hide sidebar ( [ )');
    }
    var expandTab = document.getElementById('context-sidebar-expand-tab');
    if (expandTab) {
      expandTab.hidden = !collapsed;
    }
    var d = plannerData();
    if (!opts.skipSave && d && d.setup) {
      d.setup.contextSidebarCollapsed = collapsed;
      if (typeof save === 'function') save();
    }
    if (typeof syncPlannerChromeAfterNavChange === 'function') syncPlannerChromeAfterNavChange();
  }

  function toggleContextSidebarCollapse() {
    applyContextSidebarCollapse(!document.body.classList.contains('context-sidebar-collapsed'));
  }

  function toggleContextSidebarMobile(open) {
    var on = open != null ? open : !document.body.classList.contains('context-sidebar-mobile-open');
    document.body.classList.toggle('context-sidebar-mobile-open', on);
    var scrim = document.getElementById('context-sidebar-scrim');
    if (scrim) scrim.classList.toggle('is-visible', on);
  }

  function contextSidebarHighlightGuest(idx) {
    if (typeof showPanel === 'function') showPanel('guests');
    requestAnimationFrame(function () {
      var card = document.querySelector('#guest-card-grid .hub-record-card[data-record-index="' + idx + '"]');
      if (card) {
        card.classList.add('is-sidebar-highlight');
        card.scrollIntoView({ behavior: 'smooth', block: 'center' });
        setTimeout(function () { card.classList.remove('is-sidebar-highlight'); }, 2400);
      }
    });
  }

  function toggleContextSidebarFromButton(e) {
    if (e) {
      e.preventDefault();
      e.stopPropagation();
    }
    if (window.matchMedia('(max-width: 900px)').matches) toggleContextSidebarMobile();
    else toggleContextSidebarCollapse();
  }

  function wireContextSidebarControls() {
    var collapseBtn = document.getElementById('context-sidebar-collapse-btn');
    if (collapseBtn && !collapseBtn.dataset.bound) {
      collapseBtn.addEventListener('click', toggleContextSidebarFromButton);
      collapseBtn.dataset.bound = '1';
    }

    var expandTab = document.getElementById('context-sidebar-expand-tab');
    if (expandTab && !expandTab.dataset.bound) {
      expandTab.addEventListener('click', toggleContextSidebarFromButton);
      expandTab.dataset.bound = '1';
    }

    var mobileBtn = document.getElementById('context-sidebar-mobile-btn');
    if (mobileBtn && !mobileBtn.dataset.bound) {
      mobileBtn.addEventListener('click', toggleContextSidebarFromButton);
      mobileBtn.dataset.bound = '1';
    }

    var scrim = document.getElementById('context-sidebar-scrim');
    if (scrim && !scrim.dataset.bound) {
      scrim.addEventListener('click', function () { toggleContextSidebarMobile(false); });
      scrim.dataset.bound = '1';
    }

    var navHost = document.getElementById('planner-sidebar-nav');
    if (navHost && !navHost.dataset.bound) {
      navHost.addEventListener('click', function (e) {
        if (e.target.closest('.nav-item') && window.matchMedia('(max-width: 900px)').matches) {
          toggleContextSidebarMobile(false);
        }
      });
      navHost.dataset.bound = '1';
    }

    if (!document.body.dataset.contextSidebarKeyBound) {
      document.body.dataset.contextSidebarKeyBound = '1';
      document.addEventListener('keydown', function (e) {
        if (!isActive()) return;
        if (e.key !== '[' || e.ctrlKey || e.metaKey || e.altKey) return;
        var el = document.activeElement;
        var tag = el && el.tagName ? el.tagName : '';
        if (tag === 'TEXTAREA' || tag === 'SELECT') return;
        if (tag === 'INPUT' && el.id !== 'context-sidebar-collapse-btn') return;
        e.preventDefault();
        toggleContextSidebarCollapse();
      });
    }
  }

  function initContextSidebar() {
    if (!document.getElementById('planner-context-sidebar')) return;
    document.body.classList.add('context-sidebar-mode');
    if (typeof closeNavMenuDrawer === 'function') closeNavMenuDrawer();
    if (typeof scheduleCategoryMenubarRender === 'function') scheduleCategoryMenubarRender();

    wireContextSidebarControls();

    var d = plannerData();
    var collapsed = !!(d && d.setup && d.setup.contextSidebarCollapsed);
    applyContextSidebarCollapse(collapsed, { skipSave: true });

    renderContextSidebar(document.body.getAttribute('data-active-panel') || 'dashboard');
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', wireContextSidebarControls);
  } else {
    wireContextSidebarControls();
  }

  window.renderContextSidebar = renderContextSidebar;
  window.renderContextSidebarGlobal = renderContextSidebarGlobal;
  window.renderContextSidebarNav = renderContextSidebarNav;
  window.renderContextSidebarShortcuts = renderContextSidebarShortcuts;
  window.toggleContextSidebarCollapse = toggleContextSidebarCollapse;
  window.toggleContextSidebarMobile = toggleContextSidebarMobile;
  window.toggleContextSidebarFromButton = toggleContextSidebarFromButton;
  window.contextSidebarHighlightGuest = contextSidebarHighlightGuest;
  window.initContextSidebar = initContextSidebar;
  window.applyTaskRailView = applyTaskRailView;
  window.applyTaskRailGroupBy = applyTaskRailGroupBy;
  window.applyTaskRailPhaseFilter = applyTaskRailPhaseFilter;
  window.applyAppointmentRailView = applyAppointmentRailView;
  window.applyAppointmentRailGroupBy = applyAppointmentRailGroupBy;
  window.applyLogisticsRailView = applyLogisticsRailView;
  window.applyLogisticsRailGroupBy = applyLogisticsRailGroupBy;

  window.applyCalendarRailShow = applyCalendarRailShow;
  window.applyCalendarRailView = applyCalendarRailView;
  window.toggleCalendarRailSource = toggleCalendarRailSource;
  window.applyCalendarRailNeedsDate = applyCalendarRailNeedsDate;
  window.applyCalendarRailMode = applyCalendarRailMode;
  window.onSmartSourceFilterChange = onSmartSourceFilterChange;
  if (typeof window._taskRailView !== 'string') window._taskRailView = 'all';
  if (typeof window._taskRailGroupBy !== 'string') window._taskRailGroupBy = 'phase';
  if (typeof window._apptRailView !== 'string') window._apptRailView = 'all';
  if (typeof window._apptRailGroupBy !== 'string') window._apptRailGroupBy = 'month';
  if (typeof window._logRailView !== 'string') window._logRailView = 'all';
  if (typeof window._logRailGroupBy !== 'string') window._logRailGroupBy = 'day';
  if (typeof window._calRailView !== 'string') window._calRailView = 'everything';
  if (typeof window._calRailShow !== 'string') window._calRailShow = 'everything';
})();
