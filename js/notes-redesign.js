/* Notes — All.dc #12a (List) + Views #33a Cards / #33b Timeline
   + Dark.dc rail + Drawers Note · Pin · Sharing · History.
   Views: List | Cards | Timeline.
   Rail: All notes · Unpinned · Flagged · Mine · Shared
         + By subject meters + Group by Pinned to / Author / Date.
   Stats (List): Notes · Flagged · Pinned · Loose · This week.
   Data: data.notesDetails[] (adapter adds kind, author, flagged, pinnedTo). */
(function () {
  'use strict';

  window._notesMode = window._notesMode || 'list';
  window._notesRailView = window._notesRailView || 'all';
  window._notesGroupBy = window._notesGroupBy || 'pinnedTo';
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
  const KINDS = ['Open question', 'Blocker', 'Decision needed', 'Deadline', 'Preference', 'Sensitive', 'Time-critical'];

  const esc = s => (typeof escapeHtml === 'function'
    ? escapeHtml(s == null ? '' : String(s))
    : String(s == null ? '' : s).replace(/[&<>"']/g, c => ({
      '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;'
    }[c])));

  function ensureNotes() {
    if (typeof ensureNotesData === 'function') ensureNotesData();
    else {
      if (!window.data) window.data = {};
      if (!Array.isArray(data.notesDetails)) data.notesDetails = [];
    }
  }

  function subjectFromCategory(cat, pinnedTo) {
    if (pinnedTo && pinnedTo !== '—') {
      const p = String(pinnedTo).toLowerCase();
      if (/vendor|baker|florist|photo|cater|dj|band/.test(p)) return 'Vendors';
      if (/guest|household|rsvp|seating|table/.test(p)) return 'Guests';
      if (/budget|payment|money|contract|cake/.test(p)) return 'Money';
      if (/day|timeline|ceremony|reception|weekend/.test(p)) return 'The day';
    }
    const c = String(cat || '').toLowerCase();
    if (/vendor/.test(c)) return 'Vendors';
    if (/guest|personal|family|party/.test(c)) return 'Guests';
    if (/budget|money|payment|contract/.test(c)) return 'Money';
    if (/ceremony|reception|day|timeline|planning|honeymoon/.test(c)) return 'The day';
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
    return kind === 'Resolved' || /done|complete|resolved|archived/i.test(row.status || '');
  }

  function unify(row, i) {
    if (typeof ensureRowId === 'function') ensureRowId(row, 'notesDetails');
    const kind = deriveKind(row);
    const author = deriveAuthor(row, i);
    const flagged = deriveFlagged(row, kind);
    const pinnedTo = derivePinnedTo(row, subjectFromCategory(row.category));
    const loose = !pinnedTo || pinnedTo === '—';
    const subject = loose ? 'Loose' : subjectFromCategory(row.category, pinnedTo);
    const resolved = isResolved(row, kind);
    const written = row.lastEdited || row.date || '';
    const excerpt = String(row.note || row.nextStep || '').replace(/\s+/g, ' ').trim();
    return {
      id: row._id ? ('notesDetails:' + row._id) : ('notesDetails:idx:' + i),
      index: i,
      row: row,
      title: String(row.title || 'Untitled note').trim() || 'Untitled note',
      excerpt: excerpt.slice(0, 120),
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
      kind: kind === 'Resolved' ? 'Open question' : kind,
      resolved: resolved,
      shared: /mary|shared/i.test(String(row.sharedWith || row.sharing || author)),
      mine: /ama|^me$/i.test(author),
      status: resolved ? 'Resolved' : (flagged ? 'Flagged' : 'Open'),
      alsoShowsOn: row.alsoShowsOn || (subject === 'Vendors' ? 'Budget · related row' : ''),
      replies: Array.isArray(row.replies) ? row.replies : []
    };
  }

  function allNotes() {
    ensureNotes();
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

    if (mode === 'cards') {
      const rank = k => (/blocker/i.test(k) ? 0 : (/decision|deadline|time/i.test(k) ? 1 : 2));
      list.sort((a, b) => rank(a.kind) - rank(b.kind) || String(b.written).localeCompare(String(a.written)));
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
    const open = all.filter(x => !x.resolved).length;
    const blockers = all.filter(x => /blocker/i.test(x.kind)).length;
    const decisions = all.filter(x => /decision/i.test(x.kind)).length;
    const resolved = all.filter(x => x.resolved).length;
    const authors = Array.from(new Set(all.map(x => x.author)));
    let oldest = null;
    all.filter(x => !x.resolved).forEach(x => {
      const n = daysAgo(x.written);
      if (n != null && (oldest == null || n > oldest.days)) oldest = { days: n, title: x.title };
    });
    const bySubject = { Vendors: 0, Guests: 0, Money: 0, 'The day': 0, Loose: 0 };
    all.forEach(x => { bySubject[x.subject] = (bySubject[x.subject] || 0) + 1; });
    return {
      notes: all.length, flagged, pinned, loose, week,
      open, blockers, decisions, resolved, authors,
      oldest, bySubject,
      unpinned: loose,
      mine: all.filter(x => x.mine).length,
      shared: all.filter(x => x.shared || /mary/i.test(x.author)).length
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
    if (panel.dataset.uedShell === 'notes-rd12a') {
      const actions = panel.querySelector('.rd-pagehead__actions');
      if (actions) actions.innerHTML = pageheadActionsHtml();
      return;
    }
    panel.dataset.uedShell = 'notes-rd12a';
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
      stats = [
        { label: 'Notes', value: String(f.notes) },
        { label: 'Open', value: String(f.open), attention: f.notes ? Math.round(f.open / f.notes * 100) + '%' : undefined },
        { label: 'Blockers', value: String(f.blockers), attention: f.blockers ? 'act now' : undefined },
        { label: 'Decisions needed', value: String(f.decisions) },
        { label: 'Resolved', value: String(f.resolved), attention: f.week ? ('↑' + f.week + ' this week') : undefined }
      ];
    } else if (mode === 'timeline') {
      stats = [
        { label: 'Notes', value: String(f.notes) },
        { label: 'Written this week', value: String(f.week) },
        { label: 'Oldest unresolved', value: f.oldest ? (f.oldest.days + ' days') : '—', attention: f.oldest ? f.oldest.title : undefined },
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
    return `<button type="button" class="rd-chip${on ? ' is-active' : ''}" onclick="rdNotesCycleFilter('${field}')">${esc(on ? label + ': ' + cur : label + ': all')}`
      + (on ? `<span class="rd-chip__clear" onclick="event.stopPropagation();rdNotesClearFilter('${field}')">&#10005;</span>` : chev)
      + '</button>';
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
        (typeof rdSortChipHtml === 'function' ? rdSortChipHtml('Sort by newest', "rdNotesOpenSort(this)") : '') +
        (typeof rdStandardRightHtml === 'function' ? rdStandardRightHtml('notes') : '');
    }
    host.innerHTML = left +
      `<div class="rd-toolbar__right">` +
      (mode === 'list' ? `<button type="button" class="rd-chip" onclick="rdNotesAutoFit()">Auto-fit columns</button>` : '') +
      `<div class="rd-viewswitch" role="group" aria-label="Notes view">` +
      `<button type="button" class="rd-viewswitch__item${mode === 'list' ? ' is-active' : ''}" onclick="rdSetNotesView('list')">List</button>` +
      `<button type="button" class="rd-viewswitch__item${mode === 'cards' ? ' is-active' : ''}" onclick="rdSetNotesView('cards')">Cards</button>` +
      `<button type="button" class="rd-viewswitch__item${mode === 'timeline' ? ' is-active' : ''}" onclick="rdSetNotesView('timeline')">Timeline</button>` +
      `</div></div>`;
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
      `<button type="button" class="rd-bulkbar__action" onclick="rdNotesBulk('share')">Share</button>` +
      `<button type="button" class="rd-bulkbar__action" onclick="rdNotesBulk('delete')">Delete</button>` +
      `<button type="button" class="rd-bulkbar__clear" onclick="rdNotesBulkClear()">Clear selection</button>`;
  }

  /* ── views ───────────────────────────────────────────────────────────── */

  function groupKey(x) {
    const g = window._notesGroupBy || 'pinnedTo';
    if (g === 'author') return x.author || 'Unknown';
    if (g === 'date') return periodKey(x.written);
    if (x.loose) return 'Loose · not pinned to anything';
    return x.subject + ' · notes';
  }

  function renderListView() {
    const host = document.getElementById('notes-view-list');
    if (!host) return;
    const rows = filteredNotes();
    if (!rows.length) {
      host.innerHTML = `<div class="rd-notes-empty"><h3>No notes yet</h3>
        <p>Write a note and pin it to a record as you type.</p>
        <button type="button" class="rd-btn rd-btn--primary" onclick="rdNotesAdd()">New note</button></div>`;
      return;
    }
    const groups = {};
    const order = [];
    rows.forEach(x => {
      const k = groupKey(x);
      if (!groups[k]) { groups[k] = []; order.push(k); }
      groups[k].push(x);
    });
    let html = `<div class="rd-table-wrap"><table class="rd-notes-table"><thead><tr>
      <th class="rd-notes-check"></th><th>Note</th><th>Pinned to</th><th>Author</th><th>Written</th><th>Flag</th>
    </tr></thead><tbody>`;
    order.forEach(g => {
      const items = groups[g];
      html += `<tr class="rd-notes-group"><td colspan="6">${esc(g.replace(' · notes', ' · ' + items.length + ' notes'))}</td></tr>`;
      items.forEach(x => {
        const sel = window._notesSel.has(x.id);
        const open = window._notesDrawerId === x.id;
        html += `<tr class="rd-notes-row${sel ? ' is-selected' : ''}${open ? ' is-open' : ''}" onclick="rdNotesOpenDrawer('${esc(x.id)}')">
          <td class="rd-notes-check" onclick="event.stopPropagation()">
            <input type="checkbox" ${sel ? 'checked' : ''} onchange="rdNotesToggleSel('${esc(x.id)}')" aria-label="Select note">
          </td>
          <td class="rd-notes-name"><strong>${esc(x.title)}</strong>${x.excerpt ? '<span>' + esc(x.excerpt) + '</span>' : ''}</td>
          <td>${esc(x.loose ? '—' : x.pinnedTo)}</td>
          <td>${esc(x.author)}</td>
          <td>${esc(fmtShort(x.written))}</td>
          <td>${x.flagged ? '<span class="rd-notes-flag">Flagged</span>' : '—'}</td>
        </tr>`;
      });
    });
    html += `<tr class="rd-notes-addrow" onclick="rdNotesAdd()"><td class="rd-notes-check">+</td>
      <td colspan="5">Write a note — pin it to a record as you type</td></tr>`;
    html += '</tbody></table></div>';
    const loose = notesFigures().loose;
    if (loose > 0) {
      html += `<div class="rd-section__head rd-notes-loose">
        <div class="rd-pagehead__eyebrow">Loose notes</div>
        <p class="rd-help">${loose} not pinned to anything yet.</p>
        <button type="button" class="rd-btn rd-btn--quiet" style="margin-left:auto" onclick="rdNotesSetRailView('unpinned')">Pin them</button>
      </div>`;
    }
    host.innerHTML = html;
  }

  function kindClass(kind) {
    const k = String(kind || '').toLowerCase();
    if (/block/.test(k)) return 'blocker';
    if (/decision/.test(k)) return 'decision';
    if (/deadline|time/.test(k)) return 'deadline';
    if (/prefer/.test(k)) return 'preference';
    if (/sensit/.test(k)) return 'sensitive';
    return 'open';
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
    host.innerHTML = `<div class="rd-notes-cardgrid">${rows.map(x => `
      <article class="rd-notes-card${x.flagged ? ' is-flagged' : ''}${x.resolved ? ' is-resolved' : ''}" onclick="rdNotesOpenDrawer('${esc(x.id)}')">
        <div class="rd-notes-card__top">
          <h3>${esc(x.title)}</h3>
          <span class="rd-notes-kind rd-notes-kind--${kindClass(x.kind)}">${esc(x.resolved ? 'Resolved' : x.kind)}</span>
        </div>
        <div class="rd-notes-card__pin">${esc(x.loose ? 'Loose · not pinned' : 'Pinned to · ' + x.pinnedTo)}</div>
        <div class="rd-notes-card__meta">
          <div><span>Written</span><strong>${esc(fmtShort(x.written))} · ${esc(x.author)}</strong></div>
          ${x.nextStep ? `<div><span>Next</span><strong>${esc(x.nextStep)}</strong></div>` : ''}
        </div>
        <div class="rd-notes-card__foot">${esc(x.resolved ? 'Resolved' : (x.flagged ? 'Needs a decision' : 'Open'))}</div>
      </article>`).join('')}</div>`;
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
        html += `<li class="rd-notes-tl" onclick="rdNotesOpenDrawer('${esc(x.id)}')">
          <span class="rd-notes-tl__when">${esc(when)}</span>
          <div class="rd-notes-tl__body">
            <strong>${esc(x.title)}</strong>
            <em>${esc(x.author)} · ${esc(x.loose ? 'loose' : x.pinnedTo)}</em>
          </div>
          <span class="rd-notes-kind rd-notes-kind--${kindClass(x.kind)}">${esc(x.resolved ? 'Resolved' : x.kind)}</span>
          <span class="rd-notes-tl__status">${esc(x.resolved ? 'Resolved' : (x.flagged ? 'Open' : 'Note'))}</span>
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
    const tab = window._notesDrawerTab || 0;
    let body = '';
    if (tab === 0) {
      body = `<div class="rd-drawer__note-body">${esc(x.body || x.excerpt || 'No body yet.')}</div>`
        + field('Author', x.author)
        + field('Written', fmtLong(x.written))
        + field('Flagged', x.flagged ? 'Yes · needs a decision' : 'No')
        + (x.nextStep ? field('Next step', x.nextStep) : '');
    } else if (tab === 1) {
      body = field('Record', x.loose
        ? '— · loose'
        : `<button type="button" class="rd-drawer__link" onclick="rdNotesOpenPin('${esc(x.subject)}')">${esc(x.pinnedTo)} →</button>`)
        + (x.alsoShowsOn ? field('Also shows on', x.alsoShowsOn) : '')
        + `<p class="rd-drawer__note">A pinned note appears in that record&rsquo;s drawer. Deleting the record keeps the note and marks it loose — ${notesFigures().loose} notes are loose today.</p>`;
    } else if (tab === 2) {
      body = `<div class="rd-drawer__guest"><strong>Mary O. · planner</strong><span>Can read and reply</span></div>`
        + `<div class="rd-drawer__guest"><strong>Kwesi</strong><span>Can read and reply</span></div>`
        + `<div class="rd-drawer__guest"><strong>Vendors</strong><span>Never</span></div>`
        + `<p class="rd-drawer__note">A note is never in a share packet, whatever sections you pick.</p>`
        + (x.replies.length ? `<div class="rd-drawer__section-title">Replies · ${x.replies.length}</div>` +
          x.replies.map(r => `<div class="rd-drawer__hist"><strong>${esc(r.author || 'Mary O.')}</strong> · ${esc(r.when || '')}<br>${esc(r.text || '')}</div>`).join('')
          : `<div class="rd-drawer__section-title">Replies · 0</div><p class="rd-drawer__note">No replies yet.</p>`);
    } else {
      body = `<div class="rd-drawer__hist">${esc(fmtShort(x.written))} · Written by ${esc(x.author)}</div>`
        + (x.flagged ? `<div class="rd-drawer__hist">Flagged · needs a decision</div>` : '')
        + `<p class="rd-drawer__note">A note is the only record whose history is mostly conversation.</p>`;
    }
    const crumb = 'Note · ' + (x.loose ? 'loose' : x.subject.toLowerCase());
    const chips = (x.flagged ? '<span class="rd-notes-flag">Flagged</span> ' : '') + esc(x.author + ' · ' + fmtShort(x.written));
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
        <button type="button" class="rd-btn rd-btn--primary" onclick="rdNotesFullEditor('${esc(x.id)}')">Full editor</button>
      </div>
    </aside>`;
    slot.classList.add('is-open');
  }

  function field(label, valueHtml) {
    return `<div class="rd-drawer__field"><span>${esc(label)}</span><strong>${valueHtml}</strong></div>`;
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
  function rdNotesCycleFilter(field) {
    const options = { all: true };
    allNotes().forEach(x => {
      if (field === 'subject') options[x.subject] = true;
      if (field === 'author') options[x.author] = true;
      if (field === 'kind') options[x.kind] = true;
      if (field === 'pinnedTo' && !x.loose) options[x.pinnedTo] = true;
      if (field === 'period') options[periodKey(x.written)] = true;
      if (field === 'flag') { options.Flagged = true; options.Clear = true; }
    });
    const list = Object.keys(options);
    const cur = (window._notesUiFilters || {})[field] || 'all';
    const i = list.indexOf(cur);
    window._notesUiFilters[field] = list[(i + 1) % list.length];
    renderNotesRd();
  }
  function rdNotesClearFilter(field) {
    window._notesUiFilters[field] = 'all';
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
      if (typeof covAlert === 'function') covAlert('Notes can be shared with your planner — they are never included in a vendor share packet.');
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
    ensureNotes();
    if (typeof addNotesDetailRow === 'function') {
      try { addNotesDetailRow(); } catch (e) { /* fall through */ }
    }
    ensureNotes();
    const row = data.notesDetails[data.notesDetails.length - 1];
    if (!row || (row.title && row.title !== 'Untitled Note' && row.note)) {
      const fresh = {
        title: 'New note',
        category: 'Planning',
        tags: '',
        pinned: false,
        flagged: false,
        author: 'Ama',
        date: typeof notesToday === 'function' ? notesToday() : new Date().toISOString().slice(0, 10),
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
    window._notesSearch = typeof covPrompt === 'function'
      ? '' : '';
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
    ensureNotes();
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
  window.rdNotesCycleFilter = rdNotesCycleFilter;
  window.rdNotesClearFilter = rdNotesClearFilter;
  window.rdNotesToggleOpenOnly = rdNotesToggleOpenOnly;
  window.rdNotesToggleUnresolved = rdNotesToggleUnresolved;

  /* Override legacy renderer — keep name renderNotesPage for all call sites */
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
