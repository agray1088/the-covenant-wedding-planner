/* Vendor Portal — separate product (Planner Vendor Portal.dc.html V1–V5).
   No login. Token in ?g=… or ?expired=1. Reads planner localStorage when present;
   falls back to Adom Catering demo matching the mocks. Counts without names. */
(function () {
  'use strict';

  var STORAGE_KEY = 'covenant_planner_v1';
  var ACTIVE_KEY = 'covenant_active_profile';
  var TABS = [
    { id: 'brief', label: 'Your brief', short: 'Brief' },
    { id: 'schedule', label: 'Your schedule', short: 'Schedule' },
    { id: 'paperwork', label: 'Your paperwork', short: 'Paperwork' },
    { id: 'upload', label: 'Upload', short: 'Upload' }
  ];

  /* ── The rules underneath (V6/V7) — the scope contract and the access
        lifecycle. Not a fifth tab: the four tabs above are what these two
        produce. The reasons are load-bearing — they are what lets someone
        extend the table correctly in a year — so every row carries its why.
        The marks are the security model itself, not settings: every ✕ is
        absent from the model, not hidden behind a permission flag. */
  var SCOPE_ROWS = [
    { data: 'Their own contract',            v: '✓',        c: '✓', p: '✓',       why: 'It is theirs. Withholding it creates email.' },
    { data: 'Their instalments and invoices', v: '✓',       c: '✓', p: '✓',       why: 'Both parties must see the same schedule.' },
    { data: 'Their slice of the run sheet',  v: '✓',        c: '✓', p: '✓',       why: 'Derived live, so a moved dinner moves their page.' },
    { data: 'Headcount and dietary counts',  v: 'counts',   c: '✓', p: '✓',       why: 'The kitchen needs numbers, not identities.' },
    { data: 'Venue access, loading, power',  v: '✓',        c: '✓', p: '✓',       why: 'Operational, and the venue already told them.' },
    { data: 'Day-of contact for them',       v: '2 numbers', c: '✓', p: '✓',      why: 'The planner and the venue. Not the full list.' },
    { data: 'Guest names and addresses',     v: '✕',        c: '✓', p: '✓',       why: 'No catering decision requires a name.' },
    { data: 'Budget totals and targets',     v: '✕',        c: '✓', p: '✓',       why: 'Knowing the pot changes the next quote.' },
    { data: "Other vendors' pricing",        v: '✕',        c: '✓', p: '✓',       why: 'Commercially theirs, not shared.' },
    { data: "Other vendors' run sheets",     v: '✕',        c: '✓', p: '✓',       why: 'Only their own dependencies are surfaced.' },
    { data: 'The Covenant tab',              v: '✕',        c: '✓', p: 'granted', why: 'Private to the couple; planner access is opt-in.' },
    { data: 'Internal notes',                v: '✕',        c: '✓', p: '✓',       why: 'Notes are candid by design.' },
    { data: 'Planner history',               v: '✕',        c: '✓', p: '✓',       why: 'An audit log is not a shared artefact.' },
    { data: 'Saved views',                   v: '✕',        c: 'own', p: 'own',   why: 'Per person, never travels.' },
    { data: 'Share-packet activity',         v: '✕',        c: '✓', p: '✓',       why: "Who opened what is the couple's business." }
  ];

  var LIFECYCLE_STEPS = [
    { n: 1, title: 'Planner builds the packet', body: 'From Share Packets. Picks the vendor; the portal decides the contents from the scope contract — there is no content picker.' },
    { n: 2, title: 'Link is sent', body: 'A URL with an embedded token. No account, no password — the vendor is a caterer, not a user we are trying to acquire. Same trust model as a calendar invite.' },
    { n: 3, title: 'Vendor opens it', body: "Provenance banner names who shared it and when access ends. First open is logged and surfaces in the couple's Share Packets · Activity view." },
    { n: 4, title: 'Vendor works from it', body: 'Reads their brief, accepts the schedule, uploads what they owe. Every write is attributed and lands as a note on their vendor record.' },
    { n: 5, title: 'Access expires', body: 'Four days after the wedding, automatically. Downloaded files stay theirs; the live view closes.' }
  ];

  var REVOKE_ROWS = [
    { label: 'Stops the live link',       val: 'immediately',      tone: 'ok' },
    { label: 'Ends further downloads',    val: 'immediately',      tone: 'ok' },
    { label: 'Removes them from activity', val: 'no · the log is kept', tone: 'no' },
    { label: 'Recalls a downloaded PDF',  val: 'no · impossible',  tone: 'no' },
    { label: 'Deletes what they uploaded', val: "no · it is the couple's now", tone: 'no' }
  ];

  function scopeMarkClass(mark) {
    if (mark === '✓') return 'vp-mk is-yes';
    if (mark === '✕') return 'vp-mk is-no';
    return 'vp-mk is-part';
  }

  var state = {
    tab: 'brief',
    session: null,
    forceExpired: false,
    rulesOpen: false
  };

  /** Match planner dark-mode preference (sync key, saved setup.darkMode, or system). */
  function applyVpDarkMode() {
    var on = false;
    try {
      var sync = localStorage.getItem('covenant_dark_mode');
      if (sync === '1') on = true;
      else if (sync === '0') on = false;
      else {
        var data = loadPlannerData();
        if (data && data.setup && typeof data.setup.darkMode === 'boolean') {
          on = data.setup.darkMode;
        } else if (window.matchMedia) {
          on = window.matchMedia('(prefers-color-scheme: dark)').matches;
        }
      }
    } catch (e) { /* ignore */ }
    document.body.classList.toggle('dark-mode', on);
    document.body.setAttribute('data-theme', on ? 'dark' : 'light');
    document.documentElement.style.colorScheme = on ? 'dark' : 'light';
  }

  function esc(s) {
    return String(s == null ? '' : s).replace(/[&<>"']/g, function (c) {
      return ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[c];
    });
  }

  function qs(name) {
    try {
      return new URLSearchParams(window.location.search).get(name);
    } catch (e) { return null; }
  }

  function profileDataKey(id) {
    return (!id || id === 'default') ? STORAGE_KEY : STORAGE_KEY + '_' + id;
  }

  function loadPlannerData() {
    try {
      var active = localStorage.getItem(ACTIVE_KEY) || 'default';
      var raw = localStorage.getItem(profileDataKey(active));
      if (!raw) raw = localStorage.getItem(STORAGE_KEY);
      if (!raw) return null;
      return JSON.parse(raw);
    } catch (e) { return null; }
  }

  function tokenFromLink(link) {
    var m = String(link || '').match(/\/g\/([A-Za-z0-9_-]+)/);
    return m ? m[1] : '';
  }

  function fmtLong(iso) {
    if (!iso) return '—';
    var d = new Date(String(iso).slice(0, 10) + 'T00:00:00');
    if (Number.isNaN(d.getTime())) return String(iso);
    return d.toLocaleDateString('en-GB', { day: 'numeric', month: 'long', year: 'numeric' });
  }

  function fmtShort(iso) {
    if (!iso) return '—';
    var d = new Date(String(iso).slice(0, 10) + 'T00:00:00');
    if (Number.isNaN(d.getTime())) return String(iso);
    return d.toLocaleDateString('en-GB', { day: 'numeric', month: 'short' });
  }

  function coupleNames(setup) {
    var b = String((setup && setup.bride) || '').trim();
    var g = String((setup && setup.groom) || '').trim();
    if (b && g) return b + ' & ' + g;
    return b || g || 'Ama & Kwesi';
  }

  function dietaryCounts(data) {
    var covers = 0, veg = 0, nut = 0;
    var guests = (data && Array.isArray(data.guests)) ? data.guests : [];
    covers = guests.length;
    guests.forEach(function (g) {
      var meal = String(g.meal || g.diet || g.dietary || '').toLowerCase();
      var notes = String(g.notes || g.allergies || '').toLowerCase();
      if (/veg|plant/.test(meal) || /veg/.test(notes)) veg++;
      if (/nut/.test(meal) || /nut/.test(notes)) nut++;
    });
    return {
      covers: covers || 142,
      vegetarian: veg || 9,
      nutAllergy: nut || 3,
      serviceAt: '6:30pm'
    };
  }

  function demoSession(opts) {
    opts = opts || {};
    return {
      token: opts.token || 'cat9',
      status: opts.status || 'live',
      sharedBy: 'Mary Osei',
      sharedOn: '4 April',
      expires: opts.expires || '2026-11-12',
      mode: 'Live',
      wedding: { coupleNames: 'Ama & Kwesi', date: '2026-11-08', dateLabel: '8 November 2026' },
      vendor: { name: 'Adom Catering', category: 'Catering' },
      counts: { covers: 142, vegetarian: 9, nutAllergy: 3, serviceAt: '6:30pm' },
      slice: [
        { title: 'Kitchen access', meta: 'Loading bay, rear · 3-phase power available', time: '1:00pm', kind: 'loadin' },
        { title: 'Canapés to the marquee', meta: '142 covers · passed, not stationed', time: '4:30pm', kind: 'service' },
        { title: 'Dinner service', meta: '142 covers · 9 vegetarian · 3 nut-free', time: '6:30pm', kind: 'service' },
        { title: 'Cake cut', meta: 'Coordinated with the band break', time: '9:15pm', kind: 'service' },
        { title: 'Clear-down', meta: 'Kitchen and marquee · out by 12:30am', time: '10:30pm', kind: 'clear' }
      ],
      scheduleGantt: {
        dayTitle: 'Sunday 8 November',
        onSite: '1:00pm–12:30am',
        obligations: 5,
        crew: 10,
        setup: '90 min',
        lanes: [
          { name: 'Kitchen', sub: '1:00pm · prep · Yaa + 6', bar: 'Load in', left: 4, width: 14, hatch: true },
          { name: 'Canapés', sub: '4:30pm · 142 passed', bar: 'Canapés', left: 36, width: 14, hatch: false },
          { name: 'Dinner', sub: '6:30pm · 142 covers', bar: 'Dinner', left: 52, width: 14, hatch: false },
          { name: 'Cake', sub: '9:15pm · with the band break', bar: 'Cake', left: 74, width: 11, hatch: false },
          { name: 'Clear down', sub: '10:30pm · out by 12:30am', bar: 'Clear down', left: 84, width: 14, hatch: true }
        ],
        footnote: 'Hatched is load-in and clear-down; solid is service. Two things depend on you and are shown so you can see them: the venue cannot flip the room until canapés are out, and the band break is set around your cake cut.'
      },
      deps: [
        'Grace Hall waits on canapés before guests move from the lawn.',
        'The band holds the break until cake is cut.'
      ],
      owed: [
        { title: 'Certificate of insurance', meta: 'The venue will not release keys without it', due: '1 Oct', tone: 'danger' },
        { title: 'Final vegetarian main', meta: 'After the 20 August tasting', due: '20 Aug', tone: 'warn' }
      ],
      contacts: [
        { name: 'Mary Osei', role: 'Planner · call first', phone: '+233 24 330 1187' },
        { name: 'Nana Ama', role: 'Grace Hall venue', phone: '+233 30 277 9000' }
      ],
      paperwork: {
        contractValue: '$12,780',
        paid: '$3,000',
        outstanding: '$9,780',
        nextDue: '1 Nov',
        contract: {
          title: 'Service agreement',
          meta: 'Signed by both parties 2 Apr',
          headMeta: 'signed 2 April · 6 pages'
        },
        clauses: [
          { title: 'Final headcount clause', meta: 'Numbers lock 1 November', chip: '1 Nov', tone: 'warn' },
          { title: 'Cancellation terms', meta: '60 days · clause 9', chip: 'View', tone: '' }
        ],
        instalments: [
          { title: 'Deposit', meta: 'Paid 2 April · receipt available', amount: '$3,000', tone: 'ok' },
          { title: 'Second instalment', meta: 'Due on final headcount', amount: '$4,890', tone: 'warn' },
          { title: 'Balance', meta: 'Due on the day', amount: '$4,890', tone: '' }
        ],
        invoices: [
          { title: 'INV-0412 · deposit', meta: 'Issued 2 Apr · settled 4 Apr', amount: '$3,000', tone: 'ok' },
          { title: 'INV-0788 · second', meta: 'Issued 20 Jul · unpaid', amount: '$4,890', tone: 'warn' }
        ]
      },
      uploads: {
        outstanding: [
          {
            title: 'Certificate of insurance',
            due: 'Due 1 October',
            tone: 'danger',
            body: 'Grace Hall will not release keys to any caterer without a current COI naming them as additionally insured. You have been asked twice — 14 July and 22 July.',
            drop: true
          },
          {
            title: 'Final vegetarian main',
            due: 'After 20 August',
            tone: 'warn',
            body: 'Nine guests are waiting on this. It cannot be submitted before the tasting on 20 August, so it is not overdue — it is scheduled.',
            drop: false
          }
        ],
        done: [
          { title: 'Food hygiene certificate', meta: 'Uploaded 4 Apr · expires 12 Mar 2027', tone: 'ok' },
          { title: 'Sample menu, signed', meta: 'Uploaded 2 Apr', tone: 'ok' },
          { title: 'Staff list', meta: 'Uploaded 18 Jul · 10 names', tone: 'ok' }
        ]
      }
    };
  }

  function buildSessionFromData(data, token, forceExpired) {
    var packets = (data && Array.isArray(data.packets)) ? data.packets : [];
    var packet = null;
    if (token) {
      packet = packets.find(function (p) {
        return tokenFromLink(p.link) === token || String(p._id) === token;
      }) || null;
    }
    if (!packet) {
      packet = packets.find(function (p) {
        return /vendor/i.test(String(p.recipientType || '')) || /cater|vendor/i.test(String(p.recipient || ''));
      }) || null;
    }

    var demo = demoSession({
      token: token || (packet ? tokenFromLink(packet.link) : 'cat9'),
      expires: packet && packet.expires
    });

    if (!data && !packet) {
      if (forceExpired) demo.status = 'expired';
      return demo;
    }

    var setup = (data && data.setup) || {};
    var counts = dietaryCounts(data);
    var vendorName = (packet && packet.recipient) || demo.vendor.name;
    var vendors = (data && Array.isArray(data.vendors)) ? data.vendors : [];
    var vendor = vendors.find(function (v) {
      return String(v.name || v.vendor || '').toLowerCase() === String(vendorName).toLowerCase();
    }) || vendors[0] || null;
    if (vendor) vendorName = String(vendor.name || vendor.vendor || vendorName);

    var weddingDate = String(setup.date || demo.wedding.date).slice(0, 10);
    var expires = String((packet && packet.expires) || demo.expires).slice(0, 10);
    var status = 'live';
    if (forceExpired || (packet && (packet.revoked || /revok/i.test(packet.status)))) status = 'revoked';
    else if (forceExpired || (packet && /expir/i.test(packet.status))) status = 'expired';
    else if (expires) {
      var today = new Date(); today.setHours(0, 0, 0, 0);
      var exp = new Date(expires + 'T00:00:00');
      if (!Number.isNaN(exp.getTime()) && exp < today) status = 'expired';
    }

    var slice = [];
    var tl = (data && Array.isArray(data.wdayTimeline) && data.wdayTimeline.length)
      ? data.wdayTimeline
      : ((data && data.timeline) || []);
    var hayVendor = String(vendorName).toLowerCase().split(/\s+/)[0];
    tl.forEach(function (r) {
      var hay = [r.event, r.title, r.name, r.who, r.notes, r.vendor].join(' ').toLowerCase();
      if (hayVendor && hay.indexOf(hayVendor) >= 0) {
        slice.push({
          title: String(r.event || r.title || r.name || 'Cue'),
          meta: String(r.who || r.notes || r.location || 'On the day'),
          time: String(r.time || r.start || '—').slice(0, 5),
          kind: /load|access|setup|clear|strike/i.test(hay) ? 'loadin' : 'service'
        });
      }
    });
    if (!slice.length) slice = demo.slice;

    var contacts = demo.contacts.slice();
    if (setup.plannerName || setup.plannerPhone) {
      contacts[0] = {
        name: setup.plannerName || contacts[0].name,
        role: 'Planner · call first',
        phone: setup.plannerPhone || contacts[0].phone
      };
    }

    return {
      token: demo.token,
      status: status,
      sharedBy: setup.plannerName || demo.sharedBy,
      sharedOn: (packet && packet.created) ? fmtShort(packet.created) : demo.sharedOn,
      expires: expires,
      mode: (packet && packet.mode) || 'Live',
      wedding: {
        coupleNames: coupleNames(setup),
        date: weddingDate,
        dateLabel: fmtLong(weddingDate)
      },
      vendor: { name: vendorName, category: (vendor && (vendor.type || vendor.category)) || 'Vendor' },
      counts: counts,
      slice: slice,
      scheduleGantt: slice === demo.slice ? demo.scheduleGantt : null,
      deps: demo.deps,
      owed: demo.owed,
      contacts: contacts,
      paperwork: demo.paperwork,
      uploads: demo.uploads
    };
  }

  function toast(msg) {
    var el = document.getElementById('vp-toast');
    if (!el) {
      el = document.createElement('div');
      el.id = 'vp-toast';
      el.className = 'vp-toast';
      document.body.appendChild(el);
    }
    el.textContent = msg;
    el.hidden = false;
    clearTimeout(toast._t);
    toast._t = setTimeout(function () { el.hidden = true; }, 2600);
  }

  function chipClass(tone) {
    if (tone === 'danger') return 'vp-chip is-danger';
    if (tone === 'warn') return 'vp-chip is-warn';
    if (tone === 'ok') return 'vp-chip is-ok';
    return 'vp-chip';
  }

  function parseVpTime(str) {
    var m = String(str || '').trim().match(/^(\d{1,2}):(\d{2})\s*(am|pm)?$/i);
    if (!m) return null;
    var h = parseInt(m[1], 10);
    var min = parseInt(m[2], 10);
    var ap = (m[3] || '').toLowerCase();
    if (ap === 'pm' && h < 12) h += 12;
    if (ap === 'am' && h === 12) h = 0;
    var total = h * 60 + min;
    if (total < 12 * 60) total += 24 * 60;
    return total - 12 * 60;
  }

  var GANTT_SPAN_MIN = 12.5 * 60;

  function ganttPct(minFromNoon, widthMin) {
    var left = Math.max(0, Math.min(92, (minFromNoon / GANTT_SPAN_MIN) * 100));
    var width = Math.max(8, Math.min(92 - left, ((widthMin || 75) / GANTT_SPAN_MIN) * 100));
    return { left: left, width: width };
  }

  function buildScheduleGantt(s) {
    if (s.scheduleGantt) return s.scheduleGantt;
    var lanes = (s.slice || []).map(function (r) {
      var hatch = r.kind === 'loadin' || r.kind === 'clear';
      var start = parseVpTime(r.time) || 0;
      var widthMin = hatch ? 90 : 75;
      var pos = ganttPct(start, widthMin);
      var short = String(r.title || '').replace(/\s+to the marquee$/i, '').replace(/\s+service$/i, '').replace(/\s+cut$/i, ' cut');
      return {
        name: short.split(' ')[0] === 'Kitchen' ? 'Kitchen' : short.replace(/^Canapés.*/, 'Canapés').replace(/^Dinner.*/, 'Dinner').replace(/^Cake.*/, 'Cake').replace(/^Clear.*/, 'Clear down'),
        sub: (r.time ? r.time + ' · ' : '') + String(r.meta || '').split('·')[0].trim(),
        bar: hatch ? (r.kind === 'clear' ? 'Clear down' : 'Load in') : short.split(' ')[0],
        left: pos.left,
        width: pos.width,
        hatch: hatch
      };
    });
    return {
      dayTitle: (function () {
        if (s.wedding && s.wedding.date) {
          var d = new Date(String(s.wedding.date).slice(0, 10) + 'T00:00:00');
          if (!Number.isNaN(d.getTime())) {
            return d.toLocaleDateString('en-GB', { weekday: 'long', day: 'numeric', month: 'long' });
          }
        }
        return 'Your window on the day';
      })(),
      onSite: '1:00pm–12:30am',
      obligations: lanes.length,
      crew: 10,
      setup: '90 min',
      lanes: lanes,
      footnote: (function () {
        var base = 'Hatched is load-in and clear-down; solid is service.';
        var deps = (s.deps || []).filter(Boolean);
        if (deps.length) {
          return base + ' ' + deps.length + ' dependenc' + (deps.length === 1 ? 'y' : 'ies')
            + ' shown both ways: ' + deps.join(' ');
        }
        return base + ' Accept confirms you can meet these times. Request a change proposes; it does not write through — the couple confirms.';
      })()
    };
  }

  function fmtExpiresShort(iso) {
    var d = new Date(String(iso).slice(0, 10) + 'T00:00:00');
    if (Number.isNaN(d.getTime())) return '—';
    return d.toLocaleDateString('en-GB', { day: 'numeric', month: 'short' });
  }

  /* Provenance banner (Master): “access expires 12 November” — day + month, no year. */
  function fmtExpiresBanner(iso) {
    var d = new Date(String(iso).slice(0, 10) + 'T00:00:00');
    if (Number.isNaN(d.getTime())) return '—';
    return d.toLocaleDateString('en-GB', { day: 'numeric', month: 'long' });
  }

  function firstOverdueOwed(s) {
    return (s.owed || []).find(function (r) { return r.tone === 'danger'; }) || (s.owed || [])[0] || null;
  }

  function renderExpired(s) {
    var first = String(s.sharedBy || 'the planner').split(' ')[0];
    return ''
      + '<div class="vp-topbar">'
      + '<span class="vp-topbar__mark">✦</span>'
      + '<span class="vp-topbar__wedding">' + esc(s.wedding.coupleNames) + '</span>'
      + '<span class="vp-topbar__badge">Vendor</span>'
      + '<span class="vp-topbar__vendor">' + esc(s.vendor.name) + '</span>'
      + '</div>'
      + '<div class="vp-expired">'
      + '<div class="vp-eyebrow">Access ended</div>'
      + '<h1>This link has expired</h1>'
      + '<p>Access ran to ' + esc(fmtLong(s.expires)) + ', four days after the wedding. Anything you downloaded while it was live is still yours — this only closes the live view.</p>'
      + '<div class="vp-expired__acts">'
      + '<button type="button" class="vp-btn vp-btn--primary" data-vp-act="request-access">Request access from ' + esc(s.sharedBy) + '</button>'
      + '<button type="button" class="vp-btn" data-vp-act="message">Message ' + esc(first) + '</button>'
      + '</div>'
      + '</div>';
  }

  function renderBrief(s) {
    var counts = s.counts;
    return ''
      + '<div class="vp-pagehead"><div class="vp-eyebrow">Your brief</div>'
      + '<h1 class="vp-title">' + esc(s.vendor.name) + '</h1>'
      + '<p class="vp-sub">Everything you need for the day, and nothing you do not</p></div>'
      + '<div class="vp-stats">'
      + '<div class="vp-stat"><span>Covers</span><strong>' + counts.covers + '</strong></div>'
      + '<div class="vp-stat"><span>Vegetarian</span><strong>' + counts.vegetarian + '</strong></div>'
      + '<div class="vp-stat"><span>Nut allergy</span><strong class="is-warn">' + counts.nutAllergy + '</strong></div>'
      + '<div class="vp-stat"><span>Service at</span><strong>' + esc(counts.serviceAt) + '</strong></div>'
      + '</div>'
      + '<div class="vp-section-head"><strong>Your slice of the day</strong><span>' + s.slice.length + ' obligations · times derived from the couple\'s run sheet</span></div>'
      + s.slice.map(function (r) {
        return '<div class="vp-row' + (r.kind === 'loadin' || r.kind === 'clear' ? ' is-hatch' : '') + '"><div><strong>'
          + esc(r.title) + '</strong><em>' + esc(r.meta) + '</em></div><span class="vp-meta">' + esc(r.time) + '</span></div>';
      }).join('')
      + '<div class="vp-section-head"><strong>You owe us</strong><span>' + s.owed.length + ' outstanding</span></div>'
      + s.owed.map(function (r) {
        return '<div class="vp-row"><div><strong>' + esc(r.title) + '</strong><em>' + esc(r.meta)
          + '</em></div><span class="' + chipClass(r.tone) + '">' + esc(r.due) + '</span></div>';
      }).join('')
      + '<div class="vp-section-head"><strong>Who to call on the day</strong><span>2 numbers · not the full contact list</span></div>'
      + s.contacts.map(function (c) {
        return '<div class="vp-row"><div><strong>' + esc(c.name) + '</strong><em>' + esc(c.role)
          + '</em></div><a class="vp-meta" href="tel:' + esc(c.phone.replace(/\s+/g, '')) + '">' + esc(c.phone) + '</a></div>';
      }).join('')
      + '<div class="vp-foot">'
      + '<button type="button" class="vp-btn vp-btn--primary" data-vp-act="confirm">Confirm your details</button>'
      + '<button type="button" class="vp-btn" data-vp-act="download">Download brief</button>'
      + '</div>';
  }

  function renderBriefMobile(s) {
    var counts = s.counts;
    var next = (s.slice && s.slice[0]) || { title: 'Kitchen access', meta: 'Loading bay, rear', time: '1:00pm' };
    var owed = firstOverdueOwed(s);
    var overdueN = (s.owed || []).filter(function (r) { return r.tone === 'danger'; }).length || 1;
    return ''
      + '<div class="vp-m-stats">'
      + '<div class="vp-m-stat"><span>Covers</span><strong>' + counts.covers + '</strong></div>'
      + '<div class="vp-m-stat"><span>Veg</span><strong>' + counts.vegetarian + '</strong></div>'
      + '<div class="vp-m-stat"><span>Nut</span><strong class="is-warn">' + counts.nutAllergy + '</strong></div>'
      + '</div>'
      + '<div class="vp-m-block">'
      + '<div class="vp-m-eyebrow">Your next obligation</div>'
      + '<div class="vp-m-title">' + esc(next.title) + '</div>'
      + '<div class="vp-m-sub">' + esc(next.time) + ' · ' + esc(String(next.meta).split('·')[0].trim()) + '</div>'
      + '</div>'
      + (owed
        ? '<div class="vp-m-block vp-m-block--danger">'
          + '<div class="vp-m-eyebrow is-danger">You owe us · ' + overdueN + ' overdue</div>'
          + '<div class="vp-m-title">' + esc(owed.title) + '</div>'
          + '<div class="vp-m-sub is-danger">' + esc(owed.due) + ' · blocks venue keys</div>'
          + '<button type="button" class="vp-m-cta" data-vp-act="upload">Upload now</button>'
          + '</div>'
        : '')
      + '<div class="vp-m-block">'
      + '<div class="vp-m-eyebrow">Call</div>'
      + s.contacts.map(function (c) {
        var role = String(c.role || '').replace(/\s*·.*$/, '');
        return '<div class="vp-m-call">'
          + '<div><div class="vp-m-call__name">' + esc(c.name) + '</div>'
          + '<div class="vp-m-call__role">' + esc(role) + '</div></div>'
          + '<a class="vp-m-call__btn" href="tel:' + esc(c.phone.replace(/\s+/g, '')) + '">Call</a>'
          + '</div>';
      }).join('')
      + '</div>';
  }

  function renderGanttLane(lane) {
    var barCls = 'vp-gantt__bar' + (lane.hatch ? ' is-hatch' : ' is-service');
    return '<div class="vp-gantt__row">'
      + '<div class="vp-gantt__label"><strong>' + esc(lane.name) + '</strong><em>' + esc(lane.sub) + '</em></div>'
      + '<div class="vp-gantt__track">'
      + '<div class="' + barCls + '" style="left:' + lane.left + '%;width:' + lane.width + '%">'
      + esc(lane.bar) + '</div></div></div>';
  }

  function renderSchedule(s) {
    var g = buildScheduleGantt(s);
    return ''
      + '<div class="vp-pagehead"><div class="vp-eyebrow">Your schedule</div>'
      + '<h1 class="vp-title">' + esc(g.dayTitle) + '</h1>'
      + '<p class="vp-sub">Your window only — the rest of the day is not shown</p></div>'
      + '<div class="vp-stats">'
      + '<div class="vp-stat"><span>On site</span><strong style="font-size:15px">' + esc(g.onSite) + '</strong></div>'
      + '<div class="vp-stat"><span>Obligations</span><strong>' + g.obligations + '</strong></div>'
      + '<div class="vp-stat"><span>Crew</span><strong>' + g.crew + '</strong></div>'
      + '<div class="vp-stat"><span>Setup</span><strong>' + esc(g.setup) + '</strong></div>'
      + '</div>'
      + '<div class="vp-gantt">'
      + '<div class="vp-gantt__axis">'
      + ['12pm', '2pm', '4pm', '6pm', '8pm', '10pm', '12am'].map(function (t) {
        return '<span>' + t + '</span>';
      }).join('')
      + '</div>'
      + g.lanes.map(renderGanttLane).join('')
      + '</div>'
      + '<p class="vp-note vp-note--gantt">' + esc(g.footnote) + '</p>'
      + '<div class="vp-foot">'
      + '<button type="button" class="vp-btn vp-btn--primary" data-vp-act="accept">Accept this schedule</button>'
      + '<button type="button" class="vp-btn" data-vp-act="change">Request a change</button>'
      + '</div>';
  }

  function renderPaperwork(s) {
    var p = s.paperwork;
    var contractHead = p.contract.headMeta || '1';
    return ''
      + '<div class="vp-pagehead"><div class="vp-eyebrow">Your paperwork</div>'
      + '<h1 class="vp-title">' + esc(s.vendor.name) + '</h1>'
      + '<p class="vp-sub">Your contract and your invoices — no other vendor\'s</p></div>'
      + '<div class="vp-stats">'
      + '<div class="vp-stat"><span>Contract value</span><strong>' + esc(p.contractValue) + '</strong></div>'
      + '<div class="vp-stat"><span>Paid</span><strong>' + esc(p.paid) + '</strong></div>'
      + '<div class="vp-stat"><span>Outstanding</span><strong class="is-warn">' + esc(p.outstanding) + '</strong></div>'
      + '<div class="vp-stat"><span>Next due</span><strong style="font-size:13px">' + esc(p.nextDue) + '</strong></div>'
      + '</div>'
      + '<div class="vp-section-head"><strong>Your contract</strong><span>' + esc(contractHead) + '</span></div>'
      + '<div class="vp-row"><div><strong>' + esc(p.contract.title) + '</strong><em>' + esc(p.contract.meta)
      + '</em></div><span class="vp-meta">View · Download</span></div>'
      + p.clauses.map(function (c) {
        return '<div class="vp-row"><div><strong>' + esc(c.title) + '</strong><em>' + esc(c.meta)
          + '</em></div><span class="' + chipClass(c.tone) + '">' + esc(c.chip) + '</span></div>';
      }).join('')
      + '<div class="vp-section-head"><strong>Your instalments</strong><span>' + p.instalments.length + ' · derived from the contract, not typed</span></div>'
      + p.instalments.map(function (r) {
        return '<div class="vp-row"><div><strong>' + esc(r.title) + '</strong><em>' + esc(r.meta)
          + '</em></div><span class="' + chipClass(r.tone) + '">' + esc(r.amount) + '</span></div>';
      }).join('')
      + '<div class="vp-section-head"><strong>Your invoices</strong><span>' + p.invoices.length + ' issued</span></div>'
      + p.invoices.map(function (r) {
        return '<div class="vp-row"><div><strong>' + esc(r.title) + '</strong><em>' + esc(r.meta)
          + '</em></div><span class="' + chipClass(r.tone) + '">' + esc(r.amount) + '</span></div>';
      }).join('')
      + '<p class="vp-note">You see your own figures only. The couple\'s total budget, their targets, and what any other vendor charges are not part of this view and cannot be added to it.</p>'
      + '<div class="vp-foot">'
      + '<button type="button" class="vp-btn vp-btn--primary" data-vp-act="invoice">Raise an invoice</button>'
      + '<button type="button" class="vp-btn" data-vp-act="download">Download all</button>'
      + '</div>';
  }

  function renderUpload(s) {
    var u = s.uploads;
    return ''
      + '<div class="vp-pagehead"><div class="vp-eyebrow">Upload</div>'
      + '<h1 class="vp-title">Two documents outstanding</h1>'
      + '<p class="vp-sub">One blocks the venue</p></div>'
      + '<div style="padding:15px 0 4px">'
      + u.outstanding.map(function (card) {
        return '<div class="vp-card is-' + esc(card.tone) + '">'
          + '<div class="vp-card__top"><span class="vp-card__dot"></span><span>' + esc(card.title)
          + '</span><span style="margin-left:auto;font-size:11.5px;font-weight:500">' + esc(card.due) + '</span></div>'
          + '<div class="vp-card__body">' + esc(card.body) + '</div>'
          + (card.drop
            ? '<div class="vp-drop" data-vp-act="upload">Drop a PDF here, or choose a file<small>PDF or image · up to 10MB</small></div>'
            : '')
          + '</div>';
      }).join('')
      + '</div>'
      + '<div class="vp-section-head"><strong>Already uploaded</strong><span>' + u.done.length + ' · visible to the couple immediately</span></div>'
      + u.done.map(function (r) {
        return '<div class="vp-row"><div><strong>' + esc(r.title) + '</strong><em>' + esc(r.meta)
          + '</em></div><span class="' + chipClass(r.tone) + '">Accepted</span></div>';
      }).join('')
      + '<p class="vp-note">An upload lands in the couple\'s Contracts page and clears the matching red card there. You will see it marked Accepted here once they have looked at it.</p>'
      + '<div class="vp-foot">'
      + '<button type="button" class="vp-btn vp-btn--primary" data-vp-act="upload">Upload the certificate</button>'
      + '<button type="button" class="vp-btn" data-vp-act="message">Message Mary</button>'
      + '</div>';
  }

  function renderRules() {
    var scope = ''
      + '<div class="vp-rules-sec">'
      + '<div class="vp-eyebrow">V6 · The scope contract</div>'
      + '<h2 class="vp-rules-h">Fifteen rows deciding what a vendor can ever see</h2>'
      + '<p class="vp-rules-lead">This is the security model, not a settings screen. Every ✕ is <b>absent from the query</b>, not filtered out of a response — a vendor endpoint that could return a guest name is a bug, not a misconfiguration. The reasons matter more than the marks: they are what lets someone extend this table correctly in a year.</p>'
      + '<div class="vp-scope-wrap"><table class="vp-scope-table">'
      + '<thead><tr><th>Data</th><th>Vendor</th><th>Couple</th><th>Planner</th><th>Why</th></tr></thead>'
      + '<tbody>'
      + SCOPE_ROWS.map(function (r) {
        return '<tr>'
          + '<td class="vp-scope-data">' + esc(r.data) + '</td>'
          + '<td><span class="' + scopeMarkClass(r.v) + '">' + esc(r.v) + '</span></td>'
          + '<td><span class="' + scopeMarkClass(r.c) + '">' + esc(r.c) + '</span></td>'
          + '<td><span class="' + scopeMarkClass(r.p) + '">' + esc(r.p) + '</span></td>'
          + '<td class="vp-scope-why">' + esc(r.why) + '</td>'
          + '</tr>';
      }).join('')
      + '</tbody></table></div>'
      + '<p class="vp-note">Every ✕ in the vendor column is absent from the model, not hidden behind a permission flag. There is no setting that turns one on, because a setting implies a case where it would be correct.</p>'
      + '</div>';

    var lifecycle = ''
      + '<div class="vp-rules-sec">'
      + '<div class="vp-eyebrow">V7 · Access lifecycle</div>'
      + '<h2 class="vp-rules-h">How a vendor gets in, and out</h2>'
      + '<p class="vp-rules-lead">Five steps from packet to expiry. No account creation anywhere in the flow — a caterer should not need a password to read their own call time.</p>'
      + '<ol class="vp-life">'
      + LIFECYCLE_STEPS.map(function (st) {
        return '<li class="vp-life__step"><span class="vp-life__n">' + st.n + '</span>'
          + '<div><strong>' + esc(st.title) + '</strong><em>' + esc(st.body) + '</em></div></li>';
      }).join('')
      + '</ol>'
      + '<div class="vp-section-head"><strong>What revocation can and cannot do</strong><span>said plainly in the revoke dialog too</span></div>'
      + REVOKE_ROWS.map(function (r) {
        return '<div class="vp-row"><div><strong>' + esc(r.label) + '</strong></div>'
          + '<span class="' + (r.tone === 'ok' ? 'vp-chip is-ok' : 'vp-chip is-danger') + '">' + esc(r.val) + '</span></div>';
      }).join('')
      + '<p class="vp-note">Honest revocation: it stops the link, it does not recall a PDF, and it does not delete what they uploaded. A planner who believes revocation recalls a PDF will make a worse decision than one who knows it does not.</p>'
      + '</div>';

    return ''
      + '<div class="vp-rules-overlay" id="vp-rules" role="dialog" aria-modal="true" aria-label="The rules underneath">'
      + '<div class="vp-rules-scrim" data-vp-act="rules-close"></div>'
      + '<div class="vp-rules-sheet">'
      + '<div class="vp-rules-head">'
      + '<div><div class="vp-eyebrow">The rules underneath</div><h1 class="vp-rules-title">Scope &amp; lifecycle</h1>'
      + '<p class="vp-sub">What can be reached, and how someone gets in and out. These are what produce the four tabs.</p></div>'
      + '<button type="button" class="vp-rules-close" data-vp-act="rules-close" aria-label="Close">×</button>'
      + '</div>'
      + '<div class="vp-rules-body">' + scope + lifecycle + '</div>'
      + '</div></div>';
  }

  function render() {
    var root = document.getElementById('vp-app');
    if (!root || !state.session) return;
    var s = state.session;
    var narrow = window.matchMedia && window.matchMedia('(max-width: 520px)').matches;

    if (s.status === 'expired' || s.status === 'revoked') {
      root.innerHTML = '<div class="vp-shell">' + renderExpired(s) + '</div>';
      bind(root);
      return;
    }

    var body = '';
    if (state.tab === 'schedule') body = renderSchedule(s);
    else if (state.tab === 'paperwork') body = renderPaperwork(s);
    else if (state.tab === 'upload') body = renderUpload(s);
    else if (narrow) body = renderBriefMobile(s);
    else body = renderBrief(s);

    var shellCls = 'vp-shell' + (narrow ? ' vp-shell--mobile' : '');
    var bannerLong = 'Shared by ' + esc(s.sharedBy) + ' on ' + esc(s.sharedOn)
      + ' · access expires ' + esc(fmtExpiresBanner(s.expires))
      + ' · you are seeing ' + (s.mode === 'Live' ? 'live records, not a copy' : 'a snapshot');
    var bannerShort = 'Expires ' + esc(fmtExpiresShort(s.expires)) + ' · live records';

    root.innerHTML = ''
      + '<div class="' + shellCls + '">'
      + '<div class="vp-topbar' + (narrow ? ' vp-topbar--mobile' : '') + '">'
      + '<span class="vp-topbar__mark">✦</span>'
      + (narrow
        ? '<span class="vp-topbar__vendor-main">' + esc(s.vendor.name) + '</span>'
        : '<span class="vp-topbar__wedding">' + esc(s.wedding.coupleNames) + ' · ' + esc(s.wedding.dateLabel) + '</span>')
      + '<span class="vp-topbar__badge">Vendor</span>'
      + (narrow ? '' : '<span class="vp-topbar__vendor">' + esc(s.vendor.name) + '</span>')
      + '</div>'
      + '<nav class="vp-tabs" aria-label="Vendor portal">'
      + TABS.map(function (t) {
        return '<button type="button" class="vp-tab' + (state.tab === t.id ? ' is-active' : '')
          + '" data-vp-tab="' + t.id + '">' + esc(narrow ? t.short : t.label) + '</button>';
      }).join('')
      + '</nav>'
      + '<div class="vp-banner' + (narrow ? ' vp-banner--short' : '') + '">'
      + (narrow ? bannerShort : bannerLong)
      + '</div>'
      + '<div class="vp-body">' + body + '</div>'
      + '<div class="vp-rulebar"><button type="button" class="vp-rulebar__btn" data-vp-act="rules-open">'
      + 'Why you can see this — the scope &amp; lifecycle behind this link</button></div>'
      + '</div>'
      + (state.rulesOpen ? renderRules() : '');
    bind(root);
  }

  function bind(root) {
    root.querySelectorAll('[data-vp-tab]').forEach(function (btn) {
      btn.addEventListener('click', function () {
        state.tab = btn.getAttribute('data-vp-tab') || 'brief';
        try {
          var u = new URL(window.location.href);
          u.searchParams.set('tab', state.tab);
          history.replaceState({}, '', u.toString());
        } catch (e) { /* soft */ }
        render();
      });
    });
    root.querySelectorAll('[data-vp-act]').forEach(function (btn) {
      btn.addEventListener('click', function () {
        var act = btn.getAttribute('data-vp-act');
        if (act === 'confirm' || act === 'accept') toast('Noted — the couple will see your confirmation.');
        else if (act === 'change') toast('Change requested. It proposes; it does not write through.');
        else if (act === 'invoice') toast('Draft invoice prepared for the couple to review.');
        else if (act === 'upload') toast('Upload received. It will clear on Contracts once reviewed.');
        else if (act === 'message') toast('Message sent to ' + (state.session.sharedBy || 'the planner') + '.');
        else if (act === 'request-access') toast('Access request sent to ' + (state.session.sharedBy || 'the planner') + '.');
        else if (act === 'download') toast('Brief prepared for download.');
        else if (act === 'rules-open') { state.rulesOpen = true; render(); }
        else if (act === 'rules-close') { state.rulesOpen = false; render(); }
      });
    });
  }

  function boot() {
    applyVpDarkMode();
    var token = qs('g') || qs('token') || '';
    var tab = qs('tab') || 'brief';
    state.forceExpired = qs('expired') === '1' || qs('expired') === 'true';
    state.tab = TABS.some(function (t) { return t.id === tab; }) ? tab : 'brief';
    var data = loadPlannerData();
    state.session = buildSessionFromData(data, token, state.forceExpired);
    document.title = state.session.vendor.name + ' · Vendor Portal';
    document.addEventListener('keydown', function (e) {
      if (e.key === 'Escape' && state.rulesOpen) { state.rulesOpen = false; render(); }
    });
    render();
    if (window.matchMedia) {
      try {
        window.matchMedia('(max-width: 520px)').addEventListener('change', render);
      } catch (e) {
        window.matchMedia('(max-width: 520px)').addListener(render);
      }
    }
  }

  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', boot);
  else boot();
})();
