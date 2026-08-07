/**
 * State library — CURSOR-IMPLEMENTATION-GUIDE batch 37
 * Four archetypes × four states + per-page empty copy deck from Views.
 */
(function (global) {
  'use strict';

  function esc(s) {
    return String(s == null ? '' : s)
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;');
  }

  /** Per-page empty copy from Views · State library · per-page empty copy */
  var EMPTY_COPY = {
    guests: {
      archetype: 'table',
      heading: 'No guests yet',
      body: 'The guest list is where almost everything else starts.',
      actions: [
        { label: 'Add your first guest', primary: true, action: 'add-guest' },
        { label: 'Import from a spreadsheet', action: 'import' }
      ]
    },
    households: {
      archetype: 'table',
      heading: 'No households yet',
      body: 'Households appear once guests have addresses.',
      actions: [{ label: 'Add addresses to guests', primary: true, page: 'guests' }]
    },
    contacts: {
      archetype: 'table',
      heading: 'No contacts yet',
      body: 'Guests and vendors with a number appear here.',
      actions: [{ label: 'Add a contact', primary: true, action: 'add' }]
    },
    party: {
      archetype: 'table',
      heading: 'Nobody in the party yet',
      body: 'Roles, attire and duties all hang off this list.',
      actions: [{ label: 'Add a member', primary: true, action: 'add-party' }]
    },
    tables: {
      archetype: 'canvas',
      heading: 'No tables placed yet',
      body: 'Start from the venue’s plan rather than blank.',
      actions: [{ label: 'Use the venue plan', primary: true, action: 'venue-plan' }]
    },
    gifts: {
      archetype: 'table',
      heading: 'No gifts received yet',
      body: 'Gifts and thank-yous are tracked as one record.',
      actions: [
        { label: 'Add a gift', primary: true, action: 'add-gift' },
        { label: 'Add registry', action: 'registry' }
      ]
    },
    budget: {
      archetype: 'table',
      heading: 'No budget lines yet',
      body: 'Set a target first, then add lines under it.',
      actions: [{ label: 'Set a target', primary: true, action: 'set-target' }]
    },
    payments: {
      archetype: 'table',
      heading: 'No instalments yet',
      body: 'Instalments come from contracts, not typed here.',
      actions: [{ label: 'Add a contract', primary: true, page: 'contracts' }]
    },
    contracts: {
      archetype: 'table',
      heading: 'No documents yet',
      body: 'Upload the venue contract first — most dates derive from it.',
      actions: [{ label: 'Upload a document', primary: true, action: 'upload' }]
    },
    vendors: {
      archetype: 'table',
      heading: 'No vendors yet',
      body: 'Shortlist before booking; passed vendors stay on record.',
      actions: [{ label: 'Add a vendor', primary: true, action: 'add' }]
    },
    catering: {
      archetype: 'table',
      heading: 'No menu yet',
      body: 'Dishes come from tastings, so book one first.',
      actions: [{ label: 'Add a tasting', primary: true, action: 'add' }]
    },
    entertainment: {
      archetype: 'table',
      heading: 'No acts booked',
      body: 'Acts carry call times and power draw.',
      actions: [{ label: 'Add a performer', primary: true, action: 'add' }]
    },
    shotlist: {
      archetype: 'table',
      heading: 'No shots listed',
      body: 'Shots need a window or they will not happen.',
      actions: [
        { label: 'Add a shot', primary: true, action: 'add' },
        { label: 'Use a template', action: 'template' }
      ]
    },
    appointments: {
      archetype: 'table',
      heading: 'No appointments booked',
      body: 'Travel allowance is set per appointment, not globally.',
      actions: [{ label: 'Book an appointment', primary: true, action: 'add' }]
    },
    timeline: {
      archetype: 'table',
      heading: 'No events yet',
      body: 'Durations are the input; times derive from them.',
      actions: [
        { label: 'Add an event', primary: true, action: 'add' },
        { label: 'Use a template', action: 'template' }
      ]
    },
    ceremony: {
      archetype: 'table',
      heading: 'No order of service yet',
      body: 'Elements carry durations and scripts.',
      actions: [{ label: 'Add an element', primary: true, action: 'add' }]
    },
    logistics: {
      archetype: 'table',
      heading: 'Nothing scheduled',
      body: 'Rooms, transport and arrivals live here.',
      actions: [{ label: 'Add a movement', primary: true, action: 'add' }]
    },
    tasks: {
      archetype: 'table',
      heading: 'No tasks yet',
      body: 'The timeline fills as you plan — start with what must happen first.',
      actions: [{ label: 'Add a task', primary: true, action: 'add-task' }]
    },
    notes: {
      archetype: 'table',
      heading: 'No notes yet',
      body: 'A note is pinned to a record and declares what it wants.',
      actions: [{ label: 'Write a note', primary: true, action: 'add' }]
    },
    packets: {
      archetype: 'table',
      heading: 'Nothing shared yet',
      body: 'A packet is a filtered projection, never a copy.',
      actions: [{ label: 'Build a packet', primary: true, action: 'add' }]
    },
    emails: {
      archetype: 'table',
      heading: 'No templates yet',
      body: 'Merge fields resolve against live records.',
      actions: [{ label: 'Use a standard template', primary: true, action: 'template' }]
    },
    prayer: {
      archetype: 'reference',
      heading: 'No entries yet',
      body: 'Answered entries are the ones that print.',
      actions: [{ label: 'Write an entry', primary: true, action: 'add' }]
    },
    counseling: {
      archetype: 'table',
      heading: 'No sessions yet',
      body: 'Completion derives from homework, not attendance.',
      actions: [{ label: 'Book a session', primary: true, action: 'add' }]
    },
    setup: {
      archetype: 'form',
      heading: 'Set the wedding up first',
      body: 'Six of thirteen fields change other pages.',
      actions: [{ label: 'Set date and names', primary: true, page: 'setup' }]
    },
    mood: {
      archetype: 'canvas',
      heading: 'Nothing on the board',
      body: 'Drop images or add a palette.',
      actions: [{ label: 'Add an image', primary: true, action: 'add' }]
    },
    essentials: {
      archetype: 'table',
      heading: 'Nothing packed yet',
      body: 'Items belong to a kit and a carrier.',
      actions: [{ label: 'Use the standard kits', primary: true, action: 'template' }]
    },
    history: {
      archetype: 'table',
      heading: 'No history yet',
      body: 'The log fills itself as you work.',
      actions: []
    }
  };

  var FILTER_EMPTY = {
    heading: 'Nothing matches this filter',
    body: 'Clear the filter to see every record again — emptiness here is a view, not a missing list.'
  };

  var LOADING = {
    heading: 'Loading…',
    body: 'Pulling the latest records for this page.'
  };

  var ERROR = {
    heading: 'This page could not load',
    body: 'Your data is still on this device. Try again, or open another page and come back.'
  };

  function copyFor(pageId) {
    return EMPTY_COPY[pageId] || {
      archetype: 'table',
      heading: 'Nothing here yet',
      body: 'Add the first record this page depends on.',
      actions: [{ label: 'Add a record', primary: true, action: 'add' }]
    };
  }

  function runAction(act) {
    if (!act) return;
    if (act.page && typeof global.showPanel === 'function') {
      global.showPanel(act.page, true);
      return;
    }
    if (typeof act.onClick === 'function') {
      act.onClick(act);
      return;
    }
    var a = act.action;
    if (a === 'add-guest' && typeof global.covInlineNew === 'function') {
      if (typeof global.showPanel === 'function') global.showPanel('guests', true);
      global.covInlineNew('guests', 'record-drawer-body');
      return;
    }
    if (a === 'add-party' && typeof global.covInlineNew === 'function') {
      if (typeof global.showPanel === 'function') global.showPanel('party', true);
      global.covInlineNew('party', 'record-drawer-body');
      return;
    }
    if (a === 'add-gift' && typeof global.covInlineNew === 'function') {
      if (typeof global.showPanel === 'function') global.showPanel('gifts', true);
      global.covInlineNew('gifts', 'record-drawer-body');
      return;
    }
    if (a === 'add-task' && typeof global.covInlineNew === 'function') {
      if (typeof global.showPanel === 'function') global.showPanel('tasks', true);
      global.covInlineNew('tasks', 'record-drawer-body');
      return;
    }
    if (a === 'import' && typeof global.openImportModal === 'function') {
      global.openImportModal();
      return;
    }
    if (typeof global.dispatchEvent === 'function') {
      global.dispatchEvent(new CustomEvent('rd-state-action', { detail: act }));
    }
  }

  /**
   * Render a state surface into host.
   * kind: 'empty' | 'filter' | 'loading' | 'error' | 'first-run'
   */
  function render(host, opts) {
    if (!host) return null;
    opts = opts || {};
    var kind = opts.kind || 'empty';
    var pageId = opts.pageId || host.getAttribute('data-rd-page') || '';
    var copy = opts.copy || (kind === 'empty' ? copyFor(pageId) : null);
    var heading = opts.heading;
    var body = opts.body;
    var actions = opts.actions;
    var archetype = (copy && copy.archetype) || opts.archetype || 'table';

    if (kind === 'filter') {
      heading = heading || FILTER_EMPTY.heading;
      body = body || FILTER_EMPTY.body;
      actions = actions || [{ label: 'Clear filter', primary: true, action: 'clear-filter', onClick: opts.onClear }];
    } else if (kind === 'loading') {
      heading = heading || LOADING.heading;
      body = body || LOADING.body;
      actions = actions || [];
    } else if (kind === 'error') {
      heading = heading || ERROR.heading;
      body = body || ERROR.body;
      actions = actions || [{ label: 'Try again', primary: true, onClick: opts.onRetry }];
    } else if (kind === 'first-run') {
      heading = heading || (copy && copy.heading) || 'Start here';
      body = body || (copy && copy.body) || '';
      actions = actions || (copy && copy.actions) || [];
    } else {
      heading = heading || (copy && copy.heading) || 'Nothing here yet';
      body = body || (copy && copy.body) || '';
      actions = actions || (copy && copy.actions) || [];
    }

    host.className = (host.className || '').replace(/\brd-state\b[^ ]*/g, '').trim();
    host.classList.add('rd-state', 'rd-state--' + kind, 'rd-state--' + archetype);
    host.setAttribute('data-rd-state', kind);
    host.setAttribute('role', kind === 'error' ? 'alert' : 'status');

    var actionsHtml = (actions || [])
      .map(function (act, i) {
        var cls = 'rd-btn' + (act.primary || i === 0 ? ' rd-btn--primary' : '');
        return (
          '<button type="button" class="' +
          cls +
          '" data-rd-state-act="' +
          i +
          '">' +
          esc(act.label) +
          '</button>'
        );
      })
      .join('');

    host.innerHTML =
      '<div class="rd-state__inner">' +
      (kind === 'loading' ? '<div class="rd-state__pulse" aria-hidden="true"></div>' : '') +
      '<div class="rd-state__heading">' +
      esc(heading) +
      '</div>' +
      '<div class="rd-state__body">' +
      esc(body) +
      '</div>' +
      (actionsHtml ? '<div class="rd-state__actions">' + actionsHtml + '</div>' : '') +
      '</div>';

    host.querySelectorAll('[data-rd-state-act]').forEach(function (btn) {
      btn.addEventListener('click', function () {
        var i = parseInt(btn.getAttribute('data-rd-state-act'), 10);
        runAction(actions[i]);
      });
    });
    return host;
  }

  function renderEmpty(host, pageId, overrides) {
    return render(host, Object.assign({ kind: 'empty', pageId: pageId }, overrides || {}));
  }

  function renderFilterEmpty(host, overrides) {
    return render(host, Object.assign({ kind: 'filter' }, overrides || {}));
  }

  function renderLoading(host, overrides) {
    return render(host, Object.assign({ kind: 'loading' }, overrides || {}));
  }

  function renderError(host, overrides) {
    return render(host, Object.assign({ kind: 'error' }, overrides || {}));
  }

  /**
   * If collection is empty, paint empty state into host and return true.
   * If a filter is active and filtered length is 0, paint filter-empty.
   */
  function maybeEmpty(host, opts) {
    opts = opts || {};
    var total = opts.total != null ? opts.total : 0;
    var filtered = opts.filtered != null ? opts.filtered : total;
    var filterOn = !!opts.filterOn;
    if (total === 0) {
      renderEmpty(host, opts.pageId, opts);
      return true;
    }
    if (filterOn && filtered === 0) {
      renderFilterEmpty(host, opts);
      return true;
    }
    return false;
  }

  global.RdStates = {
    EMPTY_COPY: EMPTY_COPY,
    copyFor: copyFor,
    render: render,
    renderEmpty: renderEmpty,
    renderFilterEmpty: renderFilterEmpty,
    renderLoading: renderLoading,
    renderError: renderError,
    maybeEmpty: maybeEmpty
  };
})(typeof window !== 'undefined' ? window : globalThis);
