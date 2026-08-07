/* Wedding Day Timeline — redesign shell (Phase 2 · timeline-vertical / timeline-details).
   Vertical | Details are two renderings of one event set — a view switcher, not tabs of
   different data. Rail residual: Needs an owner. Meters: Events / First / Last / Unowned. */
(function () {
  'use strict';

  window._wdayMode = window._wdayMode || 'vertical';
  window._wdayRailView = window._wdayRailView || 'all';
  window._wdayUiFilters = window._wdayUiFilters || { block: 'all', owner: 'all', vendor: 'all' };
  window._wdayRowHeight = window._wdayRowHeight || 'compact';

  const esc = s => (typeof escapeHtml === 'function' ? escapeHtml(s == null ? '' : String(s)) : String(s == null ? '' : s));

  function rows() {
    if (typeof wdayTimelineRows === 'function') return wdayTimelineRows();
    return typeof safeArray === 'function' ? safeArray(data.timeline) : (data.timeline || []);
  }

  function eventOwner(r) {
    return String((r && (r.responsible || r.owner || '')) || '').trim();
  }
  function isUnowned(r) {
    return !eventOwner(r);
  }
  function eventBlock(r) {
    const mins = typeof timelineMinutes === 'function' ? timelineMinutes(r && r.time) : null;
    if (mins == null) {
      const hay = String((r && r.event) || '').toLowerCase();
      if (/ceremon|process|vow|ring|recess/.test(hay)) return 'ceremony';
      if (/reception|dance|dinner|toast|cake|send/.test(hay)) return 'evening';
      return 'morning';
    }
    if (mins < 12 * 60) return 'morning';
    if (mins < 17 * 60) return 'ceremony';
    return 'evening';
  }
  function fmtTime(t) {
    return typeof formatTimelineTime === 'function' ? formatTimelineTime(t) : (t || '—');
  }

  function timelineFigures() {
    const list = rows();
    const timed = list.filter(r => String(r.time || '').trim()).sort((a, b) =>
      String(a.time || '').localeCompare(String(b.time || '')));
    const unowned = list.filter(isUnowned);
    return {
      count: list.length,
      morning: list.filter(r => eventBlock(r) === 'morning').length,
      ceremony: list.filter(r => eventBlock(r) === 'ceremony').length,
      evening: list.filter(r => eventBlock(r) === 'evening').length,
      unowned: unowned.length,
      first: timed.length ? fmtTime(timed[0].time) : '—',
      last: timed.length ? fmtTime(timed[timed.length - 1].time) : '—'
    };
  }

  function timelineRailCounts() {
    const f = timelineFigures();
    return {
      all: f.count,
      morning: f.morning,
      ceremony: f.ceremony,
      evening: f.evening,
      unowned: f.unowned
    };
  }

  function matchesRail(r, view) {
    view = view || window._wdayRailView || 'all';
    if (view === 'all') return true;
    if (view === 'morning' || view === 'ceremony' || view === 'evening') return eventBlock(r) === view;
    if (view === 'unowned') return isUnowned(r);
    return true;
  }

  function matchesFilters(r) {
    if (!matchesRail(r)) return false;
    const ui = window._wdayUiFilters || {};
    if (ui.block && ui.block !== 'all' && eventBlock(r) !== ui.block) return false;
    if (ui.owner && ui.owner !== 'all') {
      if (ui.owner === '__none__') { if (!isUnowned(r)) return false; }
      else if (eventOwner(r) !== ui.owner) return false;
    }
    if (ui.vendor && ui.vendor !== 'all') {
      const hay = [r.responsible, r.event, r.notes, r.location].join(' ').toLowerCase();
      if (hay.indexOf(String(ui.vendor).toLowerCase()) < 0) return false;
    }
    return true;
  }

  function pageheadActionsHtml() {
    const svg = 'viewBox="0 0 24 24" aria-hidden="true" style="width:14px;height:14px;fill:none;stroke:currentColor;stroke-width:1.7;stroke-linecap:round;stroke-linejoin:round"';
    return `<button type="button" class="rd-btn" onclick="typeof emailDaySchedule==='function'?emailDaySchedule():openWdayTimelinePrint()">Send to coordinator</button>
      <button type="button" class="rd-btn" onclick="typeof openWdayTimelinePrint==='function'?openWdayTimelinePrint():printCurrentPage()"><svg ${svg}><path d="M6 9V4h12v5"/><rect x="4" y="9" width="16" height="7" rx="1"/><path d="M7 16h10v4H7z"/></svg>Print section</button>
      <button type="button" class="rd-btn" onclick="exportSectionCSV('Wedding Day',typeof wdayTimelineRows==='function'?wdayTimelineRows():data.timeline)">Export CSV</button>
      <button type="button" class="rd-btn rd-btn--primary" onclick="typeof addWdayRow==='function'?addWdayRow():addTimelineRow()">+ Add event</button>`;
  }

  function uedTimelineShellRd() {
    const panel = document.getElementById('panel-timeline');
    if (!panel) return;
    panel.classList.add('ued-scope', 'wday-mockup');
    if (panel.dataset.uedShell === 'timeline-rd6b') {
      const actions = panel.querySelector('.rd-pagehead__actions');
      if (actions) actions.innerHTML = pageheadActionsHtml();
      return;
    }
    panel.dataset.uedShell = 'timeline-rd6b';
    panel.innerHTML = `<div class="rd-page">
      <div class="rd-pagehead">
        <div>
          <div class="rd-pagehead__eyebrow">The Day</div>
          <div class="rd-pagehead__title-row">
            <h1 class="rd-pagehead__title">Wedding Day Timeline</h1>
          </div>
        </div>
        <div class="rd-pagehead__actions">${pageheadActionsHtml()}</div>
      </div>
      <div class="rd-stats m-stats" id="wday-stats"></div>
      <div class="rd-toolbar" id="wday-toolbar"></div>
      <div class="rd-bulkbar" id="wday-bulk-bar" hidden></div>
      <div class="rd-surface">
        <div class="rd-view" id="wday-view-vertical" data-wday-view="vertical">
          <div class="wday-vertical" id="wday-vertical"></div>
          <div class="rd-section__head">
            <div class="rd-pagehead__eyebrow">Key moments</div>
            <p class="rd-help">What the photographer and the MC both need.</p>
          </div>
          <div class="rd-grid-3" id="wday-key-moments"></div>
        </div>
        <div class="rd-view" id="wday-view-details" data-wday-view="details" hidden>
          <div class="rd-table-wrap ued-table-wrap" id="cwp-wdayTimeline"></div>
          <span class="rd-table-foot ued-soft" id="wday-hub-preview-foot"></span>
          <section class="rd-panel m-block">
            <div class="rd-panel__head m-head">Note for the coordinator</div>
            <textarea id="wday-coordinator-note" class="wday-note-box" oninput="saveTimelineMeta('coordinatorNote', this.value)" style="width:100%;min-height:120px;border:1px solid var(--hairline, #e7e1d4);background:transparent;padding:.6rem;font-size:13px"></textarea>
          </section>
          <section class="rd-panel m-block">
            <div class="rd-panel__head m-head">Day-of contacts</div>
            <div id="wday-contact-list" class="wday-contact-list"></div>
          </section>
        </div>
      </div>
    </div>`;
  }

  function renderWdayStatsRd() {
    const host = document.getElementById('wday-stats');
    if (!host) return;
    const f = timelineFigures();
    if (typeof RdDepth !== 'undefined' && RdDepth.renderStats) {
      RdDepth.renderStats(host, [
        { label: 'Events', value: String(f.count), filter: 'Show all', onFilter: () => applyTimelineRailView('all') },
        { label: 'First', value: f.first, filter: 'Morning' },
        { label: 'Last', value: f.last, filter: 'Evening' },
        {
          label: 'Unowned',
          value: String(f.unowned),
          filter: 'Needs an owner',
          attention: f.unowned ? 'Events still need an owner' : undefined,
          onFilter: () => applyTimelineRailView('unowned')
        }
      ]);
      return;
    }
    const cell = (label, val, tone) =>
      `<div class="m-stat${tone ? ' m-stat--' + tone : ''}"><div class="m-stat-label">${esc(label)}</div><div class="m-stat-val">${val}</div></div>`;
    host.innerHTML = [
      cell('Events', String(f.count)),
      cell('First', f.first),
      cell('Last', f.last),
      cell('Unowned', String(f.unowned), f.unowned ? 'warn' : '')
    ].join('');
  }

  function filterChip(label, field) {
    const ui = window._wdayUiFilters || {};
    const cur = ui[field];
    const on = cur && cur !== 'all';
    const display = cur === '__none__' ? 'Unowned' : cur;
    const chev = '<svg viewBox="0 0 24 24" aria-hidden="true" style="width:1em;height:1em;fill:none;stroke:currentColor;stroke-width:2.2;stroke-linecap:round"><path d="m6 9 6 6 6-6"/></svg>';
    return `<button type="button" class="rd-chip${on ? ' is-active' : ''}" onclick="rdWdayOpenFilter('${field}',this)">${esc(on ? label + ': ' + display : label + ': all')}`
      + (on ? `<span class="rd-chip__clear" onclick="event.stopPropagation();rdWdayClearFilter('${field}')">&#10005;</span>` : chev)
      + '</button>';
  }

  function renderWdayToolbar() {
    const host = document.getElementById('wday-toolbar');
    if (!host) return;
    const mode = window._wdayMode || 'vertical';
    const svg = 'viewBox="0 0 24 24" aria-hidden="true" style="width:1em;height:1em;fill:none;stroke:currentColor;stroke-width:1.7;stroke-linecap:round;stroke-linejoin:round"';
    const tableCtrls = mode === 'details'
      ? `<button type="button" class="rd-chip" onclick="rdWdayAutoFit(this)"><svg ${svg}><path d="M3 5v14M21 5v14"/><path d="M7 12h10"/><path d="M10 9l-3 3 3 3M14 9l3 3-3 3"/></svg>Auto-fit columns</button>
         <button type="button" class="rd-chip" onclick="rdWdayCycleRowHeight()"><svg ${svg}><path d="M4 6h16M4 12h16M4 18h16"/></svg>Row height · ${esc(window._wdayRowHeight || 'compact')}<svg ${svg}><path d="m6 9 6 6 6-6"/></svg></button>`
      : '';
    host.innerHTML =
      filterChip('Block', 'block') +
      filterChip('Owner', 'owner') +
      filterChip('Vendor', 'vendor') +
      `<div class="rd-toolbar__right">${tableCtrls}
        <div class="rd-viewswitch" role="group" aria-label="Timeline view">
          <button type="button" class="rd-viewswitch__item${mode === 'vertical' ? ' is-active' : ''}" onclick="rdSetTimelineView('vertical')">Vertical</button>
          <button type="button" class="rd-viewswitch__item${mode === 'details' ? ' is-active' : ''}" onclick="rdSetTimelineView('details')">Details</button>
        </div>
      </div>`;
  }

  function renderWdayBulkBar() {
    const bar = document.getElementById('wday-bulk-bar');
    if (!bar) return;
    if ((window._wdayMode || 'vertical') !== 'details') {
      bar.hidden = true;
      bar.innerHTML = '';
      return;
    }
    const ids = typeof cwpSelectedIds === 'function' ? cwpSelectedIds('wdayTimeline') : [];
    const n = ids.length;
    if (!n) { bar.hidden = true; bar.innerHTML = ''; return; }
    bar.hidden = false;
    bar.innerHTML = `<span class="rd-bulkbar__count"><span data-bulk-count>${n}</span> selected</span>
      <span class="rd-bulkbar__sep"></span>
      <button type="button" class="rd-bulkbar__action" onclick="rdWdayBulkOwner()">Set owner</button>
      <button type="button" class="rd-bulkbar__action" onclick="typeof openWdayTimelinePrint==='function'&&openWdayTimelinePrint()">Print run sheet</button>
      <button type="button" class="rd-bulkbar__clear" onclick="typeof cwpClearSelection==='function'&&cwpClearSelection('wdayTimeline');renderTimeline();">Clear selection</button>`;
  }

  function applyViewMode() {
    const mode = window._wdayMode || 'vertical';
    const panel = document.getElementById('panel-timeline');
    if (panel) panel.dataset.activeTab = mode;
    const vert = document.getElementById('wday-view-vertical');
    const det = document.getElementById('wday-view-details');
    if (vert) vert.hidden = mode !== 'vertical';
    if (det) det.hidden = mode !== 'details';
  }

  function renderVerticalRd() {
    const wrap = document.getElementById('wday-vertical');
    if (!wrap) return;
    const list = rows().filter(matchesFilters);
    if (!list.length) {
      if (typeof RdStates !== 'undefined' && RdStates.applyOverlay) {
        RdStates.applyOverlay(wrap, {
          page: 'timeline',
          total: rows().length,
          filtered: 0,
          filterOn: rows().length > 0,
          addLabel: '+ Add event',
          onAdd: () => { if (typeof addTimelineRow === 'function') addTimelineRow(); }
        });
      } else {
        wrap.innerHTML = '<div class="empty-state">Add events on the Details view to build your timeline.</div>';
      }
      return;
    }
    wrap.classList.remove('has-rd-state');
    const owned = list.filter(r => !isUnowned(r));
    const residual = list.filter(isUnowned);
    const ordered = owned.concat(residual);
    wrap.innerHTML = ordered.map(e => {
      const danger = isUnowned(e) ? ' is-unowned' : '';
      const owner = eventOwner(e) || 'Needs an owner';
      return `<div class="m-tl-item${danger}"${e._source === 'timeline' && e._index != null ? ` onclick="typeof openRecordEditor==='function'&&openRecordEditor('timeline',${e._index})"` : ''}>
        <div class="m-tl-time">${esc(fmtTime(e.time))}</div>
        <div class="m-tl-rail"><span class="m-tl-dot"></span></div>
        <div class="m-tl-body">
          <div class="m-tl-event">${esc(e.event || 'Event')}</div>
          <div class="m-tl-meta">${[e.location, owner, e.duration].filter(Boolean).map(esc).join(' · ')}</div>
        </div>
      </div>`;
    }).join('');
    if (residual.length) {
      wrap.insertAdjacentHTML('beforeend',
        `<div class="rd-grouplist__group is-danger" style="margin-top:1rem;padding:.5rem 0;color:var(--danger,#8b3a3a);font-size:12px;font-weight:600;letter-spacing:.08em;text-transform:uppercase">Needs an owner · ${residual.length}</div>`);
    }
  }

  function paintKeyMomentsAndContacts() {
    const keyBox = document.getElementById('wday-key-moments');
    const contacts = document.getElementById('wday-contact-list');
    const note = document.getElementById('wday-coordinator-note');
    const list = rows();
    if (keyBox) {
      keyBox.innerHTML = list.slice(0, 6).map(row =>
        `<div class="wday-key-row"><time>${esc(fmtTime(row.time))}</time><span>${esc(row.event || 'Timeline Event')}</span></div>`
      ).join('') || '<p class="rd-help">Add key moments in the Details view.</p>';
    }
    if (contacts) {
      const source = (data.vendors || []).filter(v => v.phone || v.contact).slice(0, 5);
      contacts.innerHTML = source.map(v =>
        `<div class="wday-contact-row"><span class="wday-contact-role">${esc(v.cat || 'Vendor')}</span><span class="wday-contact-name">${esc(v.contact || v.name || '')}</span><span class="wday-contact-phone">${esc(v.phone || '')}</span></div>`
      ).join('') || '<p class="rd-help">Add vendor contacts on the Vendors page.</p>';
    }
    if (note && typeof timelineMeta === 'function') {
      note.value = timelineMeta().coordinatorNote || '';
    }
  }

  function rdEnsureTimelineTableLayout(forRedesign) {
    const d = (typeof CWP !== 'undefined' && CWP.TABLES) ? CWP.TABLES.wdayTimeline : null;
    if (!d) return;
    if (!d._rdBackup) {
      d._rdBackup = { extraFilter: d.extraFilter, hideToolbar: d.hideToolbar, afterRender: d.afterRender };
    }
    if (!forRedesign) {
      if (d._rdActive) { Object.assign(d, d._rdBackup); d._rdActive = false; }
      return;
    }
    d.extraFilter = r => matchesFilters(r);
    d.hideToolbar = true;
    d._rdActive = true;
    d.afterRender = () => {
      const wrap = document.getElementById('cwp-wdayTimeline');
      if (wrap && typeof RdStates !== 'undefined' && RdStates.applyOverlay) {
        RdStates.applyOverlay(wrap, {
          page: 'timeline',
          total: rows().length,
          filtered: rows().filter(matchesFilters).length,
          filterOn: (window._wdayRailView && window._wdayRailView !== 'all')
            || Object.values(window._wdayUiFilters || {}).some(v => v && v !== 'all'),
          addLabel: '+ Add event',
          onAdd: () => { if (typeof addTimelineRow === 'function') addTimelineRow(); }
        });
      }
    };
  }

  function rdSetTimelineView(mode) {
    window._wdayMode = mode === 'details' ? 'details' : 'vertical';
    /* Keep legacy tab helper in sync for any callers */
    try { if (typeof wdayTab === 'function') { /* visual only */ } } catch (e) { /* ignore */ }
    window._wdayTab = window._wdayMode;
    renderTimelineRd();
  }

  function applyTimelineRailView(view) {
    window._wdayRailView = view || 'all';
    if (typeof setSavedView === 'function') setSavedView('timeline', window._wdayRailView);
    renderTimelineRd();
    if (typeof renderContextSidebar === 'function') renderContextSidebar('timeline');
  }

  function rdWdayOpenFilter(field, btn) {
    const list = rows();
    let opts = [{ value: 'all', label: 'All' }];
    if (field === 'block') {
      opts = opts.concat([
        { value: 'morning', label: 'Morning' },
        { value: 'ceremony', label: 'Ceremony' },
        { value: 'evening', label: 'Evening' }
      ]);
    } else if (field === 'owner') {
      const names = Array.from(new Set(list.map(eventOwner).filter(Boolean))).sort();
      opts = opts.concat([{ value: '__none__', label: 'Unowned' }]).concat(names.map(n => ({ value: n, label: n })));
    } else {
      const names = Array.from(new Set((data.vendors || []).map(v => v.name).filter(Boolean))).sort();
      opts = opts.concat(names.map(n => ({ value: n, label: n })));
    }
    const apply = val => {
      window._wdayUiFilters[field] = val || 'all';
      renderTimelineRd();
    };
    if (typeof rdOpenPicker === 'function') {
      rdOpenPicker(btn, opts, window._wdayUiFilters[field] || 'all', apply);
      return;
    }
    apply(opts[1] ? opts[1].value : 'all');
  }
  function rdWdayClearFilter(field) {
    window._wdayUiFilters[field] = 'all';
    renderTimelineRd();
  }
  function rdWdayAutoFit(btn) {
    if (typeof rdAutoFitTable === 'function') rdAutoFitTable(document.getElementById('cwp-wdayTimeline'), btn);
    else if (typeof autoFitColumns === 'function') autoFitColumns(btn);
  }
  function rdWdayCycleRowHeight() {
    const order = ['compact', 'default', 'tall'];
    const i = order.indexOf(window._wdayRowHeight || 'compact');
    window._wdayRowHeight = order[(i < 0 ? 0 : i + 1) % order.length];
    renderTimelineRd();
  }
  function rdWdayBulkOwner() {
    const next = window.prompt('Set owner to:', '');
    if (!next) return;
    const ids = typeof cwpSelectedIds === 'function' ? cwpSelectedIds('wdayTimeline') : [];
    (data.timeline || []).forEach(r => {
      if (ids.indexOf(String(r._id)) >= 0) r.responsible = next;
    });
    if (typeof save === 'function') save();
    renderTimelineRd();
  }

  function renderTimelineRd() {
    uedTimelineShellRd();
    if (typeof renderPageUxChrome === 'function') renderPageUxChrome('timeline');
    applyViewMode();
    renderWdayStatsRd();
    renderWdayToolbar();
    renderWdayBulkBar();

    const mode = window._wdayMode || 'vertical';
    if (mode === 'vertical') {
      renderVerticalRd();
      paintKeyMomentsAndContacts();
    } else {
      rdEnsureTimelineTableLayout(true);
      if (typeof cwpRenderTable === 'function') cwpRenderTable('wdayTimeline');
      paintKeyMomentsAndContacts();
      const foot = document.getElementById('wday-hub-preview-foot');
      if (foot) foot.textContent = 'Two renderings of one set of events — reading and editing. That is a view switcher.';
    }

    if (typeof renderContextSidebar === 'function'
      && document.body.getAttribute('data-active-panel') === 'timeline'
      && document.body.classList.contains('context-sidebar-mode')) {
      renderContextSidebar('timeline');
    }
    if (typeof uxRevealPanel === 'function') uxRevealPanel('timeline');
  }

  /* Aliases used by mock shells */
  if (typeof window.addWdayRow !== 'function') {
    window.addWdayRow = function () {
      if (typeof addTimelineRow === 'function') addTimelineRow();
      else if (typeof openRecordEditor === 'function') openRecordEditor('timeline');
    };
  }
  if (typeof window.emailDaySchedule !== 'function') {
    window.emailDaySchedule = function () {
      if (typeof openWdayTimelinePrint === 'function') openWdayTimelinePrint();
      else if (typeof printCurrentPage === 'function') printCurrentPage();
    };
  }

  /* Bridge legacy wdayTab → view switcher */
  window.wdayTab = function (name) {
    rdSetTimelineView(name === 'details' ? 'details' : 'vertical');
  };

  window.renderTimeline = renderTimelineRd;
  window.renderWdayVertical = renderVerticalRd;
  window.rdSetTimelineView = rdSetTimelineView;
  window.applyTimelineRailView = applyTimelineRailView;
  window.timelineRailCounts = timelineRailCounts;
  window.timelineFigures = timelineFigures;
  window.rdWdayOpenFilter = rdWdayOpenFilter;
  window.rdWdayClearFilter = rdWdayClearFilter;
  window.rdWdayAutoFit = rdWdayAutoFit;
  window.rdWdayCycleRowHeight = rdWdayCycleRowHeight;
  window.rdWdayBulkOwner = rdWdayBulkOwner;

  function hookTimelinePanelRenderer() {
    if (window.SYSTEM_PANEL_RENDERERS) {
      window.SYSTEM_PANEL_RENDERERS.timeline = function () { renderTimelineRd(); };
    }
  }
  hookTimelinePanelRenderer();
  var _showPanelTimeline = window.showPanel;
  if (typeof _showPanelTimeline === 'function') {
    window.showPanel = function (id, forceOpen) {
      var out = _showPanelTimeline.call(window, id, forceOpen);
      hookTimelinePanelRenderer();
      return out;
    };
  }
})();
