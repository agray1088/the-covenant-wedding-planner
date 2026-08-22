/* Email Templates — Master s25 / 12c · Preview 33e · Sent log 33f · Tabs 19n
   Table: Template · Audience · Fields · Sent · Last used · Status
   Surfaces: Templates (split preview) · Preview · Sent log
   Section tabs (19n): Templates | Preview | Sent log + Audience filter chips
   Rail: All templates · Guests · Vendors · Wedding party · With blank fields
         · Group by Audience / Last used / Author
   Drawer: Template · Fields · Audience · Sent log
   Primary: New template · Data: data.emailTemplates[] — nine Master templates. */
(function () {
  'use strict';

  window._etMode = window._etMode || 'table';
  window._etRailView = window._etRailView || 'all';
  window._etGroupBy = window._etGroupBy || 'audience';
  window._etAudienceTab = window._etAudienceTab || null;
  window._etUiFilters = window._etUiFilters || { audience: 'all', status: 'all', field: 'all', template: 'all', outcome: 'all' };
  window._etFailuresFirst = window._etFailuresFirst !== false;
  window._etDrawerId = window._etDrawerId || null;
  window._etDrawerTab = window._etDrawerTab || 0;
  window._etSel = window._etSel instanceof Set ? window._etSel : new Set();
  window._etPreviewId = window._etPreviewId || null;
  window._etPreviewIdx = window._etPreviewIdx || 0;

  const SHELL_VER = 'et-rd12c-s25';
  const COL_SCOPE = 'emails';
  const DRAWER_TABS = ['Template', 'Fields', 'Audience', 'Sent log'];
  const SURFACE_TABS = [
    { id: 'table', label: 'Templates' },
    { id: 'preview', label: 'Preview' },
    { id: 'log', label: 'Sent log' }
  ];
  const AUDIENCE_TABS = ['Guests', 'Vendors', 'Wedding party'];
  const ET_COLUMNS = [
    { key: '_sel', label: '', width: '34px', fixed: true },
    { key: 'template', label: 'Template' },
    { key: 'audience', label: 'Audience', width: '120px' },
    { key: 'fields', label: 'Fields', width: '70px' },
    { key: 'sent', label: 'Sent', width: '70px' },
    { key: 'lastUsed', label: 'Last used', width: '100px' },
    { key: 'status', label: 'Status', width: '120px' }
  ];
  if (window.rdColumns) {
    window.rdColumns.register(COL_SCOPE, ET_COLUMNS.slice(), function () { renderEmailsRd(); });
  }

  /* Master s25 — nine templates (4 Guests · 3 Vendors · 2 Wedding party). */
  const MASTER_TEMPLATES = [
    {
      title: 'RSVP reminder', audience: 'Guests', fieldCount: 6, sent: 17, lastUsed: 'Yesterday', status: 'Ready',
      subject: 'A gentle nudge — will we see you on {{wedding.date}}?',
      body: 'Dear {{guest.first_name}},\n\nWe are counting down to {{wedding.date}} and are still hoping to hear from you. The chapel at {{wedding.venue}} holds {{wedding.seats}}, and we would love one of those seats to be yours.\n\nCould you let us know by {{wedding.rsvp_deadline}}?\n\nWith love,\n{{couple.shown_as}}',
      sends: [{ when: 'Yesterday', sent: 17, label: '17 guests' }, { when: '12 Jul', sent: 9, label: '9 guests' }]
    },
    {
      title: 'Save the date', audience: 'Guests', fieldCount: 4, sent: 24, lastUsed: '14 Mar', status: 'Ready',
      subject: 'Save the Date — {{couple.shown_as}}',
      body: 'Save the date! We are getting married on {{wedding.date}}.\n\nFormal invitation to follow.\n\n{{couple.shown_as}}',
      sends: [{ when: '4 Mar', sent: 24, label: '24 guests' }]
    },
    {
      title: 'Thank-you for the gift', audience: 'Guests', fieldCount: 5, sent: 0, lastUsed: '—', status: '1 blank field',
      subject: 'From the bottom of our hearts',
      body: 'Dear {{guest.first_name}},\n\nThank you for celebrating our wedding with us — and for the {{gift.description}}. Your presence and your gift mean more than we can say.\n\nWith love,\n{{couple.shown_as}}',
      blankToken: 'gift.description',
      sends: []
    },
    {
      title: 'Travel & accommodation', audience: 'Guests', fieldCount: 7, sent: 0, lastUsed: '—', status: 'Ready',
      subject: 'Travel & Lodging Information',
      body: 'Hi {{guest.first_name}},\n\nThank you for traveling for our wedding on {{wedding.date}}. We have reserved a hotel block at {{hotel.name}}. Use code {{hotel.code}} when booking.\n\nLooking forward to celebrating with you,\n{{couple.shown_as}}',
      sends: []
    },
    {
      title: 'Request a quote', audience: 'Vendors', fieldCount: 5, sent: 8, lastUsed: '19 Apr', status: 'Ready',
      subject: 'Wedding Inquiry — {{wedding.date}}',
      body: 'Hi {{vendor.name}},\n\nWe are getting married on {{wedding.date}} at {{wedding.venue}} and would love to learn more about your services.\n\nThank you,\n{{couple.shown_as}}',
      sends: [{ when: '19 Apr', sent: 8, label: '8 vendors' }]
    },
    {
      title: 'Payment confirmation', audience: 'Vendors', fieldCount: 6, sent: 6, lastUsed: '24 Jul', status: 'Ready',
      subject: 'Payment sent — {{vendor.name}}',
      body: 'Hi {{vendor.name}},\n\nWe have sent {{payment.amount}} for {{payment.service}}. Please confirm receipt.\n\nThank you,\n{{couple.shown_as}}',
      sends: [{ when: '24 Jul', sent: 6, label: '6 vendors' }]
    },
    {
      title: 'Final headcount notice', audience: 'Vendors', fieldCount: 4, sent: 0, lastUsed: '—', status: '1 blank field',
      subject: 'Final headcount — {{wedding.date}}',
      body: 'Hi {{vendor.name}},\n\nOur final guest count is {{wedding.seats}}. Please confirm your team can accommodate this number.\n\nThank you,\n{{couple.shown_as}}',
      blankToken: 'wedding.seats',
      sends: []
    },
    {
      title: 'Fitting reminder', audience: 'Wedding party', fieldCount: 5, sent: 6, lastUsed: '12 Jul', status: 'Ready',
      subject: 'Fitting this week — {{wedding.date}}',
      body: 'Hi {{guest.first_name}},\n\nA quick reminder about your fitting on {{fitting.date}} at {{fitting.location}}.\n\nThank you,\n{{couple.shown_as}}',
      sends: [{ when: '12 Jul', sent: 6, label: '6 members' }]
    },
    {
      title: 'Weekend brief', audience: 'Wedding party', fieldCount: 8, sent: 0, lastUsed: '—', status: 'Draft',
      subject: 'Wedding weekend brief',
      body: 'Hi everyone,\n\nThank you for being part of our wedding weekend. Key details:\n\nCeremony: {{ceremony.time}} at {{wedding.venue}}\nReception: {{reception.time}} at {{reception.venue}}\n\nWith gratitude,\n{{couple.shown_as}}',
      sends: []
    }
  ];

  const PREVIEW_RECIPIENTS = [
    {
      label: 'Owusu',
      name: 'Mrs Comfort Owusu',
      email: 'c.owusu@example.com',
      templateHint: 'RSVP chase',
      subject: 'A gentle reminder — we need your reply by 30 September',
      body: 'Dear Mrs Owusu,\n\nWe are so glad you will be with us on Sunday 8 November. The caterer needs final numbers, so we are chasing the last few replies.\n\nWe have you down for 4 guests at 12 Ridge Rd, Accra, and we are still waiting on a meal choice for Nana Afua. If you could reply by 30 September, that would be a real help.\n\nWith love,\nAma and Kwesi',
      fields: [
        { token: 'household', value: 'Mrs Comfort Owusu' },
        { token: 'guest_count', value: '4 guests' },
        { token: 'address', value: '12 Ridge Rd, Accra' },
        { token: 'missing_meal_for', value: 'Nana Afua' },
        { token: 'rsvp_deadline', value: '30 September' },
        { token: 'wedding_date', value: 'Sunday 8 November' }
      ],
      conditionalDrops: 3,
      conditionalNote: 'Three of the twelve recipients have no meal outstanding. For those, the sentence containing {{missing_meal_for}} is dropped entirely rather than rendered empty.'
    },
    {
      label: 'Mensah',
      name: 'Efua Mensah',
      email: 'efua.mensah@example.com',
      templateHint: 'RSVP reminder',
      subject: 'A gentle nudge — will we see you on 8 November?',
      body: 'Dear Efua,\n\nWe are counting down to 8 November 2026 and are still hoping to hear from you. The chapel at Grace Hall holds 120, and we would love one of those seats to be yours.\n\nCould you let us know by 30 September?\n\nWith love,\nAma & Kwesi',
      fields: [
        { token: 'guest.first_name', value: 'Efua' },
        { token: 'wedding.date', value: '8 November 2026' },
        { token: 'wedding.venue', value: 'Grace Hall' },
        { token: 'wedding.seats', value: '120' },
        { token: 'wedding.rsvp_deadline', value: 'Not set on Wedding Setup', blank: true },
        { token: 'couple.shown_as', value: 'Ama & Kwesi' }
      ],
      conditionalDrops: 0,
      conditionalNote: ''
    }
  ];

  const SEND_LOG_GROUPS = [
    {
      key: 'RSVP chase · sent 18 July', sent: 42, delivered: 38, opened: 24, replied: 9,
      rows: [
        { name: 'Owusu household', email: 'c.owusu@example.com', detail: 'Opened 3× · replied 18 Jul', outcome: 'Replied' },
        { name: 'Boateng household', email: 'k.boateng@example.com', detail: 'Opened once 18 Jul', outcome: 'Opened' },
        { name: 'Mensah household', email: 'no email on file', detail: 'Not sent —', outcome: 'Excluded' },
        { name: 'Appiah household', email: 'j.appiah@example.com', detail: 'Bounced · mailbox full 18 Jul', outcome: 'Bounced' }
      ]
    },
    {
      key: 'Save the date · sent 4 March', sent: 62, delivered: 61, opened: 57, replied: 0,
      rows: [
        { name: 'All households', email: '62 recipients', detail: '92% open rate 4 Mar', outcome: 'Complete' }
      ]
    },
    {
      key: 'Vendor timing confirmation · sent 6 May', sent: 6, delivered: 6, opened: 5, replied: 0,
      rows: [
        { name: 'Highlife Collective', email: 'kojo@highlife.example', detail: 'Never opened 6 May', outcome: 'Unopened' }
      ]
    },
    {
      key: 'Drafts · not sent', sent: 0, delivered: 0, opened: 0, replied: 0,
      rows: [
        { name: 'Final numbers to Adom', email: '1 recipient · blocked', detail: 'Waits on the 20 Aug tasting —', outcome: 'Blocked' },
        { name: 'Thank-you follow-up', email: '11 recipients', detail: 'Scheduled 15 Nov —', outcome: 'Scheduled' }
      ]
    }
  ];

  const esc = s => (typeof escapeHtml === 'function'
    ? escapeHtml(s == null ? '' : String(s))
    : String(s == null ? '' : s));

  function ensureEt() {
    if (!window.data) window.data = {};
    if (!data.emailTemplatesMeta || typeof data.emailTemplatesMeta !== 'object') data.emailTemplatesMeta = {};
    if (!Array.isArray(data.emailTemplates)) data.emailTemplates = [];
    if (!data.emailTemplatesMeta.s25 || data.emailTemplates.length !== MASTER_TEMPLATES.length) {
      data.emailTemplates = MASTER_TEMPLATES.map((t, i) => seedMasterTemplate(t, i));
      data.emailTemplatesMeta.s25 = true;
    }
  }

  function libTemplate(title) {
    if (typeof EMAIL_TEMPLATES === 'undefined') return null;
    const want = String(title || '').toLowerCase();
    return EMAIL_TEMPLATES.find(t => {
      const ti = String(t.title || '').toLowerCase();
      if (ti === want) return true;
      if (/thank-you for the gift/i.test(title) && /thank you \(attended \+ gift\)/i.test(ti)) return true;
      if (/travel & accommodation/i.test(title) && /travel & lodging/i.test(ti)) return true;
      if (/request a quote/i.test(title) && /inquiry/i.test(ti)) return true;
      if (/payment confirmation/i.test(title) && /final balance/i.test(ti)) return true;
      if (/final headcount/i.test(title) && /headcount/i.test(ti)) return true;
      if (/fitting reminder/i.test(title) && /fitting/i.test(ti)) return true;
      if (/weekend brief/i.test(title) && /timeline email/i.test(ti)) return true;
      return false;
    }) || null;
  }

  function seedMasterTemplate(t, i) {
    const lib = libTemplate(t.title);
    return {
      _id: typeof nextRecordId === 'function' ? nextRecordId('emailTemplates') : ('et-s25-' + i),
      title: t.title,
      cat: t.audience,
      audience: t.audience,
      subject: lib ? lib.subject : t.subject,
      body: lib ? lib.body : t.body,
      sent: t.sent,
      lastUsed: t.lastUsed,
      status: t.status,
      author: 'Couple',
      from: '',
      replyTo: '',
      blankToken: t.blankToken || '',
      sends: (t.sends || []).slice(),
      fieldCountHint: t.fieldCount
    };
  }

  function extractFields(subject, body) {
    const text = String(subject || '') + '\n' + String(body || '');
    const found = [];
    const re = /\{\{([^}]+)\}\}/g;
    let m;
    while ((m = re.exec(text))) {
      const token = m[1].trim();
      if (found.indexOf(token) < 0) found.push(token);
    }
    return found;
  }

  function mergeLookup() {
    const base = typeof etMergeValues === 'function' ? etMergeValues() : {};
    const s = (window.data && data.setup) || {};
    const couple = [s.bride, s.groom].filter(Boolean).join(' & ') || (base.bride && base.groom ? (base.bride + ' & ' + base.groom) : 'Ama & Kwesi');
    return Object.assign({}, base, {
      'guest.first_name': base.name && base.name[0] !== '[' ? base.name : 'Efua',
      'wedding.date': base.date,
      'wedding.venue': base.venue,
      'wedding.seats': base.guestCount,
      'wedding.rsvp_deadline': base.rsvpDeadline,
      'couple.shown_as': couple,
      guest_first_name: base.name,
      wedding_date: base.date,
      wedding_venue: base.venue
    });
  }

  function resolveField(token, lookup) {
    const key = String(token || '').trim();
    if (Object.prototype.hasOwnProperty.call(lookup, key)) return lookup[key];
    const flat = key.replace(/\./g, '_');
    if (Object.prototype.hasOwnProperty.call(lookup, flat)) return lookup[flat];
    /* legacy simple tokens */
    const simple = key.split('.').pop();
    if (Object.prototype.hasOwnProperty.call(lookup, simple)) return lookup[simple];
    const aliases = {
      first_name: 'name',
      shown_as: 'couple',
      rsvp_deadline: 'rsvpDeadline',
      seats: 'guestCount',
      date: 'date',
      venue: 'venue'
    };
    if (aliases[simple] && lookup[aliases[simple]] != null) return lookup[aliases[simple]];
    return '';
  }

  function isBlankValue(val) {
    const v = String(val == null ? '' : val).trim();
    return !v || /^\[.+\]$/.test(v) || /not set|todo|tbd/i.test(v);
  }

  function fieldStates(row) {
    const lookup = mergeLookup();
    const tokens = extractFields(row.subject, row.body);
    const forcedBlank = String(row.blankToken || '').trim();
    return tokens.map(token => {
      let value = resolveField(token, lookup);
      let blank = isBlankValue(value);
      if (forcedBlank && (token === forcedBlank || token.replace(/\./g, '_') === forcedBlank.replace(/\./g, '_'))) {
        blank = true;
        value = 'Not set on Wedding Setup';
      }
      return {
        token: token,
        display: '{{' + token + '}}',
        value: blank ? 'Not set on Wedding Setup' : String(value),
        blank: blank
      };
    });
  }

  function unify(row, i) {
    if (typeof ensureRowId === 'function') ensureRowId(row, 'emailTemplates');
    const audience = row.audience || audienceFromCat(row.cat, row.title);
    const fields = fieldStates(row);
    const blanks = fields.filter(f => f.blank).length;
    let status = String(row.status || '').trim();
    if (/draft/i.test(status)) status = 'Draft';
    else if (/blank field/i.test(status)) status = status;
    else if (blanks > 0) status = blanks === 1 ? '1 blank field' : (blanks + ' blank fields');
    else if (!status || /ready/i.test(status)) status = 'Ready';
    const sent = Number(row.sent) || 0;
    const fieldCount = Number(row.fieldCountHint) || fields.length;
    return {
      id: row._id ? ('emailTemplates:' + row._id) : ('emailTemplates:idx:' + i),
      index: i,
      row: row,
      title: String(row.title || 'Untitled template').trim() || 'Untitled template',
      audience: audience,
      subject: String(row.subject || ''),
      body: String(row.body || ''),
      fields: fields,
      fieldCount: fieldCount,
      blanks: blanks,
      sent: sent,
      lastUsed: String(row.lastUsed || '—').trim() || '—',
      status: status,
      author: String(row.author || 'Couple'),
      from: String(row.from || mergeLookup()['couple.shown_as'] || 'Couple'),
      replyTo: String(row.replyTo || ''),
      sends: Array.isArray(row.sends) ? row.sends : []
    };
  }

  function audienceFromCat(cat, title) {
    const c = String(cat || '').toLowerCase();
    const ti = String(title || '').toLowerCase();
    if (/wedding party|bridesmaid|groomsmen|fitting|weekend brief/.test(c + ' ' + ti)) return 'Wedding party';
    if (/vendor|quote|payment|headcount|inquiry|follow/.test(c + ' ' + ti)) return 'Vendors';
    return 'Guests';
  }

  function allTemplates() {
    ensureEt();
    return (data.emailTemplates || []).map(unify);
  }

  function etFigures() {
    const items = allTemplates();
    const sentTotal = items.reduce((n, x) => n + x.sent, 0);
    const fieldSet = new Set();
    items.forEach(x => x.fields.forEach(f => fieldSet.add(f.token)));
    const unresolved = items.reduce((n, x) => n + x.blanks, 0);
    const drafts = items.filter(x => x.status === 'Draft').length;
    const blankRows = items.filter(x => x.blanks > 0).length;
    const never = items.filter(x => x.sent === 0).length;
    let most = { title: '—', sent: 0 };
    items.forEach(x => { if (x.sent > most.sent) most = { title: x.title, sent: x.sent }; });
    let lastSent = '—';
    items.forEach(x => {
      if (x.lastUsed && x.lastUsed !== '—' && x.sent) lastSent = x.lastUsed;
    });
    const guests = (data.guests || []);
    const pending = guests.filter(g => !/yes|accepted|no|declined/i.test(String(g.rsvp || ''))).length || Math.max(12, Math.round(guests.length * 0.2));
    const withEmail = guests.filter(g => String(g.email || '').trim()).length || Math.max(0, pending - 3);
    return {
      templates: items.length,
      sentTotal: sentTotal,
      mergeFields: fieldSet.size,
      unresolved: unresolved,
      drafts: drafts,
      blankRows: blankRows,
      never: never,
      mostTitle: most.title,
      mostSent: most.sent,
      lastSent: lastSent,
      pending: pending,
      withEmail: withEmail,
      noEmail: Math.max(0, pending - withEmail),
      byAudience: {
        Guests: items.filter(x => x.audience === 'Guests').length,
        Vendors: items.filter(x => x.audience === 'Vendors').length,
        'Wedding party': items.filter(x => x.audience === 'Wedding party').length
      }
    };
  }

  function etRailCounts() {
    const f = etFigures();
    return {
      all: f.templates,
      Guests: f.byAudience.Guests || 0,
      Vendors: f.byAudience.Vendors || 0,
      'Wedding party': f.byAudience['Wedding party'] || 0,
      blanks: f.blankRows
    };
  }

  function matchesRail(x) {
    const v = window._etRailView || 'all';
    if (v === 'blanks') return x.blanks > 0;
    if (v === 'Guests' || v === 'Vendors' || v === 'Wedding party') return x.audience === v;
    return true;
  }
  function matchesFilters(x) {
    if (!matchesRail(x)) return false;
    const audTab = window._etAudienceTab;
    if (audTab && x.audience !== audTab) return false;
    const ui = window._etUiFilters || {};
    if (ui.audience && ui.audience !== 'all' && x.audience.toLowerCase() !== String(ui.audience).toLowerCase()) return false;
    if (ui.status && ui.status !== 'all' && x.status.toLowerCase() !== String(ui.status).toLowerCase()) return false;
    if (ui.field && ui.field !== 'all') {
      if (!x.fields.some(f => f.token === ui.field || f.display === ui.field)) return false;
    }
    if (ui.template && ui.template !== 'all' && x.title.toLowerCase() !== String(ui.template).toLowerCase()) return false;
    return true;
  }
  function filteredTemplates() {
    const items = allTemplates().filter(matchesFilters);
    items.sort((a, b) => {
      if (a.lastUsed === 'Yesterday') return -1;
      if (b.lastUsed === 'Yesterday') return 1;
      return (b.sent - a.sent) || a.title.localeCompare(b.title);
    });
    return items;
  }

  function statusPill(status) {
    let scheme = 'green';
    if (/blank/i.test(status)) scheme = 'gold';
    else if (/draft/i.test(status)) scheme = 'muted';
    else if (/fail|bounce|blocked/i.test(status)) scheme = 'coral';
    else if (/ready|complete|replied|opened/i.test(status)) scheme = 'green';
    return `<span class="status-pill" data-pillscheme="${scheme}">${esc(status)}</span>`;
  }

  /* ── shell ───────────────────────────────────────────────────────────── */

  function pageheadActionsHtml() {
    const mode = window._etMode || 'table';
    const f = etFigures();
    if (mode === 'preview') {
      return ''
        + '<button type="button" class="rd-btn" onclick="rdEtPrint()">Print proof</button>'
        + '<button type="button" class="rd-btn" onclick="rdEtFullEditor()">Full editor</button>'
        + '<button type="button" class="rd-btn" onclick="rdEtPreviewNext()">Preview next</button>'
        + `<button type="button" class="rd-btn rd-btn--primary" onclick="rdEtSend()">Send to ${f.withEmail || 12}</button>`;
    }
    if (mode === 'log') {
      const failed = Math.max(1, f.noEmail || 5);
      return ''
        + '<button type="button" class="rd-btn" onclick="rdEtPrint()">Print log</button>'
        + '<button type="button" class="rd-btn" onclick="rdEtFullEditor()">Full editor</button>'
        + '<button type="button" class="rd-btn" onclick="rdEtExport()">Export</button>'
        + `<button type="button" class="rd-btn rd-btn--primary" onclick="rdEtResendFailed()">Resend to ${failed} failed</button>`;
    }
    return ''
      + '<button type="button" class="rd-btn" onclick="rdEtImport()">Import template</button>'
      + '<button type="button" class="rd-btn" onclick="rdEtPrint()"><svg viewBox="0 0 24 24" aria-hidden="true" style="width:14px;height:14px;fill:none;stroke:currentColor;stroke-width:1.7;stroke-linecap:round;stroke-linejoin:round"><path d="M6 9V4h12v5"/><rect x="4" y="9" width="16" height="7" rx="1"/><path d="M7 16h10v4H7z"/></svg>Print section</button>'
      + '<button type="button" class="rd-btn" onclick="rdEtFullEditor()">Full editor</button>'
      + '<button type="button" class="rd-btn" onclick="rdEtExport()">Export</button>'
      + '<button type="button" class="rd-btn rd-btn--primary" onclick="rdEtAdd()">New template</button>';
  }

  function uedEmailsShellRd() {
    const panel = document.getElementById('panel-emails');
    if (!panel) return;
    panel.classList.add('ued-scope', 'emails-mockup', 'emails-rd');
    if (panel.dataset.uedShell === SHELL_VER) {
      const actions = panel.querySelector('.rd-pagehead__actions');
      if (actions) actions.innerHTML = pageheadActionsHtml();
      return;
    }
    panel.dataset.uedShell = SHELL_VER;
    panel.innerHTML = `<div class="rd-page">
      <div class="rd-pagehead">
        <div>
          <div class="rd-pagehead__eyebrow">Documents</div>
          <div class="rd-pagehead__title-row">
            <h1 class="rd-pagehead__title">Email Templates</h1>
          </div>
        </div>
        <div class="rd-pagehead__actions">${pageheadActionsHtml()}</div>
      </div>
      <div class="rd-stats m-stats" id="emails-stats" aria-label="Email templates summary"></div>
      <div class="rd-sectiontabs rd-et-surfacetabs" id="emails-section-tabs" role="tablist" aria-label="Email Templates surfaces"></div>
      <div class="rd-toolbar" id="emails-toolbar"></div>
      <div class="rd-bulkbar" id="emails-bulk-bar" hidden></div>
      <div class="rd-surface">
        <div class="rd-surface__row" id="emails-surface-row">
          <div class="rd-surface__main" id="emails-view-host">
            <div class="rd-view" id="et-view-table" data-et-view="table"></div>
            <div class="rd-view" id="et-view-preview" data-et-view="preview" hidden></div>
            <div class="rd-view" id="et-view-log" data-et-view="log" hidden></div>
          </div>
          <div id="emails-drawer-slot"></div>
        </div>
      </div>
    </div>`;
    if (typeof window.covenantShell !== 'undefined' && window.covenantShell.drawer) {
      window.covenantShell.drawer();
    }
  }

  function renderEtSectionTabs() {
    const host = document.getElementById('emails-section-tabs');
    if (!host) return;
    const mode = window._etMode || 'table';
    host.innerHTML = SURFACE_TABS.map(t =>
      `<button type="button" class="rd-sectiontabs__item${mode === t.id ? ' is-active' : ''}" role="tab" aria-selected="${mode === t.id}" onclick="rdEtSetSurface('${t.id}')">${esc(t.label)}</button>`
    ).join('') + '<span class="rd-et-surfacetabs-note">3 surfaces</span>';
  }

  function audienceChip(label) {
    const active = window._etAudienceTab === label;
    return `<button type="button" class="rd-chip${active ? ' is-active' : ''}" onclick="rdEtSetAudienceTab('${esc(label)}')">${esc(label)}${active ? '<span class="rd-chip__clear" onclick="event.stopPropagation();rdEtSetAudienceTab(null)">&#10005;</span>' : ''}</button>`;
  }

  function renderEtStatsRd() {
    const host = document.getElementById('emails-stats');
    if (!host) return;
    const f = etFigures();
    const mode = window._etMode || 'table';
    let stats;
    if (mode === 'preview') {
      stats = [
        { label: 'Templates', value: String(f.templates) },
        { label: 'Recipients this send', value: String(f.withEmail || 12) },
        { label: 'Merge fields', value: '6', attention: 'all resolved' },
        { label: 'Conditional drops', value: '3', attention: 'no meal outstanding' },
        { label: 'Excluded', value: String(f.noEmail || 1), attention: 'no email on file' }
      ];
    } else if (mode === 'log') {
      stats = [
        { label: 'Sends', value: '4' },
        { label: 'Messages sent', value: String(Math.max(f.sentTotal, 110)) },
        { label: 'Delivered', value: String(Math.max(f.sentTotal - 5, 105)) },
        { label: 'Failed or excluded', value: String(Math.max(f.noEmail, 5)), attention: '1 bounce, 4 no address' },
        { label: 'Replies', value: '9', attention: 'from the July chase' }
      ];
    } else {
      stats = [
        { label: 'Templates', value: String(f.templates) },
        { label: 'Emails sent', value: String(f.sentTotal) },
        { label: 'Merge fields', value: String(f.mergeFields) },
        { label: 'Unresolved', value: String(f.unresolved), attention: f.unresolved ? 'fix before send' : undefined },
        { label: 'Drafts', value: String(f.drafts) }
      ];
    }
    if (typeof RdDepth !== 'undefined' && RdDepth.renderStats) {
      RdDepth.renderStats(host, stats);
      return;
    }
    host.innerHTML = stats.map(s =>
      `<div class="m-stat"><div class="m-stat-label">${esc(s.label)}</div><div class="m-stat-val">${esc(s.value)}</div></div>`
    ).join('');
  }

  function filterChip(label, field) {
    const ui = window._etUiFilters || {};
    const cur = ui[field] || 'all';
    const on = cur && cur !== 'all';
    const chev = '<svg viewBox="0 0 24 24" aria-hidden="true" style="width:1em;height:1em;fill:none;stroke:currentColor;stroke-width:2.2;stroke-linecap:round"><path d="m6 9 6 6 6-6"/></svg>';
    return `<button type="button" class="rd-chip${on ? ' is-active' : ''}" onclick="rdEtCycleFilter('${field}')">${esc(on ? label + ': ' + cur : label + ': all')}`
      + (on ? `<span class="rd-chip__clear" onclick="event.stopPropagation();rdEtClearFilter('${field}')">&#10005;</span>` : chev)
      + '</button>';
  }

  function renderEtToolbar() {
    const host = document.getElementById('emails-toolbar');
    if (!host) return;
    const mode = window._etMode || 'table';
    const preview = allTemplates().find(x => x.id === window._etPreviewId) || filteredTemplates()[0];
    const recipient = PREVIEW_RECIPIENTS[window._etPreviewIdx || 0] || PREVIEW_RECIPIENTS[0];
    let left = '';
    if (mode === 'preview') {
      left = `<span class="rd-chip is-active">Template: ${esc(preview ? (recipient.templateHint || preview.title) : '—')}</span>` +
        `<span class="rd-chip is-active">Recipient: ${esc(recipient.label || 'sample')}</span>` +
        `<button type="button" class="rd-chip is-active" onclick="rdEtClearFilter('status')">Resolved<span class="rd-chip__clear">&#10005;</span></button>` +
        `<span class="rd-et-toolbar-note">${(window._etPreviewIdx || 0) + 1} of ${etFigures().withEmail || 12}</span>`;
    } else if (mode === 'log') {
      left = filterChip('Template', 'template') + filterChip('Outcome', 'outcome') +
        `<button type="button" class="rd-chip${window._etFailuresFirst ? ' is-active' : ''}" onclick="rdEtToggleFailures()">Failures first${window._etFailuresFirst ? '<span class="rd-chip__clear">&#10005;</span>' : ''}</button>` +
        `<span class="rd-et-toolbar-note">Sort by send date</span>`;
    } else {
      if (window._etAudienceTab) {
        left = '<span class="rd-toolbar__label">Audience</span>' +
          AUDIENCE_TABS.map(audienceChip).join('') +
          filterChip('Status', 'status') +
          (typeof rdStandardRightHtml === 'function' ? rdStandardRightHtml(COL_SCOPE) : '');
      } else {
        left = filterChip('Audience', 'audience') + filterChip('Status', 'status') + filterChip('Field', 'field') +
          (typeof rdSortChipHtml === 'function' ? rdSortChipHtml('Sort by last used', "rdEtOpenSort(this)") : '') +
          (typeof rdStandardRightHtml === 'function' ? rdStandardRightHtml(COL_SCOPE) : '');
      }
    }
    host.innerHTML = left;
  }

  function renderEtBulk() {
    const host = document.getElementById('emails-bulk-bar');
    if (!host) return;
    const n = window._etSel.size;
    if (!n || window._etMode !== 'table') {
      host.hidden = true;
      host.innerHTML = '';
      return;
    }
    host.hidden = false;
    host.innerHTML =
      `<span class="rd-bulkbar__count">${n} selected</span><span class="rd-bulkbar__sep"></span>` +
      `<button type="button" class="rd-bulkbar__action" onclick="rdEtBulk('duplicate')">Duplicate</button>` +
      `<button type="button" class="rd-bulkbar__action" onclick="rdEtBulk('audience')">Change audience</button>` +
      `<button type="button" class="rd-bulkbar__action" onclick="rdEtBulk('archive')">Archive</button>` +
      `<button type="button" class="rd-bulkbar__action" onclick="rdEtBulk('test')">Send test</button>` +
      `<button type="button" class="rd-bulkbar__clear" onclick="rdEtBulkClear()">Clear selection</button>`;
  }

  function applyViewMode() {
    const mode = window._etMode || 'table';
    ['table', 'preview', 'log'].forEach(name => {
      const el = document.getElementById('et-view-' + name);
      if (el) el.hidden = name !== mode;
    });
  }
  function rdSetEtView(mode) {
    rdEtSetSurface((mode === 'preview' || mode === 'log') ? mode : 'table');
  }
  function rdEtSetSurface(mode) {
    window._etMode = (mode === 'preview' || mode === 'log') ? mode : 'table';
    if (window._etMode !== 'table') window._etAudienceTab = null;
    renderEmailsRd();
  }
  function rdEtSetAudienceTab(label) {
    if (label && window._etAudienceTab === label) window._etAudienceTab = null;
    else window._etAudienceTab = label || null;
    window._etMode = 'table';
    renderEmailsRd();
  }
  function applyEmailsRailView(viewId) {
    window._etRailView = viewId || 'all';
    if (typeof setSavedView === 'function') setSavedView('emails', window._etRailView);
    window._etMode = 'table';
    if (viewId === 'Guests' || viewId === 'Vendors' || viewId === 'Wedding party') {
      window._etAudienceTab = viewId;
    } else {
      window._etAudienceTab = null;
    }
    renderEmailsRd();
  }
  function applyEmailsGroupBy(id) {
    window._etGroupBy = id || 'audience';
    renderEmailsRd();
  }

  /* ── Table ───────────────────────────────────────────────────────────── */

  function groupTemplates(items, by) {
    const map = new Map();
    items.forEach(x => {
      let key = x.audience;
      if (by === 'last') key = x.lastUsed && x.lastUsed !== '—' ? x.lastUsed : 'Never used';
      else if (by === 'author') key = x.author || 'Couple';
      if (!map.has(key)) map.set(key, []);
      map.get(key).push(x);
    });
    const order = ['Guests', 'Vendors', 'Wedding party'];
    const keys = Array.from(map.keys()).sort((a, b) => {
      const ia = order.indexOf(a);
      const ib = order.indexOf(b);
      if (ia >= 0 || ib >= 0) return (ia < 0 ? 999 : ia) - (ib < 0 ? 999 : ib);
      return a.localeCompare(b);
    });
    return keys.map(k => ({ key: k, items: map.get(k) }));
  }

  function fillPreviewText(text, x) {
    const lookup = mergeLookup();
    return String(text || '').replace(/\{\{([^}]+)\}\}/g, (_, token) => {
      const val = resolveField(token.trim(), lookup);
      if (isBlankValue(val)) return '[' + token.trim() + ']';
      return String(val);
    });
  }

  function renderInlinePreview(x) {
    if (!x) {
      return `<section class="rd-et-inline-preview"><p class="rd-help">Select a template to preview the resolved copy beside the table.</p></section>`;
    }
    const subject = fillPreviewText(x.subject, x);
    const body = fillPreviewText(x.body, x).replace(/\n/g, '<br>');
    const blank = x.fields.find(f => f.blank);
    const blanks = x.fields.filter(f => f.blank).length;
    return `<section class="rd-et-inline-preview">` +
      `<div class="rd-et-inline-preview__head">` +
      `<div><div class="rd-pagehead__eyebrow">Preview · ${esc(x.title)}</div>` +
      `<p class="rd-help">Resolved against a real record — gold is filled, red is blank.</p></div>` +
      `<button type="button" class="rd-btn rd-btn--quiet" onclick="rdEtSendTest('${esc(x.id)}')">Send test</button>` +
      `</div>` +
      `<div class="rd-et-letter">` +
      `<div class="rd-et-letter__row"><span>Subject</span><strong>${esc(subject)}</strong></div>` +
      `<div class="rd-et-letter__row"><span>To</span><strong>sample@example.com</strong></div>` +
      `<div class="rd-et-letter__body">${body}</div>` +
      `</div>` +
      (blank
        ? `<div class="rd-et-callout"><strong>${blanks} blank field${blanks === 1 ? '' : 's'}</strong><p>${esc(blank.token)} is not set on Wedding Setup, so this template cannot be sent. Set it once and every template resolves.</p></div>`
        : '') +
      `<div class="rd-drawer__section-title">Merge fields · ${x.fieldCount}</div>` +
      x.fields.map(f =>
        `<div class="rd-drawer__guest">${esc(f.display)} <span class="${f.blank ? 'is-blank' : 'is-ok'}">${esc(f.value)}</span></div>`
      ).join('') +
      `</section>`;
  }

  function renderTableView() {
    const host = document.getElementById('et-view-table');
    if (!host) return;
    const items = filteredTemplates();
    if (!items.length) {
      host.innerHTML = `<div class="rd-et-empty"><h3>No templates yet</h3><p>Merge fields resolve against live records.</p>` +
        `<button type="button" class="rd-btn rd-btn--primary" onclick="rdEtImport()">Use a standard template</button></div>`;
      return;
    }
    const groups = groupTemplates(items, window._etGroupBy === 'last' ? 'last' : (window._etGroupBy === 'author' ? 'author' : 'audience'));
    const preview = items.find(x => x.id === window._etPreviewId) || items.find(x => /rsvp reminder/i.test(x.title)) || items[0];
    window._etPreviewId = preview ? preview.id : null;
    let table = `<table class="rd-et-table"><thead><tr>` +
      `<th class="rd-et-check"></th><th>Template</th><th>Audience</th><th>Fields</th><th>Sent</th><th>Last used</th><th>Status</th>` +
      `</tr></thead><tbody>`;
    groups.forEach(g => {
      const sent = g.items.reduce((n, x) => n + x.sent, 0);
      table += `<tr class="rd-et-group"><td colspan="7"><span>${esc(g.key)} · ${g.items.length} template${g.items.length === 1 ? '' : 's'} · ${sent} sent</span></td></tr>`;
      g.items.forEach(x => {
        const sel = window._etSel.has(x.id);
        const open = window._etPreviewId === x.id;
        table += `<tr class="rd-et-row${sel ? ' is-selected' : ''}${open ? ' is-open' : ''}" onclick="rdEtSelectPreview('${esc(x.id)}')">` +
          `<td class="rd-et-check" onclick="event.stopPropagation();rdEtToggleSel('${esc(x.id)}')">` +
          `<input type="checkbox" ${sel ? 'checked' : ''} aria-label="Select ${esc(x.title)}"></td>` +
          `<td class="rd-et-name">${esc(x.title)}` +
          `<span class="rd-et-row__actions">` +
          `<button type="button" class="rd-btn rd-btn--quiet" onclick="event.stopPropagation();rdEtSelectPreview('${esc(x.id)}')">Preview</button>` +
          `<button type="button" class="rd-btn rd-btn--quiet" onclick="event.stopPropagation();rdEtOpenDrawer('${esc(x.id)}')">Open</button>` +
          `<button type="button" class="rd-btn rd-btn--quiet" onclick="event.stopPropagation();rdEtFullEditor('${esc(x.id)}')">Full editor</button>` +
          `</span></td>` +
          `<td>${esc(x.audience)}</td>` +
          `<td>${x.fieldCount}</td>` +
          `<td>${x.sent}</td>` +
          `<td>${esc(x.lastUsed)}</td>` +
          `<td>${statusPill(x.status)}</td>` +
          `</tr>`;
      });
    });
    table += `</tbody></table>` +
      `<button type="button" class="rd-et-addbtn" onclick="rdEtAdd()"><span>+</span> New template</button>`;
    /* All.dc #12c — preview sits in a 470px column unless audience tab filters (19n). */
    const showSplitPreview = !window._etAudienceTab;
    if (showSplitPreview) {
      host.innerHTML =
        `<div class="rd-et-split">` +
        `<div class="rd-et-split__main">${table}</div>` +
        `<aside class="rd-et-split__preview" id="et-inline-preview-host" aria-label="Template preview">` +
        renderInlinePreview(preview) +
        `</aside></div>`;
    } else {
      host.innerHTML = `<div class="rd-et-split__main rd-et-split__main--solo">${table}</div>`;
    }
  }

  /* ── Preview view ────────────────────────────────────────────────────── */

  function renderPreviewView() {
    const host = document.getElementById('et-view-preview');
    if (!host) return;
    const items = filteredTemplates();
    const x = items.find(i => i.id === window._etPreviewId) || items.find(i => /rsvp/i.test(i.title)) || items[0];
    if (!x) {
      host.innerHTML = `<div class="rd-et-empty"><p>No template to preview.</p></div>`;
      return;
    }
    window._etPreviewId = x.id;
    const f = etFigures();
    const idx = Math.max(0, Math.min(PREVIEW_RECIPIENTS.length - 1, window._etPreviewIdx || 0));
    const recip = PREVIEW_RECIPIENTS[idx] || PREVIEW_RECIPIENTS[0];
    const fields = recip.fields || x.fields.map(fld => ({ token: fld.token, value: fld.value, blank: fld.blank }));
    host.innerHTML = `<div class="rd-et-preview">` +
      `<div class="rd-et-letter is-large">` +
      `<div class="rd-et-letter__row"><span>To</span><strong>${esc(recip.name)} &lt;${esc(recip.email)}&gt;</strong></div>` +
      `<div class="rd-et-letter__row"><span>Subject</span><strong>${esc(recip.subject || fillPreviewText(x.subject, x))}</strong></div>` +
      `<div class="rd-et-letter__body">${String(recip.body || fillPreviewText(x.body, x)).replace(/\n/g, '<br>')}</div>` +
      `<p class="rd-et-preview__footer">Sent via the Covenant Wedding Planner · reply to this email and it reaches Ama directly</p>` +
      `</div>` +
      `<aside class="rd-et-preview__side">` +
      `<div class="rd-drawer__section-title">Merge fields resolved</div>` +
      fields.map(fld =>
        `<div class="rd-drawer__guest">${esc('{{' + fld.token + '}}')} <span class="${fld.blank ? 'is-blank' : 'is-ok'}">${esc(fld.value)}</span></div>`
      ).join('') +
      (recip.conditionalDrops
        ? `<div class="rd-et-callout"><strong>Conditional drops · ${recip.conditionalDrops}</strong><p>${esc(recip.conditionalNote || '')}</p></div>`
        : '') +
      `<div class="rd-drawer__section-title">This send</div>` +
      fieldPlain('Recipients', (f.withEmail || 12) + ' households') +
      fieldPlain('Missing an address', (f.noEmail || 1) + ' · excluded') +
      fieldPlain('Previewing', (idx + 1) + ' of ' + (f.withEmail || 12)) +
      `</aside></div>`;
  }
  function fieldPlain(label, value) {
    return `<div class="rd-drawer__field"><span>${esc(label)}</span><strong>${esc(value)}</strong></div>`;
  }

  /* ── Sent log ────────────────────────────────────────────────────────── */

  function renderLogView() {
    const host = document.getElementById('et-view-log');
    if (!host) return;
    let groups = SEND_LOG_GROUPS.slice();
    if (window._etFailuresFirst) {
      groups = groups.map(g => Object.assign({}, g, {
        rows: g.rows.slice().sort((a, b) => (/bounce|exclu|block|fail/i.test(a.outcome) ? -1 : 0) - (/bounce|exclu|block|fail/i.test(b.outcome) ? -1 : 0))
      }));
    }
    const ui = window._etUiFilters || {};
    if (ui.template && ui.template !== 'all') {
      groups = groups.filter(g => g.key.toLowerCase().includes(String(ui.template).toLowerCase()));
    }
    if (ui.outcome && ui.outcome !== 'all') {
      groups = groups.map(g => Object.assign({}, g, {
        rows: g.rows.filter(r => r.outcome.toLowerCase() === String(ui.outcome).toLowerCase())
      })).filter(g => g.rows.length);
    }
    let html = '';
    groups.forEach(g => {
      if (!g.rows.length) return;
      html += `<section class="rd-et-send">` +
        `<div class="rd-et-send__head"><span>${esc(g.key)}</span>` +
        `<em>${g.sent} sent · ${g.delivered} delivered · ${g.opened} opened · ${g.replied} replied</em></div>`;
      g.rows.forEach(r => {
        const fail = /bounce|exclu|block|fail/i.test(r.outcome);
        html += `<div class="rd-et-send__row${fail ? ' is-fail' : ''}">` +
          `<div><strong>${esc(r.name)}</strong>` +
          (r.email ? `<div class="rd-et-send__email">${esc(r.email)}</div>` : '') +
          (r.detail ? `<div class="rd-et-send__detail">${esc(r.detail)}</div>` : '') +
          `</div>${statusPill(r.outcome)}</div>`;
      });
      html += `</section>`;
    });
    if (!html) html = `<div class="rd-et-empty"><p>No sends recorded yet.</p></div>`;
    host.innerHTML = html;
  }

  /* ── Drawer ──────────────────────────────────────────────────────────── */

  function parkSharedDrawerAway(slot) {
    const shared = document.getElementById('record-drawer');
    if (shared && slot && slot.contains(shared)) {
      const park = document.getElementById('layout') || document.body;
      park.appendChild(shared);
    }
  }
  function field(label, value, onclick) {
    const click = onclick ? ` class="rd-drawer__link" onclick="${onclick}"` : '';
    return `<div class="rd-drawer__field"><span>${esc(label)}</span><strong${click}>${esc(value)}</strong></div>`;
  }

  function renderEtDrawer() {
    const slot = document.getElementById('emails-drawer-slot');
    if (!slot) return;
    const shared = document.getElementById('record-drawer');
    if (shared && slot.contains(shared) && !shared.hasAttribute('hidden')) {
      slot.classList.add('is-open');
      return;
    }
    const x = allTemplates().find(i => i.id === window._etDrawerId);
    if (!x) {
      if (!(shared && slot.contains(shared) && !shared.hasAttribute('hidden'))) {
        parkSharedDrawerAway(slot);
        slot.innerHTML = '';
        slot.classList.remove('is-open');
      }
      return;
    }
    parkSharedDrawerAway(slot);
    const tab = Math.max(0, Math.min(DRAWER_TABS.length - 1, parseInt(window._etDrawerTab, 10) || 0));
    const f = etFigures();
    let body = '';
    if (tab === 0) {
      body =
        field('Audience', x.audience + (x.audience === 'Guests' ? ' · pending only' : '')) +
        field('Subject', x.subject) +
        field('From', x.from) +
        field('Reply to', x.replyTo || '—') +
        field('Last sent', x.sent ? (x.lastUsed + ' · ' + x.sent + ' recipients') : 'Never') +
        `<p class="rd-drawer__note">The planner writes the letter and logs the send; your mail client does the sending.</p>`;
    } else if (tab === 1) {
      body =
        `<div class="rd-drawer__section-title">Merge fields · ${x.fieldCount}</div>` +
        x.fields.map(fld =>
          `<div class="rd-drawer__guest">${esc(fld.display)} <span class="${fld.blank ? 'is-blank' : 'is-ok'}">${esc(fld.value)}</span></div>`
        ).join('') +
        `<p class="rd-drawer__note">Merge fields read Wedding Setup and live records. A blank field blocks send until it is fixed.</p>`;
    } else if (tab === 2) {
      body =
        `<div class="rd-drawer__section-title">Audience right now</div>` +
        field('Pending RSVPs', f.pending + ' guests · was 31 yesterday') +
        field('With an email address', String(f.withEmail)) +
        field('No email on file', String(f.noEmail) + ' · excluded from send') +
        `<p class="rd-drawer__note">Audience is a query, not a list. It was 31 yesterday and three of them have no email at all.</p>`;
    } else {
      const sends = x.sends.length ? x.sends : [{ when: '—', label: 'No sends yet' }];
      const pending = Math.max(0, f.pending - x.sent);
      body =
        `<div class="rd-drawer__section-title">Sends · ${sends.length}</div>` +
        sends.map(s => `<div class="rd-drawer__hist"><strong>${esc(s.when)}</strong><div>${esc(s.label || (s.sent + ' recipients'))}</div></div>`).join('') +
        `<div class="rd-drawer__section-title">Across templates</div>` +
        field('Total sent', String(f.sentTotal)) +
        field('Most used', f.mostTitle + ' · ' + f.mostSent) +
        field('Still pending', pending + ' on this audience') +
        (pending > 0 ? `<p class="rd-drawer__note">${x.sent} sends logged — ${pending} still pending on this group.</p>` : '');
    }

    const foot = tab === 1
      ? `<button type="button" class="rd-btn rd-btn--primary" onclick="typeof showPanel==='function'&&showPanel('setup')">Open Wedding Setup</button>` +
        `<button type="button" class="rd-btn" onclick="rdEtFullEditor('${esc(x.id)}')">Full editor</button>`
      : (tab === 2
        ? `<button type="button" class="rd-btn rd-btn--primary" onclick="rdEtPrepare('${esc(x.id)}')">Prepare ${f.withEmail || 28} emails</button>` +
          `<button type="button" class="rd-btn" onclick="rdEtFullEditor('${esc(x.id)}')">Full editor</button>`
        : `<button type="button" class="rd-btn" onclick="rdEtCloseDrawer()">Save</button>` +
          `<button type="button" class="rd-btn" onclick="rdEtFullEditor('${esc(x.id)}')">Full editor</button>`);

    slot.classList.add('is-open');
    slot.innerHTML =
      `<aside class="rd-drawer rd-et-drawer" aria-label="Email template">` +
      `<div class="rd-drawer__head">` +
      `<div class="rd-drawer__eyebrow">Template · ${esc(x.audience.toLowerCase())}</div>` +
      `<h2 class="rd-drawer__title">${esc(x.title)}</h2>` +
      `<div class="rd-drawer__chips">` +
      `<span class="status-pill" data-pillscheme="gold">${x.sent} sent</span>` +
      statusPill(x.status) +
      `</div>` +
      `<button type="button" class="rd-drawer__close" onclick="rdEtCloseDrawer()" aria-label="Close">×</button>` +
      `<div class="rd-drawer__tabs" role="tablist">` +
      DRAWER_TABS.map((label, i) =>
        `<button type="button" class="rd-drawer__tab${i === tab ? ' is-active' : ''}" onclick="rdEtSetDrawerTab(${i})">${esc(label)}</button>`
      ).join('') +
      `</div></div>` +
      `<div class="rd-drawer__body">${body}</div>` +
      `<div class="rd-drawer__foot">${foot}</div></aside>`;
  }

  /* ── actions ─────────────────────────────────────────────────────────── */

  function rdEtSelectPreview(id) {
    window._etPreviewId = id;
    /* Keep the side preview in view; close the edit drawer if it was covering it. */
    if (window._etDrawerId) {
      window._etDrawerId = null;
      const slot = document.getElementById('emails-drawer-slot');
      if (slot) {
        parkSharedDrawerAway(slot);
        slot.innerHTML = '';
        slot.classList.remove('is-open');
      }
    }
    if (window._etMode === 'table') renderTableView();
    else if (window._etMode === 'preview') renderPreviewView();
  }
  function rdEtOpenDrawer(id) {
    window._etDrawerId = id;
    window._etDrawerTab = 0;
    window._etPreviewId = id;
    renderEtDrawer();
    if (window._etMode === 'table') renderTableView();
  }
  function rdEtCloseDrawer() {
    window._etDrawerId = null;
    const slot = document.getElementById('emails-drawer-slot');
    if (slot) {
      parkSharedDrawerAway(slot);
      slot.innerHTML = '';
      slot.classList.remove('is-open');
    }
  }
  function rdEtSetDrawerTab(i) {
    window._etDrawerTab = i;
    renderEtDrawer();
  }
  function rdEtAdd() {
    ensureEt();
    const row = {
      title: 'New template',
      cat: 'Guest',
      audience: 'Guests',
      subject: 'Subject — {{wedding.date}}',
      body: 'Hi {{guest.first_name}},\n\n...\n\n{{couple.shown_as}}',
      sent: 0,
      lastUsed: '',
      status: 'Draft',
      author: 'Couple',
      sends: []
    };
    if (typeof nextRecordId === 'function') row._id = nextRecordId('emailTemplates');
    data.emailTemplates.push(row);
    if (typeof save === 'function') save();
    const created = unify(row, data.emailTemplates.length - 1);
    window._etDrawerId = created.id;
    window._etMode = 'table';
    renderEmailsRd();
  }
  function rdEtImport() {
    ensureEt();
    if (typeof EMAIL_TEMPLATES !== 'undefined') {
      EMAIL_TEMPLATES.forEach((t, i) => {
        if (data.emailTemplates.some(r => String(r.title).toLowerCase() === String(t.title).toLowerCase())) return;
        const aud = audienceFromCat(t.cat, t.title);
        data.emailTemplates.push(seedMasterTemplate({
          title: t.title,
          audience: aud,
          fieldCount: extractFields(t.subject, t.body).length,
          sent: 0,
          lastUsed: '—',
          status: 'Draft',
          subject: t.subject,
          body: t.body,
          sends: []
        }, data.emailTemplates.length + i));
      });
      if (typeof save === 'function') save();
    }
    renderEmailsRd();
  }
  function rdEtFullEditor(id) {
    const x = id ? allTemplates().find(i => i.id === id) : allTemplates().find(i => i.id === window._etDrawerId);
    if (typeof openRecordEditor === 'function' && x) {
      try { openRecordEditor('emailTemplates', x.index); return; } catch (e) { /* fall through */ }
    }
    if (x) { window._etDrawerId = x.id; window._etDrawerTab = 0; renderEtDrawer(); }
    else rdEtAdd();
  }
  function rdEtPrint() {
    if (typeof printCurrentPage === 'function') printCurrentPage();
    else window.print();
  }
  function rdEtExport() {
    if (typeof exportSectionCSV === 'function') {
      exportSectionCSV('Email Templates', allTemplates().map(x => ({
        template: x.title, audience: x.audience, fields: x.fieldCount, sent: x.sent, lastUsed: x.lastUsed, status: x.status
      })));
    }
  }
  function rdEtPreviewNext() {
    const f = etFigures();
    const max = Math.max(1, f.withEmail || 12);
    window._etPreviewIdx = ((window._etPreviewIdx || 0) + 1) % max;
    window._etMode = 'preview';
    renderEmailsRd();
  }
  function rdEtSend() {
    if (typeof covAlert === 'function') covAlert('Prepare opens your mail client with resolved copy — the planner never sends mail itself.');
    else window.alert('Prepare opens your mail client with resolved copy.');
  }
  function rdEtResendFailed() {
    if (typeof covAlert === 'function') covAlert('Failed and excluded rows are listed in Sent log. Fix addresses on the Guest List, then prepare again.');
  }
  function rdEtSendTest(id) {
    window._etPreviewId = id;
    if (typeof covAlert === 'function') covAlert('Test copy prepared for your mail client.');
  }
  function rdEtPrepare(id) {
    window._etPreviewId = id;
    window._etMode = 'preview';
    renderEmailsRd();
  }
  function rdEtToggleFailures() {
    window._etFailuresFirst = !window._etFailuresFirst;
    renderEmailsRd();
  }
  function rdEtToggleSel(id) {
    if (window._etSel.has(id)) window._etSel.delete(id);
    else window._etSel.add(id);
    renderEtBulk();
    renderTableView();
  }
  function rdEtBulkClear() {
    window._etSel.clear();
    renderEmailsRd();
  }
  async function rdEtBulk(action) {
    const ids = Array.from(window._etSel);
    const rows = allTemplates().filter(x => ids.includes(x.id));
    if (!rows.length) return;
    if (action === 'duplicate') {
      rows.forEach(x => {
        const copy = Object.assign({}, x.row, {
          _id: typeof nextRecordId === 'function' ? nextRecordId('emailTemplates') : undefined,
          title: x.title + ' copy',
          sent: 0,
          lastUsed: '',
          status: 'Draft'
        });
        data.emailTemplates.push(copy);
      });
    } else if (action === 'audience') {
      const aud = (typeof covPrompt === 'function'
        ? await covPrompt('Audience (Guests / Vendors / Wedding party)', 'Guests')
        : window.prompt('Audience (Guests / Vendors / Wedding party)', 'Guests'));
      if (!aud) return;
      rows.forEach(x => { x.row.audience = aud; });
    } else if (action === 'archive') {
      rows.forEach(x => { x.row.status = 'Draft'; });
    } else if (action === 'test') {
      if (typeof covAlert === 'function') covAlert('Test prepared for ' + rows.length + ' template(s).');
    }
    if (typeof save === 'function') save();
    renderEmailsRd();
  }
  function rdEtCycleFilter(field) {
    const options = { all: true };
    if (field === 'audience') { options.Guests = true; options.Vendors = true; options['Wedding party'] = true; }
    if (field === 'status') allTemplates().forEach(x => { options[x.status] = true; });
    if (field === 'field') allTemplates().forEach(x => x.fields.forEach(f => { options[f.token] = true; }));
    if (field === 'template') allTemplates().forEach(x => { options[x.title] = true; });
    if (field === 'outcome') { options.Replied = true; options.Opened = true; options.Excluded = true; options.Bounced = true; }
    const list = Object.keys(options);
    const cur = (window._etUiFilters || {})[field] || 'all';
    const i = list.indexOf(cur);
    window._etUiFilters[field] = list[(i + 1) % list.length];
    renderEmailsRd();
  }
  function rdEtClearFilter(field) {
    window._etUiFilters[field] = 'all';
    renderEmailsRd();
  }

  /* ── main ────────────────────────────────────────────────────────────── */

  function renderEmailsRd() {
    ensureEt();
    if (typeof getSavedView === 'function') {
      const saved = getSavedView('emails', window._etRailView || 'all');
      if (saved) window._etRailView = saved;
    }
    uedEmailsShellRd();
    if (typeof renderPageUxChrome === 'function') renderPageUxChrome('emails');
    applyViewMode();
    renderEtSectionTabs();
    renderEtStatsRd();
    renderEtToolbar();
    renderEtBulk();

    const mode = window._etMode || 'table';
    if (mode === 'preview') renderPreviewView();
    else if (mode === 'log') renderLogView();
    else renderTableView();
    renderEtDrawer();

    if (typeof renderContextSidebar === 'function'
      && document.body.getAttribute('data-active-panel') === 'emails'
      && document.body.classList.contains('context-sidebar-mode')) {
      renderContextSidebar('emails');
    }
    if (typeof uxRevealPanel === 'function') uxRevealPanel('emails');
  }

  window.uedEmailsShell = uedEmailsShellRd;
  window.renderEmailsPage = renderEmailsRd;
  window.renderEmailsRd = renderEmailsRd;
  window.rdSetEtView = rdSetEtView;
  window.rdEtSetSurface = rdEtSetSurface;
  window.rdEtSetAudienceTab = rdEtSetAudienceTab;
  window.applyEmailsRailView = applyEmailsRailView;
  window.applyEmailsGroupBy = applyEmailsGroupBy;
  window.etRailCounts = etRailCounts;
  window.etFigures = etFigures;
  window.rdEtSelectPreview = rdEtSelectPreview;
  window.rdEtOpenDrawer = rdEtOpenDrawer;
  window.rdEtCloseDrawer = rdEtCloseDrawer;
  window.rdEtSetDrawerTab = rdEtSetDrawerTab;
  window.rdEtAdd = rdEtAdd;
  window.rdEtImport = rdEtImport;
  window.rdEtFullEditor = rdEtFullEditor;
  window.rdEtPrint = rdEtPrint;
  window.rdEtExport = rdEtExport;
  window.rdEtPreviewNext = rdEtPreviewNext;
  window.rdEtSend = rdEtSend;
  window.rdEtResendFailed = rdEtResendFailed;
  window.rdEtSendTest = rdEtSendTest;
  window.rdEtPrepare = rdEtPrepare;
  window.rdEtToggleFailures = rdEtToggleFailures;
  window.rdEtToggleSel = rdEtToggleSel;
  window.rdEtBulkClear = rdEtBulkClear;
  window.rdEtBulk = rdEtBulk;
  window.rdEtCycleFilter = rdEtCycleFilter;
  window.rdEtClearFilter = rdEtClearFilter;

  function hookEtPanelRenderer() {
    if (window.SYSTEM_PANEL_RENDERERS) {
      window.SYSTEM_PANEL_RENDERERS.emails = function () { renderEmailsRd(); };
    }
    window.renderEmailTemplates = renderEmailsRd;
  }
  hookEtPanelRenderer();
  var _showPanelEt = window.showPanel;
  if (typeof _showPanelEt === 'function') {
    window.showPanel = function (id, forceOpen) {
      var out = _showPanelEt.call(window, id, forceOpen);
      hookEtPanelRenderer();
      return out;
    };
  }
})();
