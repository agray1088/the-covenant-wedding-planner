/* Vision & Foundation - All.dc #13a
   Views: Read | Edit | Print preview. Rail: vision | values | scriptures | promises | building. */
(function () {
  'use strict';

  window._visMode = window._visMode || 'read';
  window._visRailView = window._visRailView || 'vision';
  window._visDrawerId = window._visDrawerId || null;
  window._visDrawerTab = window._visDrawerTab || 0;

  const DRAWER_TABS = ['Section', 'Wording', 'Print', 'History'];
  const SECTION_ORDER = ['vision', 'values', 'scriptures', 'promises', 'building'];
  const SECTION_PRIMARY_KEY = {
    vision: 'marriageVision',
    values: 'priority1',
    scriptures: 'marriageVerseFull',
    promises: 'marriagePrayer',
    building: 'marriageFirst'
  };
  const SECTION_LINKS = {
    vision: ['Keepsake print · page 1'],
    values: ['Keepsake print · page 2', 'Premarital Counseling · session 4'],
    scriptures: ['Keepsake print · page 3', 'Ceremony & Reception · readings'],
    promises: ['Keepsake print · page 4'],
    building: ['Marriage Rhythms · monthly check-in']
  };

  const SECTION_KEYS = {
    vision: ['marriageVision', 'marriageFirst'],
    values: ['priority1', 'priority2', 'priority3', 'guestExperience', 'avoid'],
    scriptures: ['marriageVerseFull', 'marriageVerseReference', 'marriageVerseBrideMeaning', 'marriageVerseGroomMeaning'],
    promises: ['marriagePrayer', 'hisPrayerForHer', 'herPrayerForHim'],
    building: ['marriageFirst', 'avoid', 'guestExperience']
  };
  const SECTION_LABELS = {
    vision: 'Vision',
    values: 'Values',
    scriptures: 'Scriptures',
    promises: 'Promises',
    building: 'Building'
  };
  const FIELD_LABELS = {
    marriageVision: 'What does a Christ-centered marriage look like to us?',
    priority1: 'Priority #1 for our wedding day',
    priority2: 'Priority #2 for our wedding day',
    priority3: 'Priority #3 for our wedding day',
    guestExperience: 'What do we want guests to walk away feeling?',
    avoid: 'What do we want to avoid?',
    marriageFirst: 'How will we keep our marriage at the center?',
    marriagePrayer: 'A prayer over this marriage',
    hisPrayerForHer: 'His prayer for her',
    herPrayerForHim: 'Her prayer for him',
    marriageVerseFull: 'Verse written in full',
    marriageVerseReference: 'Scripture reference',
    marriageVerseBrideMeaning: 'What it means to the bride',
    marriageVerseGroomMeaning: 'What it means to the groom'
  };

  const esc = s => (typeof escapeHtml === 'function'
    ? escapeHtml(s == null ? '' : String(s))
    : String(s == null ? '' : s).replace(/[&<>"']/g, ch => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[ch])));

  function store() {
    if (typeof getCovenantPlannerData === 'function') return getCovenantPlannerData();
    try { if (typeof data !== 'undefined') return data; } catch (e) { /* lexical global */ }
    if (!window.data) window.data = {};
    return window.data;
  }
  function visionData() {
    const d = store();
    if (!d.vision || typeof d.vision !== 'object' || Array.isArray(d.vision)) d.vision = {};
    return d.vision;
  }
  function value(key) { return String(visionData()[key] || '').trim(); }
  function filled(key) { return value(key).length > 0; }
  function words(text) { return String(text || '').trim().split(/\s+/).filter(Boolean).length; }
  function saveVision(key, val) {
    const d = store();
    if (!d.vision || typeof d.vision !== 'object' || Array.isArray(d.vision)) d.vision = {};
    if (typeof rflSaveVision === 'function') rflSaveVision(key, val);
    else {
      d.vision[key] = val;
      if (typeof save === 'function') save();
    }
  }
  function fmtUpdated() {
    const d = store();
    const raw = d.updatedAt || (d.vision && d.vision.updatedAt) || '';
    if (!raw) return 'This session';
    const date = new Date(raw);
    if (Number.isNaN(date.getTime())) return String(raw);
    return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
  }

  function visFigures() {
    const v = visionData();
    const allKeys = Object.keys(FIELD_LABELS);
    const sections = Object.keys(SECTION_KEYS).reduce((out, id) => {
      const keys = SECTION_KEYS[id];
      out[id] = keys.some(filled) ? 1 : 0;
      return out;
    }, {});
    const completed = Object.values(sections).reduce((s, n) => s + n, 0);
    const text = allKeys.map(k => v[k] || '').join(' ');
    return {
      sectionsComplete: completed,
      sectionsTotal: Object.keys(SECTION_KEYS).length,
      words: words(text),
      lastWritten: fmtUpdated(),
      priorities: ['priority1', 'priority2', 'priority3'].filter(filled).length,
      verse: filled('marriageVerseFull') || filled('marriageVerseReference') ? 1 : 0,
      prayers: ['marriagePrayer', 'hisPrayerForHer', 'herPrayerForHim'].filter(filled).length,
      sectionStatus: sections
    };
  }
  function visRailCounts() {
    const f = visFigures();
    return {
      vision: f.sectionStatus.vision,
      values: f.priorities,
      scriptures: f.verse,
      promises: f.prayers,
      building: f.sectionStatus.building
    };
  }

  function pageheadActionsHtml() {
    return ''
      + '<button type="button" class="rd-btn" onclick="rdVisPrint()">Print keepsake</button>'
      + '<button type="button" class="rd-btn" onclick="rdVisExport()">Export</button>'
      + '<button type="button" class="rd-btn rd-btn--primary" onclick="rdVisAddValue()">+ Add a value</button>';
  }

  function ensureShell() {
    const panel = document.getElementById('panel-vision');
    if (!panel) return;
    panel.classList.add('ued-scope', 'vision-mockup');
    if (panel.dataset.uedShell === 'vision-rd13a') {
      const actions = panel.querySelector('.rd-pagehead__actions');
      if (actions) actions.innerHTML = pageheadActionsHtml();
      return;
    }
    panel.dataset.uedShell = 'vision-rd13a';
    panel.innerHTML = `<div class="rd-page">
      <div class="rd-pagehead">
        <div>
          <div class="rd-pagehead__eyebrow">Covenant</div>
          <div class="rd-pagehead__title-row"><h1 class="rd-pagehead__title">Vision &amp; Foundation</h1></div>
        </div>
        <div class="rd-pagehead__actions">${pageheadActionsHtml()}</div>
      </div>
      <div class="rd-stats m-stats" id="vision-stats" aria-label="Vision summary"></div>
      <div class="rd-toolbar" id="vision-toolbar"></div>
      <div class="rd-surface">
        <div class="rd-surface__row">
          <div class="rd-surface__main" id="vision-view-host">
            <div class="rd-view" id="vis-view-read"></div>
            <div class="rd-view" id="vis-view-edit" hidden></div>
            <div class="rd-view" id="vis-view-print" hidden></div>
          </div>
          <div id="vision-drawer-slot"></div>
        </div>
      </div>
    </div>`;
    if (window.covenantShell && window.covenantShell.drawer) window.covenantShell.drawer();
  }

  function renderStats() {
    const host = document.getElementById('vision-stats');
    if (!host) return;
    const f = visFigures();
    const stats = [
      { label: 'Sections complete', value: f.sectionsComplete + ' of ' + f.sectionsTotal },
      { label: 'Words written', value: String(f.words) },
      { label: 'Values named', value: String(f.priorities) },
      { label: 'Last written', value: f.lastWritten }
    ];
    if (typeof RdDepth !== 'undefined' && RdDepth.renderStats) {
      RdDepth.renderStats(host, stats);
      return;
    }
    host.innerHTML = stats.map(s => `<div class="m-stat"><div class="m-stat-label">${esc(s.label)}</div><div class="m-stat-val">${esc(s.value)}</div></div>`).join('');
  }

  function renderToolbar() {
    const host = document.getElementById('vision-toolbar');
    if (!host) return;
    const mode = window._visMode || 'read';
    host.innerHTML = `<div class="rd-toolbar__left">
      <span class="rd-chip rd-chip--ghost">Keepsake foundation</span>
      <span class="rd-chip rd-chip--ghost">${esc(visFigures().sectionsComplete)} sections started</span>
      ${typeof rdSortChipHtml === 'function' ? rdSortChipHtml('Sort by section', "rdStdOpenSort(this,'vision')") : ''}
      ${typeof rdStandardRightHtml === 'function' ? rdStandardRightHtml('vision') : ''}
    </div>
    <div class="rd-toolbar__right">
      <div class="rd-viewswitch" role="group" aria-label="Vision view">
        <button type="button" class="rd-viewswitch__item${mode === 'read' ? ' is-active' : ''}" onclick="rdSetVisionView('read')">Read</button>
        <button type="button" class="rd-viewswitch__item${mode === 'edit' ? ' is-active' : ''}" onclick="rdSetVisionView('edit')">Edit</button>
        <button type="button" class="rd-viewswitch__item${mode === 'print' ? ' is-active' : ''}" onclick="rdSetVisionView('print')">Print preview</button>
      </div>
    </div>`;
  }

  function applyMode() {
    const mode = window._visMode || 'read';
    ['read', 'edit', 'print'].forEach(name => {
      const el = document.getElementById('vis-view-' + name);
      if (el) el.hidden = mode !== name;
    });
  }
  function rdSetVisionView(mode) {
    window._visMode = (mode === 'edit' || mode === 'print') ? mode : 'read';
    renderVisionRd();
  }
  function applyVisionRailView(viewId) {
    window._visRailView = SECTION_KEYS[viewId] ? viewId : 'vision';
    if (typeof setSavedView === 'function') setSavedView('vision', window._visRailView);
    if (window._visMode === 'print') window._visMode = 'read';
    renderVisionRd();
    setTimeout(() => {
      const el = document.getElementById('vis-section-' + window._visRailView);
      if (el) el.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }, 30);
  }

  function p(text, empty) {
    const t = String(text || '').trim();
    return t ? `<p>${esc(t).replace(/\n/g, '<br>')}</p>` : `<p class="rd-empty">${esc(empty || 'Still unwritten.')}</p>`;
  }
  function section(id, title, body, sub) {
    const active = window._visRailView === id ? ' is-active' : '';
    return `<section class="ued-table-card rd-vis-section${active}" id="vis-section-${esc(id)}">
      <div class="ued-table-head" onclick="rdVisOpenDrawer('${esc(id)}')" style="cursor:pointer">
        <div><div class="ued-kicker">${esc(sub || 'Foundation')}</div><div class="ued-table-title">${esc(title)}</div></div>
        <button type="button" class="rd-btn rd-btn--quiet" style="margin-left:auto" onclick="event.stopPropagation();rdVisOpenDrawer('${esc(id)}')">Open</button>
      </div>
      <div class="rd-vis-keepsake">${body}</div>
    </section>`;
  }

  function renderReadView() {
    const host = document.getElementById('vis-view-read');
    if (!host) return;
    const v = visionData();
    const priorities = ['priority1', 'priority2', 'priority3'].map((k, i) => {
      const txt = value(k);
      return `<div class="rd-vis-value"><span>${i + 1}</span><strong>${txt ? esc(txt) : 'Priority ' + (i + 1)}</strong></div>`;
    }).join('');
    const verse = value('marriageVerseFull')
      ? `<blockquote class="rd-vis-verse">${esc(value('marriageVerseFull')).replace(/\n/g, '<br>')}<cite>${esc(value('marriageVerseReference'))}</cite></blockquote>`
      : `<div class="rd-empty">Choose the verse that will anchor your marriage.</div>`;
    host.innerHTML =
      section('vision', 'Our marriage vision', p(v.marriageVision, 'Write the covenant vision you want to return to when planning gets loud.') + p(v.marriageFirst, 'Add how you will keep marriage first.'), 'Read') +
      section('values', 'Wedding-day values', `<div class="rd-vis-values">${priorities}</div><div class="rd-vis-two">${p(v.guestExperience, 'Guest experience is unwritten.')}${p(v.avoid, 'Boundaries are unwritten.')}</div>`, 'Priorities') +
      section('scriptures', 'Verse and meaning', verse + `<div class="rd-vis-two">${p(v.marriageVerseBrideMeaning, 'Bride meaning is unwritten.')}${p(v.marriageVerseGroomMeaning, 'Groom meaning is unwritten.')}</div>`, 'Scripture') +
      section('promises', 'Prayers as promises', `<div class="rd-vis-stack">${p(v.marriagePrayer, 'Write a prayer over the marriage.')}${p(v.hisPrayerForHer, 'His prayer for her is unwritten.')}${p(v.herPrayerForHim, 'Her prayer for him is unwritten.')}</div>`, 'Prayer') +
      section('building', 'What we are building', value('marriageFirst') || value('guestExperience') || value('avoid')
        ? `<div class="rd-vis-two">${p(v.marriageFirst, '')}${p(v.guestExperience || v.avoid, '')}</div>`
        : '<div class="rd-empty">This keepsake section will fill in as you name the rhythms, boundaries, and hospitality you are building.</div>', 'Next');
  }

  function inputField(key, textarea) {
    const val = esc(visionData()[key] || '');
    const label = esc(FIELD_LABELS[key] || key);
    if (textarea) {
      return `<label class="rd-vis-field"><span>${label}</span><textarea oninput="rdVisSave('${esc(key)}', this.value)">${val}</textarea></label>`;
    }
    return `<label class="rd-vis-field"><span>${label}</span><input type="text" value="${val}" oninput="rdVisSave('${esc(key)}', this.value)"></label>`;
  }

  function renderEditView() {
    const host = document.getElementById('vis-view-edit');
    if (!host) return;
    host.innerHTML = `<section class="ued-table-card rd-vis-form">
      <div class="ued-table-head"><div><div class="ued-kicker">Edit</div><div class="ued-table-title">Foundation fields</div></div></div>
      ${inputField('marriageVision', true)}
      <div class="rd-vis-grid">${inputField('priority1')}${inputField('priority2')}${inputField('priority3')}</div>
      ${inputField('guestExperience', true)}
      ${inputField('avoid', true)}
      ${inputField('marriageFirst', true)}
      ${inputField('marriagePrayer', true)}
      <div class="rd-vis-grid">${inputField('hisPrayerForHer', true)}${inputField('herPrayerForHim', true)}</div>
    </section>
    <section class="ued-table-card rd-vis-form" id="vis-section-scriptures">
      <div class="ued-table-head"><div><div class="ued-kicker">Verse</div><div class="ued-table-title">A verse for our marriage</div></div></div>
      ${inputField('marriageVerseFull', true)}
      ${inputField('marriageVerseReference')}
      <div class="rd-vis-grid">${inputField('marriageVerseBrideMeaning', true)}${inputField('marriageVerseGroomMeaning', true)}</div>
    </section>`;
  }

  function renderPrintView() {
    const host = document.getElementById('vis-view-print');
    if (!host) return;
    const sheets = typeof buildVisionFoundationPrintSheets === 'function' ? buildVisionFoundationPrintSheets() : '';
    host.innerHTML = `<section class="ued-table-card">
      <div class="ued-table-head"><div><div class="ued-kicker">Print preview</div><div class="ued-table-title">Keepsake sheets</div></div><button type="button" class="rd-btn rd-btn--primary" onclick="rdVisPrint()">Print keepsake</button></div>
      <div class="rd-print-inline">${sheets || '<div class="rd-empty">The Covenant print builder is not loaded yet.</div>'}</div>
    </section>`;
  }

  /* ── drawer (Section · Wording · Print · History) ────────────────────── */

  function parkSharedVisDrawerAway(slot) {
    const shared = document.getElementById('record-drawer');
    if (shared && slot && slot.contains(shared)) {
      const park = document.getElementById('layout') || document.body;
      park.appendChild(shared);
    }
  }
  function field(label, val, onclick) {
    const click = onclick ? ` class="rd-drawer__link" onclick="${onclick}"` : '';
    return `<div class="rd-drawer__field"><span>${esc(label)}</span><strong${click}>${esc(val)}</strong></div>`;
  }

  function renderVisDrawer() {
    const slot = document.getElementById('vision-drawer-slot');
    if (!slot) return;
    const shared = document.getElementById('record-drawer');
    if (shared && slot.contains(shared) && !shared.hasAttribute('hidden')) {
      slot.classList.add('is-open');
      return;
    }
    const id = window._visDrawerId;
    if (!id || SECTION_ORDER.indexOf(id) < 0) {
      if (!(shared && slot.contains(shared) && !shared.hasAttribute('hidden'))) {
        parkSharedVisDrawerAway(slot);
        slot.innerHTML = '';
        slot.classList.remove('is-open');
      }
      return;
    }
    parkSharedVisDrawerAway(slot);
    const tab = Math.max(0, Math.min(DRAWER_TABS.length - 1, parseInt(window._visDrawerTab, 10) || 0));
    const title = SECTION_LABELS[id] || id;
    const primaryKey = SECTION_PRIMARY_KEY[id];
    const prose = primaryKey ? value(primaryKey) : '';
    const position = SECTION_ORDER.indexOf(id) + 1;
    const links = SECTION_LINKS[id] || [];
    const printReady = !!prose;

    let body = '';
    if (tab === 0) {
      body =
        field('Section', title) +
        field('Position', position + ' of ' + SECTION_ORDER.length) +
        field('Written by', 'Both') +
        field('Last edited', fmtUpdated()) +
        `<div class="rd-drawer__section-title">Where this shows</div>` +
        (links.length
          ? links.map(l => field(l.split(' · ')[0], l.split(' · ').slice(1).join(' · '))).join('')
          : `<p class="rd-drawer__note">Not yet referenced elsewhere.</p>`) +
        `<p class="rd-drawer__note">This section is referenced by id — renaming it here updates every place it shows.</p>`;
    } else if (tab === 1) {
      body =
        `<div class="rd-vis-drawer__prose">${prose ? esc(prose).replace(/\n/g, '<br>') : '<em class="rd-empty">Nothing written yet.</em>'}</div>` +
        (primaryKey
          ? `<label class="rd-vis-field"><span>Edit wording</span><textarea class="rd-vis-drawer__textarea" oninput="rdVisSave('${esc(primaryKey)}', this.value)">${esc(prose)}</textarea></label>`
          : '') +
        `<p class="rd-drawer__note">The one tab in the planner where prose is the record rather than a note about one. It renders in Cormorant here because it will print in Cormorant.</p>`;
    } else if (tab === 2) {
      body =
        field('Print ready', printReady ? 'Yes' : 'Not yet — section is unwritten') +
        field('Class', 'B · keepsake') +
        field('Type', 'Cormorant 19pt') +
        field('Last printed', fmtUpdated()) +
        `<p class="rd-drawer__note">Print is a tab here and nowhere else, because for a Covenant record the printed page is the deliverable. Everything else prints as a by-product.</p>`;
    } else {
      body =
        `<div class="rd-drawer__section-title">This section</div>` +
        (prose
          ? `<div class="rd-drawer__hist"><strong>${esc(fmtUpdated())}</strong> · Both<div>Written</div></div>`
          : `<div class="rd-drawer__hist"><strong>—</strong> · Both<div>Still unwritten</div></div>`) +
        `<div class="rd-drawer__hist"><strong>—</strong> · Both<div>Added as section ${position} of ${SECTION_ORDER.length}</div></div>` +
        `<p class="rd-drawer__note">Printing is logged. A keepsake that has been printed and then edited is a keepsake whose paper copy is now wrong.</p>`;
    }

    slot.classList.add('is-open');
    slot.innerHTML =
      `<aside class="rd-drawer rd-vis-drawer" aria-label="Vision section">` +
      `<div class="rd-drawer__head">` +
      `<div class="rd-drawer__eyebrow">Section · ${esc(id)}</div>` +
      `<h2 class="rd-drawer__title">${esc(title)}</h2>` +
      `<div class="rd-drawer__chips">` +
      `<span class="status-pill" data-pillscheme="blue">Value ${String(position).padStart(2, '0')}</span>` +
      `<span class="status-pill" data-pillscheme="gray">Both</span>` +
      `</div>` +
      `<button type="button" class="rd-drawer__close" onclick="rdVisCloseDrawer()" aria-label="Close">×</button>` +
      `<div class="rd-drawer__tabs" role="tablist">` +
      DRAWER_TABS.map((label, i) =>
        `<button type="button" class="rd-drawer__tab${i === tab ? ' is-active' : ''}" onclick="rdVisSetDrawerTab(${i})">${esc(label)}</button>`
      ).join('') +
      `</div></div>` +
      `<div class="rd-drawer__body">${body}</div>` +
      `<div class="rd-drawer__foot">` +
      (tab === 2
        ? `<button type="button" class="rd-btn rd-btn--primary" onclick="rdVisPrint()">Print keepsake</button>`
        : `<button type="button" class="rd-btn" onclick="rdVisCloseDrawer()">Save</button>`) +
      `<button type="button" class="rd-btn" onclick="rdVisDrawerFullEditor()">Full editor</button>` +
      `</div></aside>`;
  }

  function rdVisOpenDrawer(id) {
    window._visDrawerId = SECTION_KEYS[id] ? id : 'vision';
    window._visDrawerTab = 0;
    renderVisDrawer();
  }
  function rdVisCloseDrawer() {
    window._visDrawerId = null;
    const slot = document.getElementById('vision-drawer-slot');
    if (slot) {
      parkSharedVisDrawerAway(slot);
      slot.innerHTML = '';
      slot.classList.remove('is-open');
    }
  }
  function rdVisSetDrawerTab(i) {
    window._visDrawerTab = i;
    renderVisDrawer();
  }
  function rdVisDrawerFullEditor() {
    rdSetVisionView('edit');
    rdVisCloseDrawer();
  }

  function rdVisSave(key, val) {
    saveVision(key, val);
    renderStats();
    if (window._visMode === 'read') renderReadView();
    if (window._visDrawerId) renderVisDrawer();
  }
  function rdVisPrint() {
    if (typeof openCovenantPrintTemplate === 'function' && typeof buildVisionFoundationPrintSheets === 'function') {
      openCovenantPrintTemplate(buildVisionFoundationPrintSheets());
    } else if (typeof tryCovenantPrintTemplate === 'function' && tryCovenantPrintTemplate('reflect')) {
      return;
    } else if (typeof printCurrentPage === 'function') printCurrentPage();
    else window.print();
  }
  function downloadText(name, mime, text) {
    const a = document.createElement('a');
    a.href = URL.createObjectURL(new Blob([text], { type: mime }));
    a.download = name;
    document.body.appendChild(a);
    a.click();
    setTimeout(() => { URL.revokeObjectURL(a.href); a.remove(); }, 0);
  }
  function rdVisExport() {
    downloadText('vision-foundation.json', 'application/json', JSON.stringify(visionData(), null, 2));
    if (typeof showToast === 'function') showToast('Vision exported.');
  }
  function rdVisAddValue() {
    const v = visionData();
    const key = !filled('priority1') ? 'priority1' : (!filled('priority2') ? 'priority2' : 'priority3');
    if (key === 'priority3' && filled('priority3')) {
      rdSetVisionView('edit');
      setTimeout(() => {
        const el = document.querySelector('#vis-view-edit input[oninput*="priority3"]');
        if (el) el.focus();
      }, 20);
      return;
    }
    v[key] = v[key] || '';
    rdSetVisionView('edit');
    setTimeout(() => {
      const el = document.querySelector('#vis-view-edit input[oninput*="' + key + '"]');
      if (el) el.focus();
    }, 20);
  }

  function renderVisionRd() {
    visionData();
    ensureShell();
    if (typeof renderPageUxChrome === 'function') renderPageUxChrome('vision');
    applyMode();
    renderStats();
    renderToolbar();
    renderReadView();
    renderEditView();
    renderPrintView();
    renderVisDrawer();
    if (typeof renderContextSidebar === 'function'
      && document.body.getAttribute('data-active-panel') === 'vision'
      && document.body.classList.contains('context-sidebar-mode')) {
      renderContextSidebar('vision');
    }
    if (typeof uxRevealPanel === 'function') uxRevealPanel('vision');
  }

  window.uedVisionShell = ensureShell;
  window.renderVisionPage = renderVisionRd;
  window.renderVisionRd = renderVisionRd;
  window.rdSetVisionView = rdSetVisionView;
  window.applyVisionRailView = applyVisionRailView;
  window.visRailCounts = visRailCounts;
  window.visFigures = visFigures;
  window.rdVisSave = rdVisSave;
  window.rdVisPrint = rdVisPrint;
  window.rdVisExport = rdVisExport;
  window.rdVisAddValue = rdVisAddValue;
  window.rdVisOpenDrawer = rdVisOpenDrawer;
  window.rdVisCloseDrawer = rdVisCloseDrawer;
  window.rdVisSetDrawerTab = rdVisSetDrawerTab;
  window.rdVisDrawerFullEditor = rdVisDrawerFullEditor;

  function hookVisionPanelRenderer() {
    if (window.SYSTEM_PANEL_RENDERERS) window.SYSTEM_PANEL_RENDERERS.vision = function () { renderVisionRd(); };
  }
  hookVisionPanelRenderer();
  var _showPanelVis = window.showPanel;
  if (typeof _showPanelVis === 'function') {
    window.showPanel = function (id, forceOpen) {
      var out = _showPanelVis.call(window, id, forceOpen);
      hookVisionPanelRenderer();
      return out;
    };
  }
})();
