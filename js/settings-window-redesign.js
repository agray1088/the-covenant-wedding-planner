/* Settings window — Master s39 · 49c "Settings · gear pop-out window".

   1240px modal: forest header, green save-status banner, six labelled pane
   cards in a 3×2 grid. Relocate, don't re-author — live controls keep their
   ids and handlers via appendChild slots. */
(function () {
  'use strict';

  var OVERLAY_ID = 'rd-settings-overlay';
  var ALERT_RULES_KEY = 'rd-planner-alert-rules';
  var CHECK_SVG = '<svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><circle cx="12" cy="12" r="9"/><path d="m8.5 12.3 2.2 2.2 4.8-5"/></svg>';
  var GEAR_SVG = '<svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><circle cx="12" cy="12" r="3.2"/><path d="M12 2.8v2.6M12 18.6v2.6M4.6 7.4l2.3 1.3M17.1 15.3l2.3 1.3M4.6 16.6l2.3-1.3M17.1 8.7l2.3-1.3"/></svg>';
  var ALERT_RULE_DEFAULTS = {
    paymentDue: '7+1',
    contractWindow: true,
    rsvpDigest: true,
    taskUnblocked: true,
    vendorUpload: false
  };

  function esc(s) {
    return (typeof escapeHtml === 'function')
      ? escapeHtml(s == null ? '' : String(s))
      : String(s == null ? '' : s).replace(/[&<>"']/g, function (c) {
        return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c];
      });
  }

  function onboard() {
    try { if (typeof ensureOnboardData === 'function') return ensureOnboardData() || {}; } catch (e) {}
    try { return (typeof data !== 'undefined' && data && data.onboard) ? data.onboard : {}; } catch (e) {}
    return {};
  }

  function relTime(iso) {
    if (!iso) return null;
    var t = new Date(iso);
    if (isNaN(t.getTime())) return null;
    var mins = Math.max(0, Math.round((Date.now() - t.getTime()) / 60000));
    if (mins < 1) return 'just now';
    if (mins < 60) return mins + ' minute' + (mins === 1 ? '' : 's') + ' ago';
    var hrs = Math.round(mins / 60);
    if (hrs < 24) return hrs + ' hour' + (hrs === 1 ? '' : 's') + ' ago';
    var days = Math.round(hrs / 24);
    return days + ' day' + (days === 1 ? '' : 's') + ' ago';
  }

  function bannerHtml() {
    var ob = onboard();
    var last = relTime(ob.lastBackupTime);
    var edits = ob.editsSinceBackup || 0;
    var stale = !ob.lastBackupTime || edits >= 10;
    return '<div class="rd-set__banner' + (stale ? ' rd-set__banner--amber' : '') + '" id="rd-set-banner">'
      + '<span class="rd-set__banner-icon">' + CHECK_SVG + '</span>'
      + '<span class="rd-set__banner-text"><b>Saved on this device by default.</b> Download a file backup before clearing '
      + 'browser data, switching browsers, or moving devices. Cloud sync is optional and opt-in — when enabled, '
      + 'wedding data you sync is stored on the server. We do not sell your data.</span>'
      + '<span class="rd-set__banner-meta">Last backup ' + esc(last || 'never') + ' · '
      + edits + ' edit' + (edits === 1 ? '' : 's') + ' since</span>'
      + '</div>';
  }

  function btn(label, onclick, danger, disabled) {
    return '<button type="button" class="rd-set__btn' + (danger ? ' rd-set__btn--danger' : '')
      + (disabled ? ' is-disabled' : '')
      + '" data-act="' + esc(onclick) + '"'
      + (disabled ? ' disabled aria-disabled="true"' : '')
      + '>' + esc(label) + '</button>';
  }
  function slot(id) { return '<span class="rd-set__slot" data-slot="' + esc(id) + '"></span>'; }

  function cardRow(title, desc, control) {
    return '<div class="rd-set__card-row"><div class="rd-set__card-row-text">'
      + '<div class="rd-set__card-row-title">' + esc(title) + '</div>'
      + (desc ? '<div class="rd-set__card-row-desc">' + esc(desc) + '</div>' : '')
      + '</div><div class="rd-set__card-row-control">' + control + '</div></div>';
  }

  function cachedSetupStatus() {
    return window._rdHostedSetupStatus || null;
  }

  function setupChip(ready, pendingLabel) {
    if (ready) return '<span class="rd-set__gs-chip rd-set__gs-chip--done">Ready</span>';
    return '<span class="rd-set__gs-chip rd-set__gs-chip--pend">' + esc(pendingLabel || 'Missing') + '</span>';
  }

  function setupStep(ready, title, desc, pendingLabel) {
    return '<div class="rd-set__gs-step' + (ready ? '' : ' is-muted') + '">'
      + setupChip(ready, pendingLabel)
      + '<div class="rd-set__gs-body">'
      + '<div class="rd-set__gs-title">' + esc(title) + '</div>'
      + '<div class="rd-set__gs-desc">' + desc + '</div>'
      + '</div></div>';
  }

  function hostedSetupShellHtml() {
    return '<div class="rd-hosted-setup" id="rd-hosted-setup">'
      + '<div class="rd-set__note"><b>Hosted setup checklist</b> — live capability from the sync API for '
      + '<code>PUBLIC_URL</code>, Google OAuth, and SMTP. Values of secrets are never shown — only ready / missing. '
      + 'Local demo still works with password login when Google/SMTP are unset.</div>'
      + '<div id="rd-hosted-setup-body"><div class="rd-set__note">Checking API…</div></div>'
      + cardRow('Refresh checklist', 'Re-reads GET /setup/status (booleans only)', btn('Refresh', 'rdHostedSetupRefresh'))
      + '</div>';
  }

  function renderHostedSetupBody(status) {
    if (!status || status.source === 'unreachable' || status.ok === false && status.db === 'unreachable') {
      return '<div class="rd-set__note rd-set__note--amber">Cannot reach the sync API. Set an API base URL and enable cloud, '
        + 'or start local Docker (<code>http://localhost:18787</code>). Offline planning still works.</div>';
    }
    if (status.db === 'down') {
      return '<div class="rd-set__note rd-set__note--amber">API reachable but database is down. Fix <code>DATABASE_URL</code> before auth/email will work.</div>';
    }

    var publicReady = !!status.publicUrlConfigured;
    var matchReady = !!status.clientMatchesPublicUrl;
    var googleReady = !!status.googleConfigured;
    var smtpReady = !!status.smtpConfigured;
    var publicDesc = publicReady
      ? ('Configured as <code>' + esc(status.publicUrl || '') + '</code> — used for OAuth redirects, password-reset links, RSVP / portal / invite URLs.')
      : 'Not set. Local demos fall back to the request host; hosted deploys need HTTPS <code>PUBLIC_URL</code> (see <code>docs/HOSTED_DEPLOY.md</code>).';
    var matchDesc;
    if (!status.clientApi) {
      matchDesc = 'No client API base saved yet. Paste the same origin as <code>PUBLIC_URL</code> under Cloud sync.';
    } else if (!publicReady) {
      matchDesc = 'Client points at <code>' + esc(status.clientApi) + '</code>. Server has no <code>PUBLIC_URL</code> (OK for local Docker).';
    } else if (matchReady) {
      matchDesc = 'Client <code>' + esc(status.clientApi) + '</code> matches server <code>PUBLIC_URL</code>.';
    } else {
      matchDesc = 'Client <code>' + esc(status.clientApi) + '</code> does <b>not</b> match server <code>'
        + esc(status.publicUrl || '') + '</code>. Update Settings → Cloud sync API base (or fix <code>PUBLIC_URL</code>).';
    }
    var googleDesc = googleReady
      ? 'Google Sign-In is ready. Redirect URI must include <code>…/auth/google/callback</code> — steps in <code>docs/AUTH.md</code>.'
      : 'Set <code>GOOGLE_CLIENT_ID</code> + <code>GOOGLE_CLIENT_SECRET</code> on the API. Until then, use email/password (local demo: <code>demo@covenant.local</code> / <code>covenant-demo</code>). Continue with Google stays disabled.';
    var smtpDesc = smtpReady
      ? 'SMTP is ready — password reset, RSVP invites, partner invite email, and vendor portal email can send.'
      : 'Set <code>SMTP_HOST</code> (and usually <code>SMTP_USER</code> / <code>SMTP_PASS</code> / <code>SMTP_FROM</code>). Without SMTP, reset / RSVP / invite <b>send</b> return 503 — you can still copy links manually. See <code>docs/AUTH.md</code>.';

    return setupStep(publicReady, 'PUBLIC_URL', publicDesc, 'Unset')
      + setupStep(matchReady || (!publicReady && !!status.clientApi), 'Client API matches PUBLIC_URL', matchDesc, matchReady ? 'Ready' : 'Check')
      + setupStep(googleReady, 'Google OAuth', googleDesc, 'Missing')
      + setupStep(smtpReady, 'SMTP (email)', smtpDesc, 'Missing')
      + '<div class="rd-set__note">Guides: <code>docs/AUTH.md</code> (Google + SMTP) · <code>docs/HOSTED_DEPLOY.md</code> (Railway/Fly secrets). '
      + '<b>Next polish (not this pass):</b> S3/R2 photo storage, then full Railway/Fly deploy wiring.</div>';
  }

  function applySetupStatusToControls(status) {
    if (!status) return;
    var googleBtn = document.querySelector('#rd-settings-overlay [data-act="rdCloudGoogle"]');
    if (googleBtn) {
      googleBtn.disabled = !status.googleConfigured;
      googleBtn.setAttribute('aria-disabled', status.googleConfigured ? 'false' : 'true');
      googleBtn.classList.toggle('is-disabled', !status.googleConfigured);
      googleBtn.title = status.googleConfigured
        ? ''
        : 'Google Sign-In needs GOOGLE_CLIENT_ID and GOOGLE_CLIENT_SECRET on the API (docs/AUTH.md).';
    }
    ['rdCloudForgotPassword', 'rdCloudForgotUsername'].forEach(function (act) {
      var el = document.querySelector('#rd-settings-overlay [data-act="' + act + '"]');
      if (!el) return;
      el.disabled = !status.smtpConfigured;
      el.setAttribute('aria-disabled', status.smtpConfigured ? 'false' : 'true');
      el.classList.toggle('is-disabled', !status.smtpConfigured);
      el.title = status.smtpConfigured
        ? ''
        : 'Email needs SMTP_* on the API (docs/AUTH.md). Endpoint returns 503 until configured.';
    });
    ['rdRsvpSend', 'rdRsvpRemind'].forEach(function (act) {
      var el = document.querySelector('#rd-settings-overlay [data-act="' + act + '"]');
      if (!el) return;
      el.disabled = !status.smtpConfigured;
      el.setAttribute('aria-disabled', status.smtpConfigured ? 'false' : 'true');
      el.classList.toggle('is-disabled', !status.smtpConfigured);
      el.title = status.smtpConfigured
        ? ''
        : 'RSVP email needs SMTP. Generate tokens and share links manually until SMTP is set.';
    });
    var rsvpHint = document.getElementById('rd-rsvp-smtp-hint');
    if (rsvpHint) {
      rsvpHint.innerHTML = status.smtpConfigured
        ? 'SMTP is configured — Send invites / reminders will attempt email.'
        : '<b>SMTP missing</b> — Send invites is disabled. Generate tokens and copy links, or set <code>SMTP_*</code> (see Hosted setup checklist on Cloud sync). API returns 503 <code>smtp_not_configured</code> until then.';
      rsvpHint.classList.toggle('rd-set__note--amber', !status.smtpConfigured);
    }
  }

  function hydrateHostedSetup() {
    var body = document.getElementById('rd-hosted-setup-body');
    var CS = window.CovenantCloudSync;
    if (!CS || typeof CS.fetchSetupStatus !== 'function') {
      if (body) {
        body.innerHTML = '<div class="rd-set__note rd-set__note--amber">Cloud bridge not loaded — open the planner with <code>js/cloud-sync.js</code>.</div>';
      }
      return;
    }
    var st = cloudStatus();
    if (!st.enabled && st.state === 'disabled') {
      // Still try if an API URL is saved; otherwise explain.
      var apiSaved = '';
      try { apiSaved = localStorage.getItem('covenant_cloud_api') || ''; } catch (e) { apiSaved = ''; }
      if (!apiSaved) {
        if (body) {
          body.innerHTML = '<div class="rd-set__note">Enable cloud with an API base first (local: <code>http://localhost:18787</code>). '
            + 'The checklist then reflects live Google / SMTP / PUBLIC_URL readiness.</div>';
        }
        return;
      }
    }
    CS.fetchSetupStatus().then(function (status) {
      window._rdHostedSetupStatus = status;
      if (body) body.innerHTML = renderHostedSetupBody(status);
      applySetupStatusToControls(status);
    }).catch(function () {
      if (body) {
        body.innerHTML = '<div class="rd-set__note rd-set__note--amber">Could not load setup status.</div>';
      }
    });
  }

  function card(title, desc, inner, extraClass, id) {
    return '<section class="rd-set__card' + (extraClass ? ' ' + extraClass : '') + '"'
      + (id ? ' id="' + esc(id) + '"' : '') + '><div class="rd-set__card-head">'
      + '<span class="rd-set__card-title">' + esc(title) + '</span></div>'
      + '<p class="rd-set__card-desc">' + esc(desc) + '</p>'
      + '<div class="rd-set__card-body">' + inner + '</div></section>';
  }

  function alertRules() {
    try {
      var raw = localStorage.getItem(ALERT_RULES_KEY);
      if (raw) return Object.assign({}, ALERT_RULE_DEFAULTS, JSON.parse(raw));
    } catch (e) { /* ignore */ }
    return Object.assign({}, ALERT_RULE_DEFAULTS);
  }

  function saveAlertRules(next) {
    try { localStorage.setItem(ALERT_RULES_KEY, JSON.stringify(next)); } catch (e) { /* ignore */ }
    if (typeof window.rdSyncProfileAlertSummary === 'function') window.rdSyncProfileAlertSummary();
  }

  function segControl(ruleKey, options, active) {
    return '<div class="rd-seg rd-set__seg" role="group" data-alert-rule="' + esc(ruleKey) + '">'
      + options.map(function (opt) {
        return '<button type="button" class="rd-seg__opt' + (opt.value === active ? ' is-active' : '')
          + '" data-value="' + esc(opt.value) + '">' + esc(opt.label) + '</button>';
      }).join('')
      + '</div>';
  }

  function switchControl(ruleKey, on, locked) {
    return '<button type="button" class="rd-gaps-switch' + (on ? ' is-on' : '') + (locked ? ' is-locked' : '')
      + '" role="switch" aria-checked="' + (on ? 'true' : 'false') + '" data-alert-toggle="' + esc(ruleKey) + '"'
      + (locked ? ' disabled' : '') + '><span class="rd-gaps-switch__dot"></span></button>';
  }

  function alertRulesCard() {
    var rules = alertRules();
    return card('Planner alert rules',
      'What earns an interruption. A notification is for something with a deadline and a consequence — never for activity.',
      cardRow('Payment due', 'Two reminders: seven days out and the morning of. A missed instalment can release a venue date.',
        segControl('paymentDue', [
          { value: 'off', label: 'Off' },
          { value: '7', label: '7 days' },
          { value: '7+1', label: '7 + 1 day' }
        ], rules.paymentDue))
      + cardRow('Contract expiring or unsigned', 'Fires on the cancellation window closing, not on the signature being late.',
        switchControl('contractWindow', rules.contractWindow))
      + cardRow('RSVP deadline passing', 'One digest of who has not answered, on the deadline. Not one per guest.',
        switchControl('rsvpDigest', rules.rsvpDigest))
      + cardRow('Blocked task became unblocked', 'The moment work can start is worth an interruption; the moment it was blocked is not.',
        switchControl('taskUnblocked', rules.taskUnblocked))
      + cardRow('Vendor uploaded a document', 'Off by default. It arrives in Planner History either way.',
        switchControl('vendorUpload', rules.vendorUpload))
      + cardRow('Someone else edited a record', 'Deliberately absent. A shared file that narrates itself teaches you to ignore it.',
        '<span class="rd-set__na">Not available</span>')
      + cardRow('Where they appear', 'No email, no push. The planner has no mail account and no server to send from.',
        segControl('delivery', [{ value: 'topbar', label: 'Top bar only' }], 'topbar'))
      + '<div class="rd-set__note">The notification panel behind the bell decides what needs you today. '
      + 'This pane decides what is allowed to reach it. Device settings live in this browser — restoring a backup '
      + 'on another machine brings the wedding, not these preferences.</div>',
      'rd-set__card--wide', 'rd-set-alert-rules');
  }

  function undoControl(which) {
    var b = document.getElementById(which === 'undo' ? 'undo-btn' : 'redo-btn');
    var disabled = !b || b.disabled;
    if (disabled) {
      return '<span class="rd-set__pillset"><span class="rd-set__pill rd-set__na">Nothing to '
        + which + '</span><span class="rd-set__pill rd-set__muted">Nothing yet</span></span>';
    }
    return btn(which === 'undo' ? 'Undo' : 'Redo', which === 'undo' ? 'undoPlannerChange' : 'redoPlannerChange');
  }

  function cardsHtml() {
    var ob = onboard();
    return '<div class="rd-set__cards">'
      + card('Save & backup', 'Everything saves automatically on this device. A downloaded backup is the only copy that survives a cleared browser.',
        cardRow('Save now', 'Last saved ' + (relTime(ob.lastSaveTime) || 'a moment ago'), btn('Save now', 'saveNow'))
        + cardRow('Protect plan (backup)', 'Downloads a .sqlite planner file', btn('Download backup', 'downloadSqliteBackup'))
        + cardRow('Full backup with photos', 'Zip: planner + local photo library', btn('Download full backup', 'downloadFullBackup'))
        + cardRow('Restore from backup', 'Accepts .zip, .sqlite, .db or .json', btn('Restore', 'rdSetRestore')))
      + card('History', 'Undo and redo cover recent changes on this device.',
        cardRow('Undo', '', undoControl('undo'))
        + cardRow('Redo', '', undoControl('redo'))
        + cardRow('Open change history', 'Every edit, by record and by field', btn('Open history', 'rdSetHistory')))
      + card('Export', 'One list at a time, or the whole planner as spreadsheets.',
        cardRow('List to export', '13 lists', slot('csv-export-select'))
        + cardRow('Export CSV', 'Opens in Excel, Numbers or Sheets', btn('Export CSV', 'exportSelectedListCSV')))
      + card('Print', 'Choose a page, then print it as it appears on screen.',
        cardRow('Page to print', '30 pages', slot('print-target-select'))
        + cardRow('Print page', 'Print styles are built into each page', btn('Print page', 'printSelectedSection')))
      + card('Region & format', 'Applies to every date, time and money figure in the planner.',
        cardRow('Region / locale', '12 locales', slot('s-locale'))
        + cardRow('Currency', '14 currencies', slot('s-currency'))
        + cardRow('Date format', 'MDY · DMY · YMD', slot('s-dateformat')))
      + card('Help & tools', 'Shortcuts to the help pages and table tools.',
        cardRow('Auto-fit columns', 'Fits the table you are looking at', btn('Auto-fit', 'autoFitActivePanelTables'))
        + cardRow('Get Started', 'How the planner works and your first steps', btn('Open', 'rdSetGetStarted'))
        + cardRow('Page-by-Page Guide', 'What each page does and what syncs', btn('Open', 'rdSetGuide'))
        + cardRow('FAQ', 'Answers to common questions', btn('Open', 'rdSetFaq')))
      + alertRulesCard()
      + '</div>'
      + '<div class="rd-set__footnote">Auto-fit acts on one table. Pages with two or three tables fit the one you last touched.</div>';
  }

  var SETTING_NAV = [
    { group: 'This device', items: [
      { id: 'overview', label: 'Overview' },
      { id: 'display', label: 'Display & density' },
      { id: 'dayof', label: 'Day-of mode' },
      { id: 'notifications', label: 'Notifications' }
    ]},
    { group: 'The planner', items: [
      { id: 'setup', label: 'Wedding setup' },
      { id: 'people', label: 'People & roles' },
      { id: 'money', label: 'Money rules' },
      { id: 'documents', label: 'Documents & printing' }
    ]},
    { group: 'This file', items: [
      { id: 'backup', label: 'Backup & restore' },
      { id: 'photos', label: 'Photos' },
      { id: 'import', label: 'Import' },
      { id: 'cloud', label: 'Cloud sync (beta)' },
      { id: 'rsvp', label: 'RSVP & guest portal' },
      { id: 'partners', label: 'Partner invites' },
      { id: 'vendors-portal', label: 'Vendor portal' },
      { id: 'privacy', label: 'Privacy' },
      { id: 'trash', label: 'Trash' },
      { id: 'about', label: 'About' }
    ]},
    { group: 'Help', items: [
      { id: 'getstarted', label: 'Get started' },
      { id: 'guide', label: 'Page-by-page guide' },
      { id: 'faq', label: 'FAQ' }
    ]}
  ];

  function paneShell(title, lead, body) {
    return '<div class="rd-set__pane">'
      + '<div class="rd-set__pane-head"><h3>' + esc(title) + '</h3>'
      + (lead ? '<p>' + esc(lead) + '</p>' : '') + '</div>'
      + '<div class="rd-set__pane-body">' + body + '</div></div>';
  }

  function cloudStatus() {
    try {
      if (window.CovenantCloudSync && typeof window.CovenantCloudSync.getStatus === 'function') {
        return window.CovenantCloudSync.getStatus();
      }
    } catch (e) { /* ignore */ }
    return { state: 'disabled', label: 'Cloud sync (beta)', detail: 'Not configured — offline-only (GA default).', enabled: false };
  }

  function cloudSyncPaneBody() {
    var st = cloudStatus();
    var setup = cachedSetupStatus();
    var stateLabel = ({
      disabled: 'Offline only',
      offline: 'Offline (no network)',
      signed_out: 'Signed out',
      signed_in: 'Signed in',
      syncing: 'Syncing…',
      synced: 'Synced',
      error: 'Error'
    })[st.state] || st.state;
    var user = st.user && st.user.email ? st.user.email : '';
    var html = '<div class="rd-set__note" id="rd-cloud-status" data-cloud-state="' + esc(st.state) + '">'
      + '<b>' + esc(st.label) + '</b> — status: <b>' + esc(stateLabel) + '</b>'
      + (user ? ' · ' + esc(user) : '')
      + (st.weddingId ? ' · wedding linked' : '')
      + (st.lastSync ? ' · last sync ' + esc(relTime(st.lastSync) || st.lastSync) : '')
      + (st.detail ? '<br>' + esc(st.detail) : '')
      + '</div>';

    html += hostedSetupShellHtml();

    if (!st.enabled && st.state === 'disabled') {
      html += '<div class="rd-set__note">Cloud stays off until an API base is configured, so offline GA is unbroken. '
        + 'Local Docker: <code>http://localhost:18787</code>. Hosted HTTPS: your deploy <code>PUBLIC_URL</code> '
        + '(see <code>docs/HOSTED_DEPLOY.md</code>). Set <code>covenant_cloud_api</code> + <code>covenant_cloud_enabled=1</code>, then reload. '
        + 'Also: <code>docs/OFFLINE_CLOUD_SYNC.md</code>.</div>';
      html += cardRow('API base URL', 'Stored in this browser only — local or hosted HTTPS',
        '<input type="url" class="rd-set__input" id="rd-cloud-api" placeholder="http://localhost:18787 or https://api.example.com" value="'
        + esc((function () { try { return localStorage.getItem('covenant_cloud_api') || ''; } catch (e) { return ''; } })())
        + '">');
      html += cardRow('Enable cloud sync', 'Still offline-first; guests + vendors + payments + budget + seating + contracts + timeline + packets + rentals + catering rentals + party + tasks + vendor arrivals + print packet overrides sync in beta',
        btn('Save & enable', 'rdCloudEnable'));
      html += '<div class="rd-set__note">Privacy: local by default. Enabling cloud means wedding rows you sync are stored on the API database. Photo binaries use object storage when hosted photo backup is configured — not giant base64 in Postgres. We do not sell data.</div>';
      return html;
    }

    if (st.state === 'signed_out' || (st.enabled && !user && st.state !== 'syncing' && st.state !== 'synced' && st.state !== 'error' && st.state !== 'signed_in')) {
      var googleReady = setup ? !!setup.googleConfigured : false;
      var smtpReady = setup ? !!setup.smtpConfigured : false;
      html += cardRow('Email or username', 'Demo: demo@covenant.local or demo',
        '<input type="text" class="rd-set__input" id="rd-cloud-email" autocomplete="username" placeholder="you@example.com or username">');
      html += cardRow('Password', '8+ characters',
        '<input type="password" class="rd-set__input" id="rd-cloud-password" autocomplete="current-password" placeholder="••••••••">');
      html += cardRow('Sign in', 'Creates a session on the sync API', btn('Sign in', 'rdCloudSignIn'));
      html += cardRow('Username (optional)', 'For new accounts — 3–32 chars',
        '<input type="text" class="rd-set__input" id="rd-cloud-username" autocomplete="nickname" placeholder="optional username">');
      html += cardRow('Create account', 'Email + password; username optional', btn('Register', 'rdCloudRegister'));
      html += cardRow(
        'Google Sign-In',
        googleReady
          ? 'Google OAuth is configured on this API'
          : 'Needs GOOGLE_CLIENT_ID / SECRET — see checklist above and docs/AUTH.md',
        btn('Continue with Google', 'rdCloudGoogle', false, setup ? !googleReady : false)
      );
      html += cardRow(
        'Forgot password',
        smtpReady ? 'Emails a reset link via SMTP' : 'Needs SMTP — disabled until configured (503 otherwise)',
        '<input type="email" class="rd-set__input" id="rd-cloud-forgot-email" placeholder="account email">'
        + btn('Send reset email', 'rdCloudForgotPassword', false, setup ? !smtpReady : false)
      );
      html += cardRow(
        'Forgot username',
        smtpReady ? 'Emails your username via SMTP' : 'Needs SMTP — disabled until configured',
        btn('Send username reminder', 'rdCloudForgotUsername', false, setup ? !smtpReady : false)
      );
      html += cardRow('Reset with token', 'Paste token from email if the link opened here',
        '<input type="text" class="rd-set__input" id="rd-cloud-reset-token" placeholder="reset token" value="'
        + esc((function () { try { return sessionStorage.getItem('covenant_cloud_reset_token') || ''; } catch (e) { return ''; } })())
        + '">'
        + '<input type="password" class="rd-set__input" id="rd-cloud-reset-pass" placeholder="new password (8+)">'
        + btn('Set new password', 'rdCloudResetPassword'));
      html += '<div class="rd-set__note">Cloud auth is optional. The planner keeps working offline with local save + file backup when you never sign in. Setup: <code>docs/AUTH.md</code>.</div>';
      html += cardRow('Disable cloud on this device', 'Keeps local data; stops network sync', btn('Turn off', 'rdCloudDisable'));
      return html;
    }

    html += cardRow('Sync now', 'Pull then push guests + vendors + payments + budget + seating + contracts + timeline + packets + rentals + catering rentals + party + tasks + vendor arrivals + print packet overrides (last-write-wins)', btn('Sync now', 'rdCloudSyncNow'));
    html += cardRow('Upload this wedding', 'Create/link cloud wedding and push local guests + vendors + payments + budget + seating + contracts + timeline + packets + rentals + catering rentals + party + tasks + vendor arrivals + print packet overrides', btn('Upload this wedding', 'rdCloudUpload'));
    html += cardRow('RSVP & guest portal', 'Generate links, send invites, gated landing settings', btn('Open', 'rdSetGotoRsvp'));
    html += cardRow('Partner invites', 'Invite a spouse or planner to this cloud wedding', btn('Open', 'rdSetGotoPartners'));
    html += cardRow('Vendor portal', 'Tokenized vendor packet links (scoped — not the full planner)', btn('Open', 'rdSetGotoVendorPortal'));
    html += cardRow('Sign out', 'Local planner keeps working offline', btn('Sign out', 'rdCloudSignOut'));
    html += cardRow('Disable cloud on this device', 'Flag off; offline GA path unchanged', btn('Turn off', 'rdCloudDisable'));
    html += '<div class="rd-set__note">Honest scope: <b>guests + vendors + payments + budget + seating + contracts + timeline + packets + rentals + catering rentals + party + tasks + vendor arrivals (vtimeline) + print packet overrides (vendorPackets / partyPackets / coordPacket)</b> sync in this beta. RSVP write-backs land on guests in Postgres and pull on sync. Docs: <code>docs/RSVP_AND_GUEST_PORTAL.md</code>.</div>';
    return html;
  }

  function rsvpPortalPaneBody() {
    var st = cloudStatus();
    var setup = cachedSetupStatus();
    var smtpReady = setup ? !!setup.smtpConfigured : false;
    var html = '<div class="rd-set__note" id="rd-rsvp-status">RSVP emails and the guest portal need a linked cloud wedding. The planner stays offline-first; sending mail and opening guest links need network when you use them.</div>';
    if (!st.enabled || st.state === 'disabled') {
      html += '<div class="rd-set__note">Enable cloud sync and sign in first.</div>';
      html += cardRow('Open cloud sync', '', btn('Open', 'rdSetGotoCloud'));
      return html;
    }
    if (st.state === 'signed_out' || !(st.user && st.user.email)) {
      html += '<div class="rd-set__note">Sign in on the Cloud sync pane, then upload/link this wedding.</div>';
      html += cardRow('Open cloud sync', '', btn('Open', 'rdSetGotoCloud'));
      return html;
    }
    if (!st.weddingId) {
      html += '<div class="rd-set__note">No cloud wedding linked yet — use <b>Upload this wedding</b> on Cloud sync.</div>';
      html += cardRow('Open cloud sync', '', btn('Open', 'rdSetGotoCloud'));
      return html;
    }

    html += '<div class="rd-set__note' + (setup && !smtpReady ? ' rd-set__note--amber' : '') + '" id="rd-rsvp-smtp-hint">'
      + (setup
        ? (smtpReady
          ? 'SMTP is configured — Send invites / reminders will attempt email.'
          : '<b>SMTP missing</b> — Send invites is disabled. Generate tokens and copy links, or set <code>SMTP_*</code> on Cloud sync → Hosted setup checklist.')
        : 'Checking SMTP capability…')
      + '</div>';

    html += cardRow('Refresh status', 'Tokens, sends, responses (from Postgres)', btn('Refresh', 'rdRsvpRefresh'));
    html += '<div class="rd-set__note" id="rd-rsvp-summary">Click Refresh to load RSVP status.</div>';
    html += cardRow('Generate RSVP links', 'Creates unique tokens — does not email. Share links manually if SMTP is unset.', btn('Generate tokens', 'rdRsvpTokens'));
    html += cardRow(
      'Send RSVP emails',
      smtpReady
        ? 'User action only — no automatic blasts.'
        : 'Disabled until SMTP is configured (API would return 503 smtp_not_configured).',
      btn('Send invites', 'rdRsvpSend', false, setup ? !smtpReady : false)
    );
    html += cardRow(
      'Send reminders',
      smtpReady ? 'Manual click only — never auto-blasted' : 'Disabled until SMTP is configured',
      btn('Send reminders', 'rdRsvpRemind', false, setup ? !smtpReady : false)
    );

    html += '<div class="rd-set__note" style="margin-top:1rem"><b>Gated guest portal</b> — unlisted hard-to-guess link; optional guest-email and/or rotatable couple code. Not a public wedding directory. Only published blocks appear for guests (planner-private notes stay private).</div>';
    html += cardRow('Portal slug', 'Letters, numbers, hyphens',
      '<input type="text" class="rd-set__input" id="rd-portal-slug" placeholder="alex-jordan-a1b2c3">');
    html += cardRow('Access mode', 'unlisted · email · code · email_or_code',
      '<select class="rd-set__input" id="rd-portal-mode">'
      + '<option value="unlisted">Unlisted link only</option>'
      + '<option value="email">Guest email must match list</option>'
      + '<option value="code">Custom couple code</option>'
      + '<option value="email_or_code">Email or code</option>'
      + '</select>');
    html += cardRow('Access code', 'Leave blank to keep current; rotate generates a new one',
      '<input type="text" class="rd-set__input" id="rd-portal-code" placeholder="optional new code" autocomplete="off">'
      + btn('Rotate code', 'rdPortalRotateCode'));
    html += '<div class="rd-set__note" style="margin-top:0.75rem"><b>Published blocks</b> — toggle which sections guests see, then edit content. Empty sections are omitted even when enabled.</div>';
    html += cardRow('Show blocks', 'Welcome · event · schedule · travel · lodging · registry · FAQ · hero',
      '<label style="display:flex;flex-wrap:wrap;gap:0.65rem 1rem;font-size:0.9rem">'
      + '<span><input type="checkbox" id="rd-portal-blk-welcome" checked> Welcome</span>'
      + '<span><input type="checkbox" id="rd-portal-blk-event" checked> Event</span>'
      + '<span><input type="checkbox" id="rd-portal-blk-schedule" checked> Schedule</span>'
      + '<span><input type="checkbox" id="rd-portal-blk-travel" checked> Travel</span>'
      + '<span><input type="checkbox" id="rd-portal-blk-lodging" checked> Lodging</span>'
      + '<span><input type="checkbox" id="rd-portal-blk-registry" checked> Registry</span>'
      + '<span><input type="checkbox" id="rd-portal-blk-faq" checked> FAQ</span>'
      + '<span><input type="checkbox" id="rd-portal-blk-hero" checked> Hero</span>'
      + '</label>');
    html += cardRow('Headline / subhead', 'Hero welcome text',
      '<input type="text" class="rd-set__input" id="rd-portal-headline" placeholder="Alex & Jordan">'
      + '<input type="text" class="rd-set__input" id="rd-portal-subhead" placeholder="We cannot wait to celebrate with you">');
    html += cardRow('Date / venue / dress code', 'Event details block',
      '<input type="text" class="rd-set__input" id="rd-portal-date" placeholder="Date">'
      + '<input type="text" class="rd-set__input" id="rd-portal-venue" placeholder="Venue">'
      + '<input type="text" class="rd-set__input" id="rd-portal-dress" placeholder="Dress code">');
    html += cardRow('Welcome message', 'Planner-private guest notes stay private',
      '<textarea class="rd-set__input" id="rd-portal-message" rows="3" placeholder="Welcome note for guests"></textarea>');
    html += cardRow('Schedule snippet', 'Day-of overview for guests',
      '<textarea class="rd-set__input" id="rd-portal-schedule" rows="3" placeholder="3pm ceremony · 5pm cocktail hour · 6pm dinner"></textarea>');
    html += cardRow('Travel', 'Directions, airports, shuttles',
      '<textarea class="rd-set__input" id="rd-portal-travel" rows="2" placeholder="Fly into…"></textarea>');
    html += cardRow('Lodging', 'Hotel blocks / room rates',
      '<textarea class="rd-set__input" id="rd-portal-lodging" rows="2" placeholder="Hotel block under…"></textarea>');
    html += cardRow('Registry links', 'One per line: Label | https://…',
      '<textarea class="rd-set__input" id="rd-portal-registry" rows="3" placeholder="Crate & Barrel | https://…"></textarea>');
    html += cardRow('FAQ', 'One per line: Question || Answer',
      '<textarea class="rd-set__input" id="rd-portal-faq" rows="4" placeholder="Can I bring a plus-one? || Please RSVP with your guest name."></textarea>');
    html += cardRow('Hero image URL', 'http(s) or local /path only — optional',
      '<input type="text" class="rd-set__input" id="rd-portal-hero" placeholder="https://… or /photos/hero.jpg">');
    html += cardRow('RSVP hint', 'Shown near the bottom',
      '<input type="text" class="rd-set__input" id="rd-portal-rsvp-hint" placeholder="Check your email for a personal RSVP link">');
    html += cardRow('Enable portal', 'Saves gate + published blocks', btn('Save portal', 'rdPortalSave'));
    html += '<div class="rd-set__note" id="rd-portal-summary">Portal URL appears here after save.</div>';
    html += '<div class="rd-set__note">Docs: <code>docs/RSVP_AND_GUEST_PORTAL.md</code>. Real email needs SMTP + PUBLIC_URL — see Cloud sync → Hosted setup checklist.</div>';
    return html;
  }

  function partnerInvitesPaneBody() {
    var st = cloudStatus();
    var html = '<div class="rd-set__note" id="rd-partner-status">Invite a spouse or planner to the same cloud wedding. Partners can sync and edit planner data; they cannot remove the owner. Offline use is unchanged — invites are a cloud feature.</div>';
    if (!st.enabled || st.state === 'disabled') {
      html += '<div class="rd-set__note">Enable cloud sync and sign in first.</div>';
      html += cardRow('Open cloud sync', '', btn('Open', 'rdSetGotoCloud'));
      return html;
    }
    if (st.state === 'signed_out' || !(st.user && st.user.email)) {
      html += '<div class="rd-set__note">Sign in on the Cloud sync pane first.</div>';
      html += cardRow('Open cloud sync', '', btn('Open', 'rdSetGotoCloud'));
      return html;
    }

    html += '<div class="rd-set__note" style="margin-top:0.5rem"><b>Invites for you</b> — accept when someone invited this account.</div>';
    html += cardRow('Refresh my pending invites', 'Matching your signed-in email / username', btn('Refresh inbox', 'rdPartnerPending'));
    html += '<div class="rd-set__note" id="rd-partner-inbox">Click Refresh inbox after sign-in.</div>';

    if (!st.weddingId) {
      html += '<div class="rd-set__note">To invite others, link this wedding first (Upload this wedding on Cloud sync).</div>';
      html += cardRow('Open cloud sync', '', btn('Open', 'rdSetGotoCloud'));
      return html;
    }

    html += '<div class="rd-set__note" style="margin-top:1rem"><b>Invite someone to this wedding</b></div>';
    html += cardRow('Email', 'Required — invite is private to this wedding only',
      '<input type="email" class="rd-set__input" id="rd-partner-email" placeholder="partner@example.com" autocomplete="email">');
    html += cardRow('Username (optional)', 'Only if they already have an account',
      '<input type="text" class="rd-set__input" id="rd-partner-username" placeholder="optional username" autocomplete="off">');
    html += cardRow('Role', 'partner (editor) or planner',
      '<select class="rd-set__input" id="rd-partner-role">'
      + '<option value="partner">Partner</option>'
      + '<option value="planner">Planner</option>'
      + '</select>');
    html += cardRow('Send invite', 'Email when SMTP is set; otherwise copy the link', btn('Invite', 'rdPartnerInvite'));
    html += '<div class="rd-set__note" id="rd-partner-invite-result"></div>';

    html += cardRow('Members & pending', 'List accepted members and pending invites', btn('Refresh list', 'rdPartnerRefresh'));
    html += '<div class="rd-set__note" id="rd-partner-list">Click Refresh list to load members and pending invites.</div>';
    html += '<div class="rd-set__note">Docs: <code>docs/PARTNER_INVITES.md</code>. Without SMTP, copy the invite URL from the result.</div>';
    return html;
  }

  function vendorPortalPaneBody() {
    var st = cloudStatus();
    var html = '<div class="rd-set__note" id="rd-vp-status">Create an unguessable portal link for a synced vendor. Vendors see only their scoped packet (brief, schedule slice, paperwork) — not the full planner. Offline planning is unchanged; this is a cloud feature.</div>';
    if (!st.enabled || st.state === 'disabled') {
      html += '<div class="rd-set__note">Enable cloud sync and sign in first.</div>';
      html += cardRow('Open cloud sync', '', btn('Open', 'rdSetGotoCloud'));
      return html;
    }
    if (st.state === 'signed_out' || !(st.user && st.user.email)) {
      html += '<div class="rd-set__note">Sign in on the Cloud sync pane first.</div>';
      html += cardRow('Open cloud sync', '', btn('Open', 'rdSetGotoCloud'));
      return html;
    }
    if (!st.weddingId) {
      html += '<div class="rd-set__note">Link this wedding first (Upload this wedding on Cloud sync), then sync vendors.</div>';
      html += cardRow('Open cloud sync', '', btn('Open', 'rdSetGotoCloud'));
      return html;
    }

    html += cardRow('Refresh vendors & tokens', 'Loads cloud vendors and active portal links', btn('Refresh', 'rdVpRefresh'));
    html += cardRow('Vendor', 'Must already exist on the linked cloud wedding',
      '<select class="rd-set__input" id="rd-vp-vendor"><option value="">— refresh to load —</option></select>');
    html += cardRow('Label (optional)', 'e.g. Day-of catering link',
      '<input type="text" class="rd-set__input" id="rd-vp-label" placeholder="optional label" autocomplete="off">');
    html += '<div class="rd-set__note" style="margin-top:0.75rem"><b>Packet scopes</b> — what this vendor may see. Never dumps the full planner or internal notes.</div>';
    html += cardRow('Scopes', 'Toggle blocks on this link',
      '<label style="display:flex;flex-wrap:wrap;gap:0.65rem 1rem;font-size:0.9rem">'
      + '<span><input type="checkbox" id="rd-vp-sc-brief" checked> Brief</span>'
      + '<span><input type="checkbox" id="rd-vp-sc-schedule" checked> Schedule</span>'
      + '<span><input type="checkbox" id="rd-vp-sc-paperwork" checked> Paperwork</span>'
      + '<span><input type="checkbox" id="rd-vp-sc-counts" checked> Counts</span>'
      + '<span><input type="checkbox" id="rd-vp-sc-contacts" checked> Contacts</span>'
      + '<span><input type="checkbox" id="rd-vp-sc-arrival" checked> Arrival</span>'
      + '<span><input type="checkbox" id="rd-vp-sc-parking" checked> Parking</span>'
      + '<span><input type="checkbox" id="rd-vp-sc-notes" checked> Day notes</span>'
      + '<span><input type="checkbox" id="rd-vp-sc-uploads" checked> Uploads</span>'
      + '</label>');
    html += '<div class="rd-set__note" style="margin-top:0.5rem"><b>Published packet fields</b> — couple-written content for this link only (not raw vendor.notes).</div>';
    html += cardRow('Arrival / load-in', '',
      '<input type="text" class="rd-set__input" id="rd-vp-arrival" placeholder="Arrival window e.g. 2:00–3:00pm">'
      + '<input type="text" class="rd-set__input" id="rd-vp-loadin" placeholder="Load-in notes">');
    html += cardRow('Parking / venue access', '',
      '<textarea class="rd-set__input" id="rd-vp-parking" rows="2" placeholder="Parking instructions"></textarea>'
      + '<textarea class="rd-set__input" id="rd-vp-venue-access" rows="2" placeholder="Venue access / loading bay"></textarea>');
    html += cardRow('Day-of notes', 'Published for this vendor link only',
      '<textarea class="rd-set__input" id="rd-vp-daynotes" rows="3" placeholder="Anything they need on the day"></textarea>');
    html += cardRow('Day-of contact', 'Shown when Contacts scope is on',
      '<input type="text" class="rd-set__input" id="rd-vp-contact-name" placeholder="Contact name">'
      + '<input type="text" class="rd-set__input" id="rd-vp-contact-phone" placeholder="Phone">'
      + '<input type="text" class="rd-set__input" id="rd-vp-contact-role" placeholder="Role e.g. Planner">');
    html += cardRow('Email link', 'Uses vendor email when checked; needs SMTP',
      '<label style="display:flex;align-items:center;gap:0.4rem;font-size:0.92rem">'
      + '<input type="checkbox" id="rd-vp-send-email"> Send email if SMTP is configured</label>');
    html += cardRow('Create portal link', 'Returns a copyable URL; no public directory', btn('Create link', 'rdVpCreate'));
    html += '<div class="rd-set__note" id="rd-vp-create-result"></div>';
    html += '<div class="rd-set__note" id="rd-vp-list">Click Refresh to load tokens.</div>';
    html += '<div class="rd-set__note">Docs: <code>docs/VENDOR_PORTAL.md</code>. Revoke stops the live link immediately; rotate issues a new URL (keeps published blocks).</div>';
    return html;
  }

  function navHtml(active) {
    return '<nav class="rd-set__nav" aria-label="Settings panes">'
      + SETTING_NAV.map(function (g) {
        return '<div class="rd-set__nav-grp">' + esc(g.group) + '</div>'
          + g.items.map(function (it) {
            return '<button type="button" class="rd-set__nav-item' + (it.id === active ? ' is-active' : '')
              + '" data-set-pane="' + esc(it.id) + '">' + esc(it.label) + '</button>';
          }).join('');
      }).join('')
      + '</nav>';
  }

  function photosListHtml(lib) {
    lib = lib || [];
    if (!lib.length) {
      return 'No library photos yet. Couple hero and Vision Board pins still save with the planner; use <b>Add photos</b> for the IndexedDB library included in full zip backups.';
    }
    return '<ul class="rd-set__photo-list" style="margin:0;padding-left:1.1rem">'
      + lib.slice(0, 40).map(function (p) {
        var label = esc((p && (p.name || p.caption || p.id)) || 'photo');
        var meta = esc([p && p.mime, p && p.size ? (Math.round(p.size / 1024) + ' KB') : '', p && p.kind].filter(Boolean).join(' · '));
        return '<li style="margin:0.35rem 0"><span>' + label + '</span>'
          + (meta ? ' <span class="rd-set__muted">(' + meta + ')</span>' : '')
          + ' <button type="button" class="rd-set__btn" data-act="rdPhotosRemove" data-photo-id="'
          + esc(p && p.id ? p.id : '') + '" style="margin-left:0.35rem">Remove</button></li>';
      }).join('')
      + (lib.length > 40 ? '<li class="rd-set__muted">…and ' + (lib.length - 40) + ' more</li>' : '')
      + '</ul>';
  }

  function refreshPhotosPane(ov) {
    if ((window._rdSetPane || 'overview') !== 'photos') return;
    var main = ov && ov.querySelector('#rd-set-main');
    if (!main) return;
    main.innerHTML = paneHtml('photos');
    wireActions(ov);
    wirePhotoFile(ov);
  }

  function wirePhotoFile(ov) {
    var input = ov && ov.querySelector('#rd-photos-file');
    if (!input || input.dataset.bound) return;
    input.dataset.bound = '1';
    input.addEventListener('change', function () {
      var files = Array.prototype.slice.call(input.files || []);
      input.value = '';
      if (!files.length) return;
      if (typeof CovenantPhotos === 'undefined' || !CovenantPhotos || typeof CovenantPhotos.putFromFile !== 'function') {
        if (typeof showToast === 'function') showToast('Photo store not loaded.', 'warn');
        return;
      }
      var i = 0;
      function next() {
        if (i >= files.length) {
          refreshPhotosPane(document.getElementById(OVERLAY_ID));
          if (typeof showToast === 'function') showToast('Added ' + files.length + ' photo' + (files.length === 1 ? '' : 's') + ' to local library');
          return;
        }
        var f = files[i++];
        CovenantPhotos.putFromFile(f, { kind: 'library' })
          .then(next)
          .catch(function (err) {
            console.warn('[photos]', err);
            if (typeof showToast === 'function') showToast((err && err.message) || 'Photo add failed', 'warn');
            next();
          });
      }
      next();
    });
  }

  function paneHtml(id) {
    if (id === 'overview' || !id) return bannerHtml() + cardsHtml();
    if (id === 'display') {
      return paneShell('Display & density',
        'Look & feel lives in Profile & Display — density is the one people change hourly.',
        cardRow('Open Profile & Display', 'Appearance, font, planning view, density', btn('Open', 'rdSetProfile'))
        + cardRow('Region & format', 'Locale, currency, date order', '<span class="rd-set__muted">On Overview</span>'));
    }
    if (id === 'dayof') {
      return paneShell('Day-of mode',
        'On the day nobody edits records. They check the time, read the next cue, and phone somebody.',
        cardRow('Open day-of timeline', 'Wedding Day Timeline · current cue', btn('Open timeline', 'rdSetTimeline'))
        + '<div class="rd-set__note">Day-of mode hides edit chrome. It does not delete anything.</div>');
    }
    if (id === 'notifications') {
      return paneShell('Notifications',
        'What earns an interruption. A notification is for something with a deadline and a consequence.',
        alertRulesCard());
    }
    if (id === 'setup') {
      return paneShell('Wedding setup',
        'The eleven facts every other page reads — couple, date, venues, budget target, timezone.',
        cardRow('Open Wedding Setup', 'Couple, date, venues, menu visibility', btn('Open', 'rdSetSetup')));
    }
    if (id === 'people') {
      return paneShell('People & roles',
        'Who can reach which pages. Viewer preferences hold the link list; Profile Access holds this person.',
        cardRow('Viewer preferences', 'Who has a way in', btn('Open', 'rdSetViewerPrefs'))
        + cardRow('Your Access tab', 'What you can reach on this device', btn('Open Access', 'rdSetAccessTab')));
    }
    if (id === 'money') {
      return paneShell('Money rules',
        'Currency and date format apply to every money figure. Budget target lives on Wedding Setup.',
        cardRow('Currency & locale', 'On Overview · Region & format', '<span class="rd-set__muted">On Overview</span>')
        + cardRow('Budget target', 'Owned by Wedding Setup', btn('Open Setup', 'rdSetSetup')));
    }
    if (id === 'documents') {
      return paneShell('Documents & printing',
        'Print a page as it appears. Export one list at a time as CSV.',
        cardRow('Print page', '30 pages', btn('Print', 'printSelectedSection'))
        + cardRow('Export CSV', '13 lists', btn('Export', 'exportSelectedListCSV'))
        + cardRow('Auto-fit columns', 'Fits the table you last touched', btn('Auto-fit', 'autoFitActivePanelTables')));
    }
    if (id === 'backup') {
      return paneShell('Backup & restore',
        'Local file backup — no Postgres on this device. A downloaded file is the only copy that survives a cleared browser.',
        cardRow('Download backup', 'Planner as a single .sqlite file', btn('Download backup', 'downloadSqliteBackup'))
        + cardRow('Full backup with photos', '.zip with planner + photo library blobs', btn('Download full backup', 'downloadFullBackup'))
        + cardRow('Restore from backup', 'Accepts .zip, .sqlite, .db or .json', btn('Restore', 'rdSetRestore'))
        + cardRow('Save now', '', btn('Save now', 'saveNow'))
        + '<div class="rd-set__note">Offline by default. Optional cloud sync (separate pane) stores what you opt in to sync — it is not a substitute for downloading a file backup. See <code>docs/BACKUP_AND_PHOTOS.md</code>.</div>');
    }
    if (id === 'photos') {
      var lib = [];
      try {
        if (typeof CovenantPhotos !== 'undefined' && CovenantPhotos && typeof CovenantPhotos.ensureLibrary === 'function') {
          lib = CovenantPhotos.ensureLibrary() || [];
        } else if (typeof data !== 'undefined' && data && Array.isArray(data.photoLibrary)) {
          lib = data.photoLibrary;
        }
      } catch (e) {}
      var count = lib.length;
      return paneShell('Photos',
        'Local photo library for offline use. Bytes stay in IndexedDB on this device; metadata is listed here. Include them in a full .zip backup.',
        cardRow('Photo library', count + ' photo' + (count === 1 ? '' : 's') + ' on this device',
          btn('Add photos', 'rdPhotosAdd') + ' ' + btn('Refresh list', 'rdPhotosRefresh'))
        + '<div id="rd-photos-list" class="rd-set__note">' + photosListHtml(lib) + '</div>'
        + '<div class="rd-set__note">Couple hero and Vision Board pins still work as before. New library photos use IndexedDB blobs (refs like <code>idb:…</code>) so backups can ship binaries without stuffing huge base64 into cloud Postgres rows. Online photo metadata + object storage scaffolding: <code>docs/BACKUP_AND_PHOTOS.md</code>.</div>'
        + '<input type="file" id="rd-photos-file" accept="image/*" multiple style="display:none">');
    }
    if (id === 'import') {
      return paneShell('Import',
        'Restore replaces this browser\'s copy with the file you choose.',
        cardRow('Restore from file', 'Same path as backup restore (.zip / .sqlite / .json)', btn('Choose file', 'rdSetRestore')));
    }
    if (id === 'cloud') {
      return paneShell('Cloud sync (beta)',
        'Optional and opt-in. Offline planning always works. When enabled, wedding data you sync is stored on the sync API. Guests, vendors, payments, budget, seating, contracts, timeline, packets, rentals, catering rentals, party, tasks, vendor arrivals, and print packet overrides sync in beta — not full multi-user realtime yet.',
        cloudSyncPaneBody());
    }
    if (id === 'rsvp') {
      return paneShell('RSVP & guest portal',
        'Couple-controlled RSVP links and a gated wedding landing. Not SEO-indexed. Responses write back to guests in Postgres so cloud sync picks them up.',
        rsvpPortalPaneBody());
    }
    if (id === 'partners') {
      return paneShell('Partner invites',
        'Invite a spouse or planner to this cloud wedding with partner or planner access. Not a public listing.',
        partnerInvitesPaneBody());
    }
    if (id === 'vendors-portal') {
      return paneShell('Vendor portal',
        'Tokenized links for a scoped vendor packet. Privacy: link required — not a public vendor directory.',
        vendorPortalPaneBody());
    }
    if (id === 'privacy') {
      return paneShell('Privacy',
        'Local-first by design. You should never need to install Postgres to plan a wedding.',
        '<div class="rd-set__note"><b>Local by default.</b> Planner data and the photo library live in this browser (localStorage + SQLite/IndexedDB). No account is required for core planning.</div>'
        + '<div class="rd-set__note"><b>Optional cloud.</b> Cloud sync is opt-in. When you enable it and sign in, we store the wedding rows you sync on the API database (managed Postgres on the host — not on your laptop). That is online backup of synced domains, not “we store nothing.”</div>'
        + '<div class="rd-set__note"><b>We do not sell your data.</b> File backups you download stay under your control. Photo binaries prefer object storage (S3/R2) or local disk when online photo backup is configured — metadata in the database, blobs elsewhere.</div>'
        + cardRow('Open backup & restore', 'Download or restore a local file', btn('Open', 'rdSetGotoBackup'))
        + cardRow('Open cloud sync', 'Optional; offline still works with it off', btn('Open', 'rdSetGotoCloud')));
    }
    if (id === 'trash') {
      return paneShell('Trash',
        'The planner does not keep a separate trash bin. Deleted rows leave Planner History.',
        '<div class="rd-set__note">Undo covers recent deletes on this device. Older deletes stay in Planner History as a record of what changed — they are not recoverable from a trash list.</div>'
        + cardRow('Open Planner History', '', btn('Open history', 'rdSetHistory')));
    }
    if (id === 'about') {
      return paneShell('About',
        'The Covenant Wedding Planner — offline-first, one file per wedding.',
        '<div class="rd-set__note">Offline by default: no account required, no tracking. Data stays on this device until you download a backup or opt into cloud sync. Optional <b>Cloud sync (beta)</b> stores what you sync on the API when enabled — we do not sell data, and we do not claim “we store nothing” once cloud backup is on. Photos: local IndexedDB library + file zip backup; online object-storage scaffolding is separate. Look &amp; feel lives in Profile &amp; Display; this window holds backups, privacy, exports, printing, history and regional format. Docs: <code>docs/BACKUP_AND_PHOTOS.md</code>.</div>');
    }
    if (id === 'getstarted') {
      return paneShell('Get started', 'How the planner works and your first steps.',
        cardRow('Open Get Started', '', btn('Open', 'rdSetGetStarted')));
    }
    if (id === 'guide') {
      return paneShell('Page-by-page guide', 'What each page does and what syncs.',
        cardRow('Open guide', '', btn('Open', 'rdSetGuide')));
    }
    if (id === 'faq') {
      return paneShell('FAQ', 'Answers to common questions.',
        cardRow('Open FAQ', '', btn('Open', 'rdSetFaq')));
    }
    return bannerHtml() + cardsHtml();
  }

  function bodyHtml(pane) {
    var active = pane || window._rdSetPane || 'overview';
    return '<div class="rd-set__grid">'
      + navHtml(active)
      + '<div class="rd-set__main" id="rd-set-main">' + paneHtml(active) + '</div>'
      + '</div>';
  }

  function wireAlertRules(ov) {
    var rules = alertRules();
    Array.prototype.forEach.call(ov.querySelectorAll('[data-alert-rule]'), function (group) {
      var key = group.getAttribute('data-alert-rule');
      if (key === 'delivery') return;
      Array.prototype.forEach.call(group.querySelectorAll('.rd-seg__opt'), function (opt) {
        opt.addEventListener('click', function () {
          rules[key] = opt.getAttribute('data-value');
          saveAlertRules(rules);
          Array.prototype.forEach.call(group.querySelectorAll('.rd-seg__opt'), function (o) {
            o.classList.toggle('is-active', o === opt);
          });
        });
      });
    });
    Array.prototype.forEach.call(ov.querySelectorAll('[data-alert-toggle]'), function (sw) {
      sw.addEventListener('click', function () {
        if (sw.disabled || sw.classList.contains('is-locked')) return;
        var key = sw.getAttribute('data-alert-toggle');
        rules[key] = !rules[key];
        saveAlertRules(rules);
        sw.classList.toggle('is-on', rules[key]);
        sw.setAttribute('aria-checked', rules[key] ? 'true' : 'false');
      });
    });
  }

  function wireNav(ov) {
    Array.prototype.forEach.call(ov.querySelectorAll('[data-set-pane]'), function (btn) {
      btn.addEventListener('click', function () {
        window._rdSetPane = btn.getAttribute('data-set-pane') || 'overview';
        var main = ov.querySelector('#rd-set-main');
        if (main) {
          main.innerHTML = paneHtml(window._rdSetPane);
          moveSlots(ov);
          wireActions(ov);
          afterPanePaint(window._rdSetPane);
        }
        Array.prototype.forEach.call(ov.querySelectorAll('[data-set-pane]'), function (b) {
          b.classList.toggle('is-active', b === btn);
        });
      });
    });
  }

  function afterPanePaint(paneId) {
    if (paneId === 'cloud' || paneId === 'rsvp') hydrateHostedSetup();
  }

  function refreshCloudPane(ov) {
    if ((window._rdSetPane || 'overview') !== 'cloud') return;
    var main = ov && ov.querySelector('#rd-set-main');
    if (!main) return;
    main.innerHTML = paneHtml('cloud');
    wireActions(ov);
    afterPanePaint('cloud');
  }

  function cloudMsg(ok, text) {
    if (typeof showToast === 'function') showToast(text);
    else if (!ok) console.warn('[cloud]', text);
    var ov = document.getElementById(OVERLAY_ID);
    refreshCloudPane(ov);
  }

  function wireActions(ov) {
    var closeBtn = ov.querySelector('.rd-set__close');
    if (closeBtn && !closeBtn.dataset.bound) {
      closeBtn.dataset.bound = '1';
      closeBtn.addEventListener('click', close);
    }
    Array.prototype.forEach.call(ov.querySelectorAll('[data-act]'), function (b) {
      if (b.dataset.actBound) return;
      b.dataset.actBound = '1';
      b.addEventListener('click', function () { run(b.getAttribute('data-act'), b); });
    });
    wireAlertRules(ov);
    wirePhotoFile(ov);
  }

  function moveSlots(ov) {
    Array.prototype.forEach.call(ov.querySelectorAll('[data-slot]'), function (s) {
      var el = document.getElementById(s.getAttribute('data-slot'));
      if (el) s.appendChild(el);
    });
  }

  function build() {
    var ov = document.getElementById(OVERLAY_ID);
    if (!ov) {
      ov = document.createElement('div');
      ov.id = OVERLAY_ID;
      ov.className = 'rd-settings-overlay';
      document.body.appendChild(ov);
      ov.addEventListener('click', function (e) { if (e.target === ov) close(); });
    }
    ov.innerHTML =
      '<div class="rd-settings-window" role="dialog" aria-modal="true" aria-label="Settings">'
      + '<div class="rd-set__head rd-set__head--forest">'
      + '<span class="rd-set__mark">' + GEAR_SVG + '</span>'
      + '<div class="rd-set__head-copy">'
      + '<span class="rd-set__title">Settings</span>'
      + '<span class="rd-set__saved">Backups, exports, printing, history and regional format. '
      + 'Look &amp; feel lives in Profile &amp; Display.</span>'
      + '</div>'
      + '<button type="button" class="rd-set__profile-chip" data-act="rdSetProfile">Profile &amp; Display</button>'
      + '<button type="button" class="rd-set__close" aria-label="Close settings">&times;</button>'
      + '</div>'
      + '<div class="rd-set__panebody">' + bodyHtml(window._rdSetPane || 'overview') + '</div>'
      + '</div>';

    moveSlots(ov);
    wireActions(ov);
    wireNav(ov);
    afterPanePaint(window._rdSetPane || 'overview');
    return ov;
  }

  function refreshPane(paneId) {
    var ov = document.getElementById(OVERLAY_ID);
    if (!ov) return;
    window._rdSetPane = paneId || window._rdSetPane || 'overview';
    var main = ov.querySelector('#rd-set-main');
    if (main) {
      main.innerHTML = paneHtml(window._rdSetPane);
      moveSlots(ov);
      wireActions(ov);
      afterPanePaint(window._rdSetPane);
    }
    Array.prototype.forEach.call(ov.querySelectorAll('[data-set-pane]'), function (b) {
      b.classList.toggle('is-active', b.getAttribute('data-set-pane') === window._rdSetPane);
    });
  }

  function run(name, el) {
    try {
      if (name === 'rdCloudEnable') {
        var apiEl = document.getElementById('rd-cloud-api');
        var api = apiEl ? String(apiEl.value || '').trim().replace(/\/$/, '') : '';
        if (!api) { cloudMsg(false, 'Enter an API base URL first.'); return; }
        try {
          localStorage.setItem('covenant_cloud_api', api);
          localStorage.setItem('covenant_cloud_enabled', '1');
        } catch (e) { cloudMsg(false, 'Could not save cloud settings.'); return; }
        cloudMsg(true, 'Cloud sync enabled — sign in to continue.');
        return;
      }
      if (name === 'rdCloudDisable') {
        try {
          localStorage.setItem('covenant_cloud_enabled', '0');
        } catch (e) { /* ignore */ }
        cloudMsg(true, 'Cloud sync turned off on this device.');
        return;
      }
      if (name === 'rdCloudSignIn' || name === 'rdCloudRegister') {
        var emailEl = document.getElementById('rd-cloud-email');
        var passEl = document.getElementById('rd-cloud-password');
        var userEl = document.getElementById('rd-cloud-username');
        var email = emailEl ? String(emailEl.value || '').trim() : '';
        var pass = passEl ? String(passEl.value || '') : '';
        var uname = userEl ? String(userEl.value || '').trim() : '';
        if (!email || !pass) { cloudMsg(false, 'Email/username and password required.'); return; }
        var CS = window.CovenantCloudSync;
        if (!CS) { cloudMsg(false, 'Cloud bridge not loaded.'); return; }
        var op = name === 'rdCloudRegister'
          ? CS.register(email, pass, '', uname)
          : CS.signIn(email, pass);
        op.then(function () { cloudMsg(true, name === 'rdCloudRegister' ? 'Account created.' : 'Signed in.'); })
          .catch(function (err) { cloudMsg(false, (err && err.message) || 'Auth failed'); });
        return;
      }
      if (name === 'rdCloudGoogle') {
        var gSetup = cachedSetupStatus();
        if (gSetup && !gSetup.googleConfigured) {
          cloudMsg(false, 'Google Sign-In is not configured. Set GOOGLE_CLIENT_ID and GOOGLE_CLIENT_SECRET (docs/AUTH.md).');
          return;
        }
        if (!window.CovenantCloudSync || typeof window.CovenantCloudSync.startGoogleSignIn !== 'function') {
          cloudMsg(false, 'Cloud bridge not loaded.');
          return;
        }
        cloudMsg(true, 'Redirecting to Google…');
        window.CovenantCloudSync.startGoogleSignIn();
        return;
      }
      if (name === 'rdHostedSetupRefresh') {
        var bodyEl = document.getElementById('rd-hosted-setup-body');
        if (bodyEl) bodyEl.innerHTML = '<div class="rd-set__note">Refreshing…</div>';
        hydrateHostedSetup();
        if (typeof showToast === 'function') showToast('Hosted setup checklist refreshed');
        return;
      }
      if (name === 'rdCloudForgotPassword') {
        var fpSetup = cachedSetupStatus();
        if (fpSetup && !fpSetup.smtpConfigured) {
          cloudMsg(false, 'SMTP is not configured. Set SMTP_HOST (and usually SMTP_USER / SMTP_PASS / SMTP_FROM) — docs/AUTH.md.');
          return;
        }
        var fe = document.getElementById('rd-cloud-forgot-email') || document.getElementById('rd-cloud-email');
        var femail = fe ? String(fe.value || '').trim() : '';
        if (!femail) { cloudMsg(false, 'Enter the account email first.'); return; }
        if (!window.CovenantCloudSync) { cloudMsg(false, 'Cloud bridge not loaded.'); return; }
        window.CovenantCloudSync.forgotPassword(femail)
          .then(function (body) { cloudMsg(true, (body && body.message) || 'Reset email sent (if account exists).'); })
          .catch(function (err) { cloudMsg(false, (err && err.message) || 'Reset request failed'); });
        return;
      }
      if (name === 'rdCloudForgotUsername') {
        var fuSetup = cachedSetupStatus();
        if (fuSetup && !fuSetup.smtpConfigured) {
          cloudMsg(false, 'SMTP is not configured. Set SMTP_* on the API — docs/AUTH.md.');
          return;
        }
        var ue = document.getElementById('rd-cloud-forgot-email') || document.getElementById('rd-cloud-email');
        var uemail = ue ? String(ue.value || '').trim() : '';
        if (!uemail) { cloudMsg(false, 'Enter the account email first.'); return; }
        if (!window.CovenantCloudSync) { cloudMsg(false, 'Cloud bridge not loaded.'); return; }
        window.CovenantCloudSync.forgotUsername(uemail)
          .then(function (body) { cloudMsg(true, (body && body.message) || 'Reminder sent (if account exists).'); })
          .catch(function (err) { cloudMsg(false, (err && err.message) || 'Username reminder failed'); });
        return;
      }
      if (name === 'rdCloudResetPassword') {
        var tokEl = document.getElementById('rd-cloud-reset-token');
        var npEl = document.getElementById('rd-cloud-reset-pass');
        var tok = tokEl ? String(tokEl.value || '').trim() : '';
        var np = npEl ? String(npEl.value || '') : '';
        if (!tok) {
          try { tok = sessionStorage.getItem('covenant_cloud_reset_token') || ''; } catch (e) { tok = ''; }
        }
        if (!tok || !np) { cloudMsg(false, 'Reset token and new password required.'); return; }
        if (!window.CovenantCloudSync) { cloudMsg(false, 'Cloud bridge not loaded.'); return; }
        window.CovenantCloudSync.resetPassword(tok, np)
          .then(function () {
            try { sessionStorage.removeItem('covenant_cloud_reset_token'); } catch (e) { /* ignore */ }
            cloudMsg(true, 'Password updated — signed in.');
          })
          .catch(function (err) { cloudMsg(false, (err && err.message) || 'Reset failed'); });
        return;
      }
      if (name === 'rdCloudSignOut') {
        if (!window.CovenantCloudSync) { cloudMsg(false, 'Cloud bridge not loaded.'); return; }
        window.CovenantCloudSync.signOut().then(function () { cloudMsg(true, 'Signed out.'); });
        return;
      }
      if (name === 'rdCloudSyncNow') {
        if (!window.CovenantCloudSync) { cloudMsg(false, 'Cloud bridge not loaded.'); return; }
        window.CovenantCloudSync.syncNow()
          .then(function () { cloudMsg(true, 'Guests + vendors + payments + budget + seating + contracts + timeline + packets + rentals + catering rentals + party + tasks + vendor arrivals + print packet overrides synced (beta).'); })
          .catch(function (err) { cloudMsg(false, (err && err.message) || 'Sync failed'); });
        return;
      }
      if (name === 'rdCloudUpload') {
        if (!window.CovenantCloudSync) { cloudMsg(false, 'Cloud bridge not loaded.'); return; }
        window.CovenantCloudSync.uploadWedding()
          .then(function () { cloudMsg(true, 'Wedding uploaded — guests + vendors + payments + budget + seating + contracts + timeline + packets + rentals + catering rentals + party + tasks + vendor arrivals + print packet overrides pushed.'); })
          .catch(function (err) { cloudMsg(false, (err && err.message) || 'Upload failed'); });
        return;
      }
      if (name === 'rdSetRestore') {
        var inp = document.getElementById('importInput');
        if (inp) inp.click();
        return;
      }
      if (name === 'downloadFullBackup') {
        if (typeof downloadFullBackup === 'function') downloadFullBackup();
        else if (typeof CovenantBackup !== 'undefined' && CovenantBackup && typeof CovenantBackup.downloadFullBackup === 'function') {
          CovenantBackup.downloadFullBackup().catch(function (err) {
            if (typeof showToast === 'function') showToast((err && err.message) || 'Full backup failed', 'warn');
          });
        } else if (typeof showToast === 'function') showToast('Full backup not available yet.', 'warn');
        return;
      }
      if (name === 'rdSetGotoBackup') {
        window._rdSetPane = 'backup';
        refreshPane('backup');
        return;
      }
      if (name === 'rdSetGotoCloud') {
        window._rdSetPane = 'cloud';
        refreshPane('cloud');
        return;
      }
      if (name === 'rdSetGotoRsvp') {
        window._rdSetPane = 'rsvp';
        refreshPane('rsvp');
        return;
      }
      if (name === 'rdSetGotoPartners') {
        window._rdSetPane = 'partners';
        refreshPane('partners');
        return;
      }
      if (name === 'rdPartnerPending') {
        if (!window.CovenantCloudSync || typeof window.CovenantCloudSync.pendingInvites !== 'function') {
          cloudMsg(false, 'Cloud bridge not loaded.');
          return;
        }
        window.CovenantCloudSync.pendingInvites()
          .then(function (body) {
            var inbox = document.getElementById('rd-partner-inbox');
            var list = (body && body.invites) || [];
            if (!inbox) return;
            if (!list.length) {
              inbox.textContent = 'No pending invites for this account.';
              cloudMsg(true, 'Inbox empty.');
              return;
            }
            inbox.innerHTML = '<ul style="margin:0;padding-left:1.1rem">'
              + list.map(function (inv) {
                return '<li style="margin:0.4rem 0">'
                  + esc(inv.weddingName || 'Wedding') + ' · ' + esc(inv.role || 'partner')
                  + ' · ' + esc(inv.invitedEmail || '')
                  + ' <button type="button" class="rd-set__btn" data-act="rdPartnerAccept" data-invite-id="'
                  + esc(inv.id) + '">Accept</button></li>';
              }).join('')
              + '</ul>';
            cloudMsg(true, 'Loaded ' + list.length + ' pending invite' + (list.length === 1 ? '' : 's') + '.');
            var ovInbox = document.getElementById(OVERLAY_ID);
            if (ovInbox) wireActions(ovInbox);
          })
          .catch(function (err) { cloudMsg(false, (err && err.message) || 'Could not load invites'); });
        return;
      }
      if (name === 'rdPartnerAccept') {
        var acceptId = el && el.getAttribute('data-invite-id');
        if (!acceptId) { cloudMsg(false, 'Missing invite id.'); return; }
        if (!window.CovenantCloudSync || typeof window.CovenantCloudSync.acceptInvite !== 'function') {
          cloudMsg(false, 'Cloud bridge not loaded.');
          return;
        }
        window.CovenantCloudSync.acceptInvite({ inviteId: acceptId })
          .then(function (body) {
            cloudMsg(true, 'Invite accepted' + (body && body.weddingId ? ' — wedding linked on server.' : '.'));
            run('rdPartnerPending');
            run('rdPartnerRefresh');
          })
          .catch(function (err) { cloudMsg(false, (err && err.message) || 'Accept failed'); });
        return;
      }
      if (name === 'rdPartnerInvite') {
        var pEmail = document.getElementById('rd-partner-email');
        var pUser = document.getElementById('rd-partner-username');
        var pRole = document.getElementById('rd-partner-role');
        var emailVal = pEmail ? String(pEmail.value || '').trim() : '';
        if (!emailVal) { cloudMsg(false, 'Enter an email to invite.'); return; }
        if (!window.CovenantCloudSync || typeof window.CovenantCloudSync.createInvite !== 'function') {
          cloudMsg(false, 'Cloud bridge not loaded.');
          return;
        }
        window.CovenantCloudSync.createInvite({
          email: emailVal,
          username: pUser ? String(pUser.value || '').trim() : '',
          role: pRole ? String(pRole.value || 'partner') : 'partner'
        })
          .then(function (body) {
            var resEl = document.getElementById('rd-partner-invite-result');
            var url = (body && body.inviteUrl) || (body && body.invite && body.invite.inviteUrl) || '';
            if (resEl) {
              resEl.innerHTML = esc((body && body.message) || 'Invite created.')
                + (url
                  ? ('<br>Invite URL: <code id="rd-partner-invite-url">' + esc(url) + '</code> '
                    + '<button type="button" class="rd-set__btn" data-act="rdPartnerCopyLink">Copy link</button>')
                  : '');
            }
            var ovInvite = document.getElementById(OVERLAY_ID);
            if (ovInvite) wireActions(ovInvite);
            cloudMsg(true, (body && body.email && body.email.sent) ? 'Invite emailed.' : 'Invite created — copy the link if needed.');
            run('rdPartnerRefresh');
          })
          .catch(function (err) { cloudMsg(false, (err && err.message) || 'Invite failed'); });
        return;
      }
      if (name === 'rdPartnerCopyLink') {
        var urlEl = document.getElementById('rd-partner-invite-url');
        var copyUrl = urlEl ? String(urlEl.textContent || '').trim() : '';
        if (!copyUrl) { cloudMsg(false, 'No invite URL to copy.'); return; }
        if (navigator.clipboard && navigator.clipboard.writeText) {
          navigator.clipboard.writeText(copyUrl)
            .then(function () { cloudMsg(true, 'Invite link copied.'); })
            .catch(function () { cloudMsg(false, 'Could not copy — select the URL manually.'); });
        } else {
          cloudMsg(false, 'Clipboard unavailable — select the URL manually.');
        }
        return;
      }
      if (name === 'rdPartnerRefresh') {
        if (!window.CovenantCloudSync) { cloudMsg(false, 'Cloud bridge not loaded.'); return; }
        if (typeof window.CovenantCloudSync.listMembers !== 'function') {
          cloudMsg(false, 'Partner invite APIs not loaded.');
          return;
        }
        Promise.all([
          window.CovenantCloudSync.listMembers(),
          window.CovenantCloudSync.listInvites(false)
        ])
          .then(function (pair) {
            var members = (pair[0] && pair[0].members) || [];
            var invites = (pair[1] && pair[1].invites) || [];
            var smtp = pair[1] && pair[1].smtp;
            var listEl = document.getElementById('rd-partner-list');
            if (!listEl) return;
            var htmlList = 'SMTP: ' + (smtp && smtp.configured ? 'configured' : 'not configured (copy link)')
              + '<br><b>Members</b><ul style="margin:0.35rem 0 0.75rem;padding-left:1.1rem">'
              + (members.length
                ? members.map(function (m) {
                  return '<li>' + esc(m.email || m.invitedEmail || m.displayName || m.userId || 'member')
                    + ' · <b>' + esc(m.role) + '</b>'
                    + (m.role !== 'owner'
                      ? (' <button type="button" class="rd-set__btn rd-set__btn--danger" data-act="rdPartnerRevoke" data-invite-id="'
                        + esc(m.id) + '">Remove</button>')
                      : '')
                    + '</li>';
                }).join('')
                : '<li class="rd-set__muted">No members</li>')
              + '</ul><b>Pending invites</b><ul style="margin:0.35rem 0;padding-left:1.1rem">'
              + (invites.length
                ? invites.map(function (inv) {
                  return '<li>' + esc(inv.invitedEmail || '') + ' · ' + esc(inv.role)
                    + ' <button type="button" class="rd-set__btn rd-set__btn--danger" data-act="rdPartnerRevoke" data-invite-id="'
                    + esc(inv.id) + '">Revoke</button></li>';
                }).join('')
                : '<li class="rd-set__muted">None pending</li>')
              + '</ul>';
            listEl.innerHTML = htmlList;
            var ov = document.getElementById(OVERLAY_ID);
            if (ov) wireActions(ov);
            cloudMsg(true, 'Members and invites refreshed.');
          })
          .catch(function (err) { cloudMsg(false, (err && err.message) || 'Refresh failed'); });
        return;
      }
      if (name === 'rdPartnerRevoke') {
        var revId = el && el.getAttribute('data-invite-id');
        if (!revId) { cloudMsg(false, 'Missing id.'); return; }
        if (!window.CovenantCloudSync || typeof window.CovenantCloudSync.revokeInvite !== 'function') {
          cloudMsg(false, 'Cloud bridge not loaded.');
          return;
        }
        window.CovenantCloudSync.revokeInvite(revId)
          .then(function () {
            cloudMsg(true, 'Revoked.');
            run('rdPartnerRefresh');
          })
          .catch(function (err) { cloudMsg(false, (err && err.message) || 'Revoke failed'); });
        return;
      }
      if (name === 'rdSetGotoVendorPortal') {
        window._rdSetPane = 'vendors-portal';
        refreshPane('vendors-portal');
        return;
      }
      if (name === 'rdVpRefresh') {
        if (!window.CovenantCloudSync) { cloudMsg(false, 'Cloud bridge not loaded.'); return; }
        if (typeof window.CovenantCloudSync.listVendorPortalTokens !== 'function') {
          cloudMsg(false, 'Vendor portal APIs not loaded.');
          return;
        }
        var stVp = cloudStatus();
        var wid = stVp.weddingId;
        if (!wid) { cloudMsg(false, 'No linked wedding.'); return; }
        Promise.all([
          window.CovenantCloudSync.api('/weddings/' + encodeURIComponent(wid) + '/vendors', { method: 'GET' }),
          window.CovenantCloudSync.listVendorPortalTokens(false)
        ])
          .then(function (pair) {
            var vendors = (pair[0] && (pair[0].vendors || pair[0].items)) || [];
            var tokens = (pair[1] && pair[1].tokens) || [];
            var smtp = pair[1] && pair[1].smtp;
            var sel = document.getElementById('rd-vp-vendor');
            if (sel) {
              if (!vendors.length) {
                sel.innerHTML = '<option value="">No cloud vendors — sync vendors first</option>';
              } else {
                sel.innerHTML = vendors.map(function (v) {
                  return '<option value="' + esc(v.id || v._id || '') + '">'
                    + esc((v.name || 'Vendor') + (v.category || v.cat ? ' · ' + (v.category || v.cat) : ''))
                    + '</option>';
                }).join('');
              }
            }
            var listEl = document.getElementById('rd-vp-list');
            if (listEl) {
              listEl.innerHTML = 'SMTP: ' + (smtp && smtp.configured ? 'configured' : 'not configured (copy link)')
                + '<br><b>Active portal links</b><ul style="margin:0.35rem 0;padding-left:1.1rem">'
                + (tokens.length
                  ? tokens.map(function (t) {
                    var url = t.portalUrl || t.clientUrl || '';
                    return '<li style="margin:0.45rem 0">'
                      + esc(t.vendorName || t.vendorId || 'Vendor')
                      + (t.label ? ' · ' + esc(t.label) : '')
                      + ' · <b>' + esc(t.status || 'live') + '</b>'
                      + (url ? ('<br><code data-vp-url="' + esc(url) + '">' + esc(url) + '</code> '
                        + '<button type="button" class="rd-set__btn" data-act="rdVpCopy" data-url="'
                        + esc(url) + '">Copy</button>') : '')
                      + ' <button type="button" class="rd-set__btn" data-act="rdVpRotate" data-token-id="'
                      + esc(t.id) + '">Rotate</button>'
                      + ' <button type="button" class="rd-set__btn rd-set__btn--danger" data-act="rdVpRevoke" data-token-id="'
                      + esc(t.id) + '">Revoke</button></li>';
                  }).join('')
                  : '<li class="rd-set__muted">No active tokens</li>')
                + '</ul>';
            }
            var ov = document.getElementById(OVERLAY_ID);
            if (ov) wireActions(ov);
            cloudMsg(true, 'Vendors and portal tokens refreshed.');
          })
          .catch(function (err) { cloudMsg(false, (err && err.message) || 'Refresh failed'); });
        return;
      }
      if (name === 'rdVpCreate') {
        var vSel = document.getElementById('rd-vp-vendor');
        var vLabel = document.getElementById('rd-vp-label');
        var vSend = document.getElementById('rd-vp-send-email');
        var vendorId = vSel ? String(vSel.value || '').trim() : '';
        if (!vendorId) { cloudMsg(false, 'Select a vendor (refresh if the list is empty).'); return; }
        if (!window.CovenantCloudSync || typeof window.CovenantCloudSync.createVendorPortalToken !== 'function') {
          cloudMsg(false, 'Cloud bridge not loaded.');
          return;
        }
        function vpChk(id, fallback) {
          var el = document.getElementById(id);
          return el ? !!el.checked : fallback;
        }
        var scopes = {
          brief: vpChk('rd-vp-sc-brief', true),
          schedule: vpChk('rd-vp-sc-schedule', true),
          paperwork: vpChk('rd-vp-sc-paperwork', true),
          uploads: vpChk('rd-vp-sc-uploads', true),
          counts: vpChk('rd-vp-sc-counts', true),
          contacts: vpChk('rd-vp-sc-contacts', true),
          arrival: vpChk('rd-vp-sc-arrival', true),
          parking: vpChk('rd-vp-sc-parking', true),
          notes: vpChk('rd-vp-sc-notes', true)
        };
        var published = {
          arrivalWindow: (document.getElementById('rd-vp-arrival') || {}).value || '',
          loadIn: (document.getElementById('rd-vp-loadin') || {}).value || '',
          parking: (document.getElementById('rd-vp-parking') || {}).value || '',
          venueAccess: (document.getElementById('rd-vp-venue-access') || {}).value || '',
          dayNotes: (document.getElementById('rd-vp-daynotes') || {}).value || '',
          contactName: (document.getElementById('rd-vp-contact-name') || {}).value || '',
          contactPhone: (document.getElementById('rd-vp-contact-phone') || {}).value || '',
          contactRole: (document.getElementById('rd-vp-contact-role') || {}).value || ''
        };
        window.CovenantCloudSync.createVendorPortalToken({
          vendorId: vendorId,
          label: vLabel ? String(vLabel.value || '').trim() : '',
          sendEmail: !!(vSend && vSend.checked),
          scopes: scopes,
          published: published
        })
          .then(function (body) {
            var resEl = document.getElementById('rd-vp-create-result');
            var url = (body && body.portalUrl) || (body && body.token && body.token.portalUrl) || '';
            if (resEl) {
              resEl.innerHTML = esc((body && body.message) || 'Portal link created.')
                + (url
                  ? ('<br>Portal URL: <code id="rd-vp-new-url">' + esc(url) + '</code> '
                    + '<button type="button" class="rd-set__btn" data-act="rdVpCopyNew">Copy link</button>')
                  : '');
            }
            var ovCreate = document.getElementById(OVERLAY_ID);
            if (ovCreate) wireActions(ovCreate);
            cloudMsg(true, (body && body.email && body.email.sent) ? 'Portal link emailed.' : 'Portal link created — copy if needed.');
            run('rdVpRefresh');
          })
          .catch(function (err) { cloudMsg(false, (err && err.message) || 'Create failed'); });
        return;
      }
      if (name === 'rdVpCopyNew') {
        var newUrlEl = document.getElementById('rd-vp-new-url');
        var newUrl = newUrlEl ? String(newUrlEl.textContent || '').trim() : '';
        if (!newUrl) { cloudMsg(false, 'No URL to copy.'); return; }
        if (navigator.clipboard && navigator.clipboard.writeText) {
          navigator.clipboard.writeText(newUrl)
            .then(function () { cloudMsg(true, 'Portal link copied.'); })
            .catch(function () { cloudMsg(false, 'Could not copy — select the URL manually.'); });
        } else {
          cloudMsg(false, 'Clipboard unavailable — select the URL manually.');
        }
        return;
      }
      if (name === 'rdVpCopy') {
        var copyVp = el && el.getAttribute('data-url');
        if (!copyVp) { cloudMsg(false, 'No URL to copy.'); return; }
        if (navigator.clipboard && navigator.clipboard.writeText) {
          navigator.clipboard.writeText(copyVp)
            .then(function () { cloudMsg(true, 'Portal link copied.'); })
            .catch(function () { cloudMsg(false, 'Could not copy — select the URL manually.'); });
        } else {
          cloudMsg(false, 'Clipboard unavailable — select the URL manually.');
        }
        return;
      }
      if (name === 'rdVpRevoke') {
        var tokRev = el && el.getAttribute('data-token-id');
        if (!tokRev) { cloudMsg(false, 'Missing token id.'); return; }
        if (!window.CovenantCloudSync || typeof window.CovenantCloudSync.revokeVendorPortalToken !== 'function') {
          cloudMsg(false, 'Cloud bridge not loaded.');
          return;
        }
        window.CovenantCloudSync.revokeVendorPortalToken(tokRev)
          .then(function () {
            cloudMsg(true, 'Portal link revoked.');
            run('rdVpRefresh');
          })
          .catch(function (err) { cloudMsg(false, (err && err.message) || 'Revoke failed'); });
        return;
      }
      if (name === 'rdVpRotate') {
        var tokRot = el && el.getAttribute('data-token-id');
        if (!tokRot) { cloudMsg(false, 'Missing token id.'); return; }
        if (!window.CovenantCloudSync || typeof window.CovenantCloudSync.rotateVendorPortalToken !== 'function') {
          cloudMsg(false, 'Cloud bridge not loaded.');
          return;
        }
        window.CovenantCloudSync.rotateVendorPortalToken(tokRot)
          .then(function (body) {
            var url = (body && body.portalUrl) || '';
            cloudMsg(true, url ? ('Rotated. New URL: ' + url) : 'Rotated — refresh to copy the new URL.');
            run('rdVpRefresh');
          })
          .catch(function (err) { cloudMsg(false, (err && err.message) || 'Rotate failed'); });
        return;
      }
      if (name === 'rdRsvpRefresh') {
        if (!window.CovenantCloudSync || typeof window.CovenantCloudSync.rsvpStatus !== 'function') {
          cloudMsg(false, 'Cloud bridge not loaded.');
          return;
        }
        window.CovenantCloudSync.rsvpStatus()
          .then(function (body) {
            var sum = body && body.summary ? body.summary : {};
            var smtp = body && body.smtp ? body.smtp : {};
            var el = document.getElementById('rd-rsvp-summary');
            if (el) {
              el.innerHTML = 'Guests: <b>' + esc(String(sum.total || 0)) + '</b> · with email '
                + esc(String(sum.withEmail || 0)) + ' · tokens ' + esc(String(sum.withToken || 0))
                + ' · sent ' + esc(String(sum.sent || 0)) + ' · responded ' + esc(String(sum.responded || 0))
                + '<br>SMTP: ' + (smtp.configured ? 'configured' : 'not configured (send returns 503; links still work)')
                + (body.publicUrl ? '<br>PUBLIC_URL: <code>' + esc(body.publicUrl) + '</code>' : '');
            }
            if (body && body.portal) { /* ignore */ }
            cloudMsg(true, 'RSVP status loaded.');
            return window.CovenantCloudSync.portalGet();
          })
          .then(function (body) {
            if (!body || !body.portal) return;
            var p = body.portal;
            var slugEl = document.getElementById('rd-portal-slug');
            var modeEl = document.getElementById('rd-portal-mode');
            var headEl = document.getElementById('rd-portal-headline');
            var subEl = document.getElementById('rd-portal-subhead');
            var dateEl = document.getElementById('rd-portal-date');
            var venueEl = document.getElementById('rd-portal-venue');
            var dressEl = document.getElementById('rd-portal-dress');
            var msgEl = document.getElementById('rd-portal-message');
            var schedEl = document.getElementById('rd-portal-schedule');
            var travelEl = document.getElementById('rd-portal-travel');
            var lodgeEl = document.getElementById('rd-portal-lodging');
            var regEl = document.getElementById('rd-portal-registry');
            var faqEl = document.getElementById('rd-portal-faq');
            var heroEl = document.getElementById('rd-portal-hero');
            var hintEl = document.getElementById('rd-portal-rsvp-hint');
            var sumEl = document.getElementById('rd-portal-summary');
            if (slugEl && p.slug) slugEl.value = p.slug;
            if (modeEl && p.accessMode) modeEl.value = p.accessMode;
            var pub = p.published || {};
            if (headEl && pub.headline != null) headEl.value = pub.headline || '';
            if (subEl && pub.subhead != null) subEl.value = pub.subhead || '';
            if (dateEl && pub.date != null) dateEl.value = pub.date || '';
            if (venueEl && pub.venue != null) venueEl.value = pub.venue || '';
            if (dressEl && pub.dressCode != null) dressEl.value = pub.dressCode || '';
            if (msgEl && pub.message != null) msgEl.value = pub.message || '';
            if (schedEl && pub.schedule != null) schedEl.value = pub.schedule || '';
            if (travelEl && pub.travel != null) travelEl.value = pub.travel || '';
            if (lodgeEl && pub.lodging != null) lodgeEl.value = pub.lodging || '';
            if (heroEl && pub.heroImageUrl != null) heroEl.value = pub.heroImageUrl || '';
            if (hintEl && pub.rsvpHint != null) hintEl.value = pub.rsvpHint || '';
            if (regEl) {
              regEl.value = (pub.registryLinks || []).map(function (l) {
                return (l.label || '') + ' | ' + (l.url || '');
              }).join('\n');
            }
            if (faqEl) {
              faqEl.value = (pub.faqs || []).map(function (f) {
                return (f.q || '') + ' || ' + (f.a || '');
              }).join('\n');
            }
            var bl = pub.blocks || {};
            [
              ['welcome', 'rd-portal-blk-welcome'],
              ['event', 'rd-portal-blk-event'],
              ['schedule', 'rd-portal-blk-schedule'],
              ['travel', 'rd-portal-blk-travel'],
              ['lodging', 'rd-portal-blk-lodging'],
              ['registry', 'rd-portal-blk-registry'],
              ['faq', 'rd-portal-blk-faq'],
              ['hero', 'rd-portal-blk-hero']
            ].forEach(function (pair) {
              var elChk = document.getElementById(pair[1]);
              if (!elChk) return;
              if (Object.prototype.hasOwnProperty.call(bl, pair[0])) elChk.checked = !!bl[pair[0]];
            });
            if (sumEl) {
              sumEl.innerHTML = p.url
                ? ('Portal: <a href="' + esc(p.url) + '" target="_blank" rel="noopener">' + esc(p.url) + '</a>'
                  + (p.enabled ? ' · enabled' : ' · disabled')
                  + ' · mode ' + esc(p.accessMode || 'unlisted'))
                : 'Portal not configured yet.';
            }
          })
          .catch(function (err) { cloudMsg(false, (err && err.message) || 'RSVP status failed'); });
        return;
      }
      if (name === 'rdRsvpTokens') {
        if (!window.CovenantCloudSync) { cloudMsg(false, 'Cloud bridge not loaded.'); return; }
        window.CovenantCloudSync.rsvpGenerateTokens()
          .then(function (body) {
            cloudMsg(true, 'Created ' + ((body && body.created) || 0) + ' token(s)'
              + (body && body.skipped ? '; skipped ' + body.skipped + ' (already had tokens)' : '') + '.');
          })
          .catch(function (err) { cloudMsg(false, (err && err.message) || 'Token generate failed'); });
        return;
      }
      if (name === 'rdRsvpSend' || name === 'rdRsvpRemind') {
        if (!window.CovenantCloudSync) { cloudMsg(false, 'Cloud bridge not loaded.'); return; }
        var smtpSetup = cachedSetupStatus();
        if (smtpSetup && !smtpSetup.smtpConfigured) {
          cloudMsg(false, 'SMTP is not configured — generate tokens and share links manually, or set SMTP_* (docs/AUTH.md).');
          return;
        }
        var kind = name === 'rdRsvpRemind' ? 'rsvp_reminder' : 'rsvp_invite';
        window.CovenantCloudSync.rsvpSend({ kind: kind })
          .then(function (body) {
            cloudMsg(true, 'Sent ' + ((body && body.sent) || 0)
              + (body && body.failed ? '; failed ' + body.failed : '')
              + (body && body.skipped ? '; skipped ' + body.skipped : '') + '.');
          })
          .catch(function (err) { cloudMsg(false, (err && err.message) || 'Send failed'); });
        return;
      }
      if (name === 'rdPortalSave') {
        if (!window.CovenantCloudSync) { cloudMsg(false, 'Cloud bridge not loaded.'); return; }
        var slug = (document.getElementById('rd-portal-slug') || {}).value || '';
        var mode = (document.getElementById('rd-portal-mode') || {}).value || 'unlisted';
        var code = (document.getElementById('rd-portal-code') || {}).value || '';
        function chk(id, fallback) {
          var el = document.getElementById(id);
          return el ? !!el.checked : fallback;
        }
        function parseRegistry(raw) {
          return String(raw || '').split('\n').map(function (line) {
            var t = String(line || '').trim();
            if (!t) return null;
            var pipe = t.indexOf('|');
            if (pipe < 0) return null;
            return {
              label: t.slice(0, pipe).trim(),
              url: t.slice(pipe + 1).trim()
            };
          }).filter(Boolean);
        }
        function parseFaq(raw) {
          return String(raw || '').split('\n').map(function (line) {
            var t = String(line || '').trim();
            if (!t) return null;
            var sep = t.indexOf('||');
            if (sep < 0) return null;
            return { q: t.slice(0, sep).trim(), a: t.slice(sep + 2).trim() };
          }).filter(Boolean);
        }
        var published = {
          headline: (document.getElementById('rd-portal-headline') || {}).value || '',
          subhead: (document.getElementById('rd-portal-subhead') || {}).value || '',
          date: (document.getElementById('rd-portal-date') || {}).value || '',
          venue: (document.getElementById('rd-portal-venue') || {}).value || '',
          dressCode: (document.getElementById('rd-portal-dress') || {}).value || '',
          message: (document.getElementById('rd-portal-message') || {}).value || '',
          schedule: (document.getElementById('rd-portal-schedule') || {}).value || '',
          travel: (document.getElementById('rd-portal-travel') || {}).value || '',
          lodging: (document.getElementById('rd-portal-lodging') || {}).value || '',
          heroImageUrl: (document.getElementById('rd-portal-hero') || {}).value || '',
          rsvpHint: (document.getElementById('rd-portal-rsvp-hint') || {}).value || '',
          registryLinks: parseRegistry((document.getElementById('rd-portal-registry') || {}).value),
          faqs: parseFaq((document.getElementById('rd-portal-faq') || {}).value),
          blocks: {
            welcome: chk('rd-portal-blk-welcome', true),
            event: chk('rd-portal-blk-event', true),
            schedule: chk('rd-portal-blk-schedule', true),
            travel: chk('rd-portal-blk-travel', true),
            lodging: chk('rd-portal-blk-lodging', true),
            registry: chk('rd-portal-blk-registry', true),
            faq: chk('rd-portal-blk-faq', true),
            hero: chk('rd-portal-blk-hero', true)
          }
        };
        var body = {
          enabled: true,
          generateSlug: !String(slug).trim(),
          accessMode: mode,
          published: published
        };
        if (String(slug).trim()) body.slug = String(slug).trim();
        if (String(code).trim()) body.accessCode = String(code).trim();
        window.CovenantCloudSync.portalUpdate(body)
          .then(function (res) {
            var p = res && res.portal;
            var sumEl = document.getElementById('rd-portal-summary');
            if (sumEl && p && p.url) {
              sumEl.innerHTML = 'Portal: <a href="' + esc(p.url) + '" target="_blank" rel="noopener">' + esc(p.url) + '</a>';
            }
            if (p && p.slug) {
              var slugEl2 = document.getElementById('rd-portal-slug');
              if (slugEl2) slugEl2.value = p.slug;
            }
            var codeEl = document.getElementById('rd-portal-code');
            if (codeEl) codeEl.value = '';
            cloudMsg(true, 'Portal saved.');
          })
          .catch(function (err) { cloudMsg(false, (err && err.message) || 'Portal save failed'); });
        return;
      }
      if (name === 'rdPortalRotateCode') {
        if (!window.CovenantCloudSync) { cloudMsg(false, 'Cloud bridge not loaded.'); return; }
        var codeIn = (document.getElementById('rd-portal-code') || {}).value || '';
        window.CovenantCloudSync.portalRotateCode(String(codeIn).trim() || undefined)
          .then(function (res) {
            var codeEl = document.getElementById('rd-portal-code');
            if (codeEl && res && res.accessCode) codeEl.value = res.accessCode;
            cloudMsg(true, (res && res.message) || 'Access code rotated.');
          })
          .catch(function (err) { cloudMsg(false, (err && err.message) || 'Rotate failed'); });
        return;
      }
      if (name === 'rdPhotosAdd') {
        var ph = document.getElementById('rd-photos-file');
        if (ph) ph.click();
        return;
      }
      if (name === 'rdPhotosRefresh') {
        refreshPhotosPane(document.getElementById(OVERLAY_ID));
        return;
      }
      if (name === 'rdPhotosRemove') {
        var pid = el && el.getAttribute('data-photo-id');
        if (!pid) return;
        if (typeof CovenantPhotos === 'undefined' || !CovenantPhotos || typeof CovenantPhotos.removePhoto !== 'function') {
          if (typeof showToast === 'function') showToast('Photo store not loaded.', 'warn');
          return;
        }
        CovenantPhotos.removePhoto(pid).then(function () {
          refreshPhotosPane(document.getElementById(OVERLAY_ID));
          if (typeof showToast === 'function') showToast('Photo removed from local library');
        });
        return;
      }
      if (name === 'rdSetHistory') {
        close();
        window._histReturnPanel = document.body.getAttribute('data-active-panel') || 'dashboard';
        if (typeof showPanel === 'function') showPanel('history', true);
        return;
      }
      if (name === 'rdSetProfile') {
        close();
        if (typeof toggleProfileDrawer === 'function') toggleProfileDrawer();
        return;
      }
      if (name === 'rdSetAccessTab') {
        close();
        window._pdDrawerTab = 'access';
        if (typeof openProfileDrawer === 'function') openProfileDrawer();
        else if (typeof toggleProfileDrawer === 'function') toggleProfileDrawer();
        if (typeof rdPdSetTab === 'function') rdPdSetTab('access');
        return;
      }
      if (name === 'rdSetSetup') {
        close();
        if (typeof showPanel === 'function') showPanel('setup', true);
        return;
      }
      if (name === 'rdSetTimeline') {
        close();
        if (typeof showPanel === 'function') showPanel('timeline', true);
        return;
      }
      if (name === 'rdSetViewerPrefs') {
        close();
        if (typeof showPanel === 'function') showPanel('viewer-prefs', true);
        return;
      }
      if (name === 'rdSetGetStarted' || name === 'rdSetGuide' || name === 'rdSetFaq') {
        var panel = name === 'rdSetGetStarted' ? 'instructions'
          : name === 'rdSetGuide' ? 'guide' : 'faq';
        close();
        if (typeof showPanel === 'function') showPanel(panel, true);
        requestAnimationFrame(function () { window.scrollTo({ top: 0, behavior: 'smooth' }); });
        return;
      }
      if (typeof window[name] === 'function') window[name]();
    } catch (e) { /* never let one control break the window */ }
  }

  function focusSection(section) {
    if (!section) return;
    if (section === 'alerts' || section === 'notifications') {
      window._rdSetPane = 'notifications';
      var ov = document.getElementById(OVERLAY_ID);
      if (ov) {
        var main = ov.querySelector('#rd-set-main');
        if (main) {
          main.innerHTML = paneHtml('notifications');
          moveSlots(ov);
          wireActions(ov);
        }
        Array.prototype.forEach.call(ov.querySelectorAll('[data-set-pane]'), function (b) {
          b.classList.toggle('is-active', b.getAttribute('data-set-pane') === 'notifications');
        });
      }
      return;
    }
    var target = document.getElementById(section === 'alerts' ? 'rd-set-alert-rules' : section);
    if (!target) return;
    requestAnimationFrame(function () {
      target.scrollIntoView({ behavior: 'smooth', block: 'start' });
      target.classList.add('rd-set__card--focus');
      setTimeout(function () { target.classList.remove('rd-set__card--focus'); }, 1400);
    });
  }

  function open(section) {
    build();
    var ov = document.getElementById(OVERLAY_ID);
    if (ov) ov.classList.add('is-open');
    document.addEventListener('keydown', onEsc, true);
    focusSection(section);
  }
  function close() {
    var ov = document.getElementById(OVERLAY_ID);
    if (ov) ov.classList.remove('is-open');
    document.removeEventListener('keydown', onEsc, true);
  }
  function onEsc(e) { if (e.key === 'Escape') close(); }

  window.openSettingsWindow = open;
  window.closeSettingsWindow = close;
  window.rdGetPlannerAlertRules = alertRules;

  function bindGear() {
    var gear = document.getElementById('rd-gear-btn');
    if (!gear || gear.dataset.rdSetBound) return false;
    gear.dataset.rdSetBound = '1';
    gear.setAttribute('aria-label', 'Settings');
    gear.addEventListener('click', function (e) {
      e.preventDefault();
      e.stopImmediatePropagation();
      var prefs = document.getElementById('rd-prefs');
      if (prefs) prefs.setAttribute('hidden', '');
      open();
    }, true);
    return true;
  }

  function boot() {
    if (!bindGear()) { setTimeout(boot, 300); return; }
  }
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', function () { setTimeout(boot, 500); });
  } else {
    setTimeout(boot, 500);
  }
})();
