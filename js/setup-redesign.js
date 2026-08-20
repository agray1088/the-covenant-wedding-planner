/* Wedding Setup — All.dc #15a + Drawers batch (Field · Impact · History).
   No Views.dc switcher (this page is a form, not a record browser).
   No tab — the page every other page reads.
   Rail: The couple · The day · Money · Guests & seating · Menu visibility ·
     Print & sharing · This device, plus a Setup complete meter and a
     Danger zone (Clear a table · Restore a backup · Clear history · Reset).
   Stat strip: Days to wedding · Tasks complete · Vendors booked · Guests
     invited · Budget target.
   Data: data.setup{} — bride, groom, date, engaged, budget, guests,
     venue-ceremony, venue-reception, pastor, church, style, colors,
     timezone, locale, currency, dateFormat, verse, mission, photo,
     hiddenMenuPages[]. Fields keep their legacy `s-<key>` ids and write
     through the existing saveSetup() / saveLocaleSettings() mutators so
     every other page that reads data.setup keeps working unchanged. */
(function () {
  'use strict';

  window._setupDrawerKey = window._setupDrawerKey || null;
  window._setupDrawerTab = window._setupDrawerTab || 0;

  const esc = s => (typeof escapeHtml === 'function'
    ? escapeHtml(s == null ? '' : String(s))
    : String(s == null ? '' : s).replace(/[&<>"']/g, c => ({
      '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;'
    }[c])));

  function money(n) {
    if (typeof uedMoney === 'function') return uedMoney(n);
    const v = Math.round(Number(n) || 0);
    return '$' + v.toLocaleString();
  }

  const TIMEZONE_OPTIONS = [
    '', '(GMT-10:00) Hawaii', '(GMT-09:00) Alaska', '(GMT-08:00) Pacific Time (US & Canada)',
    '(GMT-07:00) Mountain Time (US & Canada)', '(GMT-06:00) Central Time (US & Canada)',
    '(GMT-05:00) Eastern Time (US & Canada)', '(GMT-04:00) Atlantic Time (Canada)',
    '(GMT+00:00) Greenwich Mean Time'
  ];
  const LOCALE_OPTIONS = [
    ['en-US', 'English — United States'], ['en-GB', 'English — United Kingdom'],
    ['en-CA', 'English — Canada'], ['en-AU', 'English — Australia'],
    ['en-NZ', 'English — New Zealand'], ['en-IE', 'English — Ireland'],
    ['en-ZA', 'English — South Africa'], ['fr-FR', 'Français — France'],
    ['fr-CA', 'Français — Canada'], ['es-ES', 'Español — España'],
    ['es-MX', 'Español — México'], ['de-DE', 'Deutsch — Deutschland'],
    ['it-IT', 'Italiano — Italia'], ['pt-BR', 'Português — Brasil'],
    ['pt-PT', 'Português — Portugal'], ['nl-NL', 'Nederlands — Nederland'],
    ['sv-SE', 'Svenska — Sverige'], ['ja-JP', '日本語 — 日本'], ['ko-KR', '한국어 — 대한민국']
  ];
  const CURRENCY_OPTIONS = [
    ['USD', 'USD — US Dollar ($)'], ['GBP', 'GBP — British Pound (£)'], ['EUR', 'EUR — Euro (€)'],
    ['CAD', 'CAD — Canadian Dollar ($)'], ['AUD', 'AUD — Australian Dollar ($)'],
    ['NZD', 'NZD — NZ Dollar ($)'], ['ZAR', 'ZAR — South African Rand (R)'],
    ['MXN', 'MXN — Mexican Peso ($)'], ['BRL', 'BRL — Brazilian Real (R$)'],
    ['JPY', 'JPY — Japanese Yen (¥)'], ['KRW', 'KRW — Korean Won (₩)'], ['CHF', 'CHF — Swiss Franc'],
    ['SEK', 'SEK — Swedish Krona'], ['NOK', 'NOK — Norwegian Krone'], ['DKK', 'DKK — Danish Krone'],
    ['INR', 'INR — Indian Rupee (₹)'], ['SGD', 'SGD — Singapore Dollar'], ['HKD', 'HKD — Hong Kong Dollar']
  ];
  const DATEFORMAT_OPTIONS = [
    ['auto', 'Auto (match locale)'], ['MDY', 'MM/DD/YYYY'], ['DMY', 'DD/MM/YYYY'],
    ['YMD', 'YYYY-MM-DD'], ['long', 'Long (October 10, 2026)']
  ];
  const TABLE_OPTIONS = [
    ['guests', 'Guest List'], ['tasks', 'Planning Timeline'], ['budget', 'Budget categories'],
    ['payments', 'Payments'], ['vendors', 'Venue & Vendors'], ['party', 'Wedding Party'],
    ['tables', 'Table Layout'], ['gifts', 'Gift Log'], ['contracts', 'Contracts & Invoices'],
    ['essentials', 'Essentials Checklist'], ['notesDetails', 'Notes'],
    ['appointments', 'Appointments'], ['calendarEvents', 'Smart Calendar events'],
    ['vtimeline', 'Vendor Arrival Timeline'], ['timeline', 'Wedding Day Timeline']
  ];

  const SECTIONS = [
    { id: 'couple', title: 'The couple' },
    { id: 'day', title: 'The day' },
    { id: 'money', title: 'Money' },
    { id: 'guests', title: 'Guests & seating' },
    { id: 'print', title: 'Print & sharing' }
  ];

  const SETUP_FIELDS = [
    { key: 'bride', section: 'couple', label: "Bride's name", type: 'text', feeds: 'Guest List · Print Centre · every keepsake', significant: true },
    { key: 'groom', section: 'couple', label: "Groom's name", type: 'text', feeds: 'Guest List · Print Centre · every keepsake', significant: true },
    { key: 'pastor', section: 'couple', label: 'Pastor / officiant', type: 'text', feeds: 'Ceremony & Reception · Marriage license' },
    { key: 'church', section: 'couple', label: 'Church / location name', type: 'text', feeds: 'Vision & Foundation · Counseling' },
    { key: 'verse', section: 'couple', label: 'Marriage verse', type: 'text', placeholder: 'e.g. Ephesians 5:22–33', feeds: 'Vision & Foundation · Counseling' },
    { key: 'mission', section: 'couple', label: 'Marriage mission statement', type: 'textarea', placeholder: 'Write your shared purpose as a couple…', feeds: 'Vision & Foundation · Counseling' },
    { key: 'date', section: 'day', label: 'Wedding date', type: 'date', feeds: 'Countdown · every task due date · calendar', significant: true },
    { key: 'engaged', section: 'day', label: 'Engagement date', type: 'date', feeds: 'Foundation meter · keepsakes' },
    { key: 'venue-ceremony', section: 'day', label: 'Ceremony venue', type: 'text', feeds: 'Ceremony & Reception · Wedding Day Timeline', significant: true },
    { key: 'venue-reception', section: 'day', label: 'Reception venue', type: 'text', feeds: 'Ceremony & Reception · Wedding Day Timeline', significant: true },
    { key: 'timezone', section: 'day', label: 'Time zone', type: 'select', options: TIMEZONE_OPTIONS, feeds: 'Smart Calendar · reminders · countdown' },
    { key: 'budget', section: 'money', label: 'Total budget', type: 'number', feeds: 'Budget · Dashboard · every spend bar' },
    { key: 'guests', section: 'guests', label: 'Target guest count', type: 'number', placeholder: 'e.g. 120', feeds: 'Guest List · catering estimates · alerts', note: 'Shapes catering servings, seating capacity, and per-guest estimates — not the same as your guest list length.', significant: true },
    { key: 'style', section: 'print', label: 'Wedding style', type: 'text', placeholder: 'e.g. Garden, Classic, Rustic', feeds: 'Print Centre · keepsake theme' },
    { key: 'colors', section: 'print', label: 'Color palette', type: 'text', placeholder: 'e.g. Ivory, Sage, Champagne', feeds: 'Print Centre · keepsake theme' }
  ];
  const FIELD_BY_KEY = {};
  SETUP_FIELDS.forEach(f => { FIELD_BY_KEY[f.key] = f; });

  function ensureSetup() {
    if (!window.data) window.data = {};
    if (!data.setup || typeof data.setup !== 'object') data.setup = {};
    return data.setup;
  }

  function fmtDateLong(iso) {
    if (!iso) return '';
    const d = new Date(String(iso).slice(0, 10) + 'T00:00:00');
    if (Number.isNaN(d.getTime())) return String(iso);
    return d.toLocaleDateString('en-US', { day: 'numeric', month: 'long', year: 'numeric' });
  }

  function displayValue(f) {
    const s = ensureSetup();
    const raw = s[f.key];
    if (f.type === 'date') return raw ? fmtDateLong(raw) : '—';
    if (f.type === 'number' && f.key === 'budget') return raw ? money(raw) : '—';
    if (!raw && raw !== 0) return '—';
    return String(raw);
  }

  /* ── figures ─────────────────────────────────────────────────────────── */

  function setupFigures() {
    const s = ensureSetup();
    const dateObj = s.date ? new Date(String(s.date).slice(0, 10) + 'T00:00:00') : null;
    const today = new Date(); today.setHours(0, 0, 0, 0);
    const validDate = dateObj && !Number.isNaN(dateObj.getTime());
    const daysLeft = validDate ? Math.max(0, Math.ceil((dateObj - today) / 86400000)) : null;
    const tasks = (typeof safeArray === 'function' ? safeArray(data.tasks) : (data.tasks || []));
    const vendors = (typeof safeArray === 'function' ? safeArray(data.vendors) : (data.vendors || []));
    const guests = (typeof safeArray === 'function' ? safeArray(data.guests) : (data.guests || []));
    const tasksDone = tasks.filter(t => t.status === 'Complete').length;
    const vendorsBooked = vendors.filter(v => ['Booked', 'Paid', 'Complete'].includes(v.status)).length;
    return {
      daysLeft, dateLabel: validDate ? fmtDateLong(s.date) : 'Set your wedding date',
      tasksDone, tasksTotal: tasks.length,
      vendorsBooked, vendorsTotal: vendors.length,
      guestsCount: guests.length,
      budget: parseFloat(s.budget) || 0
    };
  }

  function setupCompleteFigures() {
    const foundation = typeof setupFoundationProgress === 'function'
      ? setupFoundationProgress() : { completed: 0, total: 11, pct: 0 };
    let hiddenCount = 0, pageTotal = 0;
    try {
      if (typeof getHiddenMenuPages === 'function') hiddenCount = getHiddenMenuPages().length;
      if (typeof getMenuVisibilityPages === 'function') pageTotal = getMenuVisibilityPages().length;
    } catch (e) { /* soft */ }
    let lastChanged = '—';
    try {
      const log = (data._historyLog || []).find(item => item.source === 'Wedding Setup');
      if (log) {
        const d = new Date(log.iso);
        if (!Number.isNaN(d.getTime())) {
          const days = Math.round((Date.now() - d.getTime()) / 86400000);
          lastChanged = days <= 0 ? 'today' : (days === 1 ? 'yesterday' : days + ' days ago');
        }
      }
    } catch (e) { /* soft */ }
    return {
      filled: foundation.completed, total: foundation.total,
      empty: Math.max(0, foundation.total - foundation.completed),
      pct: foundation.total ? Math.round(foundation.completed / foundation.total * 100) : 0,
      hiddenCount, pageTotal, lastChanged
    };
  }

  function deviceFigures() {
    let bytes = 0;
    try { bytes = new Blob([JSON.stringify(data)]).size; } catch (e) {
      try { bytes = JSON.stringify(data).length; } catch (e2) { bytes = 0; }
    }
    const kb = bytes / 1024;
    const sizeLabel = kb > 1024 ? (kb / 1024).toFixed(1) + ' MB' : Math.max(1, Math.round(kb)) + ' KB';
    let records = 0;
    Object.keys(data || {}).forEach(k => {
      if (Array.isArray(data[k]) && !k.startsWith('_')) records += data[k].length;
    });
    let lastBackup = '—';
    try {
      const ob = typeof ensureOnboardData === 'function' ? ensureOnboardData() : {};
      if (ob.lastBackupTime) {
        const days = Math.round((Date.now() - new Date(ob.lastBackupTime).getTime()) / 86400000);
        lastBackup = days <= 0 ? 'today' : (days === 1 ? 'yesterday' : days + ' days ago');
      }
    } catch (e) { /* soft */ }
    return { sizeLabel, records, lastBackup };
  }

  /* ── shell ───────────────────────────────────────────────────────────── */

  function pageheadActionsHtml() {
    return ''
      + '<button type="button" class="rd-btn" onclick="rdSetupPrint()"><svg viewBox="0 0 24 24" aria-hidden="true" style="width:14px;height:14px;fill:none;stroke:currentColor;stroke-width:1.7;stroke-linecap:round;stroke-linejoin:round"><path d="M6 9V4h12v5"/><rect x="4" y="9" width="16" height="7" rx="1"/><path d="M7 16h10v4H7z"/></svg>Print section</button>'
      + '<button type="button" class="rd-btn" onclick="rdSetupExportSettings()">Export settings</button>'
      + '<button type="button" class="rd-btn rd-btn--primary" onclick="rdSetupSave()">Save changes</button>';
  }

  function fieldInputHtml(f) {
    const s = ensureSetup();
    const val = s[f.key] != null ? s[f.key] : '';
    const focus = f.significant ? ` onfocus="rdSetupOpenDrawer('${f.key}')"` : '';
    if (f.type === 'select') {
      const opts = (f.options || []).map(o => `<option value="${esc(o)}"${val === o ? ' selected' : ''}>${esc(o || 'Select time zone')}</option>`).join('');
      return `<select id="s-${esc(f.key)}" oninput="rdSetupFieldChanged('${f.key}')" onchange="rdSetupFieldChanged('${f.key}')"${focus}>${opts}</select>`;
    }
    if (f.type === 'textarea') {
      return `<textarea id="s-${esc(f.key)}" rows="3" placeholder="${esc(f.placeholder || '')}" oninput="rdSetupFieldChanged('${f.key}')"${focus}>${esc(val)}</textarea>`;
    }
    return `<input type="${f.type}" id="s-${esc(f.key)}" value="${esc(val)}" placeholder="${esc(f.placeholder || '')}" oninput="rdSetupFieldChanged('${f.key}')"${focus}>`;
  }

  function fieldRowHtml(f) {
    return `<div class="rd-setup-field" data-setup-field="${esc(f.key)}">`
      + `<span class="rd-setup-field__label">${esc(f.label)}</span>`
      + `<div class="rd-setup-field__control">`
      + fieldInputHtml(f)
      + `<div class="rd-setup-field__note">${esc(f.note || ('Feeds ' + f.feeds))}</div>`
      + `</div>`
      + `<button type="button" class="rd-setup-field__open" title="Field details" onclick="rdSetupOpenDrawer('${esc(f.key)}')" aria-label="Open ${esc(f.label)} details">ⓘ</button>`
      + `</div>`;
  }

  function sectionCardHtml(section) {
    const fields = SETUP_FIELDS.filter(f => f.section === section.id);
    let extra = '';
    if (section.id === 'money') {
      const s = ensureSetup();
      const curOpts = CURRENCY_OPTIONS.map(([v, label]) => `<option value="${esc(v)}"${s.currency === v || (!s.currency && v === 'USD') ? ' selected' : ''}>${esc(label)}</option>`).join('');
      extra = `<div class="rd-setup-field" data-setup-field="currency">`
        + `<span class="rd-setup-field__label">Currency</span>`
        + `<div class="rd-setup-field__control"><select id="s-currency" onchange="rdSetupLocaleChanged()">${curOpts}</select>`
        + `<div class="rd-setup-field__note">Feeds every money column in the planner</div></div>`
        + `</div>`;
    }
    return `<div class="rd-setup-section" id="setup-sec-${esc(section.id)}">`
      + `<div class="rd-setup-section__head">${esc(section.title)}</div>`
      + `<div class="rd-setup-section__body">${fields.map(fieldRowHtml).join('')}${extra}</div>`
      + `</div>`;
  }

  function menuVisibilityBandHtml() {
    return `<div class="rd-setup-band" id="setup-sec-menu">`
      + `<div class="rd-setup-band__head"><span>Menu visibility</span>`
      + `<span class="rd-setup-band__meta">Hides pages from the menu without deleting anything. Dashboard and Wedding Setup always stay visible.</span></div>`
      + `<div class="rd-setup-band__body">`
      + `<div class="rd-setup-menu-actions">`
      + `<button type="button" class="rd-btn" onclick="setAllMenuPagesVisible()">Show all pages</button>`
      + `<button type="button" class="rd-btn" onclick="applySimpleMenuPreset()">Hide advanced pages</button>`
      + `</div>`
      + `<div id="menu-visibility-list" class="menu-visibility-list"></div>`
      + `<div id="setup-essentials-hub" aria-label="Essentials View hub"></div>`
      + `</div></div>`;
  }

  function deviceBandHtml() {
    const s = ensureSetup();
    const locOpts = LOCALE_OPTIONS.map(([v, label]) => `<option value="${esc(v)}"${s.locale === v || (!s.locale && v === 'en-US') ? ' selected' : ''}>${esc(label)}</option>`).join('');
    const dfOpts = DATEFORMAT_OPTIONS.map(([v, label]) => `<option value="${esc(v)}"${s.dateFormat === v || (!s.dateFormat && v === 'auto') ? ' selected' : ''}>${esc(label)}</option>`).join('');
    const sidebarOn = document.body.classList.contains('nav-sidebar');
    return `<div class="rd-setup-band" id="setup-sec-device">`
      + `<div class="rd-setup-band__head"><span>This device</span>`
      + `<span class="rd-setup-band__meta">Display and storage settings that live only in this browser.</span></div>`
      + `<div class="rd-setup-band__body">`
      + `<div class="rd-setup-grid2">`
      + `<div class="rd-setup-field"><span class="rd-setup-field__label">Region / locale</span><div class="rd-setup-field__control"><select id="s-locale" onchange="rdSetupLocaleChanged()">${locOpts}</select></div></div>`
      + `<div class="rd-setup-field"><span class="rd-setup-field__label">Date format</span><div class="rd-setup-field__control"><select id="s-dateformat" onchange="rdSetupLocaleChanged()">${dfOpts}</select></div></div>`
      + `</div>`
      + `<div class="rd-setup-photo">`
      + `<div class="setup-photo-thumb" id="setup-photo-box" onclick="document.getElementById('heroPhotoInput').click()">`
      + `<div class="setup-photo-placeholder"><svg viewBox="0 0 24 24" aria-hidden="true"><rect x="3" y="5" width="18" height="14" rx="2"/><circle cx="9" cy="10" r="1.5"/><path d="m21 15-4.5-4.5L8 19"/></svg><span>Add your photo</span></div>`
      + `<span class="setup-photo-plus"><svg viewBox="0 0 24 24"><path d="M12 5v14M5 12h14"/></svg></span>`
      + `</div>`
      + `<div class="rd-setup-photo__copy"><strong>Wedding photo</strong>`
      + `<p>Personalize your planner with a photo of you both. Drag it to reposition after uploading.</p>`
      + `<div class="rd-setup-menu-actions"><button type="button" class="rd-btn" onclick="document.getElementById('heroPhotoInput').click()">Upload photo</button>`
      + `<button type="button" class="rd-btn" id="setup-remove-photo" onclick="removeHeroPhoto()">Remove photo</button></div></div>`
      + `</div>`
      + `<div class="rd-setup-devicerow"><span>Menu layout</span><button type="button" class="rd-btn" id="menu-layout-pref-btn" onclick="toggleNavLayout()">${sidebarOn ? 'Use Top Menu' : 'Use Sidebar Menu'}</button></div>`
      + `<div class="rd-setup-devicerow" id="setup-storage-row"></div>`
      + `</div></div>`;
  }

  function licenseBandHtml() {
    return `<div class="rd-setup-band" id="setup-sec-license">`
      + `<div class="rd-setup-band__head"><span>Marriage license &amp; documents</span></div>`
      + `<div class="rd-setup-band__body"><div id="marriage-license-card"></div></div>`
      + `</div>`;
  }

  function dangerZoneHtml() {
    const tableOpts = TABLE_OPTIONS.map(([k, label]) => `<option value="${esc(k)}">${esc(label)}</option>`).join('');
    return `<div class="rd-setup-band rd-setup-danger" id="setup-sec-danger">`
      + `<div class="rd-setup-band__head"><span>Danger zone</span>`
      + `<span class="rd-setup-band__meta">Four actions that cannot be undone from inside the planner.</span>`
      + `<button type="button" class="rd-setup-band__link" onclick="downloadSqliteBackup()">Download a backup first</button></div>`
      + `<div class="rd-setup-danger__grid">`
      + `<div class="rd-setup-danger__cell"><div class="rd-setup-danger__title">Clear a single table</div>`
      + `<p>Empties one table. Everything else on the planner stays.</p>`
      + `<div class="rd-setup-danger__row"><select id="setup-danger-table">${tableOpts}</select>`
      + `<button type="button" class="rd-btn rd-btn--danger" onclick="rdSetupClearTable()">Clear table</button></div></div>`
      + `<div class="rd-setup-danger__cell"><div class="rd-setup-danger__title">Restore from a backup file</div>`
      + `<p>Replaces everything on this device with the contents of a .sqlite or .json file. Nothing merges.</p>`
      + `<button type="button" class="rd-btn rd-btn--danger" onclick="document.getElementById('importInput').click()">Choose a file</button></div>`
      + `<div class="rd-setup-danger__cell"><div class="rd-setup-danger__title">Clear the history log</div>`
      + `<p>Erases the recorded changes and undo/redo snapshots. Your planner records are untouched.</p>`
      + `<button type="button" class="rd-btn rd-btn--danger" onclick="clearPlannerHistory()">Clear history</button></div>`
      + `<div class="rd-setup-danger__cell"><div class="rd-setup-danger__title">Reset the planner</div>`
      + `<p>Returns to an empty planner. Keeps nothing at all.</p>`
      + `<button type="button" class="rd-btn rd-btn--danger" onclick="rdSetupResetPlanner()">Reset</button></div>`
      + `</div></div>`;
  }

  function completeMeterHtml() {
    return `<div class="rd-setup-complete" id="setup-complete-meter"></div>`;
  }

  function uedSetupShellRd() {
    const panel = document.getElementById('panel-setup');
    if (!panel) return;
    panel.classList.add('ued-scope', 'setup-mockup');
    if (panel.dataset.uedShell === 'setup-rd15a') {
      const actions = panel.querySelector('.rd-pagehead__actions');
      if (actions) actions.innerHTML = pageheadActionsHtml();
      return;
    }
    panel.dataset.uedShell = 'setup-rd15a';
    panel.innerHTML = `<div class="rd-page">
      <div class="rd-pagehead">
        <div>
          <div class="rd-pagehead__eyebrow">Overview · start planning</div>
          <div class="rd-pagehead__title-row">
            <h1 class="rd-pagehead__title">Wedding Setup</h1>
          </div>
        </div>
        <div class="rd-pagehead__actions">${pageheadActionsHtml()}</div>
      </div>
      <div class="rd-stats m-stats" id="setup-stats" aria-label="Wedding Setup summary"></div>
      <div class="rd-surface">
        ${completeMeterHtml()}
        <div class="rd-setup-grid">
          ${SECTIONS.map(sectionCardHtml).join('')}
        </div>
        ${menuVisibilityBandHtml()}
        ${licenseBandHtml()}
        ${deviceBandHtml()}
        ${dangerZoneHtml()}
      </div>
      <div id="setup-drawer-slot"></div>
    </div>`;
  }

  function renderSetupStatsRd() {
    const host = document.getElementById('setup-stats');
    if (!host) return;
    const f = setupFigures();
    const stats = [
      { label: 'Days to wedding', value: f.daysLeft == null ? '—' : String(f.daysLeft) },
      { label: 'Tasks complete', value: f.tasksDone + ' of ' + f.tasksTotal },
      { label: 'Vendors booked', value: String(f.vendorsBooked) },
      { label: 'Guests invited', value: String(f.guestsCount) },
      { label: 'Budget target', value: f.budget ? money(f.budget) : '—' }
    ];
    if (typeof RdDepth !== 'undefined' && RdDepth.renderStats) {
      RdDepth.renderStats(host, stats);
      return;
    }
    host.innerHTML = stats.map(s =>
      `<div class="m-stat"><div class="m-stat-label">${esc(s.label)}</div><div class="m-stat-val">${esc(s.value)}</div></div>`
    ).join('');
  }

  function renderSetupCompleteMeterRd() {
    const host = document.getElementById('setup-complete-meter');
    if (!host) return;
    const c = setupCompleteFigures();
    host.innerHTML = `<div class="rd-setup-complete__title">Setup complete</div>`
      + `<div class="rd-setup-complete__row"><span>Filled</span><span>${c.filled} of ${c.total}</span></div>`
      + `<div class="rd-track"><div class="rd-fill" style="width:${c.pct}%"></div></div>`
      + `<div class="rd-setup-complete__row"><span>Empty</span><span>${c.empty}</span></div>`
      + `<div class="rd-setup-complete__row"><span>Pages hidden</span><span>${c.hiddenCount} of ${c.pageTotal}</span></div>`
      + `<div class="rd-setup-complete__row"><span>Last changed</span><span>${esc(c.lastChanged)}</span></div>`;
  }

  function renderSetupStorageRowRd() {
    const host = document.getElementById('setup-storage-row');
    if (!host) return;
    const d = deviceFigures();
    host.innerHTML = `<span>Storage</span><span>${esc(d.sizeLabel)} · ${d.records} records · last backup ${esc(d.lastBackup)}</span>`;
  }

  /* ── drawer: Field · Impact · History ───────────────────────────────── */

  const DRAWER_TABS = ['Field', 'Impact', 'History'];

  function fieldSourceLabel(key) {
    if (key === 'currency' || key === 'locale' || key === 'dateFormat') return 'Money';
    const f = FIELD_BY_KEY[key];
    return f ? SECTIONS.find(s => s.id === f.section)?.title || 'Wedding Setup' : 'Wedding Setup';
  }

  function renderSetupDrawer() {
    const slot = document.getElementById('setup-drawer-slot');
    if (!slot) return;
    const key = window._setupDrawerKey;
    const f = key ? FIELD_BY_KEY[key] : null;
    if (!f) {
      slot.innerHTML = '';
      slot.classList.remove('is-open');
      return;
    }
    const tab = Math.max(0, Math.min(DRAWER_TABS.length - 1, parseInt(window._setupDrawerTab, 10) || 0));
    let body = '';
    if (tab === 0) {
      body = `<div class="rd-drawer__field"><span>Value</span><strong>${esc(displayValue(f))}</strong></div>`
        + `<div class="rd-drawer__field"><span>Field key</span><strong><code>data.setup.${esc(f.key)}</code></strong></div>`
        + `<p class="rd-drawer__note">Edit the field directly on the page — clicking below will jump to it and place your cursor there.</p>`
        + `<button type="button" class="rd-btn rd-btn--primary" onclick="rdSetupFocusField('${esc(f.key)}')">Edit this field →</button>`;
    } else if (tab === 1) {
      const feeds = String(f.feeds || '').split('·').map(s => s.trim()).filter(Boolean);
      body = `<div class="rd-drawer__section-title">Feeds ${feeds.length} page${feeds.length === 1 ? '' : 's'}</div>`
        + feeds.map(x => `<div class="rd-drawer__field"><span>${esc(x)}</span><strong>Reads this field</strong></div>`).join('')
        + `<p class="rd-drawer__note">${f.significant
          ? 'This is one of the facts every other page reads — changing it re-derives the pages above the moment you save.'
          : 'A change here only re-derives the pages listed above; nothing else in the planner reads this field.'}</p>`;
    } else {
      const log = (data._historyLog || []).filter(item => item.source === 'Wedding Setup').slice(0, 4);
      body = `<div class="rd-drawer__field"><span>Current value</span><strong>${esc(displayValue(f))}</strong></div>`
        + (log.length
          ? log.map(item => `<div class="rd-drawer__hist"><strong>${esc(item.date || '')} · ${esc(item.time || '')}</strong><div>${esc(item.details || item.action || 'Wedding Setup updated')}</div></div>`).join('')
          : `<div class="rd-drawer__hist"><strong>—</strong><div>No changes recorded yet for Wedding Setup.</div></div>`)
        + `<p class="rd-drawer__note">A synthetic history — the planner records Wedding Setup changes as a page, not a single field, so entries above may cover more than just ${esc(f.label.toLowerCase())}.</p>`;
    }
    slot.classList.add('is-open');
    slot.innerHTML = `<aside class="rd-drawer rd-setup-drawer" aria-label="Setup field">`
      + `<div class="rd-drawer__head">`
      + `<div class="rd-drawer__eyebrow">Field · ${esc(fieldSourceLabel(f.key).toLowerCase())}</div>`
      + `<h2 class="rd-drawer__title">${esc(f.label)}</h2>`
      + `<button type="button" class="rd-drawer__close" onclick="rdSetupCloseDrawer()" aria-label="Close">×</button>`
      + `<div class="rd-drawer__tabs" role="tablist">`
      + DRAWER_TABS.map((label, i) => `<button type="button" class="rd-drawer__tab${i === tab ? ' is-active' : ''}" onclick="rdSetupSetDrawerTab(${i})">${esc(label)}</button>`).join('')
      + `</div></div>`
      + `<div class="rd-drawer__body">${body}</div>`
      + `<div class="rd-drawer__foot">`
      + `<button type="button" class="rd-btn rd-btn--primary" onclick="rdSetupSave()">Save changes</button>`
      + `<button type="button" class="rd-btn" onclick="rdSetupCloseDrawer()">Close</button>`
      + `</div></aside>`;
  }

  /* ── actions ─────────────────────────────────────────────────────────── */

  function rdSetupOpenDrawer(key) {
    if (!FIELD_BY_KEY[key]) return;
    window._setupDrawerKey = key;
    window._setupDrawerTab = 0;
    renderSetupDrawer();
  }
  function rdSetupCloseDrawer() {
    window._setupDrawerKey = null;
    renderSetupDrawer();
  }
  function rdSetupSetDrawerTab(i) {
    window._setupDrawerTab = i;
    renderSetupDrawer();
  }
         function rdSetupJumpTo(id) {
           const el = document.getElementById(id);
           if (el && typeof el.scrollIntoView === 'function') el.scrollIntoView({ behavior: 'smooth', block: 'start' });
         }
         function rdSetupFocusField(key) {
    const el = document.getElementById('s-' + key);
    if (el && typeof el.scrollIntoView === 'function') el.scrollIntoView({ behavior: 'smooth', block: 'center' });
    if (el) setTimeout(() => { try { el.focus(); } catch (e) { /* soft */ } }, 150);
  }
  function rdSetupFieldChanged(key) {
    if (typeof saveSetup === 'function') saveSetup();
    if (window._setupDrawerKey === key) renderSetupDrawer();
  }
  function rdSetupLocaleChanged() {
    if (typeof saveLocaleSettings === 'function') saveLocaleSettings();
  }
  function rdSetupSave() {
    if (typeof save === 'function') save();
    if (typeof showToast === 'function') showToast('Wedding Setup saved.', 'ok');
  }
  function rdSetupPrint() {
    if (typeof printCurrentPage === 'function') printCurrentPage();
    else window.print();
  }
  function rdSetupExportSettings() {
    try {
      const blob = new Blob([JSON.stringify(ensureSetup(), null, 2)], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = 'wedding-setup.json';
      document.body.appendChild(a);
      a.click();
      a.remove();
      setTimeout(() => URL.revokeObjectURL(url), 1000);
    } catch (e) { if (typeof covAlert === 'function') covAlert('Could not export settings.'); }
  }
  async function rdSetupClearTable() {
    const sel = document.getElementById('setup-danger-table');
    const key = sel && sel.value;
    if (!key) return;
    const label = (TABLE_OPTIONS.find(o => o[0] === key) || [key, key])[1];
    const confirmFn = typeof covConfirm === 'function' ? covConfirm : async (msg) => window.confirm(msg);
    const ok = await confirmFn(`Empty "${label}"? This removes every row in that table. Everything else on the planner stays. Download a backup first if you are not sure.`, { title: 'Clear a table?', danger: true, okText: 'Clear table' });
    if (!ok) return;
    if (Array.isArray(data[key])) data[key] = [];
    if (typeof save === 'function') save();
    if (typeof showToast === 'function') showToast(`Cleared ${label}.`, 'ok');
    renderSetupRd();
  }
  async function rdSetupResetPlanner() {
    const confirmFn = typeof covConfirm === 'function' ? covConfirm : async (msg) => window.confirm(msg);
    const ok1 = await confirmFn('This returns to an empty planner with everything removed. Download a backup first if you want to keep anything. Continue?', { title: 'Reset the planner?', danger: true, okText: 'Continue' });
    if (!ok1) return;
    const ok2 = await confirmFn('Are you absolutely sure? This cannot be undone from inside the planner.', { title: 'Reset the planner?', danger: true, okText: 'Reset everything' });
    if (!ok2) return;
    data = typeof blankData === 'function' ? blankData() : {};
    if (typeof save === 'function') save();
    window.location.reload();
  }

  /* ── main ────────────────────────────────────────────────────────────── */

         function renderSetupRd() {
           ensureSetup();
           uedSetupShellRd();
           if (typeof renderPageUxChrome === 'function') renderPageUxChrome('setup');
           /* Syncs data.setup → the `s-<key>` inputs. Safe to call on every
              render (including after every keystroke, same as the legacy
              renderSetupPage() did): it writes the same value the field just
              saved, but it is also what makes Undo/Redo, backup restores, and
              external data changes actually show up on this page. */
           if (typeof loadSetup === 'function') loadSetup();
           renderSetupStatsRd();
           renderSetupCompleteMeterRd();
           renderSetupStorageRowRd();
           if (typeof loadLocaleSettings === 'function') loadLocaleSettings();
    if (typeof renderSetupPhotoBox === 'function') renderSetupPhotoBox();
    if (typeof renderProfileDrawerPhoto === 'function') renderProfileDrawerPhoto();
    if (typeof renderTopbarPhoto === 'function') renderTopbarPhoto();
    if (typeof renderMenuVisibilitySettings === 'function') renderMenuVisibilitySettings();
    if (typeof renderEssentialsHubHosts === 'function') renderEssentialsHubHosts();
    if (typeof renderMarriageLicense === 'function') renderMarriageLicense();
    renderSetupDrawer();

    if (typeof renderContextSidebar === 'function'
      && document.body.getAttribute('data-active-panel') === 'setup'
      && document.body.classList.contains('context-sidebar-mode')) {
      renderContextSidebar('setup');
    }
    if (typeof uxRevealPanel === 'function') uxRevealPanel('setup');
  }

  window.uedSetupShell = uedSetupShellRd;
  window.renderSetupRd = renderSetupRd;
  window.renderSetup = renderSetupRd;
  window.renderSetupPage = renderSetupRd;
  window.setupFigures = setupFigures;
  window.setupCompleteFigures = setupCompleteFigures;
  window.rdSetupOpenDrawer = rdSetupOpenDrawer;
  window.rdSetupCloseDrawer = rdSetupCloseDrawer;
  window.rdSetupSetDrawerTab = rdSetupSetDrawerTab;
         window.rdSetupJumpTo = rdSetupJumpTo;
         window.rdSetupFocusField = rdSetupFocusField;
  window.rdSetupFieldChanged = rdSetupFieldChanged;
  window.rdSetupLocaleChanged = rdSetupLocaleChanged;
  window.rdSetupSave = rdSetupSave;
  window.rdSetupPrint = rdSetupPrint;
  window.rdSetupExportSettings = rdSetupExportSettings;
  window.rdSetupClearTable = rdSetupClearTable;
  window.rdSetupResetPlanner = rdSetupResetPlanner;

  function hookSetupPanelRenderer() {
    if (window.SYSTEM_PANEL_RENDERERS) {
      window.SYSTEM_PANEL_RENDERERS.setup = function () { renderSetupRd(); };
    }
  }
  hookSetupPanelRenderer();
  var _showPanelSetup = window.showPanel;
  if (typeof _showPanelSetup === 'function') {
    window.showPanel = function (id, forceOpen) {
      var out = _showPanelSetup.call(window, id, forceOpen);
      hookSetupPanelRenderer();
      return out;
    };
  }
})();
