/* Covenant Wedding Planner — UX kit (Phase A)
   Reusable psychology-driven UI helpers + UX_PAGES registry.
   See UX-ENHANCEMENTS-REVIEW-AND-IMPLEMENTATION.md at project root. */
(function(global){
  'use strict';

  function uxEsc(v){
    if (typeof escapeHtml === 'function') return escapeHtml(v);
    return String(v == null ? '' : v)
      .replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;');
  }

  function uxData(){
    return (typeof data !== 'undefined' && data) ? data : {};
  }

  function uxOnboard(){
    if (typeof ensureOnboardData === 'function') return ensureOnboardData();
    const d = uxData();
    if (!d.onboard || typeof d.onboard !== 'object') d.onboard = {};
    return d.onboard;
  }

  function uxIsGentle(){
    return !!(uxData().setup && uxData().setup.gentleMode);
  }

  function uxBannerDismissed(id){
    const ob = uxOnboard();
    if (!ob.dismissedBanners) ob.dismissedBanners = {};
    return !!ob.dismissedBanners[id];
  }

  function uxDismissBanner(id){
    const ob = uxOnboard();
    if (!ob.dismissedBanners) ob.dismissedBanners = {};
    ob.dismissedBanners[id] = Date.now();
    if (typeof save === 'function') save();
    const panel = document.body.getAttribute('data-active-panel');
    if (panel) renderPageUxChrome(panel);
  }
  global.uxDismissBanner = uxDismissBanner;

  function uxPct(done, total){
    const t = Number(total) || 0;
    const d = Number(done) || 0;
    if (!t) return 0;
    return Math.round((d / t) * 100);
  }

  function uxInitials(name){
    const parts = String(name || '').trim().split(/\s+/).filter(Boolean);
    if (!parts.length) return '?';
    if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();
    return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
  }

  function uxHashColor(str){
    let h = 0;
    const s = String(str || '');
    for (let i = 0; i < s.length; i++) h = ((h << 5) - h) + s.charCodeAt(i);
    const hue = Math.abs(h) % 360;
    return 'hsl(' + hue + ' 32% 38%)';
  }

  /* ---------- UX kit render helpers ---------- */

  function goalBar(opts){
    opts = opts || {};
    const done = Number(opts.done) || 0;
    const total = Number(opts.total) || 0;
    const label = opts.label || 'Progress';
    const floor = opts.floor != null ? opts.floor : 0.05;
    const pct = total ? Math.max(Math.round((done / total) * 100), Math.round(floor * 100)) : Math.round(floor * 100);
    const cap = total
      ? (done + ' of ' + total + ' — ' + pct + '% ' + (opts.suffix || 'there'))
      : (opts.emptyLabel || 'Add your first items to start tracking progress');
    return '<section class="ux-goal-bar" aria-label="' + uxEsc(label) + ' progress">' +
      '<div class="ux-goal-bar__k">' + uxEsc(label) + '</div>' +
      '<div class="ux-goal-bar__track"><b class="ux-goal-bar__fill" style="width:' + pct + '%"></b></div>' +
      '<div class="ux-goal-bar__cap">' + uxEsc(cap) + '</div>' +
    '</section>';
  }
  global.goalBar = goalBar;

  function pillSchemeFor(value, context){
    const v = String(value == null ? '' : value).trim();
    const s = v.toLowerCase();
    if (!v || v === '—') return 'muted';
    if (context === 'payment') {
      if (/paid|complete/.test(s)) return 'success';
      if (/overdue/.test(s)) return 'danger';
      if (/partial|deposit|due|pending/.test(s)) return 'warning';
      return 'neutral';
    }
    if (context === 'gift') {
      if (/cash|check|fund/.test(s)) return 'gift-cash';
      if (/registry|store|amazon|target|etsy/.test(s)) return 'gift-registry';
      if (/hand|homemade|diy/.test(s)) return 'gift-handmade';
      return 'gift-other';
    }
    if (context === 'appointment') {
      if (/confirm|complete/.test(s)) return 'success';
      if (/cancel/.test(s)) return 'danger';
      if (/unconfirm|pending/.test(s)) return 'warning';
      return 'neutral';
    }
    if (context === 'calendar' || context === 'smart') {
      if (/confirm|complete|paid|done|booked/.test(s)) return 'success';
      if (/cancel|declin|overdue|late/.test(s)) return 'danger';
      if (/pending|unconfirm|due|partial|maybe/.test(s)) return 'warning';
      return 'neutral';
    }
    if (context === 'contract') {
      if (/paid|signed/.test(s) && !/not signed/.test(s)) return 'success';
      if (/invoice|invoiced/.test(s)) return 'warning';
      return 'neutral';
    }
    const statusMap = {
      'booked': 'forest', 'paid': 'success', 'complete': 'success', 'completed': 'success',
      'yes': 'success', 'accepted': 'success', 'confirmed': 'success',
      'not paid': 'danger', 'no': 'danger', 'declined': 'danger', 'cancelled': 'danger', 'canceled': 'danger',
      'contacted': 'warning', 'quote received': 'warning', 'partially paid': 'warning',
      'partial': 'warning', 'pending': 'warning', 'maybe': 'warning', 'in progress': 'blue',
      'deposit paid': 'warning', 'invoiced': 'warning',
      'not started': 'muted', 'researching': 'muted', 'scheduled': 'forest'
    };
    if (statusMap[s]) return statusMap[s];
    if (statusMap[v]) return statusMap[v];
    return 'neutral';
  }
  global.pillSchemeFor = pillSchemeFor;

  function pill(value, scheme){
    const v = String(value == null ? '' : value).trim();
    if (!v) return '';
    if (!scheme || scheme === 'auto') scheme = pillSchemeFor(v, 'status');
    const cls = ' ux-pill--' + String(scheme).replace(/\s+/g, '-').toLowerCase();
    return '<span class="ux-pill' + cls + '">' + uxEsc(v) + '</span>';
  }
  global.pill = pill;

  function pageContextStrip(opts){
    opts = opts || {};
    if (!opts.title) return '';
    const stats = (opts.stats || []).filter(function(s){ return s && s.value != null; }).map(function(s){
      const label = s.label ? uxEsc(s.label) + ' ' : '';
      return '<span class="page-context-strip-stat">' + label + '<b>' + uxEsc(String(s.value)) + '</b>' + (s.suffix ? ' ' + uxEsc(s.suffix) : '') + '</span>';
    }).join('');
    const links = (opts.links || []).map(function(l){
      const panel = l.panel || l;
      const label = l.label || panel;
      return '<button type="button" class="page-context-strip-link" onclick="showPanel(\'' + String(panel).replace(/'/g, "\\'") + '\')">' + uxEsc(label) + ' →</button>';
    }).join('');
    return '<span class="page-context-strip-label">' + uxEsc(opts.title) + '</span>' + stats + links;
  }
  global.pageContextStrip = pageContextStrip;

  function avatar(opts){
    opts = opts || {};
    if (opts.icon) {
      return '<span class="ux-avatar ux-avatar--icon" aria-hidden="true">' + opts.icon + '</span>';
    }
    const initials = uxInitials(opts.name);
    const bg = opts.color || uxHashColor(opts.name);
    return '<span class="ux-avatar" style="--ux-avatar-bg:' + bg + '" aria-hidden="true" title="' + uxEsc(opts.name || '') + '">' + uxEsc(initials) + '</span>';
  }
  global.avatar = avatar;

  function smartHint(text){
    if (!text) return '';
    return '<span class="ux-smart-hint">' + uxEsc(text) + '</span>';
  }
  global.smartHint = smartHint;

  function relatedNote(links){
    if (!Array.isArray(links) || !links.length) return '';
    const chips = links.map(l => {
      const panel = l.panel || l;
      const label = l.label || panel;
      const fn = "showPanel('" + String(panel).replace(/'/g, "\\'") + "')";
      return '<button type="button" class="ux-related-chip" onclick="' + fn + '">' + uxEsc(label) + ' →</button>';
    }).join('');
    return '<div class="ux-related-note"><span class="ux-related-note__label">Linked pages</span>' + chips + '</div>';
  }
  global.relatedNote = relatedNote;

  function sequenceList(rows, opts){
    opts = opts || {};
    if (!Array.isArray(rows) || !rows.length) return '';
    const items = rows.map(function(row, i){
      const label = typeof row === 'string' ? row : (row.label || row.moment || row.event || row.name || '');
      if (!label) return '';
      return '<li class="ux-sequence-item"><span class="ux-sequence-num">' + (i + 1) + '</span><span class="ux-sequence-label">' + uxEsc(label) + '</span></li>';
    }).filter(Boolean).join('');
    if (!items) return '';
    const title = opts.title ? '<div class="ux-sequence-title">' + uxEsc(opts.title) + '</div>' : '';
    return title + '<ol class="ux-sequence-list' + (opts.compact ? ' ux-sequence-list--compact' : '') + '">' + items + '</ol>';
  }
  global.sequenceList = sequenceList;

  function statBand(stats){
    if (!Array.isArray(stats) || !stats.length) return '';
    const items = stats.map(s =>
      '<div class="ux-stat' + (s.tone ? ' ux-stat--' + s.tone : '') + '">' +
        '<div class="ux-stat__val">' + uxEsc(s.value) + '</div>' +
        '<div class="ux-stat__label">' + uxEsc(s.label) + '</div>' +
        (s.sub ? '<div class="ux-stat__sub">' + uxEsc(s.sub) + '</div>' : '') +
      '</div>'
    ).join('');
    return '<div class="ux-stat-band">' + items + '</div>';
  }
  global.statBand = statBand;

  function uxMoney(value){
    const n = Number(value) || 0;
    if (typeof fmt === 'function') return fmt(n);
    return '$' + n.toLocaleString(undefined, { maximumFractionDigits: 0 });
  }

  function emptyState(opts){
    opts = opts || {};
    const primary = opts.primary;
    const secondary = opts.secondary;
    const pBtn = primary ? '<button type="button" class="ux-empty__btn ux-empty__btn--primary" onclick="' + (primary.onclick || primary.fn || '') + '">' + uxEsc(primary.label || 'Get started') + '</button>' : '';
    const sBtn = secondary ? '<button type="button" class="ux-empty__btn" onclick="' + (secondary.onclick || secondary.fn || '') + '">' + uxEsc(secondary.label || 'Learn more') + '</button>' : '';
    return '<div class="ux-empty">' +
      (opts.icon ? '<div class="ux-empty__icon" aria-hidden="true">' + opts.icon + '</div>' : '') +
      '<h3 class="ux-empty__title">' + uxEsc(opts.title || 'Nothing here yet') + '</h3>' +
      '<p class="ux-empty__body">' + uxEsc(opts.body || '') + '</p>' +
      (opts.hint ? '<p class="ux-empty__hint">' + uxEsc(opts.hint) + '</p>' : '') +
      '<div class="ux-empty__actions">' + pBtn + sBtn + '</div>' +
    '</div>';
  }
  global.emptyState = emptyState;

  function celebrate(opts){
    opts = opts || {};
    const action = opts.action;
    const btn = action ? '<button type="button" class="ux-celebrate__btn" onclick="' + (action.onclick || "showPanel('" + (action.panel || 'dashboard') + "')") + '">' + uxEsc(action.label || 'Continue') + '</button>' : '';
    return '<div class="ux-celebrate" role="status">' +
      '<span class="ux-celebrate__burst" aria-hidden="true">✓</span>' +
      '<div class="ux-celebrate__copy"><strong>' + uxEsc(opts.title || 'Complete') + '</strong>' +
      (opts.note ? '<span>' + uxEsc(opts.note) + '</span>' : '') + '</div>' +
      btn +
    '</div>';
  }
  global.celebrate = celebrate;

  function riskBanner(opts){
    opts = opts || {};
    if (!opts.id || uxBannerDismissed(opts.id)) return '';
    const gentle = uxIsGentle();
    const level = opts.level || 'info';
    const title = gentle && opts.gentleTitle ? opts.gentleTitle : (opts.title || '');
    const note = gentle && opts.gentleNote ? opts.gentleNote : (opts.note || '');
    const dismiss = opts.dismissLabel || 'Dismiss';
    const action = opts.action;
    const actionBtn = action ? '<button type="button" class="ux-risk-banner__action" onclick="' + (action.onclick || '') + '">' + uxEsc(action.label || 'Review') + '</button>' : '';
    return '<div class="ux-risk-banner ux-risk-banner--' + level + '" role="note">' +
      '<div class="ux-risk-banner__body"><strong>' + uxEsc(title) + '</strong><span>' + uxEsc(note) + '</span></div>' +
      '<div class="ux-risk-banner__actions">' + actionBtn +
      '<button type="button" class="ux-risk-banner__dismiss" onclick="uxDismissBanner(\'' + String(opts.id).replace(/'/g, "\\'") + '\')">' + uxEsc(dismiss) + '</button></div>' +
    '</div>';
  }
  global.riskBanner = riskBanner;

  let _uxSaveFlashTimer = null;

  function savedFlash(msg){
    const text = msg || 'Saved';
    if (typeof showToast === 'function') showToast('✓ ' + text, 'success');
  }
  global.savedFlash = savedFlash;

  function uxSavedFlashForPanel(panelId){
    if (!UX_PAGES[panelId]) return;
    clearTimeout(_uxSaveFlashTimer);
    _uxSaveFlashTimer = setTimeout(function(){ savedFlash(); }, 450);
  }
  global.uxSavedFlashForPanel = uxSavedFlashForPanel;

  function uxSavedFlashOnSave(){
    const panelId = document.body && document.body.getAttribute('data-active-panel');
    if (!panelId) return;
    if (UX_PAGES[panelId]) uxSavedFlashForPanel(panelId);
  }
  global.uxSavedFlashOnSave = uxSavedFlashOnSave;

  function socialProof(opts){
    opts = opts || {};
    if (!opts.label) return '';
    return '<span class="ux-social-proof" title="' + uxEsc(opts.source || 'Planning tip') + '">' + uxEsc(opts.label) + '</span>';
  }
  global.socialProof = socialProof;

  /* ---------- UX_PAGES registry ---------- */

  const UX_PAGES = {};

  function guestRsvpAnswered(g){
    const r = String(g.rsvp || '');
    return r && r !== 'Pending';
  }

  UX_PAGES.guests = {
    label: 'Guest List',
    nativeStats: true,
    stats(d){
      const guests = (d && d.guests) || [];
      const total = guests.length;
      const attending = guests.filter(g => /yes|accepted/i.test(g.rsvp || '')).length;
      const pending = guests.filter(g => !g.rsvp || /pending/i.test(g.rsvp || '')).length;
      const missingMeal = guests.filter(g => /yes|accepted/i.test(g.rsvp || '') && !String(g.meal || '').trim()).length;
      return [
        { label: 'Guests tracked', value: total },
        { label: 'Attending rows', value: attending },
        { label: 'Pending RSVP', value: pending, tone: pending ? 'warning' : '' },
        { label: 'Meals open', value: missingMeal, tone: missingMeal ? 'danger' : '' }
      ];
    },
    progress(d){
      const guests = (d && d.guests) || [];
      const total = guests.length;
      const done = guests.filter(guestRsvpAnswered).length;
      return { done, total, label: 'RSVPs in', suffix: 'responded' };
    },
    lifecycle(d){
      const guests = (d && d.guests) || [];
      if (!guests.length) return 'empty';
      const total = guests.length;
      const done = guests.filter(guestRsvpAnswered).length;
      if (total > 0 && done >= total) return 'complete';
      return 'filling';
    },
    related: [
      { panel: 'catering', label: 'Catering' },
      { panel: 'budget', label: 'Budget' },
      { panel: 'tables', label: 'Table Layout' }
    ],
    empty: {
      title: 'Your guest list starts here',
      body: 'Add guests one at a time, or import a list you already have. Every name flows into catering, seating, and your headcount budget automatically.',
      hint: 'Tip: start with your household, then add wedding party and family.',
      primary: { label: '+ Add your first guest', fn: 'addGuestRow()' },
      secondary: { label: 'Import CSV', fn: "openGuestCSVImport('guests')" }
    },
    complete: {
      title: 'Every guest on your list has responded',
      note: 'Your headcount is ready for catering and seating.',
      action: { label: 'Open table layout →', panel: 'tables' }
    },
    hints: { qty: 'from your guest list' },
    risks(d){
      const risks = [];
      const guests = (d && d.guests) || [];
      const yes = guests.filter(g => /yes|accepted/i.test(g.rsvp || ''));
      const missingMeal = yes.filter(g => !String(g.meal || '').trim());
      if (missingMeal.length >= 3) {
        risks.push({
          id: 'guests-meals',
          scope: 'digest',
          level: 'warn',
          title: missingMeal.length + ' attending guests need meal selections',
          gentleTitle: missingMeal.length + ' meal choices still open',
          note: 'Catering counts work best when every attending guest has a meal preference.',
          gentleNote: 'Add meal preferences when you can — it helps your caterer plan accurately.',
          action: { label: 'Review guests', onclick: "document.getElementById('guest-filter-rsvp')&&(document.getElementById('guest-filter-rsvp').value='Yes');setGuestPage(0)" }
        });
      }
      const total = guests.length;
      const answered = guests.filter(guestRsvpAnswered).length;
      if (total >= 20 && answered >= Math.min(total, 15) && answered < total) {
        risks.push({
          id: 'guests-seating-draft',
          scope: 'digest',
          level: 'info',
          title: 'Enough RSVPs to start seating',
          note: 'You have ' + answered + ' responses — open Table Layout when you are ready.',
          action: { label: 'Table layout', onclick: "showPanel('tables')" }
        });
      }
      return risks;
    }
  };

  UX_PAGES.budget = {
    label: 'Budget',
    nativeStats: true,
    stats(d){
      const overall = parseFloat(d && d.setup && d.setup.budget) || 0;
      const planned = (typeof budgetTotalPlanned === 'function') ? budgetTotalPlanned() : 0;
      const spent = (typeof budgetTotalActual === 'function') ? budgetTotalActual() : 0;
      const remaining = overall - spent;
      return [
        { label: 'Budget target', value: uxMoney(overall) },
        { label: 'Planned', value: uxMoney(planned) },
        { label: 'Spent', value: uxMoney(spent) },
        { label: remaining < 0 ? 'Over budget' : 'Remaining', value: uxMoney(Math.abs(remaining)), tone: remaining < 0 ? 'danger' : '' }
      ];
    },
    progress(d){
      const overall = parseFloat(d && d.setup && d.setup.budget) || 0;
      const spent = (typeof budgetTotalActual === 'function') ? budgetTotalActual() : 0;
      const done = overall ? Math.min(spent, overall) : 0;
      return { done: Math.round(spent), total: Math.round(overall), label: 'Budget used', suffix: 'of target', emptyLabel: 'Set a total budget in Wedding Setup to track spending' };
    },
    lifecycle(d){
      const cats = (d && d.budget) || [];
      const overall = parseFloat(d && d.setup && d.setup.budget) || 0;
      if (!cats.length && !overall) return 'empty';
      return 'filling';
    },
    related: [
      { panel: 'payments', label: 'Payments' },
      { panel: 'catering', label: 'Catering' },
      { panel: 'setup', label: 'Wedding Setup' }
    ],
    empty: {
      title: 'Build your wedding budget',
      body: 'Load a full category set or add categories one at a time. Payments and catering sync here automatically.',
      primary: { label: 'Load full categories', fn: 'loadBudgetPreset()' },
      secondary: { label: 'Wedding Setup', fn: "showPanel('setup')" }
    },
    risks(d){
      const risks = [];
      const overall = parseFloat(d && d.setup && d.setup.budget) || 0;
      const spent = (typeof budgetTotalActual === 'function') ? budgetTotalActual() : 0;
      if (overall > 0 && spent > overall) {
        const over = spent - overall;
        const moneyFmt = (typeof fmt === 'function') ? fmt : (n => '$' + Number(n).toLocaleString());
        risks.push({
          id: 'budget-over',
          level: 'warn',
          title: 'Spending is above your total budget',
          gentleTitle: 'Your plan is above the budget you set',
          note: moneyFmt(over) + ' over your ' + moneyFmt(overall) + ' target.',
          gentleNote: 'Review categories or adjust your target in Setup when you are ready.',
          action: { label: 'Review budget', onclick: "showPanel('budget')" }
        });
      }
      return risks;
    }
  };

  UX_PAGES.payments = {
    label: 'Payments',
    nativeStats: true,
    stats(d){
      const rows = (d && d.payments) || [];
      let totalDue = 0, totalPaid = 0, overdue = 0;
      const today = new Date(); today.setHours(0, 0, 0, 0);
      rows.forEach(row => {
        const summary = (typeof paymentPlanSummary === 'function')
          ? paymentPlanSummary(row)
          : { dueTotal: parseFloat(row.due) || 0, paidTotal: parseFloat(row.paid) || 0, displayStatus: row.status || '', nextDate: row.date || '' };
        totalDue += parseFloat(summary.dueTotal) || 0;
        totalPaid += parseFloat(summary.paidTotal) || 0;
        const date = summary.nextDate || row.date;
        if (date && !/paid|complete/i.test(summary.displayStatus || row.status || '')) {
          const due = new Date(date + 'T00:00:00');
          if (!isNaN(due.getTime()) && due < today) overdue++;
        }
      });
      return [
        { label: 'Payments tracked', value: rows.length },
        { label: 'Total due', value: uxMoney(totalDue) },
        { label: 'Total paid', value: uxMoney(totalPaid) },
        { label: 'Past due', value: overdue, tone: overdue ? 'danger' : '' }
      ];
    },
    progress(d){
      const rows = (d && d.payments) || [];
      const total = rows.length;
      const done = rows.filter(p => /paid|complete/i.test(p.status || '')).length;
      return { done, total, label: 'Payments complete', suffix: 'marked paid' };
    },
    lifecycle(d){
      const rows = (d && d.payments) || [];
      if (!rows.length) return 'empty';
      const total = rows.length;
      const done = rows.filter(p => /paid|complete/i.test(p.status || '')).length;
      if (total > 0 && done >= total) return 'complete';
      return 'filling';
    },
    related: [
      { panel: 'budget', label: 'Budget' },
      { panel: 'vendors', label: 'Vendors' },
      { panel: 'contracts', label: 'Contracts' }
    ],
    empty: {
      title: 'Track deposits and balances',
      body: 'Add vendor payments as you book. Link them to budget categories so totals stay in sync.',
      primary: { label: '+ Add payment', fn: 'addPaymentRow()' },
      secondary: { label: 'Open vendors', fn: "showPanel('vendors')" }
    },
    complete: {
      title: 'Every payment is marked complete',
      note: 'Your vendor balances are fully tracked — well done.',
      action: { label: 'Open budget →', panel: 'budget' }
    },
    risks(d){
      const risks = [];
      const rows = (d && d.payments) || [];
      const today = new Date(); today.setHours(0, 0, 0, 0);
      rows.forEach((p, i) => {
        const date = p.date || p.dueDate;
        if (!date || /paid|complete/i.test(p.status || '')) return;
        const due = new Date(date + 'T00:00:00');
        if (isNaN(due.getTime()) || due >= today) return;
        risks.push({
          id: 'payment-overdue-' + (p._id || i),
          level: 'warn',
          title: 'Payment past due: ' + (p.vendor || p.desc || 'Vendor payment'),
          gentleTitle: 'Friendly reminder: payment date has passed',
          note: 'Due ' + date + '. Confirm status or update the date when paid.',
          gentleNote: 'Update the payment record when you have a moment.',
          action: { label: 'Open payments', onclick: "showPanel('payments')" }
        });
      });
      return risks.slice(0, 2);
    }
  };

  function uxCateringRows(d){
    d = d || uxData();
    const keys = ['menu', 'beverages', 'kidsMenu', 'placeSettings', 'cateringRentals', 'snacks', 'vendorMeals'];
    return keys.reduce((sum, k) => sum + (Array.isArray(d[k]) ? d[k].length : 0), 0);
  }
  global.uxCateringRowCount = uxCateringRows;

  function uxCateringConfirmedCount(d){
    d = d || uxData();
    const keys = ['menu', 'beverages', 'kidsMenu', 'placeSettings', 'cateringRentals', 'snacks', 'vendorMeals'];
    let done = 0;
    keys.forEach(k => {
      (d[k] || []).forEach(row => {
        const s = String(row.status || '').toLowerCase();
        if (/confirm|book|include|paid|final/.test(s)) done++;
      });
    });
    return done;
  }
  global.uxCateringConfirmedCount = uxCateringConfirmedCount;

  function uxVendorBooked(v){
    if (typeof vendorBookedStatus === 'function') return vendorBookedStatus(v.status) || !!v.contract;
    const s = String(v.status || '');
    return /booked|paid|complete/i.test(s) || !!v.contract;
  }

  UX_PAGES.vendors = {
    label: 'Vendors',
    nativeStats: true,
    stats(d){
      const rows = (d && d.vendors) || [];
      const total = rows.length;
      const booked = rows.filter(uxVendorBooked).length;
      const notBooked = rows.filter(v => String(v.status || '') === 'Not Booked').length;
      const considering = Math.max(0, total - booked - notBooked);
      return [
        { label: 'Vendors tracked', value: total },
        { label: 'Booked', value: booked },
        { label: 'Considering', value: considering, tone: considering ? 'warning' : '' },
        { label: 'Not booked', value: notBooked }
      ];
    },
    progress(d){
      const rows = (d && d.vendors) || [];
      const total = rows.length;
      const done = rows.filter(uxVendorBooked).length;
      return { done, total, label: 'Vendors booked', suffix: 'confirmed' };
    },
    lifecycle(d){
      const rows = (d && d.vendors) || [];
      if (!rows.length) return 'empty';
      const total = rows.length;
      const done = rows.filter(uxVendorBooked).length;
      if (total > 0 && done >= total) return 'complete';
      return 'filling';
    },
    related: [
      { panel: 'payments', label: 'Payments' },
      { panel: 'contracts', label: 'Contracts' },
      { panel: 'appointments', label: 'Appointments' }
    ],
    empty: {
      icon: '🤝',
      title: 'Your vendor team starts here',
      body: 'Track quotes, contracts, and contact details in one place. Booked vendors flow into payments and your day-of timeline.',
      hint: 'Start with venue, catering, photo, and music — the anchors everything else builds around.',
      primary: { label: '+ Add your first vendor', fn: 'addVendorRow()' },
      secondary: { label: 'Open payments', fn: "showPanel('payments')" }
    },
    complete: {
      title: 'Every vendor on your list is booked',
      note: 'Beautiful — your core team is in place.',
      action: { label: 'Review payments →', panel: 'payments' }
    },
    risks(d){
      const risks = [];
      const rows = (d && d.vendors) || [];
      const weddingDate = d && d.setup && d.setup.date;
      if (weddingDate && typeof daysBetween === 'function') {
        const days = daysBetween(weddingDate);
        if (days !== null && days >= 0 && days <= 90) {
          const open = rows.filter(v => !uxVendorBooked(v)).length;
          if (open >= 2) {
            risks.push({
              id: 'vendors-unbooked-date',
              level: 'warn',
              title: open + ' vendors still open with your wedding approaching',
              gentleTitle: open + ' vendor decisions still open',
              note: 'Your wedding is ' + days + ' days away — confirm key partners when you are ready.',
              gentleNote: 'Review open vendors at your own pace — no rush, just helpful to know.',
              action: { label: 'Review vendors', onclick: "showPanel('vendors')" }
            });
          }
        }
      }
      return risks.slice(0, 1);
    }
  };

  UX_PAGES.catering = {
    label: 'Catering',
    nativeStats: true,
    stats(d){
      const total = uxCateringRows(d);
      const confirmed = uxCateringConfirmedCount(d);
      const guests = (typeof cateringGuests === 'function') ? cateringGuests() : { total: 0, adults: 0, kids: 0 };
      const cost = (typeof cateringTotal === 'function') ? cateringTotal() : 0;
      return [
        { label: 'Menu & bar items', value: total },
        { label: 'Confirmed items', value: confirmed, tone: total && confirmed < total ? 'warning' : '' },
        { label: 'Guest headcount', value: guests.total || 0 },
        { label: 'Catering total', value: uxMoney(cost) }
      ];
    },
    progress(d){
      const total = uxCateringRows(d);
      const done = uxCateringConfirmedCount(d);
      return { done, total, label: 'Menu items confirmed', suffix: 'settled' };
    },
    lifecycle(d){
      const total = uxCateringRows(d);
      if (!total) return 'empty';
      const done = uxCateringConfirmedCount(d);
      if (total > 0 && done >= total) return 'complete';
      return 'filling';
    },
    related: [
      { panel: 'guests', label: 'Guest List' },
      { panel: 'budget', label: 'Budget' },
      { panel: 'tables', label: 'Table Layout' }
    ],
    empty: {
      icon: '🍽',
      title: 'Plan what you will serve',
      body: 'Build your menu, bar, and rentals here. Every line syncs to your budget automatically.',
      hint: 'Use Load Starter on each table when you are ready — or add dishes one at a time.',
      primary: { label: 'Load starter menu', fn: 'loadMenuPreset()' },
      secondary: { label: 'Guest list', fn: "showPanel('guests')" }
    },
    complete: {
      title: 'Your catering plan is fully confirmed',
      note: 'Menu, bar, and rentals are settled — your caterer has what they need.',
      action: { label: 'Open budget →', panel: 'budget' }
    },
    risks(d){
      const risks = [];
      const guests = (d && d.guests) || [];
      const yes = guests.filter(g => /yes|accepted/i.test(g.rsvp || ''));
      const missingMeal = yes.filter(g => !String(g.meal || '').trim());
      if (missingMeal.length >= 3) {
        risks.push({
          id: 'catering-meals',
          scope: 'digest',
          level: 'warn',
          title: missingMeal.length + ' attending guests need meal selections',
          gentleTitle: missingMeal.length + ' meal choices still open',
          note: 'Meal counts from your guest list help your caterer plan accurately.',
          gentleNote: 'Add meal preferences on the Guest List when you can.',
          action: { label: 'Guest list', onclick: "showPanel('guests')" }
        });
      }
      return risks.slice(0, 1);
    }
  };

  UX_PAGES.tables = {
    label: 'Table Layout',
    nativeStats: true,
    stats(d){
      const s = (typeof tableSummaryData === 'function') ? tableSummaryData() : { assigned: 0, totalGuestHeads: 0, cap: 0, open: 0, vip: 0 };
      const tables = (d && d.tables) || [];
      return [
        { label: 'Tables', value: tables.length },
        { label: 'Guests seated', value: s.assigned || 0 },
        { label: 'Open seats', value: s.open || 0, tone: s.open ? 'warning' : '' },
        { label: 'VIP tables', value: s.vip || 0 }
      ];
    },
    progress(d){
      const s = (typeof tableSummaryData === 'function') ? tableSummaryData() : { assigned: 0, totalGuestHeads: 0 };
      return { done: s.assigned || 0, total: s.totalGuestHeads || 0, label: 'Guests seated', suffix: 'placed' };
    },
    lifecycle(d){
      const tables = (d && d.tables) || [];
      const guests = (d && d.guests) || [];
      const hasAssignments = guests.some(g => String(g.table || '').trim());
      if (!tables.length && !hasAssignments) return 'empty';
      const issues = (typeof computeTableCapacityIssues === 'function') ? computeTableCapacityIssues() : { unseatedCount: 0 };
      const s = (typeof tableSummaryData === 'function') ? tableSummaryData() : { assigned: 0, totalGuestHeads: 0 };
      if (s.totalGuestHeads > 0 && !issues.unseatedCount && s.assigned >= s.totalGuestHeads) return 'complete';
      return 'filling';
    },
    related: [
      { panel: 'guests', label: 'Guest List' },
      { panel: 'catering', label: 'Catering' },
      { panel: 'dashboard', label: 'Dashboard' }
    ],
    empty: {
      icon: '🪑',
      title: 'Seating starts on your guest list',
      body: 'Assign table numbers on the Guest List — cards appear here automatically. Drag tables on the floor plan when you are ready.',
      hint: 'Tip: start with head table and family, then fill guest tables.',
      primary: { label: 'Open guest list', fn: "showPanel('guests')" },
      secondary: { label: 'Add a table', fn: 'addTable()' }
    },
    complete: {
      title: 'Every guest has a seat',
      note: 'Your seating chart is ready for the reception.',
      action: { label: 'Print floor plan', onclick: 'window.print()' }
    },
    risks(d){
      const risks = [];
      const issues = (typeof computeTableCapacityIssues === 'function') ? computeTableCapacityIssues() : null;
      if (!issues) return risks;
      if (issues.overfull && issues.overfull.length) {
        const t = issues.overfull[0];
        risks.push({
          id: 'tables-overfull',
          level: 'warn',
          title: t.label + ' is over capacity',
          note: t.seated + ' seated / ' + t.capacity + ' seats — move guests or raise capacity.',
          action: { label: 'Table layout', onclick: "showPanel('tables')" }
        });
      } else if (issues.unseatedCount >= 5) {
        risks.push({
          id: 'tables-unseated',
          scope: 'digest',
          level: 'info',
          title: issues.unseatedCount + ' guests not seated yet',
          gentleTitle: issues.unseatedCount + ' seating assignments still open',
          note: 'Assign table numbers on the Guest List when you are ready.',
          gentleNote: 'Seating can wait until RSVPs are in — take your time.',
          action: { label: 'Guest list', onclick: "showPanel('guests')" }
        });
      }
      return risks.slice(0, 1);
    }
  };

  UX_PAGES.calendar = {
    label: 'Smart Calendar',
    nativeStats: true,
    stats(d){
      const events = (typeof buildSmartCalendarEvents === 'function') ? buildSmartCalendarEvents() : [];
      const today = (typeof todayISO === 'function') ? todayISO() : '';
      const pending = events.filter(e => /pending|unconfirm|waiting|not paid|partial/i.test(e.status || ''));
      const upcoming = events.filter(e => e.date && e.date >= today && !/complete|paid|confirmed/i.test(e.status || ''));
      const weekEnd = new Date(); weekEnd.setDate(weekEnd.getDate() + 7);
      const weekEndIso = weekEnd.toISOString().slice(0, 10);
      const dueWeek = upcoming.filter(e => e.date <= weekEndIso);
      return [
        { label: 'Calendar events', value: events.length },
        { label: 'Due this week', value: dueWeek.length, tone: dueWeek.length ? 'warning' : '' },
        { label: 'Pending', value: pending.length, tone: pending.length ? 'danger' : '' },
        { label: 'Upcoming', value: upcoming.length }
      ];
    },
    progress(d){
      const events = (typeof buildSmartCalendarEvents === 'function') ? buildSmartCalendarEvents() : [];
      const total = events.length;
      const done = events.filter(e => /complete|paid|confirmed|done/i.test(e.status || '')).length;
      return { done, total, label: 'Dates settled', suffix: 'resolved', emptyLabel: 'Add tasks, payments, or appointments to populate your calendar' };
    },
    lifecycle(d){
      const events = (typeof buildSmartCalendarEvents === 'function') ? buildSmartCalendarEvents() : [];
      if (!events.length) return 'empty';
      const total = events.length;
      const done = events.filter(e => /complete|paid|confirmed|done/i.test(e.status || '')).length;
      if (total > 0 && done >= total) return 'complete';
      return 'filling';
    },
    related: [
      { panel: 'tasks', label: 'Tasks' },
      { panel: 'timeline', label: 'Day-of Timeline' },
      { panel: 'appointments', label: 'Appointments' }
    ],
    empty: {
      icon: '📅',
      title: 'Your unified calendar awaits',
      body: 'Dates from tasks, payments, appointments, and your wedding timeline appear here automatically.',
      hint: 'Add a due date to any task, or book an appointment — the calendar fills itself.',
      primary: { label: 'Open tasks', fn: "showPanel('tasks')" },
      secondary: { label: 'Appointments', fn: "showPanel('appointments')" }
    },
    complete: {
      title: 'Every calendar date is settled',
      note: 'Tasks, payments, and appointments are confirmed on your calendar.',
      action: { label: 'Open timeline →', panel: 'timeline' }
    },
    risks(d){
      const risks = [];
      const events = (typeof buildSmartCalendarEvents === 'function') ? buildSmartCalendarEvents() : [];
      const today = (typeof todayISO === 'function') ? todayISO() : '';
      events.forEach((e, i) => {
        if (!e.date || e.date < today) return;
        if (/complete|paid|confirmed|done/i.test(e.status || '')) return;
        const diff = (typeof daysBetween === 'function') ? daysBetween(e.date) : null;
        if (diff === null || diff > 7) return;
        risks.push({
          id: 'calendar-due-' + (e.id || i),
          level: diff <= 2 ? 'warn' : 'info',
          title: (diff === 0 ? 'Today: ' : diff === 1 ? 'Tomorrow: ' : 'This week: ') + (e.title || 'Calendar item'),
          gentleTitle: 'Coming up: ' + (e.title || 'Calendar item'),
          note: 'Due ' + e.date + ' — confirm or update when handled.',
          gentleNote: 'A gentle reminder — update when you have a moment.',
          action: { label: 'Open calendar', onclick: "showPanel('calendar')" }
        });
      });
      return risks.slice(0, 2);
    }
  };

  UX_PAGES.timeline = {
    label: 'Day-of Timeline',
    nativeStats: true,
    stats(d){
      const rows = (d && d.timeline) || [];
      const total = rows.length;
      const timed = rows.filter(r => String(r.time || '').trim() && String(r.event || '').trim()).length;
      const vendorRows = (d && d.vtimeline) || [];
      return [
        { label: 'Day-of events', value: total },
        { label: 'Timed & named', value: timed },
        { label: 'Vendor arrivals', value: vendorRows.length },
        { label: 'Still open', value: Math.max(0, total - timed), tone: total > timed ? 'warning' : '' }
      ];
    },
    progress(d){
      const rows = (d && d.timeline) || [];
      const total = rows.length;
      const done = rows.filter(r => String(r.time || '').trim() && String(r.event || '').trim()).length;
      return { done, total, label: 'Timeline events ready', suffix: 'detailed' };
    },
    lifecycle(d){
      const rows = (d && d.timeline) || [];
      if (!rows.length) return 'empty';
      const total = rows.length;
      const done = rows.filter(r => String(r.time || '').trim() && String(r.event || '').trim()).length;
      if (total > 0 && done >= total) return 'complete';
      return 'filling';
    },
    related: [
      { panel: 'calendar', label: 'Smart Calendar' },
      { panel: 'vendors', label: 'Vendors' },
      { panel: 'dashboard', label: 'Dashboard' }
    ],
    empty: {
      icon: '⏱',
      title: 'Shape your wedding day flow',
      body: 'Build a minute-by-minute schedule for the big day. Vendor arrivals sync from your vendor list.',
      hint: 'Load the starter timeline for a complete day, then customize every moment.',
      primary: { label: 'Load starter timeline', fn: 'loadWdayTimelinePreset()' },
      secondary: { label: 'Add event', fn: 'addTimelineRow()' }
    },
    complete: {
      title: 'Your day-of timeline is complete',
      note: 'Every event has a time and name — share it with your coordinator.',
      action: { label: 'Open calendar', panel: 'calendar' }
    },
    risks(d){
      const risks = [];
      const weddingDate = d && d.setup && d.setup.date;
      const rows = (d && d.timeline) || [];
      if (weddingDate && typeof daysBetween === 'function') {
        const days = daysBetween(weddingDate);
        if (days !== null && days >= 0 && days <= 21 && rows.length < 5) {
          risks.push({
            id: 'timeline-sparse-date',
            level: 'info',
            title: 'Day-of timeline still taking shape',
            gentleTitle: 'Your day-of timeline has room to grow',
            note: 'Your wedding is ' + days + ' days away — add key moments when you are ready.',
            gentleNote: 'There is still time — build the timeline at your own pace.',
            action: { label: 'Load starter', onclick: 'loadWdayTimelinePreset()' }
          });
        }
      }
      return risks.slice(0, 1);
    }
  };

  UX_PAGES.tasks = {
    label: 'Planning Timeline',
    nativeStats: true,
    stats(d){
      const tasks = (d && d.tasks) || [];
      const total = tasks.length;
      const done = tasks.filter(t => t.status === 'Complete').length;
      const inProgress = tasks.filter(t => t.status === 'In Progress').length;
      const overdue = (typeof taskIsOverdue === 'function') ? tasks.filter(taskIsOverdue).length : 0;
      return [
        { label: 'Tasks tracked', value: total },
        { label: 'Complete', value: done },
        { label: 'In progress', value: inProgress },
        { label: 'Overdue', value: overdue, tone: overdue ? 'danger' : '' }
      ];
    },
    progress(d){
      const tasks = (d && d.tasks) || [];
      const total = tasks.length;
      const done = tasks.filter(t => t.status === 'Complete').length;
      return { done, total, label: 'Tasks complete', suffix: 'done' };
    },
    lifecycle(d){
      const tasks = (d && d.tasks) || [];
      if (!tasks.length) return 'empty';
      const total = tasks.length;
      const done = tasks.filter(t => t.status === 'Complete').length;
      if (total > 0 && done >= total) return 'complete';
      return 'filling';
    },
    related: [
      { panel: 'calendar', label: 'Calendar' },
      { panel: 'dashboard', label: 'Dashboard' }
    ],
    empty: {
      title: 'Your planning timeline starts here',
      body: 'Add tasks with due dates, or load a starter timeline. Tasks with dates appear on your Smart Calendar.',
      primary: { label: '+ Add task', fn: 'addTaskRow()' },
      secondary: { label: 'Load starter timeline', fn: 'loadTaskTimelinePreset()' }
    },
    complete: {
      title: 'Every task is complete',
      note: 'Beautiful work — enjoy the calm before the celebration.',
      action: { label: 'Open dashboard', panel: 'dashboard' }
    },
    risks(){
      return [];
    }
  };

  function uxRiskSortScore(r){
    const level = r.level || 'info';
    if (level === 'warn' || level === 'danger') return 0;
    if (level === 'info') return 1;
    return 2;
  }

  UX_PAGES.appointments = {
    label: 'Appointments',
    nativeStats: true,
    progress(d){
      const rows = (d && d.appointments) || [];
      const total = rows.length;
      const done = rows.filter(r => /complete|done|attended/i.test(r.status || '')).length;
      return { done, total, label: 'Appointments complete', suffix: 'finished' };
    },
    lifecycle(d){
      const rows = (d && d.appointments) || [];
      if (!rows.length) return 'empty';
      const total = rows.length;
      const done = rows.filter(r => /complete|done|attended/i.test(r.status || '')).length;
      if (total > 0 && done >= total) return 'complete';
      return 'filling';
    },
    related: [
      { panel: 'calendar', label: 'Smart Calendar' },
      { panel: 'vendors', label: 'Vendors' },
      { panel: 'tasks', label: 'Tasks' }
    ],
    empty: {
      icon: '📆',
      title: 'Track fittings and meetings',
      body: 'Add vendor appointments, tastings, and planning meetings. Dated entries flow into your Smart Calendar.',
      primary: { label: '+ Add appointment', fn: 'addAppointmentRow()' },
      secondary: { label: 'Open calendar', fn: "showPanel('calendar')" }
    },
    complete: {
      title: 'All appointments are complete',
      note: 'Every meeting on your list is marked finished.',
      action: { label: 'Open calendar →', panel: 'calendar' }
    },
    risks(d){
      const risks = [];
      const rows = (d && d.appointments) || [];
      const today = (typeof todayISO === 'function') ? todayISO() : '';
      rows.forEach((r, i) => {
        if (!r.date || r.date < today) return;
        if (/complete|cancelled|done|attended/i.test(r.status || '')) return;
        const diff = (typeof daysBetween === 'function') ? daysBetween(r.date) : null;
        if (diff === null || diff > 7) return;
        risks.push({
          id: 'appt-soon-' + (r._id || i),
          level: diff <= 2 ? 'warn' : 'info',
          title: (diff === 0 ? 'Today: ' : 'This week: ') + (r.title || r.vendor || 'Appointment'),
          gentleTitle: 'Upcoming: ' + (r.title || r.vendor || 'Appointment'),
          note: 'Scheduled ' + r.date + ' — confirm or update the status when done.',
          gentleNote: 'A gentle reminder about your upcoming appointment.',
          action: { label: 'Appointments', onclick: "showPanel('appointments')" }
        });
      });
      return risks.slice(0, 2);
    }
  };

  UX_PAGES.essentials = {
    label: 'Essentials Checklist',
    nativeStats: true,
    progress(d){
      const rows = (d && d.essentials) || [];
      const total = rows.length;
      const done = rows.filter(r => r.packed).length;
      return { done, total, label: 'Items packed', suffix: 'checked off' };
    },
    lifecycle(d){
      const rows = (d && d.essentials) || [];
      if (!rows.length) return 'empty';
      const total = rows.length;
      const done = rows.filter(r => r.packed).length;
      if (total > 0 && done >= total) return 'complete';
      return 'filling';
    },
    related: [
      { panel: 'timeline', label: 'Day-of Timeline' },
      { panel: 'tasks', label: 'Tasks' },
      { panel: 'dashboard', label: 'Dashboard' }
    ],
    empty: {
      icon: '🧳',
      title: 'Pack with peace of mind',
      body: 'Build your wedding-day essentials and emergency kit. Load the starter checklist or add your own items.',
      primary: { label: 'Load starter checklist', fn: 'loadEssentialsPreset()' },
      secondary: { label: '+ Add item', fn: 'addEssentialRow()' }
    },
    complete: {
      title: 'Every essential is packed',
      note: 'Your day-of kit is ready — one less thing to worry about.',
      action: { label: 'Open timeline →', panel: 'timeline' }
    },
    risks(){
      return [];
    }
  };

  UX_PAGES.party = {
    label: 'Wedding Party',
    nativeStats: true,
    progress(d){
      const rows = (d && d.party) || [];
      const total = rows.length;
      const done = rows.filter(r => String(r.status || '').trim()).length;
      return { done, total, label: 'Party details ready', suffix: 'with status set' };
    },
    lifecycle(d){
      const rows = (d && d.party) || [];
      if (!rows.length) return 'empty';
      const total = rows.length;
      const done = rows.filter(r => String(r.status || '').trim()).length;
      if (total > 0 && done >= total) return 'complete';
      return 'filling';
    },
    related: [
      { panel: 'guests', label: 'Guest List' },
      { panel: 'tables', label: 'Table Layout' },
      { panel: 'ceremony', label: 'Ceremony' }
    ],
    empty: {
      icon: '💐',
      title: 'Your wedding party starts here',
      body: 'Track bridesmaids, groomsmen, and helpers with roles, contacts, attire sizes, and order status.',
      primary: { label: '+ Add member', fn: 'addPartyRow()' },
      secondary: { label: 'Guest list', fn: "showPanel('guests')" }
    },
    complete: {
      title: 'Wedding party details are complete',
      note: 'Every member has a status — your party is ready for the big day.',
      action: { label: 'Open ceremony →', panel: 'ceremony' }
    },
    risks(){
      return [];
    }
  };

  function uxLogisticsRows(d){
    d = d || {};
    return ['weekendTimeline', 'travelAccommodations', 'hotelBlocks', 'transportation', 'vipCare']
      .flatMap(function(k){ return (d[k] || []); });
  }

  function uxEntertainmentRows(d){
    d = d || {};
    return (d.recSongs || []).concat(d.recMoments || [], d.speeches || [], d.mustPlay || [], d.receptionPlaylist || []);
  }

  UX_PAGES.ceremony = {
    label: 'Ceremony & Reception',
    nativeStats: true,
    progress(d){
      const order = (d && d.ceremonyOrder) || [];
      const checklist = (d && d.ceremonyChecklist) || [];
      const orderDone = order.filter(function(r){ return String(r.moment || '').trim(); }).length;
      const checkDone = checklist.filter(function(r){ return r.done; }).length;
      const total = order.length + checklist.length;
      const done = orderDone + checkDone;
      return { done, total, label: 'Ceremony planned', suffix: 'moments ready', emptyLabel: 'Load the starter order or add your first worship moment' };
    },
    lifecycle(d){
      const order = (d && d.ceremonyOrder) || [];
      const checklist = (d && d.ceremonyChecklist) || [];
      if (!order.length && !checklist.length) return 'empty';
      const orderDone = order.filter(function(r){ return String(r.moment || '').trim() && String(r.person || '').trim(); }).length;
      const checkDone = checklist.filter(function(r){ return r.done; }).length;
      if (order.length && orderDone >= order.length && (!checklist.length || checkDone >= checklist.length)) return 'complete';
      return 'filling';
    },
    related: [
      { panel: 'party', label: 'Wedding Party' },
      { panel: 'timeline', label: 'Day-of Timeline' },
      { panel: 'entertainment', label: 'Music & Speeches' }
    ],
    empty: {
      icon: '⛪',
      title: 'Shape your order of worship',
      body: 'Start with a pre-built ceremony flow, then customize vows, Scripture, and reception moments.',
      hint: 'Your processional and recessional sync with the wedding party list.',
      primary: { label: 'Load starter order', fn: 'loadCeremonyOrderPreset()' },
      secondary: { label: 'Wedding party', fn: "showPanel('party')" }
    },
    complete: {
      title: 'Ceremony flow is ready',
      note: 'Order of worship and checklist items are filled in — share the program with your officiant.',
      action: { label: 'Open timeline →', panel: 'timeline' }
    },
    sequencePreview(d){
      const order = ((d && d.ceremonyOrder) || []).filter(function(r){ return String(r.moment || '').trim(); }).slice(0, 5);
      if (order.length < 2) return '';
      return sequenceList(order.map(function(r){ return { label: r.moment }; }), { title: 'Order preview', compact: true });
    },
    hints: { qty: 'from your ceremony order and checklist' },
    risks(d){
      const checklist = (d && d.ceremonyChecklist) || [];
      const open = checklist.filter(function(r){ return !r.done && String(r.item || '').trim(); }).length;
      if (!open) return [];
      return [{
        id: 'ceremony-checklist-open',
        scope: 'digest',
        level: 'info',
        title: open + ' ceremony checklist item' + (open === 1 ? '' : 's') + ' still open',
        gentleTitle: 'Ceremony checklist has a few open items',
        note: 'Review vows, legal, and reception details before printing your program.',
        gentleNote: 'When you have a quiet moment, finish the remaining ceremony checklist items.',
        action: { label: 'Open ceremony', onclick: "showPanel('ceremony')" }
      }];
    }
  };

  UX_PAGES.contracts = {
    label: 'Contracts & Invoices',
    nativeStats: true,
    progress(d){
      const rows = (d && d.contracts) || [];
      const rentals = (d && d.rentals) || [];
      const signed = rows.filter(function(r){ return /signed|invoiced|paid/i.test(r.status || ''); }).length;
      const rentalDone = rentals.filter(function(r){ return String(r.pickup || '').trim() && String(r.ret || '').trim(); }).length;
      const total = rows.length + rentals.length;
      const done = signed + rentalDone;
      return { done, total, label: 'Documents tracked', suffix: 'settled or dated', emptyLabel: 'Add your first contract, invoice, or rental row' };
    },
    lifecycle(d){
      const rows = (d && d.contracts) || [];
      const rentals = (d && d.rentals) || [];
      if (!rows.length && !rentals.length) return 'empty';
      const pending = rows.filter(function(r){ return (r.status || 'Not Signed') === 'Not Signed'; }).length;
      if (rows.length && !pending && (!rentals.length || rentals.every(function(r){ return String(r.pickup || '').trim(); }))) return 'complete';
      return 'filling';
    },
    related: [
      { panel: 'payments', label: 'Payments' },
      { panel: 'vendors', label: 'Vendors' },
      { panel: 'budget', label: 'Budget' }
    ],
    empty: {
      icon: '📄',
      title: 'Keep every agreement in one place',
      body: 'Log contracts, invoices, and rental pickup dates — link them to vendors and payments.',
      primary: { label: '+ Add document', fn: 'addContractRow()' },
      secondary: { label: 'Vendors', fn: "showPanel('vendors')" }
    },
    complete: {
      title: 'Documents are organized',
      note: 'Contracts are signed and rental dates are captured.',
      action: { label: 'Review payments →', panel: 'payments' }
    },
    risks(d){
      const rows = (d && d.contracts) || [];
      const pending = rows.filter(function(r){ return (r.status || 'Not Signed') === 'Not Signed'; }).length;
      if (!pending) return [];
      return [{
        id: 'contracts-unsigned',
        level: pending > 2 ? 'warn' : 'info',
        title: pending + ' contract' + (pending === 1 ? '' : 's') + ' awaiting signature',
        gentleTitle: 'Some contracts still need signing',
        note: 'Unsigned agreements can delay vendors and payments.',
        gentleNote: 'When you are ready, follow up on the contracts still waiting for a signature.',
        action: { label: 'Open contracts', onclick: "showPanel('contracts')" }
      }];
    }
  };

  UX_PAGES.entertainment = {
    label: 'Entertainment',
    nativeStats: true,
    progress(d){
      const songs = (d && d.recSongs) || [];
      const moments = (d && d.recMoments) || [];
      const speeches = (d && d.speeches) || [];
      const done = songs.filter(function(r){ return String(r.song || '').trim(); }).length +
        moments.filter(function(r){ return String(r.moment || r.song || '').trim(); }).length +
        speeches.filter(function(r){ return String(r.speaker || r.name || '').trim(); }).length;
      const total = songs.length + moments.length + speeches.length;
      return { done, total, label: 'Music & moments', suffix: 'filled in', emptyLabel: 'Add ceremony songs, reception moments, or speeches' };
    },
    lifecycle(d){
      const total = uxEntertainmentRows(d).length;
      if (!total) return 'empty';
      const songs = (d && d.recSongs) || [];
      const speeches = (d && d.speeches) || [];
      const songsDone = songs.length && songs.every(function(r){ return String(r.song || '').trim(); });
      const speechesDone = !speeches.length || speeches.every(function(r){ return String(r.speaker || r.name || '').trim(); });
      if (songsDone && speechesDone) return 'complete';
      return 'filling';
    },
    related: [
      { panel: 'ceremony', label: 'Ceremony' },
      { panel: 'timeline', label: 'Timeline' },
      { panel: 'vendors', label: 'DJ / Band' }
    ],
    empty: {
      icon: '🎵',
      title: 'Plan the soundtrack of your day',
      body: 'Ceremony songs, first dances, reception moments, and speeches live here — your DJ or band can export from this list.',
      primary: { label: 'Load reception moments', fn: 'loadRecSongPreset()' },
      secondary: { label: 'Ceremony order', fn: "showPanel('ceremony')" }
    },
    complete: {
      title: 'Music and speeches are mapped',
      note: 'Ceremony and reception moments have songs and speakers assigned.',
      action: { label: 'Day-of timeline →', panel: 'timeline' }
    },
    risks(){
      return [];
    }
  };

  UX_PAGES.logistics = {
    label: 'Wedding Weekend Logistics',
    stats(d){
      const rows = uxLogisticsRows(d);
      const confirmed = rows.filter(function(r){ return /confirm|complete|booked/i.test(String(r.status || '')); }).length;
      const hotels = ((d && d.hotelBlocks) || []).length;
      const transport = ((d && d.transportation) || []).length;
      return [
        { label: 'Logistics rows', value: rows.length },
        { label: 'Confirmed', value: confirmed, tone: rows.length && confirmed < rows.length ? 'warning' : '' },
        { label: 'Hotel blocks', value: hotels },
        { label: 'Transport routes', value: transport }
      ];
    },
    progress(d){
      const rows = uxLogisticsRows(d);
      const done = rows.filter(function(r){
        if (/confirm|complete|booked/i.test(String(r.status || ''))) return true;
        const label = String(r.event || r.hotel || r.guest || r.person || r.pickup || '').trim();
        const detail = String(r.location || r.hotel || r.dropoff || r.roomBlock || '').trim();
        return !!(label && detail);
      }).length;
      return { done, total: rows.length, label: 'Weekend logistics', suffix: 'details filled', emptyLabel: 'Add rehearsal, travel, hotel blocks, or transportation' };
    },
    lifecycle(d){
      const rows = uxLogisticsRows(d);
      if (!rows.length) return 'empty';
      const done = rows.filter(function(r){ return /confirm|complete|booked/i.test(String(r.status || '')); }).length;
      if (rows.length && done >= rows.length) return 'complete';
      return 'filling';
    },
    related: [
      { panel: 'guests', label: 'Guest List' },
      { panel: 'calendar', label: 'Calendar' },
      { panel: 'budget', label: 'Budget' }
    ],
    empty: {
      icon: '🧳',
      title: 'Plan the full wedding weekend',
      body: 'Rehearsal dinner, welcome party, hotel blocks, and guest transportation sync with your calendar and budget.',
      primary: { label: 'Weekend timeline', fn: "logSetTab('weekend')" },
      secondary: { label: 'Travel & hotels', fn: "logSetTab('travel')" }
    },
    complete: {
      title: 'Weekend logistics are mapped',
      note: 'Travel, hotels, and transportation details are confirmed.',
      action: { label: 'Share packets →', panel: 'packets' }
    },
    risks(d){
      const risks = [];
      const hotels = (d && d.hotelBlocks) || [];
      hotels.forEach(function(h, i){
        const cutoff = String(h.cutoff || h.releaseDate || '').trim();
        if (!cutoff || typeof daysBetween !== 'function') return;
        const diff = daysBetween(cutoff);
        if (diff === null || diff < 0 || diff > 14) return;
        risks.push({
          id: 'hotel-cutoff-' + i,
          level: diff <= 3 ? 'warn' : 'info',
          title: 'Room block cutoff: ' + (h.hotel || h.blockName || 'Hotel block'),
          gentleTitle: 'Hotel room block cutoff is approaching',
          note: 'Release date ' + cutoff + ' — confirm remaining rooms with your hotel.',
          gentleNote: 'Your room block cutoff is coming up — a quick check-in with the hotel may help.',
          action: { label: 'Open logistics', onclick: "showPanel('logistics'); logSetTab('travel')" }
        });
      });
      return risks.slice(0, 2);
    }
  };

  UX_PAGES.honeymoon = {
    label: 'Honeymoon & After',
    nativeStats: true,
    progress(d){
      const packing = (d && d.packing) || [];
      const itinerary = (d && d.honeyItinerary) || [];
      const packed = packing.filter(function(r){ return r.packed || /packed/i.test(r.status || ''); }).length;
      const planned = itinerary.filter(function(r){ return String(r.plan || r.activity || '').trim(); }).length;
      const total = packing.length + itinerary.length;
      const done = packed + planned;
      return { done, total, label: 'Trip prepared', suffix: 'items ready', emptyLabel: 'Add itinerary days or load the packing checklist' };
    },
    lifecycle(d){
      const packing = (d && d.packing) || [];
      const itinerary = (d && d.honeyItinerary) || [];
      const details = (d && d.honeyDetails) || [];
      if (!packing.length && !itinerary.length && !details.length) return 'empty';
      const packDone = !packing.length || packing.every(function(r){ return r.packed || /packed/i.test(r.status || ''); });
      const itinDone = !itinerary.length || itinerary.every(function(r){ return String(r.plan || r.activity || '').trim(); });
      if (packDone && itinDone) return 'complete';
      return 'filling';
    },
    related: [
      { panel: 'budget', label: 'Budget' },
      { panel: 'gifts', label: 'Thank-you notes' },
      { panel: 'reflect', label: 'Homecoming' }
    ],
    empty: {
      icon: '✈️',
      title: 'Dream up your first adventure together',
      body: 'Itinerary, transport, packing, and after-wedding tasks live here — no rush until you are ready.',
      hint: 'Homecoming and name-change tasks stay low-pressure in Reflect.',
      primary: { label: 'Add itinerary row', fn: 'addHoneyItiRow()' },
      secondary: { label: 'Load packing list', fn: 'loadPackingPreset()' }
    },
    complete: {
      title: 'Honeymoon plans are in place',
      note: 'Itinerary and packing are ready — enjoy the trip and take homecoming at your pace.',
      action: { label: 'Open reflect →', panel: 'reflect' }
    },
    risks(){
      return [];
    }
  };

  UX_PAGES.gifts = {
    label: 'Gift Log',
    nativeStats: true,
    progress(d){
      const rows = (d && d.gifts) || [];
      const thanked = rows.filter(function(g){ return g.thankyou; }).length;
      return { done: thanked, total: rows.length, label: 'Thank-yous sent', suffix: 'noted', emptyLabel: 'Log gifts as they arrive — thank-you tracking starts here' };
    },
    lifecycle(d){
      const rows = (d && d.gifts) || [];
      if (!rows.length) return 'empty';
      if (rows.every(function(g){ return g.thankyou; })) return 'complete';
      return 'filling';
    },
    related: [
      { panel: 'guests', label: 'Guest List' },
      { panel: 'budget', label: 'Budget' },
      { panel: 'reflect', label: 'Homecoming' }
    ],
    empty: {
      icon: '🎁',
      title: 'Track gifts and gratitude',
      body: 'Each gift links to your guest list for thank-you notes and budget cash entries.',
      primary: { label: '+ Add gift', fn: 'addGiftRow()' },
      secondary: { label: 'Guest list', fn: "showPanel('guests')" }
    },
    complete: {
      title: 'Every gift has a thank-you noted',
      note: 'Your gratitude list is complete — beautiful finish to the celebration season.',
      action: { label: 'Homecoming →', panel: 'reflect' }
    },
    risks(d){
      const rows = (d && d.gifts) || [];
      const pending = rows.filter(function(g){ return !g.thankyou; }).length;
      if (!pending) return [];
      return [{
        id: 'gifts-thankyou-pending',
        scope: 'digest',
        level: 'info',
        title: pending + ' thank-you note' + (pending === 1 ? '' : 's') + ' still to send',
        gentleTitle: 'Some thank-you notes are still open',
        note: 'Write notes at your own pace — the gift log tracks who is covered.',
        gentleNote: 'When you feel ready, a few thank-you notes remain on your list.',
        action: { label: 'Open gift log', onclick: "showPanel('gifts')" }
      }];
    }
  };

  UX_PAGES.shotlist = {
    label: 'Photo Shot List',
    nativeStats: true,
    progress(d){
      const rows = (d && d.shotlist) || [];
      const done = rows.filter(function(r){
        return r.completed || /complete|done|got it|finished/i.test(String(r.status || ''));
      }).length;
      return { done, total: rows.length, label: 'Shots captured', suffix: 'planned or done', emptyLabel: 'Load the starter shot list or add your must-have moments' };
    },
    lifecycle(d){
      const rows = (d && d.shotlist) || [];
      if (!rows.length) return 'empty';
      const done = rows.filter(function(r){ return r.completed || /complete|done/i.test(String(r.status || '')); }).length;
      if (rows.length && done >= rows.length) return 'complete';
      return 'filling';
    },
    related: [
      { panel: 'vendors', label: 'Photographer' },
      { panel: 'timeline', label: 'Timeline' },
      { panel: 'party', label: 'Wedding Party' }
    ],
    empty: {
      icon: '📷',
      title: 'Give your photographer a clear shot list',
      body: 'Family formals, ceremony moments, and reception highlights — share this list with your vendor.',
      primary: { label: 'Load starter shots', fn: 'loadShotPreset()' },
      secondary: { label: 'Photographer vendor', fn: "showPanel('vendors')" }
    },
    complete: {
      title: 'Shot list is complete',
      note: 'Every planned shot is marked — your photographer has a clear run sheet.',
      action: { label: 'Timeline →', panel: 'timeline' }
    },
    risks(){
      return [];
    }
  };

  UX_PAGES.venue = {
    label: 'Venue',
    nativeStats: true,
    progress(d){
      const v = (d && d.venue) || {};
      const fields = ['c-name', 'c-address', 'r-name', 'r-address', 'c-capacity', 'r-capacity'];
      const done = fields.filter(function(f){ return String(v[f] || '').trim(); }).length;
      return { done, total: fields.length, label: 'Venue details', suffix: 'fields filled', emptyLabel: 'Add ceremony and reception venue details' };
    },
    lifecycle(d){
      const v = (d && d.venue) || {};
      const setup = (d && d.setup) || {};
      const hasName = String(v['c-name'] || setup['venue-ceremony'] || '').trim() || String(v['r-name'] || setup['venue-reception'] || '').trim();
      if (!hasName) return 'empty';
      const fields = ['c-name', 'c-address', 'r-name', 'r-address'];
      if (fields.every(function(f){ return String(v[f] || setup[f] || '').trim(); })) return 'complete';
      return 'filling';
    },
    related: [
      { panel: 'budget', label: 'Budget' },
      { panel: 'contracts', label: 'Contracts' },
      { panel: 'timeline', label: 'Timeline' }
    ],
    empty: {
      icon: '🏛️',
      title: 'Capture your ceremony and reception venues',
      body: 'Capacity, costs, and contacts flow into budget, contracts, and day-of logistics.',
      primary: { label: 'Edit venue details', fn: "venTab('details')" },
      secondary: { label: 'Wedding Setup', fn: "showPanel('setup')" }
    },
    complete: {
      title: 'Venue details are complete',
      note: 'Ceremony and reception locations are documented for vendors and guests.',
      action: { label: 'Contracts →', panel: 'contracts' }
    },
    risks(){
      return [];
    }
  };

  UX_PAGES.notes = {
    label: 'Notes',
    nativeStats: true,
    progress(d){
      ensureNotesDataForUx(d);
      const details = (d && d.notesDetails) || [];
      const longform = ['general', 'family', 'vendors', 'marriage'].filter(function(k){
        return String((d.notes && d.notes[k]) || '').trim();
      }).length;
      const done = details.filter(function(n){ return String(n.title || n.body || n.text || '').trim(); }).length + longform;
      const total = details.length + 4;
      return { done, total, label: 'Notes captured', suffix: 'saved', emptyLabel: 'Jot ideas, vendor conversations, or family notes' };
    },
    lifecycle(d){
      ensureNotesDataForUx(d);
      const details = (d && d.notesDetails) || [];
      const hasLong = ['general', 'family', 'vendors', 'marriage'].some(function(k){
        return String((d.notes && d.notes[k]) || '').trim();
      });
      if (!details.length && !hasLong) return 'empty';
      return 'filling';
    },
    related: [
      { panel: 'vendors', label: 'Vendors' },
      { panel: 'tasks', label: 'Tasks' },
      { panel: 'mood', label: 'Vision Board' }
    ],
    empty: {
      icon: '📝',
      title: 'A place for every planning thought',
      body: 'Vendor call notes, family preferences, and marriage reflections — searchable and pinned when important.',
      primary: { label: '+ Add note', fn: 'addNotesDetailRow()' },
      secondary: { label: 'Vision board', fn: "showPanel('mood')" }
    },
    complete: {
      title: 'Notes are organized',
      note: 'Your planning notebook is up to date.',
      action: { label: 'Tasks →', panel: 'tasks' }
    },
    risks(){
      return [];
    }
  };

  UX_PAGES.mood = {
    label: 'Vision Board',
    nativeStats: true,
    progress(d){
      const items = (d && d.moodItems) || [];
      const photos = (d && d.moodPhotos) || [];
      const done = items.filter(function(r){ return String(r.item || r.name || r.section || '').trim(); }).length +
        photos.filter(function(p){ return String(p.src || p.url || p.name || '').trim(); }).length;
      const total = items.length + photos.length;
      return { done, total, label: 'Vision captured', suffix: 'items saved', emptyLabel: 'Add inspiration photos, colors, or mood details' };
    },
    lifecycle(d){
      const items = ((d && d.moodItems) || []).length;
      const photos = ((d && d.moodPhotos) || []).length;
      if (!items && !photos) return 'empty';
      if (items >= 3 || photos >= 2) return 'complete';
      return 'filling';
    },
    related: [
      { panel: 'setup', label: 'Theme & Colors' },
      { panel: 'venue', label: 'Venue' },
      { panel: 'catering', label: 'Catering' }
    ],
    empty: {
      icon: '🎨',
      title: 'Collect the look you are dreaming of',
      body: 'Palette, florals, attire, and reception vibe — share this board with vendors.',
      primary: { label: 'Add vision item', fn: 'addMoodItem()' },
      secondary: { label: 'Profile & theme', fn: 'openProfileDrawer()' }
    },
    complete: {
      title: 'Your vision board is taking shape',
      note: 'Inspiration is saved — vendors can align to your palette and style.',
      action: { label: 'Venue →', panel: 'venue' }
    },
    risks(){
      return [];
    }
  };

  function ensureNotesDataForUx(d){
    if (!d) return;
    if (!d.notes || typeof d.notes !== 'object') d.notes = { general: '', family: '', vendors: '', marriage: '' };
    if (!Array.isArray(d.notesDetails)) d.notesDetails = [];
  }

  global.UX_PAGES = UX_PAGES;

  function pageLifecycle(panelId, d){
    d = d || uxData();
    const cfg = UX_PAGES[panelId];
    if (cfg && typeof cfg.lifecycle === 'function') return cfg.lifecycle(d);
    return 'filling';
  }
  global.pageLifecycle = pageLifecycle;

  function uxAllRisks(d){
    d = d || uxData();
    const seen = new Set();
    const rows = Object.keys(UX_PAGES).flatMap(panelId => {
      const cfg = UX_PAGES[panelId];
      if (!cfg || typeof cfg.risks !== 'function') return [];
      try {
        return cfg.risks(d).map(r => ({ ...r, panelId, panelLabel: cfg.label || panelId }));
      } catch (e) {
        return [];
      }
    }).filter(r => {
      if (!r || !r.id || seen.has(r.id)) return false;
      seen.add(r.id);
      return true;
    });
    rows.sort((a, b) => uxRiskSortScore(a) - uxRiskSortScore(b));
    return rows;
  }
  global.uxAllRisks = uxAllRisks;

  function uxPlanningHealthDigest(limit){
    const risks = uxAllRisks().filter(Boolean).slice(0, limit || 5);
    const gentle = uxIsGentle();
    const rows = risks.map((r, i) => {
      const action = r.action && r.action.onclick ? r.action.onclick : "showPanel('" + (r.panelId || 'dashboard') + "')";
      const title = gentle && r.gentleTitle ? r.gentleTitle : r.title;
      const note = gentle && r.gentleNote ? r.gentleNote : r.note;
      const source = r.panelLabel ? '<span class="ux-health-row__src">' + uxEsc(r.panelLabel) + '</span>' : '';
      return '<button type="button" class="ux-health-row ux-health-row--' + uxEsc(r.level || 'info') + '" onclick="' + action + '">' +
        '<span class="ux-health-row__num">' + String(i + 1).padStart(2, '0') + '</span>' +
        '<span>' + source + '<strong>' + uxEsc(title || 'Review planner item') + '</strong>' +
        '<small>' + uxEsc(note || 'Open the linked page for details.') + '</small></span>' +
      '</button>';
    }).join('');
    const caption = typeof uedCaption === 'function'
      ? uedCaption('shield', 'Planning Health', risks.length + ' live item' + (risks.length === 1 ? '' : 's'))
      : '<div class="ued-caption"><span class="ued-caption-left"><strong>Planning Health</strong></span><span class="ued-tag">' + risks.length + ' live item' + (risks.length === 1 ? '' : 's') + '</span></div>';
    const emptyCopy = gentle
      ? 'No urgent items right now. Your planner looks calm — take a breath and enjoy the journey.'
      : 'No UX health warnings right now. Your connected planner data is calm.';
    return '<article class="ued-panel span6 ux-health-digest" data-dash-card="planning-health">' +
      caption +
      (rows || '<div class="ux-health-empty">' + uxEsc(emptyCopy) + '</div>') +
    '</article>';
  }
  global.uxPlanningHealthDigest = uxPlanningHealthDigest;

  function uxPanelAnchor(panelId){
    const panel = document.getElementById('panel-' + panelId);
    if (!panel) return null;
    const statAnchors = [
      '#dash-v4-root header.ued-mast',
      '#budget-stats', '#payment-stats', '#vendor-stats', '#guest-stats',
      '#task-stats', '#wday-stats', '#ceremony-stats', '#gift-stats',
      '#catering-stats', '#party-stats', '#table-layout-stats',
      '#shotlist-stat-grid', '#notes-stat-grid', '#essentials-stats',
      '.contracts-stat-grid', '.hm-stat-grid',
      '#panel-entertainment > .m-stats', '#panel-venue > .m-stats'
    ];
    for (let i = 0; i < statAnchors.length; i++) {
      const el = panel.querySelector(statAnchors[i]);
      if (el) return el;
    }
    return panel.querySelector(
      ':scope > .ued-page > header.ued-mast, :scope > .ued-page > .ued-mast, :scope > header.ued-mast, :scope > .tasks-title-wrap, :scope > .ceremony-title-wrap, :scope > .ent-title-wrap, :scope > .hm-title-wrap, :scope > .venue-title-wrap, :scope > .shotlist-title-wrap, :scope > .notes-title-wrap, :scope > .party-title-wrap, :scope > .smart-page-title-wrap, :scope > .contracts-hero, :scope > .mood-title-wrap, :scope > .cat-title-wrap, :scope > .log-tabs'
    );
  }

  function uxRestorePanelDom(panelId){
    const panel = document.getElementById('panel-' + panelId);
    if (!panel) return;
    const wrap = document.getElementById('ux-body-' + panelId);
    if (wrap && wrap.parentElement) {
      const parent = wrap.parentElement;
      while (wrap.firstChild) parent.insertBefore(wrap.firstChild, wrap);
      wrap.remove();
    }
    panel.querySelectorAll('.ux-panel-skeleton').forEach(function(sk){
      if (sk.parentElement !== panel) panel.appendChild(sk);
      sk.classList.add('ux-panel-skeleton--hidden');
    });
    panel.querySelectorAll('.ux-panel-loading').forEach(function(el){
      el.classList.remove('ux-panel-loading');
    });
    panel.classList.remove('ux-panel-loading', 'ux-panel-empty');
  }
  global.uxRestorePanelDom = uxRestorePanelDom;

  function uxSetPanelEmptyState(panelId, isEmpty, cfg){
    const panel = document.getElementById('panel-' + panelId);
    if (!panel) return;
    if (isEmpty && !(cfg && cfg.skipBodyHide)) panel.classList.add('ux-panel-empty');
    else panel.classList.remove('ux-panel-empty');
  }

  function uxEnsureChromeHost(panelId){
    const panel = document.getElementById('panel-' + panelId);
    if (!panel) return null;
    let host = document.getElementById('ux-chrome-' + panelId);
    if (host && !host.isConnected) host = null;
    if (host) return host;
    host = document.createElement('div');
    host.id = 'ux-chrome-' + panelId;
    host.className = 'ux-page-chrome';
    const anchor = uxPanelAnchor(panelId);
    if (anchor && anchor.isConnected) anchor.insertAdjacentElement('afterend', host);
    else panel.prepend(host);
    return host;
  }

  function renderPageUxChrome(panelId){
    const cfg = UX_PAGES[panelId];
    if (!cfg) return;
    uxRestorePanelDom(panelId);
    const host = uxEnsureChromeHost(panelId);
    if (!host) return;
    const d = uxData();
    const state = pageLifecycle(panelId, d);
    const parts = [];

    if (state === 'empty' && cfg.empty) {
      const e = cfg.empty;
      parts.push(emptyState({
        icon: e.icon || '👥',
        title: e.title,
        body: e.body,
        hint: e.hint,
        primary: e.primary ? { label: e.primary.label, fn: e.primary.fn || e.primary.onclick } : null,
        secondary: e.secondary ? { label: e.secondary.label, fn: e.secondary.fn || e.secondary.onclick } : null
      }));
    } else {
      if (!cfg.nativeStats && typeof cfg.stats === 'function') {
        const stats = cfg.stats(d);
        if (stats && stats.length) parts.push(statBand(stats));
      }
      if (typeof cfg.progress === 'function') {
        const p = cfg.progress(d);
        if (p && (p.total > 0 || p.emptyLabel)) parts.push(goalBar(p));
      }
      if (cfg.hints && cfg.hints.qty && state === 'filling') {
        parts.push(smartHint('Counts update automatically ' + cfg.hints.qty));
      }
      if (typeof cfg.risks === 'function') {
        cfg.risks(d).filter(r => r.scope !== 'digest').forEach(r => parts.push(riskBanner(r)));
      }
      if (state === 'complete' && cfg.complete) {
        const c = cfg.complete;
        parts.push(celebrate({
          title: c.title,
          note: c.note,
          action: c.action ? {
            label: c.action.label,
            onclick: c.action.onclick || (c.action.panel ? "showPanel('" + String(c.action.panel).replace(/'/g, "\\'") + "')" : '')
          } : null
        }));
      }
      if (typeof cfg.sequencePreview === 'function') {
        const seq = cfg.sequencePreview(d);
        if (seq) parts.push(seq);
      }
      if (cfg.related) parts.push(relatedNote(cfg.related));
    }

    host.innerHTML = parts.join('');
    uxSetPanelEmptyState(panelId, state === 'empty', cfg);
  }
  global.renderPageUxChrome = renderPageUxChrome;

  /* ---------- Phase E: panel skeleton + reveal ---------- */

  function uxEnsurePanelSkeleton(panel){
    let sk = panel.querySelector(':scope > .ux-panel-skeleton');
    if (!sk) {
      const buried = panel.querySelector('.ux-panel-skeleton');
      if (buried) {
        panel.appendChild(buried);
        sk = buried;
      }
    }
    if (!sk) {
      sk = document.createElement('div');
      sk.className = 'ux-panel-skeleton';
      sk.setAttribute('aria-hidden', 'true');
      sk.innerHTML =
        '<div class="ux-skeleton-stats">' +
          '<div class="ux-skeleton-bar ux-skeleton-bar--stat"></div>' +
          '<div class="ux-skeleton-bar ux-skeleton-bar--stat"></div>' +
          '<div class="ux-skeleton-bar ux-skeleton-bar--stat"></div>' +
          '<div class="ux-skeleton-bar ux-skeleton-bar--stat"></div>' +
        '</div>' +
        '<div class="ux-skeleton-bar ux-skeleton-bar--wide"></div>' +
        '<div class="ux-skeleton-bar ux-skeleton-bar--medium"></div>' +
        '<div class="ux-skeleton-bar ux-skeleton-bar--medium"></div>';
      panel.appendChild(sk);
    }
    return sk;
  }

  function uxShowPanelSkeleton(panelId){
    const panel = document.getElementById('panel-' + panelId);
    if (!panel) return;
    uxRestorePanelDom(panelId);
    const sk = uxEnsurePanelSkeleton(panel);
    sk.classList.remove('ux-panel-skeleton--hidden');
    panel.classList.add('ux-panel-loading');
  }
  global.uxShowPanelSkeleton = uxShowPanelSkeleton;

  function uxRevealPanel(panelId){
    const panel = document.getElementById('panel-' + panelId);
    if (!panel) return;
    panel.querySelectorAll('.ux-panel-skeleton').forEach(function(sk){
      sk.classList.add('ux-panel-skeleton--hidden');
    });
    panel.classList.remove('ux-panel-loading');
    panel.querySelectorAll('.ux-panel-loading').forEach(function(el){
      el.classList.remove('ux-panel-loading');
    });
    const page = panel.querySelector(':scope > .ued-page') || panel.querySelector('.ued-page');
    if (page) {
      page.classList.remove('ux-panel-loading');
      page.classList.add('ux-panel-enter');
      setTimeout(function(){ page.classList.remove('ux-panel-enter'); }, 420);
    }
  }
  global.uxRevealPanel = uxRevealPanel;

})(typeof window !== 'undefined' ? window : globalThis);
