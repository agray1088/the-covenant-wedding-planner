/* Notes — Master s23 / 12a · Cards 33a · Timeline 33b
   Table columns: Note · Pinned to · Author · Written · Flag
   Views: List · Cards · Timeline
   Rail: All notes · Unpinned · Flagged · Mine · Shared with Mary
         · By subject · Group by Pinned to / Author / Date
   Drawer tabs: Note · Pin · Sharing · History
   Primary: New note (List) / Write a note (Cards · Timeline)
   Data: data.notesDetails[] — figures derived from the note record. */
(function () {
  'use strict';

  window._notesMode = window._notesMode || 'list';
  window._notesRailView = window._notesRailView || 'all';
  window._notesGroupBy = window._notesGroupBy || 'pinnedTo';
  window._notesSort = window._notesSort || 'newest';
  window._notesUiFilters = window._notesUiFilters || {
    subject: 'all', author: 'all', flag: 'all', kind: 'all', period: 'all', pinnedTo: 'all'
  };
  window._notesOpenOnly = window._notesOpenOnly !== false;
  window._notesUnresolvedShown = window._notesUnresolvedShown !== false;
  window._notesDrawerId = window._notesDrawerId || null;
  window._notesDrawerTab = window._notesDrawerTab || 0;
  window._notesSel = window._notesSel instanceof Set ? window._notesSel : new Set();
  window._notesSearch = window._notesSearch || '';

  const DRAWER_TABS = ['Note', 'Pin', 'Sharing', 'History'];
  const KINDS = [
    'Open question', 'Blocker', 'Decision needed', 'Deadline',
    'Preference', 'Sensitive', 'Time-critical', 'Context'
  ];
  const SHELL_VER = 'notes-rd12a-s23';
  const COL_SCOPE = 'notes';
  const NOTES_COLUMNS = [
    { key: '_sel', label: '', width: '34px', fixed: true },
    { key: 'note', label: 'Note' },
    { key: 'pinnedTo', label: 'Pinned to', width: '180px' },
    { key: 'author', label: 'Author', width: '110px' },
    { key: 'written', label: 'Written', width: '90px' },
    { key: 'flag', label: 'Flag', width: '90px' }
  ];
  if (window.rdColumns) {
    window.rdColumns.register(COL_SCOPE, NOTES_COLUMNS.slice(), function () {
      renderNotesRd();
    });
  }

  /* Master demo notes (12a / 33a / 33b). Seeded when the tracker is empty
     or still holds the old five-item starter pack. */
  const MASTER_NOTES = [
    {
      title: 'Baker has not quoted the cake yet',
      note: 'Sweet Rose said “around a thousand” on the phone in June. Nothing in writing. Budget carries $1,000 as projected, not committed, which is why the true total reads $24,040 rather than $23,040.',
      pinnedTo: 'Vendors · Sweet Rose', subject: 'Vendors', author: 'Ama',
      date: '2026-07-28', lastEdited: '2026-07-28', flagged: true, kind: 'Open question',
      alsoShowsOn: 'Budget · Cake row', owner: 'Ama', dueBy: '15 August',
      status: 'Open', nextStep: 'Get a written quote by 15 August',
      replies: [{ author: 'Mary O.', when: '29 Jul', text: 'I will call her Monday. If there is still no number by the 15th we should price the two backups.' }],
      history: [
        { when: '29 Jul', who: 'Mary O.', what: 'Replied' },
        { when: '28 Jul', who: 'Ama', what: 'Flagged' },
        { when: '28 Jul', who: 'Ama', what: 'Written' }
      ],
      relatedNotes: [{ title: 'This note', flag: true }, { title: 'No quote in writing', flag: true }],
      sharingNote: 'A note is never in a share packet, whatever sections you pick. This one names a price the vendor has not committed to — sending it would be quoting them against themselves.'
    },
    {
      title: 'Grace Hall will not confirm the 11:45pm clear',
      note: 'Venue will not put the late clear in writing. Contracts still show the standard window.',
      pinnedTo: 'Contracts · Grace Hall', subject: 'Vendors', author: 'Mary O.',
      date: '2026-07-26', lastEdited: '2026-07-26', flagged: true, kind: 'Decision needed',
      alsoShowsOn: 'Wedding Day Timeline', status: 'Open', sharedWith: 'Mary'
    },
    {
      title: 'Bloom Studio renamed from Bloom & Vine in May',
      note: 'Update stationery and the vendor packet so the new name matches the contract.',
      pinnedTo: 'Vendors · Bloom Studio', subject: 'Vendors', author: 'Kwesi',
      date: '2026-07-19', lastEdited: '2026-07-19', flagged: false, kind: 'Open question', status: 'Open'
    },
    {
      title: 'Band wants a hot meal, not the vendor box',
      note: 'Highlife asked for a hot meal rather than the standard vendor box.',
      pinnedTo: 'Entertainment · Highlife', subject: 'Vendors', author: 'Kwesi',
      date: '2026-07-14', lastEdited: '2026-07-14', flagged: false, kind: 'Preference',
      alsoShowsOn: 'Catering · Vendor meals', status: 'Open'
    },
    {
      title: 'Uncle Ato declined — do not re-invite',
      note: 'He declined clearly. Keep him off the list and do not send a reminder.',
      pinnedTo: 'Guests · Ato Owusu', subject: 'Guests', author: 'Ama',
      date: '2026-07-22', lastEdited: '2026-07-22', flagged: false, kind: 'Preference', status: 'Open'
    },
    {
      title: 'Mensah household needs a ground-floor room',
      note: 'Ground-floor only for the Mensah household — mobility needs.',
      pinnedTo: 'Households · Mensah', subject: 'Guests', author: 'Ama',
      date: '2026-07-20', lastEdited: '2026-07-20', flagged: true, kind: 'Open question',
      alsoShowsOn: 'Weekend Logistics', status: 'Open'
    },
    {
      title: 'Two children under 3 — no charge agreed with Adom',
      note: 'Confirm zero charge for the two under-threes with Adom before the tasting.',
      pinnedTo: 'Catering & Menu', subject: 'Guests', author: 'Mary O.',
      date: '2026-07-18', lastEdited: '2026-07-18', flagged: false, kind: 'Decision needed',
      sharedWith: 'Mary', status: 'Open'
    },
    {
      title: 'Gratuity for Grace Hall and Adom is the same money as the tipping rows',
      note: 'Do not double-count tip lines against the venue and catering totals.',
      pinnedTo: 'Budget', subject: 'Money', author: 'Mary O.',
      date: '2026-07-25', lastEdited: '2026-07-25', flagged: true, kind: 'Open question',
      sharedWith: 'Mary', status: 'Open'
    },
    {
      title: 'Owusu gift of $1,200 was earmarked for the venue balance',
      note: 'Gift already spoken for — keep it against the Grace Hall balance.',
      pinnedTo: 'Gifts · Owusu', subject: 'Money', author: 'Ama',
      date: '2026-07-16', lastEdited: '2026-07-16', flagged: false, kind: 'Preference', status: 'Open'
    },
    {
      title: 'Ask Rev. Mensah whether the register needs two witnesses or three',
      note: 'Loose until pinned — ask at the next meeting.',
      pinnedTo: '—', subject: 'Loose', author: 'Kwesi',
      date: '2026-07-29', lastEdited: '2026-07-29', flagged: true, kind: 'Open question',
      pinned: false, status: 'Open'
    },
    {
      title: 'Someone mentioned a cousin who does calligraphy',
      note: 'No name yet. Ask Ama’s aunt before chasing a stationer.',
      pinnedTo: '—', subject: 'Loose', author: 'Ama',
      date: '2026-07-27', lastEdited: '2026-07-27', flagged: false, kind: 'Open question',
      pinned: false, status: 'Open'
    },
    {
      title: 'Adom will not confirm the veg main until the tasting',
      note: 'Vegetarian main stays provisional until the 20 Aug tasting.',
      pinnedTo: 'Catering & Menu', subject: 'Guests', author: 'Ama',
      date: '2026-07-20', lastEdited: '2026-07-20', flagged: false, kind: 'Open question',
      affects: '9 guests', foot: 'Resolves at the 20 Aug tasting', status: 'Open'
    },
    {
      title: 'Grace Hall want the COI by 1 Oct or they will not release keys',
      note: 'Certificate of insurance is a hard gate for keys.',
      pinnedTo: 'Grace Hall contract', subject: 'Vendors', author: 'Mary O.',
      date: '2026-07-14', lastEdited: '2026-07-14', flagged: true, kind: 'Blocker',
      chased: 'Twice', foot: 'Adom owes the certificate', sharedWith: 'Mary', status: 'Open'
    },
    {
      title: 'Mrs Adjei prefers the tilapia less spicy — she will not say so herself',
      note: 'Heat reduced after tasting feedback.',
      pinnedTo: 'Tasting 1', subject: 'Guests', author: 'Kwesi',
      date: '2026-06-12', lastEdited: '2026-06-12', flagged: false, kind: 'Sensitive',
      actedOn: 'Heat reduced', foot: 'Resolved', status: 'Resolved', resolved: true
    },
    {
      title: 'Michael cannot do the 5:45pm Friday run',
      note: 'Needs a second driver for the Friday airport run.',
      pinnedTo: 'Out-of-town arrivals', subject: 'The day', author: 'Ama',
      date: '2026-08-22', lastEdited: '2026-08-22', time: '08:20', flagged: true, kind: 'Blocker',
      affects: '2 guests', foot: 'Needs a second driver', status: 'Open'
    },
    {
      title: 'Lagos pair added to Friday arrivals',
      note: 'Two guests from Lagos added to the Friday arrival list.',
      pinnedTo: 'Out-of-town arrivals', subject: 'The day', author: 'Ama',
      date: '2026-08-22', lastEdited: '2026-08-22', time: '08:15', flagged: false, kind: 'Context',
      status: 'Open'
    },
    {
      title: 'Uncle Kojo gave $2,000 with no line attached',
      note: 'Cash gift with no budget line yet — assign it or hold it.',
      pinnedTo: 'Budget', subject: 'Money', author: 'Ama',
      date: '2026-07-08', lastEdited: '2026-07-08', flagged: true, kind: 'Decision needed',
      amount: '$2,000', foot: 'Assign it or hold it', status: 'Open'
    },
    {
      title: 'Grandmother leaves at 8pm — get her photo before the speeches',
      note: 'Still has no shot window on the list.',
      pinnedTo: 'Shot Lists', subject: 'The day', author: 'Ama',
      date: '2026-07-02', lastEdited: '2026-07-02', flagged: true, kind: 'Time-critical',
      shot: 'Unscheduled', foot: 'Still has no window', status: 'Open'
    },
    {
      title: 'Do not seat the Boatengs near the band',
      note: 'Preference applied on the floor plan.',
      pinnedTo: 'Table Layout', subject: 'Guests', author: 'Kwesi',
      date: '2026-06-18', lastEdited: '2026-06-18', flagged: false, kind: 'Preference',
      applied: 'T5, far side', foot: 'Resolved', status: 'Resolved', resolved: true
    },
    {
      title: 'Rev. Mensah wants the vows a week early to read them once',
      note: 'Nothing written yet for the early read.',
      pinnedTo: 'Exchange of vows', subject: 'The day', author: 'Ama',
      date: '2026-06-14', lastEdited: '2026-06-14', flagged: false, kind: 'Deadline',
      dueField: '25 Oct', foot: 'Nothing written yet', status: 'Open'
    },
    {
      title: 'Travel allowance raised to 75 minutes',
      note: 'Travel window for the tasting party raised to 75 minutes.',
      pinnedTo: 'Menu tasting', subject: 'The day', author: 'Ama',
      date: '2026-07-20', lastEdited: '2026-07-20', flagged: false, kind: 'Context',
      status: 'Open'
    },
    {
      title: 'Sankofa quote received, unsigned',
      note: 'Quote is in; signature still outstanding.',
      pinnedTo: 'Sankofa Films', subject: 'Vendors', author: 'Mary O.',
      date: '2026-07-18', lastEdited: '2026-07-18', flagged: false, kind: 'Decision needed',
      sharedWith: 'Mary', status: 'Open'
    }
  ];

  const STARTER_TITLES = /Vendor Questions|Ceremony Ideas|Reception Details|Personal Reminders|Vow Inspiration/i;

  const esc = s => (typeof escapeHtml === 'function'
    ? escapeHtml(s == null ? '' : String(s))
    : String(s == null ? '' : s).replace(/[&<>"']/g, c => ({
      '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;'
    }[c])));

  function jsId(id) {
    return String(id == null ? '' : id).replace(/\\/g, '\\\\').replace(/'/g, "\\'");
  }

  function ensureNotes() {
    if (typeof ensureNotesData === 'function') ensureNotesData();
    else {
      if (!window.data) window.data = {};
      if (!Array.isArray(data.notesDetails)) data.notesDetails = [];
    }
  }

  function stampMasterNote(n) {
    const copy = Object.assign({}, n);
    if (typeof nextRecordId === 'function') copy._id = nextRecordId('notesDetails');
    copy.pinned = !!(copy.pinnedTo && copy.pinnedTo !== '—');
    copy.category = copy.subject === 'Loose' ? 'Planning' : (copy.subject || 'Planning');
    copy.tags = copy.kind || '';
    copy.lastEdited = copy.lastEdited || copy.date;
    return copy;
  }

  function ensureMasterNotes() {
    ensureNotes();
    if (data.notesMaster12a) return;
    const rows = data.notesDetails || [];
    const onlyStarter = rows.length > 0 && rows.every(n => STARTER_TITLES.test(String(n.title || '')));
    if (rows.length === 0 || onlyStarter) {
      data.notesDetails = MASTER_NOTES.map(stampMasterNote);
    } else {
      const have = new Set(rows.map(n => String(n.title || '').trim().toLowerCase()));
      MASTER_NOTES.forEach(function (n) {
        if (!have.has(String(n.title).trim().toLowerCase())) {
          data.notesDetails.push(stampMasterNote(n));
        }
      });
    }
    data.notesSeeded = true;
    data.notesMaster12a = true;
    if (typeof save === 'function') save();
  }

  function subjectFromCategory(cat, pinnedTo) {
    if (pinnedTo && pinnedTo !== '—') {
      const p = String(pinnedTo).toLowerCase();
      if (/vendor|baker|florist|photo|cater|dj|band|entertainment|bloom|sweet rose|sankofa|grace hall contract|contracts ·/i.test(p)) return 'Vendors';
      if (/guest|household|rsvp|seating|table|tasting|ato |mensah/i.test(p)) return 'Guests';
      if (/budget|payment|money|gift|cake row/i.test(p)) return 'Money';
      if (/day|timeline|ceremony|reception|weekend|shot|arrival|vow|logistics|menu tasting/i.test(p)) return 'The day';
    }
    const c = String(cat || '').toLowerCase();
    if (/vendor/.test(c)) return 'Vendors';
    if (/guest|personal|family|party/.test(c)) return 'Guests';
    if (/budget|money|payment|contract|gift/.test(c)) return 'Money';
    if (/ceremony|reception|day|timeline|planning|honeymoon|shot/.test(c)) return 'The day';
    return 'Loose';
  }

  function deriveKind(row) {
    if (row.kind && KINDS.indexOf(row.kind) >= 0) return row.kind;
    const hay = [row.title, row.note, row.nextStep, row.tags, row.status].join(' ').toLowerCase();
    if (/done|complete|resolved|archived/i.test(row.status || '')) return 'Resolved';
    if (/block|coi|driver|critical/.test(hay)) return 'Blocker';
    if (/decision|choose|quote|decide/.test(hay)) return 'Decision needed';
    if (/deadline|due by|by \d/.test(hay)) return 'Deadline';
    if (/prefer|like|want/.test(hay)) return 'Preference';
    if (/sensitive|private|confidential/.test(hay)) return 'Sensitive';
    if (/urgent|asap|time.critical|today/.test(hay)) return 'Time-critical';
    if (/context|added to|raised to|allowance/.test(hay)) return 'Context';
    return 'Open question';
  }

  function deriveAuthor(row, i) {
    if (row.author) return String(row.author);
    const cycle = ['Ama', 'Kwesi', 'Mary O.'];
    return cycle[i % cycle.length];
  }

  function deriveFlagged(row, kind) {
    if (typeof row.flagged === 'boolean') return row.flagged;
    if (/blocker|decision needed|deadline|time-critical/i.test(kind)) return true;
    if (/open|progress/i.test(row.status || '') && row.pinned) return true;
    return false;
  }

  function derivePinnedTo(row, subject) {
    if (row.pinnedTo) return String(row.pinnedTo);
    if (row.recordRef) return String(row.recordRef);
    const pinned = row.pinned === true || row.pinned === 'true' || row.pinned === 'Yes';
    if (!pinned) return '—';
    const cat = String(row.category || subject || 'Planning');
    if (/vendor/i.test(cat)) return 'Vendors · ' + (String(row.tags || '').split(',')[0] || 'Vendor');
    if (/budget|money/i.test(cat)) return 'Budget · ' + (row.title || 'Line');
    if (/guest/i.test(cat)) return 'Guests · list';
    if (/ceremony|reception|day|timeline/i.test(cat)) return 'The day · ' + cat;
    return cat;
  }

  function isResolved(row, kind) {
    if (row.resolved === true) return true;
    return kind === 'Resolved' || /done|complete|resolved|archived/i.test(row.status || '');
  }

  function unify(row, i) {
    if (typeof ensureRowId === 'function') ensureRowId(row, 'notesDetails');
    const kindRaw = deriveKind(row);
    const author = deriveAuthor(row, i);
    const flagged = deriveFlagged(row, kindRaw);
    const pinnedTo = derivePinnedTo(row, subjectFromCategory(row.category));
    const loose = !pinnedTo || pinnedTo === '—';
    const subject = row.subject || (loose ? 'Loose' : subjectFromCategory(row.category, pinnedTo));
    const resolved = isResolved(row, kindRaw);
    const written = row.lastEdited || row.date || '';
    const excerpt = String(row.note || row.nextStep || '').replace(/\s+/g, ' ').trim();
    const kind = kindRaw === 'Resolved' ? 'Open question' : kindRaw;
    return {
      id: row._id ? ('notesDetails:' + row._id) : ('notesDetails:idx:' + i),
      index: i,
      row: row,
      title: String(row.title || 'Untitled note').trim() || 'Untitled note',
      excerpt: excerpt.slice(0, 160),
      body: String(row.note || ''),
      nextStep: String(row.nextStep || ''),
      category: String(row.category || ''),
      subject: subject,
      pinnedTo: pinnedTo,
      loose: loose,
      author: author,
      written: written,
      time: String(row.time || ''),
      flagged: flagged,
      kind: kind,
      resolved: resolved,
      shared: !!(row.sharedWith) || /mary/i.test(String(row.sharedWith || '')) || /mary/i.test(author),
      mine: /ama|^me$/i.test(author),
      status: resolved ? 'Resolved' : (flagged ? 'Flagged' : 'Open'),
      alsoShowsOn: row.alsoShowsOn || '',
      owner: String(row.owner || author || ''),
      dueBy: String(row.dueBy || ''),
      affects: String(row.affects || ''),
      chased: String(row.chased || ''),
      actedOn: String(row.actedOn || ''),
      amount: String(row.amount || ''),
      shot: String(row.shot || ''),
      applied: String(row.applied || ''),
      dueField: String(row.dueField || ''),
      foot: String(row.foot || row.nextStep || ''),
      replies: Array.isArray(row.replies) ? row.replies : [],
      history: Array.isArray(row.history) ? row.history : [],
      relatedNotes: Array.isArray(row.relatedNotes) ? row.relatedNotes : [],
      sharingNote: String(row.sharingNote || '')
    };
  }

  function allNotes() {
    ensureMasterNotes();
    return data.notesDetails.map(unify);
  }

  function parseDate(value) {
    if (!value) return null;
    const d = new Date(String(value).slice(0, 10) + 'T00:00:00');
    return Number.isNaN(d.getTime()) ? null : d;
  }

  function fmtShort(value) {
    const d = parseDate(value);
    if (!d) return String(value || '—');
    const today = new Date(); today.setHours(0, 0, 0, 0);
    if (d.getTime() === today.getTime()) return 'Today';
    return d.toLocaleDateString('en-US', { day: 'numeric', month: 'short' });
  }

  function fmtLong(value) {
    const d = parseDate(value);
    if (!d) return String(value || '—');
    return d.toLocaleDateString('en-US', { day: 'numeric', month: 'long', year: 'numeric' });
  }

  function daysAgo(value) {
    const d = parseDate(value);
    if (!d) return null;
    const today = new Date(); today.setHours(0, 0, 0, 0);
    return Math.round((today - d) / 86400000);
  }

  function thisWeek(value) {
    const n = daysAgo(value);
    return n != null && n >= 0 && n < 7;
  }

  function lastWeek(value) {
    const n = daysAgo(value);
    return n != null && n >= 7 && n < 14;
  }

  function periodKey(value) {
    const n = daysAgo(value);
    if (n == null) return 'Earlier';
    if (n <= 0) return 'Today';
    if (n < 7) return 'This week';
    const d = parseDate(value);
    if (!d) return 'Earlier';
    const now = new Date();
    if (d.getMonth() === now.getMonth() && d.getFullYear() === now.getFullYear()) {
      return 'Earlier in ' + d.toLocaleDateString('en-US', { month: 'long' });
    }
    return d.toLocaleDateString('en-US', { month: 'long' });
  }

  function visCols() {
    return window.rdColumns ? window.rdColumns.visible(COL_SCOPE) : NOTES_COLUMNS;
  }

  function filteredNotes() {
    const mode = window._notesMode || 'list';
    const rail = window._notesRailView || 'all';
    const ui = window._notesUiFilters || {};
    let list = allNotes();

    if (rail === 'unpinned') list = list.filter(x => x.loose);
    else if (rail === 'flagged') list = list.filter(x => x.flagged);
    else if (rail === 'mine') list = list.filter(x => x.mine);
    else if (rail === 'shared') list = list.filter(x => x.shared || /mary/i.test(x.author));

    if (ui.subject && ui.subject !== 'all') list = list.filter(x => x.subject === ui.subject);
    if (ui.author && ui.author !== 'all') list = list.filter(x => x.author === ui.author);
    if (ui.flag && ui.flag !== 'all') {
      if (/flag/i.test(ui.flag)) list = list.filter(x => x.flagged);
      else if (/clear|none/i.test(ui.flag)) list = list.filter(x => !x.flagged);
    }
    if (ui.kind && ui.kind !== 'all') list = list.filter(x => x.kind === ui.kind);
    if (ui.pinnedTo && ui.pinnedTo !== 'all') list = list.filter(x => x.pinnedTo === ui.pinnedTo);
    if (ui.period && ui.period !== 'all') list = list.filter(x => periodKey(x.written) === ui.period);

    if (mode === 'cards' && window._notesOpenOnly) list = list.filter(x => !x.resolved);
    if (mode === 'timeline' && window._notesUnresolvedShown) list = list.filter(x => !x.resolved);

    const q = String(window._notesSearch || '').trim().toLowerCase();
    if (q) {
      list = list.filter(x => (x.title + ' ' + x.body + ' ' + x.pinnedTo + ' ' + x.author + ' ' + x.kind).toLowerCase().indexOf(q) >= 0);
    }

    const sort = window._notesSort || 'newest';
    if (mode === 'cards') {
      const rank = k => (/blocker/i.test(k) ? 0 : (/decision|deadline|time/i.test(k) ? 1 : 2));
      list.sort((a, b) => rank(a.kind) - rank(b.kind) || String(b.written).localeCompare(String(a.written)));
    } else if (sort === 'oldest') {
      list.sort((a, b) => String(a.written).localeCompare(String(b.written)) || String(a.time).localeCompare(String(b.time)));
    } else if (sort === 'flagged') {
      list.sort((a, b) => (b.flagged ? 1 : 0) - (a.flagged ? 1 : 0) || String(b.written).localeCompare(String(a.written)));
    } else if (sort === 'author') {
      list.sort((a, b) => String(a.author).localeCompare(String(b.author)) || String(b.written).localeCompare(String(a.written)));
    } else {
      list.sort((a, b) => String(b.written).localeCompare(String(a.written)) || String(b.time).localeCompare(String(a.time)));
    }
    return list;
  }

  function notesFigures() {
    const all = allNotes();
    const flagged = all.filter(x => x.flagged).length;
    const pinned = all.filter(x => !x.loose).length;
    const loose = all.filter(x => x.loose).length;
    const week = all.filter(x => thisWeek(x.written)).length;
    const weekPrior = all.filter(x => lastWeek(x.written)).length;
    const open = all.filter(x => !x.resolved).length;
    const blockers = all.filter(x => /blocker/i.test(x.kind) && !x.resolved);
    const decisions = all.filter(x => /decision/i.test(x.kind) && !x.resolved).length;
    const resolved = all.filter(x => x.resolved).length;
    const resolvedWeek = all.filter(x => x.resolved && thisWeek(x.written)).length;
    const authors = Array.from(new Set(all.map(x => x.author)));
    let oldest = null;
    all.filter(x => !x.resolved).forEach(x => {
      const n = daysAgo(x.written);
      if (n != null && (oldest == null || n > oldest.days)) oldest = { days: n, title: x.title };
    });
    const bySubject = { Vendors: 0, Guests: 0, Money: 0, 'The day': 0, Loose: 0 };
    all.forEach(x => { bySubject[x.subject] = (bySubject[x.subject] || 0) + 1; });
    const blockerHint = blockers.slice(0, 2).map(x => {
      if (/coi/i.test(x.title)) return 'COI';
      if (/driver|friday run|michael/i.test(x.title)) return 'the Friday driver';
      return x.title.split(/[—–-]/)[0].trim().slice(0, 28);
    }).filter(Boolean);
    return {
      notes: all.length, flagged, pinned, loose, week, weekPrior,
      open, blockers: blockers.length, decisions, resolved, resolvedWeek, authors,
      oldest, bySubject,
      unpinned: loose,
      mine: all.filter(x => x.mine).length,
      shared: all.filter(x => x.shared || /mary/i.test(x.author)).length,
      blockerHint: blockerHint.length ? blockerHint.join(' and ') : ''
    };
  }

  function notesRailCounts() {
    const f = notesFigures();
    return {
      all: f.notes,
      unpinned: f.unpinned,
      flagged: f.flagged,
      mine: f.mine,
      shared: f.shared,
      bySubject: f.bySubject
    };
  }

  /* ── shell ───────────────────────────────────────────────────────────── */

  function pageheadActionsHtml() {
    const mode = window._notesMode || 'list';
    if (mode === 'cards' || mode === 'timeline') {
      return ''
        + '<button type="button" class="rd-btn" onclick="rdNotesPrint()">Print notes</button>'
        + '<button type="button" class="rd-btn" onclick="rdNotesFullEditor()">Full editor</button>'
        + '<button type="button" class="rd-btn" onclick="rdNotesExport()">Export</button>'
        + '<button type="button" class="rd-btn rd-btn--primary" onclick="rdNotesAdd()">Write a note</button>';
    }
    return ''
      + '<button type="button" class="rd-btn" onclick="rdNotesSearchFocus()">Search notes</button>'
      + '<button type="button" class="rd-btn" onclick="rdNotesPrint()">Print section</button>'
      + '<button type="button" class="rd-btn" onclick="rdNotesFullEditor()">Full editor</button>'
      + '<button type="button" class="rd-btn" onclick="rdNotesExport()">Export</button>'
      + '<button type="button" class="rd-btn rd-btn--primary" onclick="rdNotesAdd()">New note</button>';
  }

  function uedNotesShellRd() {
    const panel = document.getElementById('panel-notes');
    if (!panel) return;
    panel.classList.add('ued-scope', 'notes-mockup', 'notes-rd');
    if (panel.dataset.uedShell === SHELL_VER) {
      const actions = panel.querySelector('.rd-pagehead__actions');
      if (actions) actions.innerHTML = pageheadActionsHtml();
      return;
    }
    panel.dataset.uedShell = SHELL_VER;
    panel.innerHTML = `<div class="rd-page">
      <div class="rd-pagehead">
        <div>
          <div class="rd-pagehead__eyebrow">Overview</div>
          <div class="rd-pagehead__title-row">
            <h1 class="rd-pagehead__title">Notes</h1>
          </div>
        </div>
        <div class="rd-pagehead__actions">${pageheadActionsHtml()}</div>
      </div>
      <div class="rd-stats m-stats" id="notes-stats" aria-label="Notes summary"></div>
      <div class="rd-toolbar" id="notes-toolbar"></div>
      <div class="rd-bulkbar" id="notes-bulk-bar" hidden></div>
      <div class="rd-surface">
        <div class="rd-surface__row" id="notes-surface-row">
          <div class="rd-surface__main" id="notes-view-host">
            <div class="rd-view" id="notes-view-list" data-notes-view="list"></div>
            <div class="rd-view" id="notes-view-cards" data-notes-view="cards" hidden></div>
            <div class="rd-view" id="notes-view-timeline" data-notes-view="timeline" hidden></div>
          </div>
          <div id="notes-drawer-slot"></div>
        </div>
      </div>
    </div>`;
    if (typeof window.covenantShell !== 'undefined' && window.covenantShell.drawer) {
      window.covenantShell.drawer();
    }
  }

  function renderNotesStatsRd() {
    const host = document.getElementById('notes-stats');
    if (!host) return;
    const f = notesFigures();
    const mode = window._notesMode || 'list';
    let stats;
    if (mode === 'cards') {
      const openPct = f.notes ? Math.round(f.open / f.notes * 100) + '%' : undefined;
      stats = [
        { label: 'Notes', value: String(f.notes) },
        { label: 'Open', value: String(f.open), attention: openPct },
        { label: 'Blockers', value: String(f.blockers), attention: f.blockerHint || (f.blockers ? 'act now' : undefined) },
        { label: 'Decisions needed', value: String(f.decisions) },
        { label: 'Resolved', value: String(f.resolved), attention: f.resolvedWeek ? ('↑' + f.resolvedWeek + ' this week') : undefined }
      ];
    } else if (mode === 'timeline') {
      let weekAtt;
      if (f.weekPrior != null) {
        const delta = f.week - f.weekPrior;
        if (delta > 0) weekAtt = '↑' + delta + ' on last week';
        else if (delta < 0) weekAtt = '↓' + Math.abs(delta) + ' on last week';
      }
      stats = [
        { label: 'Notes', value: String(f.notes) },
        { label: 'Written this week', value: String(f.week), attention: weekAtt },
        { label: 'Oldest unresolved', value: f.oldest ? (f.oldest.days + ' days') : '—', attention: f.oldest ? (f.oldest.title.length > 40 ? f.oldest.title.slice(0, 36) + '…' : f.oldest.title) : undefined },
        { label: 'Resolved', value: String(f.resolved) },
        { label: 'Authors', value: String(f.authors.length), attention: f.authors.slice(0, 3).join(', ') }
      ];
    } else {
      stats = [
        { label: 'Notes', value: String(f.notes) },
        { label: 'Flagged', value: String(f.flagged), attention: f.flagged ? 'needs a look' : undefined },
        { label: 'Pinned', value: String(f.pinned) },
        { label: 'Loose', value: String(f.loose) },
        { label: 'This week', value: String(f.week) }
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
    const ui = window._notesUiFilters || {};
    const cur = ui[field] || 'all';
    const on = cur && cur !== 'all';
    const chev = '<svg viewBox="0 0 24 24" aria-hidden="true" style="width:1em;height:1em;fill:none;stroke:currentColor;stroke-width:2.2"><path d="m6 9 6 6 6-6"/></svg>';
    return `<button type="button" class="rd-chip${on ? ' is-active' : ''}" onclick="rdNotesOpenFilter(this,'${field}')">${esc(on ? label + ': ' + cur : label + ': all')}`
      + (on ? `<span class="rd-chip__clear" onclick="event.stopPropagation();rdNotesClearFilter('${field}')">&#10005;</span>` : chev)
      + '</button>';
  }

  function sortChipLabel() {
    const by = window._notesSort || 'newest';
    if (by === 'oldest') return 'Sort by oldest';
    if (by === 'flagged') return 'Sort by flagged';
    if (by === 'author') return 'Sort by author';
    return 'Sort by newest';
  }

  function viewSwitchHtml(mode) {
    return `<div class="rd-toolbar__right">` +
      `<div class="rd-viewswitch" role="group" aria-label="Notes view">` +
      `<button type="button" class="rd-viewswitch__item${mode === 'list' ? ' is-active' : ''}" onclick="rdSetNotesView('list')">List</button>` +
      `<button type="button" class="rd-viewswitch__item${mode === 'cards' ? ' is-active' : ''}" onclick="rdSetNotesView('cards')">Cards</button>` +
      `<button type="button" class="rd-viewswitch__item${mode === 'timeline' ? ' is-active' : ''}" onclick="rdSetNotesView('timeline')">Timeline</button>` +
      `</div></div>`;
  }

  function renderNotesToolbar() {
    const host = document.getElementById('notes-toolbar');
    if (!host) return;
    const mode = window._notesMode || 'list';
    let left = '';
    if (mode === 'cards') {
      left = filterChip('Kind', 'kind') + filterChip('Pinned to', 'pinnedTo') +
        `<button type="button" class="rd-chip${window._notesOpenOnly ? ' is-active' : ''}" onclick="rdNotesToggleOpenOnly()">Open only${window._notesOpenOnly ? '<span class="rd-chip__clear">✕</span>' : ''}</button>` +
        `<span class="rd-notes-toolbar-note">Sort by urgency</span>`;
    } else if (mode === 'timeline') {
      left = filterChip('Period', 'period') + filterChip('Author', 'author') +
        `<button type="button" class="rd-chip${window._notesUnresolvedShown ? ' is-active' : ''}" onclick="rdNotesToggleUnresolved()">Unresolved shown${window._notesUnresolvedShown ? '<span class="rd-chip__clear">✕</span>' : ''}</button>` +
        `<span class="rd-notes-toolbar-note">Newest first</span>`;
    } else {
      left = filterChip('Subject', 'subject') + filterChip('Author', 'author') + filterChip('Flag', 'flag') +
        (typeof rdSortChipHtml === 'function'
          ? rdSortChipHtml(sortChipLabel(), 'rdNotesOpenSort(this)')
          : `<button type="button" class="rd-chip" onclick="rdNotesOpenSort(this)">${esc(sortChipLabel())}</button>`) +
        (typeof rdStandardRightHtml === 'function' ? rdStandardRightHtml(COL_SCOPE) : '');
    }
    host.innerHTML = left + viewSwitchHtml(mode);
  }

  function renderNotesBulk() {
    const host = document.getElementById('notes-bulk-bar');
    if (!host) return;
    const n = window._notesSel.size;
    if (!n || window._notesMode === 'timeline') {
      host.hidden = true;
      host.innerHTML = '';
      return;
    }
    host.hidden = false;
    host.innerHTML =
      `<span class="rd-bulkbar__count">${n} selected</span><span class="rd-bulkbar__sep"></span>` +
      `<button type="button" class="rd-bulkbar__action" onclick="rdNotesBulk('flag')">Flag</button>` +
      `<button type="button" class="rd-bulkbar__action" onclick="rdNotesBulk('pin')">Pin to a record</button>` +
      `<button type="button" class="rd-bulkbar__action" onclick="rdNotesBulk('share')">Share with Mary</button>` +
      `<button type="button" class="rd-bulkbar__action" onclick="rdNotesBulk('delete')">Delete</button>` +
      `<button type="button" class="rd-bulkbar__clear" onclick="rdNotesBulkClear()">Clear selection</button>`;
  }

  /* ── views ───────────────────────────────────────────────────────────── */

  function groupKey(x) {
    const g = window._notesGroupBy || 'pinnedTo';
    if (g === 'author') return x.author || 'Unknown';
    if (g === 'date') return periodKey(x.written);
    if (x.loose) return 'Loose';
    return x.subject;
  }

  function groupBanner(key, count) {
    if (key === 'Loose') return 'Loose · ' + count + ' notes · not pinned to anything';
    if (window._notesGroupBy === 'author') return key + ' · ' + count + ' notes';
    if (window._notesGroupBy === 'date') return key + ' · ' + count + ' notes';
    return key + ' · ' + count + ' notes';
  }

  function cellFor(x, key, safeId) {
    if (key === '_sel') {
      const sel = window._notesSel.has(x.id);
      return `<td class="rd-notes-check" onclick="event.stopPropagation()">` +
        `<input type="checkbox" ${sel ? 'checked' : ''} onchange="rdNotesToggleSel('${esc(safeId)}')" aria-label="Select note"></td>`;
    }
    if (key === 'note') {
      return `<td class="rd-notes-name"><strong>${esc(x.title)}</strong>` +
        (x.excerpt ? `<span>${esc(x.excerpt)}</span>` : '') + `</td>`;
    }
    if (key === 'pinnedTo') return `<td>${esc(x.loose ? '—' : x.pinnedTo)}</td>`;
    if (key === 'author') return `<td>${esc(x.author)}</td>`;
    if (key === 'written') return `<td>${esc(fmtShort(x.written))}</td>`;
    if (key === 'flag') {
      return `<td>${x.flagged ? '<span class="rd-notes-flag">Flagged</span>' : ''}</td>`;
    }
    return '<td></td>';
  }

  function renderListView() {
    const host = document.getElementById('notes-view-list');
    if (!host) return;
    const rows = filteredNotes();
    const cols = visCols();
    const span = cols.length;
    if (!rows.length) {
      host.innerHTML = `<div class="rd-notes-empty"><h3>No notes yet</h3>
        <p>Write a note and pin it to a record as you type.</p>
        <button type="button" class="rd-btn rd-btn--primary" onclick="rdNotesAdd()">New note</button></div>`;
      return;
    }
    const SUBJECT_ORDER = ['Vendors', 'Guests', 'Money', 'The day', 'Loose'];
    const groups = {};
    const order = [];
    rows.forEach(x => {
      const k = groupKey(x);
      if (!groups[k]) { groups[k] = []; order.push(k); }
      groups[k].push(x);
    });
    if ((window._notesGroupBy || 'pinnedTo') === 'pinnedTo') {
      order.sort((a, b) => {
        const ia = SUBJECT_ORDER.indexOf(a);
        const ib = SUBJECT_ORDER.indexOf(b);
        return (ia < 0 ? 99 : ia) - (ib < 0 ? 99 : ib);
      });
    }
    const th = cols.map(c => {
      const w = c.width ? ` style="width:${c.width}"` : '';
      const af = c.fixed ? ' data-autofit="off"' : '';
      return `<th${w}${af}>${esc(c.label || '')}</th>`;
    }).join('');
    let html = `<div class="rd-table-wrap"><table class="rd-notes-table rd-table"><thead><tr>${th}</tr></thead><tbody>`;
    order.forEach(g => {
      const items = groups[g];
      html += `<tr class="rd-notes-group"><td colspan="${span}">${esc(groupBanner(g, items.length))}</td></tr>`;
      items.forEach(x => {
        const sel = window._notesSel.has(x.id);
        const open = window._notesDrawerId === x.id;
        const safeId = jsId(x.id);
        html += `<tr class="rd-notes-row${sel ? ' is-selected' : ''}${open ? ' is-open' : ''}" onclick="rdNotesOpenDrawer('${esc(safeId)}')">`;
        cols.forEach(c => { html += cellFor(x, c.key, safeId); });
        html += `</tr>`;
      });
    });
    html += `<tr class="rd-notes-addrow" onclick="rdNotesAdd()"><td class="rd-notes-check">+</td>
      <td colspan="${Math.max(1, span - 1)}">Write a note — pin it to a record as you type</td></tr>`;
    html += '</tbody></table></div>';
    host.innerHTML = html;
    if (typeof window.rdStdApplyRowHeight === 'function') {
      window.rdStdApplyRowHeight(COL_SCOPE, host);
    }
  }

  function kindClass(kind) {
    const k = String(kind || '').toLowerCase();
    if (/block/.test(k)) return 'blocker';
    if (/decision/.test(k)) return 'decision';
    if (/deadline|time/.test(k)) return 'deadline';
    if (/prefer/.test(k)) return 'preference';
    if (/sensit/.test(k)) return 'sensitive';
    if (/context/.test(k)) return 'context';
    return 'open';
  }

  function cardExtraRows(x) {
    const rows = [];
    rows.push({ label: 'Written', value: fmtShort(x.written) + ' · ' + x.author });
    if (x.affects) rows.push({ label: 'Affects', value: x.affects });
    if (x.chased) rows.push({ label: 'Chased', value: x.chased });
    if (x.actedOn) rows.push({ label: 'Acted on', value: x.actedOn });
    if (x.amount) rows.push({ label: 'Amount', value: x.amount });
    if (x.shot) rows.push({ label: 'Shot', value: x.shot });
    if (x.applied) rows.push({ label: 'Applied', value: x.applied });
    if (x.dueField) rows.push({ label: 'Due', value: x.dueField });
    return rows;
  }

  function renderCardsView() {
    const host = document.getElementById('notes-view-cards');
    if (!host) return;
    const rows = filteredNotes();
    if (!rows.length) {
      host.innerHTML = `<div class="rd-notes-empty"><h3>No open notes</h3>
        <p>Clear “Open only” to see resolved notes, or write a new one.</p>
        <button type="button" class="rd-btn rd-btn--primary" onclick="rdNotesAdd()">Write a note</button></div>`;
      return;
    }
    host.innerHTML = `<div class="rd-notes-cardgrid">${rows.map(x => {
      const safeId = jsId(x.id);
      const extras = cardExtraRows(x);
      const foot = x.resolved ? 'Resolved' : (x.foot || (x.flagged ? 'Needs a decision' : 'Open'));
      return `
      <article class="rd-notes-card${x.flagged ? ' is-flagged' : ''}${x.resolved ? ' is-resolved' : ''}" onclick="rdNotesOpenDrawer('${esc(safeId)}')">
        <div class="rd-notes-card__top">
          <h3>${esc(x.title)}</h3>
          <span class="rd-notes-kind rd-notes-kind--${kindClass(x.kind)}">${esc(x.resolved ? 'Resolved' : x.kind)}</span>
        </div>
        <div class="rd-notes-card__pin">${esc(x.loose ? 'Loose · not pinned' : 'Pinned to · ' + x.pinnedTo)}</div>
        <div class="rd-notes-card__meta">
          ${extras.map(r => `<div><span>${esc(r.label)}</span><strong>${esc(r.value)}</strong></div>`).join('')}
        </div>
        <div class="rd-notes-card__foot">${esc(foot)}</div>
      </article>`;
    }).join('')}</div>`;
  }

  function timelineStatus(x) {
    if (x.resolved) return 'Resolved';
    if (/context/i.test(x.kind)) return 'Note';
    if (x.flagged || /blocker|decision|deadline|time/i.test(x.kind)) return 'Open';
    return 'Note';
  }

  function renderTimelineView() {
    const host = document.getElementById('notes-view-timeline');
    if (!host) return;
    const rows = filteredNotes();
    if (!rows.length) {
      host.innerHTML = `<div class="rd-notes-empty"><h3>No notes in this period</h3>
        <button type="button" class="rd-btn rd-btn--primary" onclick="rdNotesAdd()">Write a note</button></div>`;
      return;
    }
    const periods = {};
    const order = [];
    rows.forEach(x => {
      const p = periodKey(x.written);
      if (!periods[p]) { periods[p] = []; order.push(p); }
      periods[p].push(x);
    });
    let html = '';
    order.forEach(p => {
      const items = periods[p];
      const resolved = items.filter(x => x.resolved).length;
      const blockers = items.filter(x => /blocker/i.test(x.kind)).length;
      const meta = blockers
        ? (items.length + ' notes · ' + blockers + ' blocker' + (blockers === 1 ? '' : 's'))
        : (items.length + ' notes · ' + resolved + ' resolved');
      html += `<div class="rd-notes-period"><div class="rd-notes-period__head"><strong>${esc(p)}</strong><span>${esc(meta)}</span></div><ul>`;
      items.forEach(x => {
        const when = (p === 'Today' && x.time) ? x.time : fmtShort(x.written);
        const pinLine = x.author + ' · ' + (x.loose ? 'loose' : ('pinned to ' + x.pinnedTo));
        const safeId = jsId(x.id);
        html += `<li class="rd-notes-tl" onclick="rdNotesOpenDrawer('${esc(safeId)}')">
          <div class="rd-notes-tl__body">
            <strong>${esc(x.title)}</strong>
            <em>${esc(pinLine)}</em>
          </div>
          <span class="rd-notes-kind rd-notes-kind--${kindClass(x.kind)}">${esc(x.resolved ? 'Resolved' : x.kind)}</span>
          <span class="rd-notes-tl__when">${esc(when)}</span>
          <span class="rd-notes-tl__status">${esc(timelineStatus(x))}</span>
        </li>`;
      });
      html += '</ul></div>';
    });
    host.innerHTML = html;
  }

  /* ── drawer ──────────────────────────────────────────────────────────── */

  function parkSharedDrawerAway(slot) {
    const d = document.getElementById('record-drawer');
    const layout = document.getElementById('layout');
    if (d && layout && d.parentElement === slot) layout.appendChild(d);
  }

  function findNote(id) {
    return allNotes().find(x => x.id === id) || null;
  }

  function field(label, valueHtml) {
    return `<div class="rd-drawer__field"><span>${esc(label)}</span><strong>${valueHtml}</strong></div>`;
  }

  function drawerNoteBody(x) {
    return `<div class="rd-drawer__note-body">${esc(x.body || x.excerpt || 'No body yet.')}</div>`
      + field('Author', esc(x.author))
      + field('Written', esc(fmtLong(x.written)))
      + field('Flagged', x.flagged ? 'Yes · needs a decision' : 'No')
      + (x.owner ? field('Owner', esc(x.owner)) : '')
      + (x.dueBy ? field('By', esc(x.dueBy)) : '');
  }

  function drawerPinBody(x) {
    const looseCount = notesFigures().loose;
    const pinHtml = x.loose
      ? '— · loose'
      : `<button type="button" class="rd-drawer__link" onclick="rdNotesOpenPin('${esc(jsId(x.subject))}')">${esc(x.pinnedTo)} →</button>`;
    let related = '';
    if (!x.loose) {
      const others = (x.relatedNotes && x.relatedNotes.length)
        ? x.relatedNotes.slice()
        : allNotes().filter(n => n.id !== x.id && n.pinnedTo === x.pinnedTo).slice(0, 3)
          .map(n => ({ title: n.title, flag: n.flagged }));
      if (!others.length) others.push({ title: 'This note', flag: x.flagged });
      const label = /vendor/i.test(x.subject) ? 'Notes on this vendor' : ('Notes on ' + x.pinnedTo);
      related = `<div class="rd-drawer__section-title">${esc(label)}</div>` +
        others.map(r => `<div class="rd-drawer__guest"><strong>${esc(r.title === 'This note' ? 'This note' : r.title)}</strong>` +
          `<span>${r.flag ? '<span class="rd-notes-flag">Flagged</span>' : ''}</span></div>`).join('');
    }
    return field('Record', pinHtml)
      + (x.alsoShowsOn ? field('Also shows on', esc(x.alsoShowsOn)) : '')
      + `<p class="rd-drawer__note">A pinned note appears in that record&rsquo;s drawer. Deleting the record keeps the note and marks it <em>loose</em> — ${looseCount} note${looseCount === 1 ? '' : 's'} ${looseCount === 1 ? 'is' : 'are'} loose today.</p>`
      + related;
  }

  function drawerSharingBody(x) {
    const note = x.sharingNote ||
      'A note is never in a share packet, whatever sections you pick.';
    const replies = x.replies || [];
    return `<div class="rd-drawer__guest"><strong>Mary O. · planner</strong><span>Can read and reply</span></div>`
      + `<div class="rd-drawer__guest"><strong>Kwesi</strong><span>Can read and reply</span></div>`
      + `<div class="rd-drawer__guest"><strong>Vendors</strong><span>Never</span></div>`
      + `<p class="rd-drawer__note">${esc(note)}</p>`
      + (replies.length
        ? `<div class="rd-drawer__section-title">Replies · ${replies.length}</div>` +
          replies.map(r => `<div class="rd-drawer__hist"><strong>${esc(r.author || 'Mary O.')}</strong> · ${esc(r.when || '')}<br>${esc(r.text || '')}</div>`).join('')
        : `<div class="rd-drawer__section-title">Replies · 0</div><p class="rd-drawer__note">No replies yet.</p>`);
  }

  function drawerHistoryBody(x) {
    let entries = x.history && x.history.length ? x.history.slice() : [];
    if (!entries.length) {
      entries.push({ when: fmtShort(x.written), who: x.author, what: 'Written' });
      if (x.flagged) entries.unshift({ when: fmtShort(x.written), who: x.author, what: 'Flagged' });
      (x.replies || []).forEach(r => {
        entries.unshift({ when: r.when || '', who: r.author || 'Mary O.', what: 'Replied' });
      });
    }
    const people = Array.from(new Set(entries.map(e => e.who).filter(Boolean)));
    return `<div class="rd-drawer__section-title">This note</div>`
      + entries.map(e => `<div class="rd-drawer__hist">${esc(e.when)} · ${esc(e.who)}<br><strong>${esc(e.what)}</strong></div>`).join('')
      + `<p class="rd-drawer__note">A note is the only record whose history is mostly conversation. ${entries.length} entr${entries.length === 1 ? 'y' : 'ies'}, ${people.length} people${x.flagged && !x.resolved ? ', one decision still open' : ''}.</p>`;
  }

  function renderNotesDrawer() {
    const slot = document.getElementById('notes-drawer-slot');
    if (!slot) return;
    const id = window._notesDrawerId;
    const x = id ? findNote(id) : null;
    if (!x) {
      parkSharedDrawerAway(slot);
      slot.innerHTML = '';
      slot.classList.remove('is-open');
      return;
    }
    const tab = Math.max(0, Math.min(DRAWER_TABS.length - 1, parseInt(window._notesDrawerTab, 10) || 0));
    let body = '';
    if (tab === 0) body = drawerNoteBody(x);
    else if (tab === 1) body = drawerPinBody(x);
    else if (tab === 2) body = drawerSharingBody(x);
    else body = drawerHistoryBody(x);

    const crumb = 'Note · ' + (x.loose ? 'loose' : x.subject.toLowerCase());
    const chips = (x.flagged ? '<span class="rd-notes-flag">Flagged</span> ' : '') +
      esc(x.author + ' · ' + fmtShort(x.written));
    slot.innerHTML = `<aside class="rd-drawer rd-notes-drawer" role="dialog" aria-label="${esc(x.title)}">
      <div class="rd-drawer__head">
        <button type="button" class="rd-drawer__close" onclick="rdNotesCloseDrawer()" aria-label="Close">✕</button>
        <div class="rd-drawer__eyebrow">${esc(crumb)}</div>
        <h2 class="rd-drawer__title">${esc(x.title)}</h2>
        <div class="rd-notes-drawer__meta">${chips}</div>
        <div class="rd-drawer__tabs">${DRAWER_TABS.map((t, i) =>
          `<button type="button" class="rd-drawer__tab${i === tab ? ' is-active' : ''}" onclick="rdNotesSetDrawerTab(${i})">${esc(t)}</button>`
        ).join('')}</div>
      </div>
      <div class="rd-drawer__body">${body}</div>
      <div class="rd-drawer__foot">
        <button type="button" class="rd-btn" onclick="rdNotesSave()">Save</button>
        <button type="button" class="rd-btn rd-btn--primary" onclick="rdNotesFullEditor('${esc(jsId(x.id))}')">Full editor</button>
      </div>
    </aside>`;
    slot.classList.add('is-open');
  }

  /* ── actions ─────────────────────────────────────────────────────────── */

  function applyViewMode() {
    const mode = window._notesMode || 'list';
    ['list', 'cards', 'timeline'].forEach(name => {
      const el = document.getElementById('notes-view-' + name);
      if (el) el.hidden = name !== mode;
    });
  }

  function rdSetNotesView(mode) {
    window._notesMode = (mode === 'cards' || mode === 'timeline') ? mode : 'list';
    renderNotesRd();
  }
  function rdNotesSetRailView(viewId) {
    window._notesRailView = viewId || 'all';
    if (typeof setSavedView === 'function') setSavedView('notes', window._notesRailView);
    renderNotesRd();
  }
  function rdNotesSetGroupBy(groupId) {
    window._notesGroupBy = groupId || 'pinnedTo';
    if (typeof setSavedView === 'function') setSavedView('notesGroupBy', window._notesGroupBy);
    renderNotesRd();
  }
  function rdNotesOpenFilter(btn, field) {
    const options = [{ value: 'all', label: 'All' }];
    if (field === 'flag') {
      options.push({ value: 'Flagged', label: 'Flagged' });
      options.push({ value: 'Clear', label: 'Clear' });
    } else {
      const seen = {};
      allNotes().forEach(x => {
        if (field === 'subject' && x.subject) seen[x.subject] = true;
        if (field === 'author' && x.author) seen[x.author] = true;
        if (field === 'kind' && x.kind) seen[x.kind] = true;
        if (field === 'pinnedTo' && !x.loose) seen[x.pinnedTo] = true;
        if (field === 'period') seen[periodKey(x.written)] = true;
      });
      Object.keys(seen).sort().forEach(v => options.push({ value: v, label: v }));
    }
    const cur = (window._notesUiFilters || {})[field] || 'all';
    if (typeof window.rdPickOne === 'function') {
      window.rdPickOne(btn, options, cur, function (val) {
        window._notesUiFilters[field] = val || 'all';
        renderNotesRd();
      });
      return;
    }
    const list = options.map(o => o.value);
    const i = list.indexOf(cur);
    window._notesUiFilters[field] = list[(i + 1) % list.length];
    renderNotesRd();
  }
  function rdNotesClearFilter(field) {
    window._notesUiFilters[field] = 'all';
    renderNotesRd();
  }
  function rdNotesOpenSort(btn) {
    const opts = [
      { value: 'newest', label: 'Sort by newest' },
      { value: 'oldest', label: 'Sort by oldest' },
      { value: 'flagged', label: 'Sort by flagged' },
      { value: 'author', label: 'Sort by author' }
    ];
    if (typeof window.rdPickOne === 'function') {
      window.rdPickOne(btn, opts, window._notesSort || 'newest', function (val) {
        window._notesSort = val || 'newest';
        renderNotesRd();
      });
      return;
    }
    const list = opts.map(o => o.value);
    const i = list.indexOf(window._notesSort || 'newest');
    window._notesSort = list[(i + 1) % list.length];
    renderNotesRd();
  }
  function rdNotesToggleOpenOnly() {
    window._notesOpenOnly = !window._notesOpenOnly;
    renderNotesRd();
  }
  function rdNotesToggleUnresolved() {
    window._notesUnresolvedShown = !window._notesUnresolvedShown;
    renderNotesRd();
  }
  function rdNotesToggleSel(id) {
    if (window._notesSel.has(id)) window._notesSel.delete(id);
    else window._notesSel.add(id);
    renderNotesBulk();
    if (window._notesMode === 'list') renderListView();
    else if (window._notesMode === 'cards') renderCardsView();
  }
  function rdNotesBulkClear() {
    window._notesSel.clear();
    renderNotesRd();
  }
  async function rdNotesBulk(action) {
    const ids = Array.from(window._notesSel);
    const rows = allNotes().filter(x => ids.includes(x.id));
    if (!rows.length) return;
    if (action === 'flag') rows.forEach(x => { x.row.flagged = true; });
    else if (action === 'pin') {
      const ref = typeof covPrompt === 'function'
        ? await covPrompt('Pin to (e.g. Vendors · Sweet Rose)', 'Vendors · ')
        : window.prompt('Pin to (e.g. Vendors · Sweet Rose)', 'Vendors · ');
      if (!ref) return;
      rows.forEach(x => { x.row.pinnedTo = ref; x.row.pinned = true; });
    } else if (action === 'share') {
      rows.forEach(x => { x.row.sharedWith = 'Mary'; });
      if (typeof covAlert === 'function') {
        covAlert('Shared with Mary. Notes are never included in a vendor share packet.');
      } else if (typeof showToast === 'function') {
        showToast('Shared with Mary', 'ok');
      }
    } else if (action === 'delete') {
      const ok = typeof covConfirm === 'function'
        ? await covConfirm('Delete ' + rows.length + ' note(s)?')
        : window.confirm('Delete ' + rows.length + ' note(s)?');
      if (!ok) return;
      const remove = new Set(rows.map(x => x.index));
      data.notesDetails = data.notesDetails.filter((_, i) => !remove.has(i));
      window._notesSel.clear();
    }
    if (typeof save === 'function') save();
    renderNotesRd();
  }
  function rdNotesOpenDrawer(id) {
    window._notesDrawerId = id;
    window._notesDrawerTab = 0;
    renderNotesDrawer();
    if (window._notesMode === 'list') renderListView();
    else if (window._notesMode === 'cards') renderCardsView();
    else renderTimelineView();
  }
  function rdNotesCloseDrawer() {
    window._notesDrawerId = null;
    const slot = document.getElementById('notes-drawer-slot');
    if (slot) {
      parkSharedDrawerAway(slot);
      slot.innerHTML = '';
      slot.classList.remove('is-open');
    }
  }
  function rdNotesSetDrawerTab(i) {
    window._notesDrawerTab = i;
    renderNotesDrawer();
  }
  function rdNotesAdd() {
    ensureMasterNotes();
    if (typeof addNotesDetailRow === 'function') {
      try { addNotesDetailRow(); } catch (e) { /* fall through */ }
    }
    ensureNotes();
    const row = data.notesDetails[data.notesDetails.length - 1];
    if (!row || (row.title && row.title !== 'Untitled Note' && row.note)) {
      const fresh = {
        title: 'New note',
        category: 'Planning',
        subject: 'Loose',
        tags: '',
        pinned: false,
        pinnedTo: '—',
        flagged: false,
        author: 'Ama',
        date: typeof notesToday === 'function' ? notesToday() : new Date().toISOString().slice(0, 10),
        lastEdited: typeof notesToday === 'function' ? notesToday() : new Date().toISOString().slice(0, 10),
        time: typeof notesTimeNow === 'function' ? notesTimeNow() : '',
        status: 'Open',
        note: '',
        nextStep: '',
        kind: 'Open question'
      };
      if (typeof nextRecordId === 'function') fresh._id = nextRecordId('notesDetails');
      data.notesDetails.push(fresh);
      if (typeof save === 'function') save();
    }
    const created = unify(data.notesDetails[data.notesDetails.length - 1], data.notesDetails.length - 1);
    window._notesMode = 'list';
    window._notesDrawerId = created.id;
    window._notesDrawerTab = 0;
    renderNotesRd();
  }
  function rdNotesFullEditor(id) {
    const x = id ? findNote(id) : findNote(window._notesDrawerId);
    if (typeof openRecordEditor === 'function' && x) {
      try { openRecordEditor('notesDetails', x.index); return; } catch (e) { /* fall through */ }
    }
    if (x) { window._notesDrawerId = x.id; window._notesDrawerTab = 0; renderNotesDrawer(); }
    else rdNotesAdd();
  }
  function rdNotesPrint() {
    if (typeof printCurrentPage === 'function') printCurrentPage();
    else window.print();
  }
  function rdNotesExport() {
    if (typeof exportSectionCSV === 'function') {
      exportSectionCSV('Notes', filteredNotes().map(x => ({
        note: x.title, pinnedTo: x.pinnedTo, author: x.author, written: x.written, flag: x.flagged ? 'Flagged' : '', kind: x.kind
      })));
    }
  }
  function rdNotesSearchFocus() {
    const q = window.prompt ? window.prompt('Search notes', window._notesSearch || '') : '';
    if (q == null) return;
    window._notesSearch = q;
    renderNotesRd();
  }
  function rdNotesAutoFit() {
    const panel = document.getElementById('panel-notes');
    if (panel && typeof autoFitOneTable === 'function') {
      panel.querySelectorAll('table').forEach((t, i) => autoFitOneTable(t, i));
    }
  }
  function rdNotesSave() {
    if (typeof save === 'function') save();
    if (typeof showToast === 'function') showToast('Note saved', 'ok');
    renderNotesRd();
  }
  function rdNotesOpenPin(subject) {
    if (/vendor/i.test(subject)) showPanel('vendors');
    else if (/guest/i.test(subject)) showPanel('guests');
    else if (/money/i.test(subject)) showPanel('budget');
    else showPanel('timeline');
  }

  /* ── main ────────────────────────────────────────────────────────────── */

  function renderNotesRd() {
    ensureMasterNotes();
    if (typeof getSavedView === 'function') {
      const saved = getSavedView('notes', window._notesRailView || 'all');
      if (saved) window._notesRailView = saved;
      const gb = getSavedView('notesGroupBy', window._notesGroupBy || 'pinnedTo');
      if (gb) window._notesGroupBy = gb;
    }
    uedNotesShellRd();
    if (typeof renderPageUxChrome === 'function') renderPageUxChrome('notes');
    applyViewMode();
    renderNotesStatsRd();
    renderNotesToolbar();
    renderNotesBulk();

    const mode = window._notesMode || 'list';
    if (mode === 'cards') renderCardsView();
    else if (mode === 'timeline') renderTimelineView();
    else renderListView();
    renderNotesDrawer();

    if (typeof renderContextSidebar === 'function'
      && document.body.getAttribute('data-active-panel') === 'notes'
      && document.body.classList.contains('context-sidebar-mode')) {
      renderContextSidebar('notes');
    }
    if (typeof uxRevealPanel === 'function') uxRevealPanel('notes');
  }

  window.uedNotesShell = uedNotesShellRd;
  window.renderNotesRd = renderNotesRd;
  window.renderNotesPage = renderNotesRd;
  window.rdSetNotesView = rdSetNotesView;
  window.rdNotesSetRailView = rdNotesSetRailView;
  window.applyNotesRailView = rdNotesSetRailView;
  window.applyNotesGroupBy = rdNotesSetGroupBy;
  window.rdNotesSetGroupBy = rdNotesSetGroupBy;
  window.notesRailCounts = notesRailCounts;
  window.notesFigures = notesFigures;
  window.rdNotesOpenDrawer = rdNotesOpenDrawer;
  window.rdNotesCloseDrawer = rdNotesCloseDrawer;
  window.rdNotesSetDrawerTab = rdNotesSetDrawerTab;
  window.rdNotesAdd = rdNotesAdd;
  window.rdNotesFullEditor = rdNotesFullEditor;
  window.rdNotesPrint = rdNotesPrint;
  window.rdNotesExport = rdNotesExport;
  window.rdNotesSearchFocus = rdNotesSearchFocus;
  window.rdNotesAutoFit = rdNotesAutoFit;
  window.rdNotesSave = rdNotesSave;
  window.rdNotesOpenPin = rdNotesOpenPin;
  window.rdNotesToggleSel = rdNotesToggleSel;
  window.rdNotesBulkClear = rdNotesBulkClear;
  window.rdNotesBulk = rdNotesBulk;
  window.rdNotesOpenFilter = rdNotesOpenFilter;
  window.rdNotesCycleFilter = rdNotesOpenFilter;
  window.rdNotesClearFilter = rdNotesClearFilter;
  window.rdNotesOpenSort = rdNotesOpenSort;
  window.rdNotesToggleOpenOnly = rdNotesToggleOpenOnly;
  window.rdNotesToggleUnresolved = rdNotesToggleUnresolved;

  window.renderNotesPage = function () { renderNotesRd(); };
  window.renderNotes = function () { renderNotesRd(); };

  function hookNotesPanelRenderer() {
    if (window.SYSTEM_PANEL_RENDERERS) {
      window.SYSTEM_PANEL_RENDERERS.notes = function () { renderNotesRd(); };
    }
    window.renderNotesPage = function () { renderNotesRd(); };
  }
  hookNotesPanelRenderer();
  var _showPanelNotes = window.showPanel;
  if (typeof _showPanelNotes === 'function') {
    window.showPanel = function (id, forceOpen) {
      var out = _showPanelNotes.call(window, id, forceOpen);
      hookNotesPanelRenderer();
      return out;
    };
  }
})();
