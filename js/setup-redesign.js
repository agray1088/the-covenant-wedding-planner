/* Wedding Setup — Master s35 · 15a (+ 11c earlier drawing)
   The page every other page reads. Not a record table — a form: eleven facts,
   each naming what it feeds, plus menu visibility and the danger zone.

   Additive: every setup input keeps its id and saveSetup() handler. This file
   relocates chrome into the Master layout — pagehead, stat strip, view switcher,
   feeds captions, menu-visibility presets, danger zone, and the Setup-field
   drawer (Field · Impact · History) for the wedding date. */
(function () {
  'use strict';

  window._setupDrawerTab = window._setupDrawerTab || 0;
  window._setupView = window._setupView || 'current';

  const SHELL_VER = 'setup-rd-s35e';
  const SETUP_TRACKED = [
    's-bride', 's-groom', 's-church', 's-date', 's-venue-ceremony', 's-venue-reception',
    's-timezone', 's-budget', 's-currency', 's-guests', 's-locale', 's-colors', 's-dateformat'
  ];
  const HIDDEN_FIELD_IDS = [
    's-pastor', 's-engaged', 's-style', 's-verse', 's-mission', 's-locale', 's-dateformat', 's-colors'
  ];
  const GRID_SECTIONS = [
    {
      id: 'the-couple', title: 'The couple',
      fields: [
        { id: 's-bride', label: 'Bride' },
        { id: 's-groom', label: 'Groom' },
        { id: 's-church', label: 'Home church' }
      ],
      display: ['shown-as']
    },
    {
      id: 'the-day', title: 'The day',
      fields: [
        { id: 's-date', label: 'Wedding date' },
        { id: 's-venue-ceremony', label: 'Ceremony', timeKey: 'ceremony' },
        { id: 's-venue-reception', label: 'Reception', timeKey: 'reception' },
        { id: 's-timezone', label: 'Time zone' }
      ]
    },
    {
      id: 'money', title: 'Money',
      fields: [
        { id: 's-budget', label: 'Budget target' },
        { id: 's-currency', label: 'Currency' }
      ],
      display: ['gratuity-policy']
    },
    {
      id: 'guests', title: 'Guests & seating',
      fields: [{ id: 's-guests', label: 'Target guest count' }],
      display: ['seats-available', 'adult-child-rate', 'rsvp-deadline']
    },
    {
      id: 'print', title: 'Print & sharing',
      display: ['paper-size', 'keepsake-accent', 'share-expiry']
    },
    {
      id: 'device', title: 'This device', photo: true,
      display: ['storage', 'last-backup', 'weekly-backup']
    }
  ];
  const DRAWER_TABS = ['Field', 'Impact', 'History'];
  const MENU_PRESETS = [
    ['all', 'Show all pages', 'setAllMenuPagesVisible'],
    ['advanced', 'Hide advanced pages', 'applySimpleMenuPreset'],
    ['essentials', 'Focus on essentials', 'applyEssentialsMenuPreset'],
    ['planning', 'Planning core', 'applyPlanningCoreMenuPreset'],
    ['guests', 'Guests & seating', 'applyGuestsMenuPreset'],
    ['money', 'Money', 'applyMoneyMenuPreset'],
    ['weekend', 'Wedding weekend', 'applyWeekendMenuPreset']
  ];

  const FEEDS = {
    's-bride': 'Guest List · Print Centre · every keepsake',
    's-groom': 'Guest List · Print Centre · every keepsake',
    's-church': 'Vision & Foundation · Counseling',
    'shown-as': 'Top bar · invitations · share packets',
    's-date': 'Countdown · every task due date · the calendar',
    's-venue-ceremony': 'Ceremony & Reception · Timeline',
    's-venue-reception': 'Ceremony & Reception · Timeline',
    's-timezone': 'Calendar · reminders · smart create',
    's-budget': 'Budget · Dashboard · every spend bar',
    's-currency': 'Every money column in the planner',
    'gratuity-policy': 'Budget · Payments · Vendors',
    's-guests': 'Guest List · catering estimates · alerts',
    'seats-available': 'Table Layout · catering headcount',
    'adult-child-rate': 'Catering & Menu · headcount cost',
    'rsvp-deadline': 'Guest List reminders · Email Templates',
    'paper-size': 'Print Centre · every printable',
    'keepsake-accent': 'Class B keepsakes',
    'share-expiry': 'Share Packets',
    storage: 'Database Hub',
    'last-backup': 'Database Hub · Get Started',
    'weekly-backup': 'Dashboard alert'
  };

  const esc = s => (typeof escapeHtml === 'function'
    ? escapeHtml(s == null ? '' : String(s))
    : String(s == null ? '' : s).replace(/[&<>"']/g, ch => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[ch])));

  function store() {
    if (typeof getCovenantPlannerData === 'function') return getCovenantPlannerData();
    try { if (typeof data !== 'undefined') return data; } catch (e) { /* lexical */ }
    if (!window.data) window.data = {};
    return window.data;
  }
  function saveNow() { if (typeof save === 'function') save(); }

  function moneyFmt(n) {
    const v = Math.round(parseFloat(n) || 0);
    if (typeof fmtMoney === 'function') { try { return fmtMoney(v); } catch (e) { /* fall */ } }
    return '$' + v.toLocaleString();
  }

  function timelineTime(kw) {
    const tl = Array.isArray(store().timeline) ? store().timeline : [];
    const e = tl.find(r => String(r.event || '').toLowerCase().includes(kw));
    return e && e.time ? String(e.time).trim() : '';
  }

  function dhFigures() {
    const d = store();
    let records = 0;
    let dbMb = '0.1';
    const keys = ['guests', 'tasks', 'payments', 'vendors', 'budget', 'gifts', 'contracts', 'appointments',
      'tables', 'counseling', 'packets', 'notes', 'contacts'];
    keys.forEach(k => { if (Array.isArray(d[k])) records += d[k].length; });
    try {
      const blob = JSON.stringify(d);
      dbMb = (blob.length / 1024 / 1024).toFixed(1);
      if (dbMb === '0.0') dbMb = '0.1';
    } catch (e) { /* soft */ }
    let lastBackup = 'Never';
    let backupDays = null;
    try {
      const ob = (typeof getOnboarding === 'function' ? getOnboarding() : null) ||
        d._onboarding || {};
      if (ob.lastBackupTime) {
        backupDays = Math.round((Date.now() - new Date(ob.lastBackupTime).getTime()) / 86400000);
        if (backupDays <= 0) lastBackup = 'Today';
        else if (backupDays === 1) lastBackup = 'Yesterday';
        else lastBackup = backupDays + ' days ago';
      }
    } catch (e) { /* soft */ }
    return { records, dbMb, lastBackup, backupDays };
  }

  function setupFigures() {
    const d = store();
    const s = d.setup || {};
    const bride = String(s.bride || '').trim();
    const groom = String(s.groom || '').trim();
    const shownAs = [bride, groom].filter(Boolean).join(' & ') || '—';
    const cTime = timelineTime('ceremony') || String(s.ceremonyTime || '').trim();
    const rTime = timelineTime('reception') || String(s.receptionTime || '').trim();
    const ceremonyVenue = String(s['venue-ceremony'] || '').trim();
    const receptionVenue = String(s['venue-reception'] || '').trim();
    const ceremony = [ceremonyVenue, cTime].filter(Boolean).join(' · ') || '—';
    const reception = [receptionVenue, rTime].filter(Boolean).join(' · ') || '—';
    const tzEl = document.getElementById('s-timezone');
    const tzDisplay = tzEl && tzEl.selectedIndex > 0
      ? tzEl.options[tzEl.selectedIndex].text.replace(/^\([^)]+\)\s*/, '').trim()
      : (String(s.timezone || '').trim() || '—');
    const adult = parseFloat(s.costAdult) || 0;
    const child = parseFloat(s.costChild) || 0;
    const adultChild = (adult || child)
      ? moneyFmt(adult).replace(/\.\d+$/, '') + ' / ' + moneyFmt(child).replace(/\.\d+$/, '')
      : '—';
    let rsvpLabel = 'Not set';
    if (typeof getRsvpDeadlineInfo === 'function') {
      const info = getRsvpDeadlineInfo();
      if (info && info.date) {
        rsvpLabel = typeof fmtDate === 'function' ? fmtDate(info.date) : String(info.date).slice(0, 10);
      }
    } else if (s.rsvpDeadline) {
      rsvpLabel = s.rsvpDeadline;
    }
    const locale = String(s.locale || document.getElementById('s-locale')?.value || 'en-US');
    const paperSize = /GB|AU|NZ|IE|ZA|FR|DE|ES|IT|PT|NL|SE|JP|KR/.test(locale)
      ? 'A4 · Letter aware' : 'Letter · A4 aware';
    const keepsake = String(s.colors || '').trim() || '—';
    let shareExpiry = 'Not set';
    const packets = Array.isArray(d.packets) ? d.packets : [];
    const expiring = packets.filter(p => p.expires && !/expir|revok/i.test(String(p.status || '')));
    if (expiring.length) {
      const days = expiring.map(p => {
        const ms = new Date(String(p.expires).slice(0, 10) + 'T00:00:00').getTime() - Date.now();
        return Math.max(0, Math.ceil(ms / 86400000));
      }).sort((a, b) => a - b);
      if (days[0] != null) shareExpiry = days[0] + ' day' + (days[0] === 1 ? '' : 's');
    } else if (s.shareExpiryDays) {
      shareExpiry = s.shareExpiryDays + ' days';
    }
    const dh = dhFigures();
    const guestTarget = String(s.guests || '').trim();
    const guestDisplay = guestTarget ? (guestTarget + ' invited') : '—';
    const earlier = window._setupView === 'earlier';
    return {
      shownAs, ceremony, reception, tzDisplay, adultChild, rsvpLabel, paperSize, keepsake, shareExpiry,
      guestDisplay, dh,
      gratuityPolicy: 'Tracked separately',
      seatsAvailable: seatCount()
    };
  }

  /* ── pagehead (Master 15a) ───────────────────────────────────────────── */

  function ensurePagehead() {
    const panel = document.getElementById('panel-setup');
    if (!panel) return;
    let head = panel.querySelector('.rd-setup-pagehead');
    if (!head) {
      head = document.createElement('div');
      head.className = 'rd-pagehead rd-setup-pagehead';
      panel.insertBefore(head, panel.firstChild);
    }
    head.innerHTML =
      '<div><div class="rd-pagehead__eyebrow">Overview · start planning</div>' +
      '<div class="rd-pagehead__title-row"><h1 class="rd-pagehead__title">Wedding Setup</h1></div></div>' +
      '<div class="rd-pagehead__actions rd-setup-actions">' +
      '<button type="button" class="rd-btn rd-btn--quiet" onclick="rdSetupResetDefaults()">Reset to defaults</button>' +
      '<button type="button" class="rd-btn" onclick="typeof printActivePanel===\'function\'&&printActivePanel()">Print section</button>' +
      '<button type="button" class="rd-btn" onclick="rdSetupFullEditor()">Full editor</button>' +
      '<button type="button" class="rd-btn" onclick="rdSetupExport()">Export settings</button>' +
      '<button type="button" class="rd-btn rd-btn--primary" onclick="rdSetupSave()">Save changes</button>' +
      '</div>';
    let vs = panel.querySelector('#rd-setup-viewswitch');
    if (!vs) {
      vs = document.createElement('div');
      vs.id = 'rd-setup-viewswitch';
      vs.className = 'rd-setup-viewswitch';
      head.insertAdjacentElement('afterend', vs);
    }
    const v = window._setupView || 'current';
    vs.innerHTML =
      '<div class="rd-viewswitch" role="group" aria-label="Setup drawing">' +
      '<button type="button" class="rd-viewswitch__item' + (v === 'current' ? ' is-active' : '') +
      '" onclick="rdSetupSetView(\'current\')">Wedding Setup</button>' +
      '<button type="button" class="rd-viewswitch__item' + (v === 'earlier' ? ' is-active' : '') +
      '" onclick="rdSetupSetView(\'earlier\')">earlier drawing</button></div>';
  }

  /* ── stat strip — 15a (five figures) vs 11c (earlier drawing) ─────────── */

  function seatCount() {
    const d = store();
    if (!Array.isArray(d.tables)) return '—';
    let n = 0;
    d.tables.forEach(t => { n += parseInt(t.seats || t.capacity || 0, 10) || 0; });
    return n > 0 ? String(n) : '—';
  }
  function shortDate(raw) {
    if (!raw) return '—';
    const dt = new Date(String(raw).trim() + 'T00:00:00');
    if (Number.isNaN(dt.getTime())) return raw;
    return dt.toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' });
  }

  function ensureStatStrip() {
    const panel = document.getElementById('panel-setup');
    if (!panel) return;
    let strip = panel.querySelector('.rd-setup-statstrip');
    const legacy = panel.querySelector('.m-stats');
    const earlier = window._setupView === 'earlier';
    if (!strip) {
      strip = document.createElement('div');
      strip.className = 'rd-setup-statstrip';
      const anchor = panel.querySelector('#rd-setup-viewswitch') || panel.querySelector('.rd-setup-pagehead');
      if (anchor) anchor.insertAdjacentElement('afterend', strip);
      else panel.insertBefore(strip, panel.firstChild);
    }
    if (legacy) legacy.classList.add('rd-setup-legacy-hide');

    const s = (store().setup) || {};
    const days = document.getElementById('setup-stat-days')?.textContent || '—';
    const d = store();
    const taskDone = Array.isArray(d.tasks) ? d.tasks.filter(t => t.status === 'Complete').length : 0;
    const taskTotal = Array.isArray(d.tasks) ? d.tasks.length : 0;
    if (earlier) {
      strip.innerHTML =
        '<div class="rd-setup-stat"><span class="rd-setup-stat__k">Days to go</span>' +
        '<span class="rd-setup-stat__v">' + esc(days) + '</span></div>' +
        '<div class="rd-setup-stat"><span class="rd-setup-stat__k">Wedding date</span>' +
        '<span class="rd-setup-stat__v">' + esc(shortDate(s.date)) + '</span></div>' +
        '<div class="rd-setup-stat"><span class="rd-setup-stat__k">Budget target</span>' +
        '<span class="rd-setup-stat__v">' + esc(parseFloat(s.budget) > 0 ? moneyFmt(s.budget) : '—') + '</span></div>' +
        '<div class="rd-setup-stat"><span class="rd-setup-stat__k">Guest cap</span>' +
        '<span class="rd-setup-stat__v">' + esc(s.guests || '—') + '</span></div>' +
        '<div class="rd-setup-stat"><span class="rd-setup-stat__k">Seats</span>' +
        '<span class="rd-setup-stat__v">' + esc(seatCount()) + '</span></div>';
    } else {
      strip.innerHTML =
        '<div class="rd-setup-stat"><span class="rd-setup-stat__k">Days to wedding</span>' +
        '<span class="rd-setup-stat__v">' + esc(days) + '</span></div>' +
        '<div class="rd-setup-stat"><span class="rd-setup-stat__k">Tasks complete</span>' +
        '<span class="rd-setup-stat__v">' + esc(taskTotal ? (taskDone + ' of ' + taskTotal) : taskDone) + '</span></div>' +
        '<div class="rd-setup-stat"><span class="rd-setup-stat__k">Vendors booked</span>' +
        '<span class="rd-setup-stat__v">' + esc(document.getElementById('setup-stat-vendors')?.textContent || '0') + '</span></div>' +
        '<div class="rd-setup-stat"><span class="rd-setup-stat__k">Guests invited</span>' +
        '<span class="rd-setup-stat__v">' + esc(document.getElementById('setup-stat-guests')?.textContent || '0') + '</span></div>' +
        '<div class="rd-setup-stat"><span class="rd-setup-stat__k">Budget target</span>' +
        '<span class="rd-setup-stat__v">' + esc(parseFloat(s.budget) > 0 ? moneyFmt(s.budget) : '—') + '</span></div>';
    }
  }

  /* ── form grid (Master 15a / 11c — rd-setup-grid section bands) ─────── */

  function convertSetupField(inputId, labelOverride) {
    const input = document.getElementById(inputId);
    if (!input) return null;
    let mField = input.closest('.m-field');
    if (!mField) mField = input.parentElement;
    if (!mField) return null;
    let row = mField.closest('.rd-setup-field');
    if (row) {
      if (labelOverride) {
        const lab = row.querySelector('.rd-setup-field__label');
        if (lab) lab.textContent = labelOverride;
      }
      return row;
    }
    const labelText = labelOverride ||
      (mField.querySelector('label') ? mField.querySelector('label').textContent.replace(/:$/, '').trim() : inputId);
    const labelEl = mField.querySelector('label');
    if (labelEl) labelEl.remove();
    row = document.createElement('div');
    row.className = 'rd-setup-field';
    row.dataset.fieldId = inputId;
    row.innerHTML =
      '<span class="rd-setup-field__label">' + esc(labelText) + '</span>' +
      '<div class="rd-setup-field__control"></div>';
    const control = row.querySelector('.rd-setup-field__control');
    while (mField.firstChild) control.appendChild(mField.firstChild);
    mField.replaceWith(row);
    return row;
  }

  function feedsHtml(key) {
    const text = FEEDS[key];
    if (!text) return '';
    return '<div class="rd-setup-feeds"><span class="rd-setup-feeds__k">Feeds</span> ' + esc(text) + '</div>';
  }

  function displayFieldRow(key, label, value) {
    return '<div class="rd-setup-field rd-setup-field--display" data-display-key="' + esc(key) + '">' +
      '<span class="rd-setup-field__label">' + esc(label) + '</span>' +
      '<div class="rd-setup-field__control">' +
      '<div class="rd-setup-display-val">' + esc(value) + '</div>' +
      feedsHtml(key) +
      '</div></div>';
  }

  function ensureHiddenFieldPocket(panel) {
    let pocket = panel.querySelector('#rd-setup-hidden-fields');
    if (!pocket) {
      pocket = document.createElement('div');
      pocket.id = 'rd-setup-hidden-fields';
      pocket.className = 'rd-setup-legacy-hide';
      panel.appendChild(pocket);
    }
    HIDDEN_FIELD_IDS.forEach(fid => {
      const input = document.getElementById(fid);
      if (!input || pocket.contains(input)) return;
      const wrap = input.closest('.m-field') || input.closest('.rd-setup-field');
      if (wrap && !pocket.contains(wrap)) pocket.appendChild(wrap);
    });
    panel.querySelectorAll('.m-block').forEach(block => {
      if (block.querySelector('#s-verse') || block.querySelector('#s-mission')) {
        block.classList.add('rd-setup-legacy-hide');
      }
    });
    const license = document.getElementById('marriage-license-card');
    if (license) license.classList.add('rd-setup-legacy-hide');
  }

  function ensureSetupGrid() {
    const panel = document.getElementById('panel-setup');
    if (!panel) return;
    const prevVer = panel.dataset.setupGridVer;
    if (prevVer === SHELL_VER && panel.querySelector('#rd-setup-formhost')) return;
    panel.dataset.setupGridVer = SHELL_VER;
    panel.querySelector('#rd-setup-formhost')?.remove();

    const legacyGrid = panel.querySelector('.m-grid-2');
    if (legacyGrid) legacyGrid.classList.add('rd-setup-legacy-hide');

    const host = document.createElement('div');
    host.id = 'rd-setup-formhost';
    host.className = 'rd-setup-formhost';
    const grid = document.createElement('div');
    grid.className = 'rd-setup-grid rd-setup-mockup-grid';
    host.appendChild(grid);

    GRID_SECTIONS.forEach(sec => {
      const cell = document.createElement('section');
      cell.className = 'rd-setup-section';
      cell.id = 'setup-sec-' + sec.id;
      cell.innerHTML =
        '<div class="rd-setup-section__head">' + esc(sec.title) + '</div>' +
        '<div class="rd-setup-section__body"></div>';
      const body = cell.querySelector('.rd-setup-section__body');
      if (sec.photo) {
        const photoBlock = panel.querySelector('.setup-photo-block');
        const photoCard = photoBlock ? photoBlock.closest('.m-block') : null;
        if (photoCard) {
          photoCard.classList.remove('rd-setup-legacy-hide');
          body.appendChild(photoCard);
        }
      }
      (sec.fields || []).forEach(f => {
        const row = convertSetupField(f.id, f.label);
        if (!row) return;
        if (f.timeKey) row.dataset.timeKey = f.timeKey;
        body.appendChild(row);
      });
      (sec.display || []).forEach(key => {
        const slot = document.createElement('div');
        slot.className = 'rd-setup-display-slot';
        slot.dataset.displayKey = key;
        body.appendChild(slot);
      });
      grid.appendChild(cell);
    });

    ensureHiddenFieldPocket(panel);

    const menuCard = panel.querySelector('.menu-visibility-card');
    if (menuCard) {
      menuCard.classList.add('rd-setup-menu-band');
      host.appendChild(menuCard);
    }

    const anchor = panel.querySelector('.rd-setup-statstrip') ||
      panel.querySelector('#rd-setup-viewswitch') ||
      panel.querySelector('.rd-setup-pagehead');
    if (anchor) anchor.insertAdjacentElement('afterend', host);
    else panel.appendChild(host);
  }

  function refreshDisplayFields() {
    const f = setupFigures();
    const earlier = window._setupView === 'earlier';
    const displayMap = {
      'shown-as': ['Shown as', f.shownAs],
      'gratuity-policy': ['Gratuity policy', f.gratuityPolicy],
      'seats-available': ['Seats available', f.seatsAvailable],
      'adult-child-rate': ['Adult / child rate', f.adultChild],
      'rsvp-deadline': ['RSVP deadline', f.rsvpLabel],
      'paper-size': ['Paper size', f.paperSize],
      'keepsake-accent': ['Keepsake accent', f.keepsake],
      'share-expiry': ['Share expiry', f.shareExpiry],
      storage: ['Storage', f.dh.dbMb + ' MB · ' + f.dh.records + ' records'],
      'last-backup': ['Last backup', f.dh.lastBackup],
      'weekly-backup': ['Weekly backup reminder', (store().setup || {}).backupReminderDay || 'Not set']
    };
    Object.keys(displayMap).forEach(key => {
      const slot = document.querySelector('#panel-setup .rd-setup-display-slot[data-display-key="' + key + '"], #panel-setup .rd-setup-field--display[data-display-key="' + key + '"]');
      if (!slot) return;
      const pair = displayMap[key];
      slot.outerHTML = displayFieldRow(key, pair[0], pair[1]);
    });
    document.querySelectorAll('#panel-setup .rd-setup-field[data-time-key]').forEach(row => {
      const tk = row.dataset.timeKey;
      const t = timelineTime(tk) || '—';
      let suffix = row.querySelector('.rd-setup-field__time');
      if (!suffix) {
        suffix = document.createElement('span');
        suffix.className = 'rd-setup-field__time';
        const ctrl = row.querySelector('.rd-setup-field__control');
        if (ctrl) ctrl.appendChild(suffix);
      }
      suffix.textContent = t !== '—' ? (' · ' + t) : '';
    });
    const guestRow = document.querySelector('#panel-setup .rd-setup-field[data-field-id="s-guests"]');
    if (guestRow) {
      let hint = guestRow.querySelector('.rd-setup-guest-hint');
      if (!earlier) {
        if (!hint) {
          hint = document.createElement('div');
          hint.className = 'rd-setup-guest-hint rd-setup-display-val is-inline';
          guestRow.querySelector('.rd-setup-field__control')?.appendChild(hint);
        }
        const raw = String((store().setup || {}).guests || '').trim();
        hint.textContent = raw ? (raw + ' invited') : '';
        hint.style.display = raw ? '' : 'none';
      } else if (hint) {
        hint.remove();
      }
    }
  }

  function addFeedsCaptions() {
    Object.keys(FEEDS).forEach(id => {
      if (['shown-as', 'gratuity-policy', 'seats-available', 'adult-child-rate', 'rsvp-deadline',
        'paper-size', 'keepsake-accent', 'share-expiry', 'storage', 'last-backup', 'weekly-backup'].includes(id)) return;
      const input = document.getElementById(id);
      if (!input) return;
      const field = input.closest('.rd-setup-field') || input.closest('.m-field') ||
        input.closest('.rd-setup-field__control')?.parentElement || input.parentElement;
      if (!field || field.querySelector('.rd-setup-feeds')) return;
      const cap = document.createElement('div');
      cap.className = 'rd-setup-feeds';
      cap.innerHTML = '<span class="rd-setup-feeds__k">Feeds</span> ' + esc(FEEDS[id]);
      field.appendChild(cap);
      if (id === 's-date') {
        const btn = document.createElement('button');
        btn.type = 'button';
        btn.className = 'rd-setup-impact-btn';
        btn.textContent = 'Review what changing the date moves →';
        btn.setAttribute('onclick', 'rdSetupOpenDrawer()');
        field.appendChild(btn);
      }
    });
    if (window._setupView === 'earlier') {
      const tzFeeds = document.querySelector('#panel-setup [data-field-id="s-timezone"] .rd-setup-feeds');
      if (tzFeeds) tzFeeds.innerHTML = '<span class="rd-setup-feeds__k">Feeds</span> Calendar · reminders';
      const rsvpSlot = document.querySelector('#panel-setup [data-display-key="rsvp-deadline"] .rd-setup-feeds');
      if (rsvpSlot) rsvpSlot.innerHTML = '<span class="rd-setup-feeds__k">Feeds</span> Guest List reminders';
      const backupSlot = document.querySelector('#panel-setup [data-display-key="last-backup"] .rd-setup-feeds');
      if (backupSlot) backupSlot.innerHTML = '<span class="rd-setup-feeds__k">Feeds</span> Database Hub';
    }
  }

  function applySetupView() {
    const earlier = window._setupView === 'earlier';
    const menuCard = panelQuery('.menu-visibility-card');
    if (menuCard) menuCard.classList.toggle('rd-setup-legacy-hide', earlier);
    ensureStatStrip();
    ensureDangerZone();
    refreshDisplayFields();
    addFeedsCaptions();
    if (typeof renderContextSidebar === 'function') renderContextSidebar('setup');
  }

  /* ── layout: hide legacy chrome, menu presets (15a vs 11c) ───────────── */

  function ensureLayout() {
    const panel = document.getElementById('panel-setup');
    if (!panel) return;
    const firstRun = panel.dataset.setupLayout !== SHELL_VER;
    if (firstRun) {
      panel.dataset.setupLayout = SHELL_VER;
      panel.querySelectorAll('.setup-preferences-card, #setup-essentials-hub, #setup-history-danger').forEach(el => {
        el.classList.add('rd-setup-legacy-hide');
      });
      const rightCol = panel.querySelector('.m-grid-2 > .m-col:last-child');
      if (rightCol) rightCol.classList.add('rd-setup-legacy-hide');

      const menuCard = panel.querySelector('.menu-visibility-card');
      if (menuCard) {
        if (!menuCard.querySelector('.rd-setup-menu-caption')) {
          const cap = document.createElement('p');
          cap.className = 'rd-setup-menu-caption';
          cap.id = 'rd-setup-menu-caption';
          const head = menuCard.querySelector('.m-head');
          if (head) head.insertAdjacentElement('afterend', cap);
        }
        if (!menuCard.querySelector('.rd-setup-menu-presets')) {
          const presets = document.createElement('div');
          presets.className = 'rd-setup-menu-presets';
          presets.innerHTML = MENU_PRESETS.map((p, i) =>
            '<button type="button" class="rd-chip' + (i === 2 ? ' is-active' : '') +
            '" onclick="typeof ' + p[2] + '===\'function\'&&' + p[2] + '()">' + esc(p[1]) + '</button>'
          ).join('');
          const actions = menuCard.querySelector('.m-actions');
          if (actions) menuCard.insertBefore(presets, actions);
          else menuCard.appendChild(presets);
        }
        const oldHelp = menuCard.querySelector('.v4-help-note');
        if (oldHelp) oldHelp.classList.add('rd-setup-legacy-hide');
        const oldActions = menuCard.querySelector('.m-actions');
        if (oldActions) oldActions.classList.add('rd-setup-legacy-hide');
      }
      ensureSetupGrid();
    }
    refreshMenuCaption();
    applySetupView();
  }

  function refreshMenuCaption() {
    const cap = document.getElementById('rd-setup-menu-caption');
    if (!cap || window._setupView === 'earlier') return;
    const hidden = Array.isArray(store().setup?.hiddenMenuPages) ? store().setup.hiddenMenuPages.length : 0;
    cap.textContent = hidden + ' page' + (hidden === 1 ? '' : 's') + ' hidden · nothing is deleted, and Dashboard and Wedding Setup always stay visible';
  }

  /* ── danger zone (Master 15a — four cards; 11c — three cards) ──────── */

  function ensureDangerZone() {
    const panel = document.getElementById('panel-setup');
    if (!panel) return;
    const earlier = window._setupView === 'earlier';
    let sec = panel.querySelector('#rd-setup-danger');
    if (!sec) {
      sec = document.createElement('section');
      sec.className = 'rd-setup-danger';
      sec.id = 'rd-setup-danger';
      panel.appendChild(sec);
    }
    const histN = Array.isArray(store()._historyLog) ? store()._historyLog.length : 0;
    const snapN = Array.isArray(store()._undoSnapshots) ? store()._undoSnapshots.length : 0;
    let cards = '';
    if (earlier) {
      sec.innerHTML =
        '<div class="rd-setup-band__head">' +
        '<div class="rd-setup-band__title">Danger zone</div>' +
        '<div class="rd-setup-band__meta">These three actions cannot be undone from inside the planner</div>' +
        '<button type="button" class="rd-setup-band__link" onclick="typeof downloadSqliteBackup===\'function\'&&downloadSqliteBackup()">Download a backup first</button>' +
        '</div>' +
        '<div class="rd-setup-danger__grid rd-setup-danger__grid--3">' +
        dangerCard('Clear a single table', 'Empties one table and names everything that breaks. Asks for a backup first.', 'rdSetupClearTable()', 'Choose a table') +
        dangerCard('Restore from a backup file', 'Replaces everything currently on this device with the contents of a .sqlite file.', 'rdSetupRestore()', 'Choose a file') +
        dangerCard('Reset the planner', 'Returns to an empty planner with the sample data removed. Keeps nothing.', 'rdSetupReset()', 'Reset') +
        '</div>';
    } else {
      sec.innerHTML =
        '<div class="rd-setup-band__head">' +
        '<div class="rd-setup-band__title">Danger zone</div>' +
        '<div class="rd-setup-band__meta">Four actions that cannot be undone from inside the planner</div>' +
        '<button type="button" class="rd-setup-band__link" onclick="typeof downloadSqliteBackup===\'function\'&&downloadSqliteBackup()">Download a backup first</button>' +
        '</div>' +
        '<div class="rd-setup-danger__grid rd-setup-danger__grid--4">' +
        dangerCard('Clear a single table', 'Empties one table and names everything that breaks first. Asks for a backup before it runs.', 'rdSetupClearTable()', 'Choose a table') +
        dangerCard('Restore from a backup file', 'Replaces everything on this device with the contents of a .sqlite file. Nothing merges.', 'rdSetupRestore()', 'Choose a file') +
        dangerCard('Clear the history log', 'Erases the ' + histN + ' recorded change' + (histN === 1 ? '' : 's') +
          ' and all ' + snapN + ' undo snapshot' + (snapN === 1 ? '' : 's') +
          '. Your planner records are untouched — only the record of how they got that way.', 'rdSetupClearHistory()', histN ? ('Clear ' + histN + ' entr' + (histN === 1 ? 'y' : 'ies')) : 'Clear history') +
        dangerCard('Reset the planner', 'Returns to an empty planner with the sample data removed. Keeps nothing at all.', 'rdSetupReset()', 'Reset') +
        '</div>';
    }
  }
  function dangerCard(title, body, onclick, cta) {
    return '<article class="rd-setup-danger__card">' +
      '<h3>' + esc(title) + '</h3><p>' + esc(body) + '</p>' +
      '<button type="button" class="rd-btn rd-btn--danger" onclick="' + onclick + '">' + esc(cta) + '</button></article>';
  }

  /* ── Setup-field drawer — Field · Impact · History (Master 15a) ─────── */

  function dateLabel() {
    const d = store();
    const raw = String((d.setup && d.setup.date) || '').trim();
    if (!raw) return 'Not set';
    if (typeof fmtDate === 'function') { try { return fmtDate(raw, 'long'); } catch (e) { /* fall */ } }
    const dt = new Date(raw + 'T00:00:00');
    return Number.isNaN(dt.getTime()) ? raw : dt.toLocaleDateString('en-US', { day: 'numeric', month: 'long', year: 'numeric' });
  }

  function setupHistoryRows() {
    const log = Array.isArray(store()._historyLog) ? store()._historyLog : [];
    const dateRows = log.filter(e => {
      const t = String(e.field || e.path || e.label || e.summary || '').toLowerCase();
      return /date|wedding|setup/.test(t);
    }).slice(-6).reverse();
    if (!dateRows.length) {
      return '<p class="rd-drawer__note">Two entries in five months. Sparseness here is the reassuring reading.</p>';
    }
    return dateRows.map(e => {
      const when = e.at || e.ts || e.time || '';
      const who = e.user || e.who || e.actor || 'Planner';
      const detail = e.after || e.value || e.summary || e.action || 'Changed';
      let whenStr = '—';
      if (when) {
        const dt = new Date(when);
        whenStr = Number.isNaN(dt.getTime()) ? String(when).slice(0, 10)
          : dt.toLocaleDateString('en-GB', { day: 'numeric', month: 'short' });
      }
      return '<div class="rd-drawer__hist"><strong>' + esc(whenStr + ' · ' + who) + '</strong><em>' + esc(detail) + '</em></div>';
    }).join('') +
      '<p class="rd-drawer__note">Two entries in five months. A setup field that changes often is a sign the wedding is not settled — the sparseness here is the reassuring reading.</p>';
  }

  function setupLastChanged() {
    const log = Array.isArray(store()._historyLog) ? store()._historyLog : [];
    const setupRows = log.filter(e => {
      const t = String(e.field || e.path || e.table || e.label || '').toLowerCase();
      return t === 'setup' || /wedding|date|bride|groom|budget|guest/.test(t);
    });
    const last = setupRows[setupRows.length - 1];
    if (!last) return '—';
    const when = last.at || last.ts || last.time;
    if (!when) return '—';
    const mins = Math.round((Date.now() - new Date(when).getTime()) / 60000);
    if (mins < 60) return mins + ' min ago';
    const hrs = Math.round(mins / 60);
    if (hrs < 48) return hrs + ' hour' + (hrs === 1 ? '' : 's') + ' ago';
    const days = Math.round(hrs / 24);
    return days + ' day' + (days === 1 ? '' : 's') + ' ago';
  }

  function impactCounts() {
    const d = store();
    return {
      tasks: Array.isArray(d.tasks) ? d.tasks.length : 0,
      pays: Array.isArray(d.payments) ? d.payments.length : 0,
      appts: Array.isArray(d.appointments) ? d.appointments.length : 0,
      counseling: Array.isArray(d.counseling) ? d.counseling.length : 0
    };
  }

  function renderDrawer() {
    const panel = document.getElementById('panel-setup');
    if (!panel) return;
    let slot = document.getElementById('rd-setup-drawer');
    if (!slot) {
      slot = document.createElement('div');
      slot.id = 'rd-setup-drawer';
      panel.appendChild(slot);
    }
    const tab = Math.max(0, Math.min(DRAWER_TABS.length - 1, parseInt(window._setupDrawerTab, 10) || 0));
    const ic = impactCounts();
    const days = document.getElementById('setup-stat-days')?.textContent || '—';
    const changed = setupLastChanged();
    const changedChip = changed !== '—' ? ('Changed ' + changed) : 'Changed recently';
    let body = '';
    if (tab === 0) {
      body =
        drawerRow('Value', dateLabel()) +
        drawerRow('Day', (function () {
          const raw = String((store().setup && store().setup.date) || '').trim();
          if (!raw) return '—';
          const dt = new Date(raw + 'T00:00:00');
          return Number.isNaN(dt.getTime()) ? '—' : dt.toLocaleDateString('en-US', { weekday: 'long' });
        })()) +
        drawerRow('Days away', days) +
        drawerRow('Time zone', setupFigures().tzDisplay) +
        '<div class="rd-drawer__section-title">Changing this re-dates</div>' +
        '<div class="rd-setup-impact-list">' +
        '<div><span>' + ic.tasks + ' tasks</span><em>All phase due dates</em></div>' +
        '<div><span>' + ic.pays + ' payments</span><em>Relative schedules only</em></div>' +
        '<div><span>' + ic.appts + ' appointments</span><em>Kept absolute</em></div>' +
        (ic.counseling ? ('<div><span>' + ic.counseling + ' counseling sessions</span><em>Re-spaced</em></div>') : '') +
        '<div><span>Countdown</span><em>Dashboard, top bar</em></div></div>' +
        '<p class="rd-drawer__note">Eleven fields on Wedding Setup feed the rest of the planner. This is the one that feeds the most, and the only one whose edit is a confirmed action.</p>' +
        '<p class="rd-drawer__note">A date change is a confirmed action: you get a before-and-after list of every moved due date and approve it as one change.</p>';
    } else if (tab === 1) {
      body =
        '<div class="rd-drawer__section-title">Changing the date moves, as one approved change</div>' +
        drawerRow('Task due dates', ic.tasks + ' task' + (ic.tasks === 1 ? '' : 's')) +
        drawerRow('Payment schedule', ic.pays + ' payment' + (ic.pays === 1 ? '' : 's')) +
        drawerRow('Appointments', ic.appts + ' appointment' + (ic.appts === 1 ? '' : 's')) +
        (ic.counseling ? drawerRow('Counseling sessions', ic.counseling + ' session' + (ic.counseling === 1 ? '' : 's')) : '') +
        drawerRow('Countdown & calendar', 'Re-based') +
        '<p class="rd-drawer__note">A before-and-after list, approved as one change — so undo reverses all of it or none.</p>' +
        '<p class="rd-drawer__note">A date change shows a before-and-after list of every moved due date, and you approve it as one change — so undo reverses all of it or none.</p>';
    } else {
      body =
        '<div class="rd-drawer__section-title">This field</div>' +
        setupHistoryRows();
    }
    const footPrimary = tab === 0
      ? '<button type="button" class="rd-btn rd-btn--primary" onclick="rdSetupSave();rdSetupCloseDrawer()">Save</button>' +
        '<button type="button" class="rd-btn" onclick="rdSetupFullEditor()">Full editor</button>'
      : tab === 2
        ? '<button type="button" class="rd-btn rd-btn--primary" onclick="rdSetupSave();rdSetupCloseDrawer()">Save</button>' +
          '<button type="button" class="rd-btn" onclick="rdSetupFullEditor()">Full editor</button>'
        : '<button type="button" class="rd-btn rd-btn--primary" onclick="rdSetupSave();rdSetupCloseDrawer()">Save changes</button>' +
          '<button type="button" class="rd-btn" onclick="rdSetupFullEditor()">Full editor</button>' +
          '<button type="button" class="rd-btn" onclick="rdSetupCloseDrawer()">Discard</button>';
    slot.classList.add('is-open');
    slot.innerHTML =
      '<div class="rd-setup-drawer__scrim" onclick="rdSetupCloseDrawer()"></div>' +
      '<aside class="rd-drawer rd-setup-fielddrawer" aria-label="Setup field">' +
      '<div class="rd-drawer__head">' +
      '<button type="button" class="rd-drawer__close" onclick="rdSetupCloseDrawer()" aria-label="Close">×</button>' +
      '<div class="rd-drawer__eyebrow">Field · the day</div>' +
      '<h2 class="rd-drawer__title">Wedding date</h2>' +
      '<div class="rd-drawer__chips">' +
      '<span class="status-pill" data-pillscheme="blue">Feeds 6 pages</span>' +
      '<span class="status-pill" data-pillscheme="muted">' + esc(changedChip) + '</span></div>' +
      '<div class="rd-drawer__tabs" role="tablist">' +
      DRAWER_TABS.map((label, i) =>
        '<button type="button" class="rd-drawer__tab' + (i === tab ? ' is-active' : '') + '" onclick="rdSetupSetDrawerTab(' + i + ')">' + esc(label) + '</button>'
      ).join('') +
      '</div></div>' +
      '<div class="rd-drawer__body">' + body + '</div>' +
      '<div class="rd-drawer__foot">' + footPrimary + '</div></aside>';
  }
  function drawerRow(label, value) {
    return '<div class="rd-setup-drawer-row"><span>' + esc(label) + '</span>' +
      '<span class="rd-setup-drawer-val">' + esc(value) + '</span></div>';
  }

  /* ── rail section scroll ─────────────────────────────────────────────── */

  function rdSetupJumpSection(id) {
    window._setupRailSection = id;
    const map = {
      'the-couple': '#setup-sec-the-couple',
      'the-day': '#setup-sec-the-day',
      money: '#setup-sec-money',
      guests: '#setup-sec-guests',
      menu: '.menu-visibility-card',
      print: '#setup-sec-print',
      device: '#setup-sec-device'
    };
    const sel = map[id];
    const el = sel ? panelQuery(sel) : null;
    if (el) el.scrollIntoView({ behavior: 'smooth', block: 'start' });
    if (typeof renderContextSidebar === 'function') renderContextSidebar('setup');
  }
  function panelQuery(sel) {
    return document.querySelector('#panel-setup ' + sel);
  }

  function setupRailHtml() {
    const active = window._setupRailSection || 'the-couple';
    const earlier = window._setupView === 'earlier';
    const filled = SETUP_TRACKED.filter(id => {
      const el = document.getElementById(id);
      return el && String(el.value || '').trim();
    }).length;
    const total = SETUP_TRACKED.length;
    const empty = total - filled;
    const hidden = Array.isArray(store().setup?.hiddenMenuPages) ? store().setup.hiddenMenuPages.length : 0;
    const histN = Array.isArray(store()._historyLog) ? store()._historyLog.length : 0;
    const items = [
      ['the-couple', 'The couple'],
      ['the-day', 'The day'],
      ['money', 'Money'],
      ['guests', 'Guests & seating']
    ];
    if (!earlier) items.push(['menu', 'Menu visibility']);
    items.push(['print', 'Print & sharing'], ['device', 'This device']);
    let list = items.map(([id, label]) =>
      '<button type="button" class="rd-rail__item' + (active === id ? ' is-active' : '') +
      '" onclick="rdSetupJumpSection(\'' + id + '\')">' + esc(label) + '</button>'
    ).join('');
    let dangerBtns = '';
    if (earlier) {
      dangerBtns =
        '<button type="button" class="rd-rail__item" onclick="rdSetupClearTable()">Clear a table</button>' +
        '<button type="button" class="rd-rail__item" onclick="rdSetupReset()">Reset planner</button>';
    } else {
      dangerBtns =
        '<button type="button" class="rd-rail__item" onclick="rdSetupClearTable()">Clear a table</button>' +
        '<button type="button" class="rd-rail__item" onclick="rdSetupRestore()">Restore a backup</button>' +
        '<button type="button" class="rd-rail__item" onclick="rdSetupClearHistory()">Clear history' +
        (histN ? (' <span class="rd-rail__count">' + histN + '</span>') : '') + '</button>' +
        '<button type="button" class="rd-rail__item" onclick="rdSetupReset()">Reset planner</button>';
    }
    const danger = '<div class="rd-rail__section"><div class="rd-rail__title">Danger zone</div><div class="rd-rail__list">' +
      dangerBtns + '</div></div>';
    return '<div class="rd-rail__stack" data-page-rail="setup">' +
      '<div class="rd-rail__section"><div class="rd-rail__title">Sections</div><div class="rd-rail__list">' + list + '</div></div>' +
      '<div class="rd-rail__section"><div class="rd-rail__title">Setup complete</div><div class="rd-rail__meters">' +
      '<div class="rd-rail__meter-top"><span>Filled</span><span class="rd-rail__count">' + filled + ' of ' + total + '</span></div>' +
      '<div class="rd-track"><div class="rd-fill" style="width:' + Math.round(filled / total * 100) + '%"></div></div>' +
      '<div class="rd-rail__meter-top"><span>Empty</span><span class="rd-rail__count">' + empty + '</span></div>' +
      '<div class="rd-rail__meter-top"><span>Pages hidden</span><span class="rd-rail__count">' + hidden + ' of 31</span></div>' +
      '<div class="rd-rail__meter-top"><span>Last changed</span><span class="rd-rail__count">' + esc(setupLastChanged()) + '</span></div>' +
      '</div></div>' + danger +
      '<p class="rd-rail__note">Changing the wedding date re-dates every task, payment and countdown. You approve the whole move as one confirmed change.</p></div>';
  }

  /* ── actions ─────────────────────────────────────────────────────────── */

  function rdSetupSave() {
    if (typeof saveSetup === 'function') saveSetup();
    else saveNow();
    refreshMenuCaption();
    refreshDisplayFields();
    if (typeof showToast === 'function') showToast('Setup saved.');
  }
  function rdSetupOpenDrawer() { window._setupDrawerTab = 0; renderDrawer(); }
  function rdSetupCloseDrawer() {
    const slot = document.getElementById('rd-setup-drawer');
    if (slot) { slot.innerHTML = ''; slot.classList.remove('is-open'); }
  }
  function rdSetupSetDrawerTab(i) { window._setupDrawerTab = i; renderDrawer(); }
  function rdSetupSetView(v) {
    window._setupView = v;
    ensurePagehead();
    applySetupView();
  }
  function rdSetupResetDefaults() {
    if (typeof covConfirm === 'function') {
      covConfirm('Reset every field on this page to its default empty state?', { title: 'Reset to defaults?', okText: 'Reset' })
        .then(ok => { if (ok && typeof resetSetupDefaults === 'function') resetSetupDefaults(); });
    }
  }
  function rdSetupFullEditor() {
    if (typeof openRecordEditor === 'function') openRecordEditor('setup', null, true);
    else if (typeof showToast === 'function') showToast('Open Wedding Setup fields below.');
  }
  function rdSetupExport() {
    if (typeof exportSetupSettings === 'function') exportSetupSettings();
    else if (typeof downloadSqliteBackup === 'function') downloadSqliteBackup();
  }
  function rdSetupReset() {
    if (typeof openResetModal === 'function') openResetModal();
    else if (typeof resetAll === 'function') resetAll();
  }
  function rdSetupRestore() {
    const input = document.getElementById('importInput');
    if (input) input.click();
  }
  async function rdSetupClearHistory() {
    const d = store();
    const n = Array.isArray(d._historyLog) ? d._historyLog.length : 0;
    const ok = typeof covConfirm === 'function'
      ? await covConfirm('Clear the ' + n + '-entry change log and its undo snapshots? Planner records are untouched.', { title: 'Clear history?', okText: 'Clear history' })
      : window.confirm('Clear the change log and undo snapshots?');
    if (!ok) return;
    d._historyLog = [];
    d._undoSnapshots = [];
    d._redoSnapshots = [];
    saveNow();
    if (typeof updateHistoryControls === 'function') updateHistoryControls();
    ensureDangerZone();
    if (typeof renderContextSidebar === 'function') renderContextSidebar('setup');
    if (typeof showToast === 'function') showToast('History cleared.');
  }
  async function rdSetupClearTable() {
    const d = store();
    const TABLES = [
      ['guests', 'Guest List'], ['tasks', 'Tasks'], ['payments', 'Payments'],
      ['vendors', 'Vendors'], ['budget', 'Budget lines'], ['gifts', 'Gifts'],
      ['contracts', 'Contracts'], ['appointments', 'Appointments']
    ].filter(([k]) => Array.isArray(d[k]));
    let slot = document.getElementById('rd-setup-cleartable');
    const panel = document.getElementById('panel-setup');
    if (!slot && panel) {
      slot = document.createElement('div');
      slot.id = 'rd-setup-cleartable';
      panel.appendChild(slot);
    }
    if (!slot) return;
    const options = TABLES.map(([key, label], i) =>
      '<option value="' + i + '">' + esc(label) + ' (' + d[key].length + ' row' + (d[key].length === 1 ? '' : 's') + ')</option>'
    ).join('');
    slot.classList.add('is-open');
    slot.innerHTML =
      '<div class="rd-setup-drawer__scrim" onclick="rdSetupCloseClearTable()"></div>' +
      '<aside class="rd-drawer rd-setup-fielddrawer" aria-label="Clear a table">' +
      '<div class="rd-drawer__head">' +
      '<button type="button" class="rd-drawer__close" onclick="rdSetupCloseClearTable()" aria-label="Close">×</button>' +
      '<div class="rd-drawer__eyebrow">Danger zone</div>' +
      '<h2 class="rd-drawer__title">Clear a single table</h2>' +
      '<p class="rd-drawer__note">Empties one table and names everything that breaks first. Download a backup before you run this.</p>' +
      '</div>' +
      '<div class="rd-drawer__body">' +
      '<label class="rd-setup-field__label" for="rd-setup-cleartable-pick">Table</label>' +
      '<select id="rd-setup-cleartable-pick" class="rd-setup-cleartable-pick">' + options + '</select>' +
      '</div>' +
      '<div class="rd-drawer__foot">' +
      '<button type="button" class="rd-btn rd-btn--danger" onclick="rdSetupConfirmClearTable()">Clear the table</button>' +
      '<button type="button" class="rd-btn" onclick="rdSetupCloseClearTable()">Cancel</button>' +
      '</div></aside>';
  }
  function rdSetupCloseClearTable() {
    const slot = document.getElementById('rd-setup-cleartable');
    if (slot) { slot.innerHTML = ''; slot.classList.remove('is-open'); }
  }
  async function rdSetupConfirmClearTable() {
    const d = store();
    const TABLES = [
      ['guests', 'Guest List'], ['tasks', 'Tasks'], ['payments', 'Payments'],
      ['vendors', 'Vendors'], ['budget', 'Budget lines'], ['gifts', 'Gifts'],
      ['contracts', 'Contracts'], ['appointments', 'Appointments']
    ].filter(([k]) => Array.isArray(d[k]));
    const pick = document.getElementById('rd-setup-cleartable-pick');
    const idx = pick ? parseInt(pick.value, 10) : -1;
    if (Number.isNaN(idx) || !TABLES[idx]) return;
    const [key, label] = TABLES[idx];
    const ok = typeof covConfirm === 'function'
      ? await covConfirm('Empty ' + label + ' — ' + d[key].length + ' row' + (d[key].length === 1 ? '' : 's') + '? Other tables are untouched.', { title: 'Clear ' + label + '?', okText: 'Clear the table' })
      : window.confirm('Empty ' + label + '?');
    if (!ok) return;
    d[key] = [];
    saveNow();
    rdSetupCloseClearTable();
    if (typeof showToast === 'function') showToast(label + ' cleared.');
    if (typeof renderSetupPage === 'function') renderSetupPage();
  }

  function renderSetupRd() {
    if (typeof _origRenderSetupPage === 'function') _origRenderSetupPage();
    const panel = document.getElementById('panel-setup');
    if (panel) panel.classList.add('ued-scope', 'rd-setup-scope');
    ensurePagehead();
    ensureStatStrip();
    ensureLayout();
    refreshDisplayFields();
    addFeedsCaptions();
    ensureDangerZone();
    refreshMenuCaption();
    if (typeof uxRevealPanel === 'function') uxRevealPanel('setup');
    if (typeof renderContextSidebar === 'function') renderContextSidebar('setup');
  }

  var _origRenderSetupPage = window.renderSetupPage;
  window.renderSetupPage = function () {
    if (typeof _origRenderSetupPage === 'function') _origRenderSetupPage.apply(this, arguments);
    const panel = document.getElementById('panel-setup');
    if (panel) panel.classList.add('ued-scope', 'rd-setup-scope');
    ensurePagehead();
    ensureStatStrip();
    ensureLayout();
    refreshDisplayFields();
    addFeedsCaptions();
    ensureDangerZone();
    refreshMenuCaption();
  };

  window.renderSetupRd = renderSetupRd;
  window.setupRailHtml = setupRailHtml;
  window.rdSetupSave = rdSetupSave;
  window.rdSetupOpenDrawer = rdSetupOpenDrawer;
  window.rdSetupCloseDrawer = rdSetupCloseDrawer;
  window.rdSetupSetDrawerTab = rdSetupSetDrawerTab;
  window.rdSetupSetView = rdSetupSetView;
  window.rdSetupJumpSection = rdSetupJumpSection;
  window.rdSetupReset = rdSetupReset;
  window.rdSetupRestore = rdSetupRestore;
  window.rdSetupClearHistory = rdSetupClearHistory;
  window.rdSetupClearTable = rdSetupClearTable;
  window.rdSetupConfirmClearTable = rdSetupConfirmClearTable;
  window.rdSetupCloseClearTable = rdSetupCloseClearTable;
  window.rdSetupResetDefaults = rdSetupResetDefaults;
  window.rdSetupFullEditor = rdSetupFullEditor;
  window.rdSetupExport = rdSetupExport;

  function hook() {
    if (window.SYSTEM_PANEL_RENDERERS) {
      window.SYSTEM_PANEL_RENDERERS.setup = function () { renderSetupRd(); };
    }
  }
  hook();
  var _showPanelSetup = window.showPanel;
  if (typeof _showPanelSetup === 'function') {
    window.showPanel = function (id, forceOpen) {
      var out = _showPanelSetup.call(window, id, forceOpen);
      hook();
      if (id === 'setup') requestAnimationFrame(renderSetupRd);
      return out;
    };
  }
})();
