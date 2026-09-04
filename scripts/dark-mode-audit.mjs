import puppeteer from 'puppeteer';
import fs from 'fs';
import path from 'path';

const BASE = 'http://127.0.0.1:8765';
const OUT = '/opt/cursor/artifacts/screenshots';
const REPORT = '/opt/cursor/artifacts/dark-mode-audit.json';
fs.mkdirSync(OUT, { recursive: true });

const LUMINANCE_THRESHOLD = 180;
const BROWN_FG_LUM_THRESHOLD = 115;
const DARK_BG_LUM_THRESHOLD = 100;

const PANELS = [
  'dashboard', 'guests', 'tasks', 'calendar', 'budget', 'payments', 'contracts',
  'vendors', 'catering', 'party', 'gifts', 'tables', 'setup', 'appointments',
  'logistics', 'notes', 'timeline', 'ceremony', 'prayer', 'counseling',
  'entertainment', 'essentials', 'mood', 'honeymoon', 'packets', 'emails',
  'shotlist', 'venue', 'contacts', 'households',
];

const INTERACTIVE_SELECTOR = [
  'button', 'a[href]', '[role="button"]', '[role="tab"]', '[role="menuitem"]',
  'tr', '.rd-dash-sec', '.spc-row', '.nav-item', '.rd-sectiontabs__item',
  '[class*="__row"]', '[class*="-row"]', '.rd-card', '.guide-ready-item',
  '.ued-list li', '.cwp-table tbody tr', '.rd-btn', '.rd-choose__item',
].join(', ');

const LABEL_TAB_SELECTOR = [
  '.m-stat-label', '.rd-stat__label', '.ued-stat-label', '.m-stat-sub', '.rd-stat__note',
  '.m-eyebrow', '.rd-pagehead__eyebrow', '.rd-drawer__eyebrow', '[class*="__eyebrow"]',
  '.ued-caption', '[class*="caption"]', '.setup-field-label', '.field-label',
  '.et-field-label', '.rd-field__label', '.rd-drawer__label', '.suggest-chips-label',
  '[class*="chip-label"]', '.rd-setup-menu-caption', '.pd-sec-head',
  '.rd-sectiontabs', '.rd-sectiontabs__item', '.rd-viewswitch', '.rd-viewswitch__item',
  '.rd-viewswitch > button', '.rd-seg', '.rd-seg__opt', '.rd-tabs', '.rd-tab',
  '.rd-subnav', '.rd-subnav__item', '.rd-drawer__tabs', '.rd-drawer__tabs > button',
  '.rd-pd-tabs', '.rd-pd-tab', '.rd-set__nav', '.rd-set__nav-item', '.rd-set__nav-grp',
  '.rd-sectiontabs__count',
].join(', ');

const HOVER_CAP_PER_PANEL = 120;
const LABEL_TAB_HOVER_CAP = 80;

function parseRgb(bg) {
  const m = bg.match(/rgba?\((\d+),\s*(\d+),\s*(\d+)/);
  if (!m) return null;
  return { r: +m[1], g: +m[2], b: +m[3], a: bg.includes('rgba') ? parseFloat(bg.split(',').pop()) : 1 };
}

function luminance(rgb) {
  return (rgb.r + rgb.g + rgb.b) / 3;
}

function isBrownOnDark(fgRgb, bgRgb) {
  if (!fgRgb) return false;
  const fgLum = luminance(fgRgb);
  if (fgLum >= BROWN_FG_LUM_THRESHOLD) return false;
  const bgLum = bgRgb && bgRgb.a >= 0.08 ? luminance(bgRgb) : 30;
  if (bgLum >= DARK_BG_LUM_THRESHOLD) return false;
  return fgRgb.r > 80 && fgRgb.g > 60 && fgRgb.b < 130;
}

async function wait(ms) {
  return new Promise((r) => setTimeout(r, ms));
}

async function dismissChrome(page) {
  await page.evaluate(() => {
    if (typeof ensureOnboardData === 'function') {
      ensureOnboardData().wizardSeen = true;
      if (typeof save === 'function') save();
    }
    if (typeof closeSetupWizard === 'function') closeSetupWizard(true);
    const wiz = document.getElementById('wizard-modal');
    if (wiz) { wiz.classList.remove('open'); wiz.style.display = 'none'; }
    document.querySelectorAll('.modal-overlay.open, .cov-modal-overlay, .setup-wizard-overlay, .cov-alert-overlay').forEach((el) => {
      el.classList.remove('open');
      el.style.display = 'none';
    });
    document.querySelectorAll('.cov-toast, .toast, .show-toast, .planner-toast').forEach((el) => el.remove());
    ['backup-banner', 'backup-reminder', 'storage-warning', 'simple-mode-banner'].forEach((id) => {
      const el = document.getElementById(id);
      if (el) el.style.display = 'none';
    });
  });
}

async function bootPlanner(page) {
  await page.goto(`${BASE}/index.html`, { waitUntil: 'networkidle2', timeout: 120000 });
  await page.waitForFunction(() => typeof window.showPanel === 'function', { timeout: 60000 });
  await page.waitForFunction(() => document.body.classList.contains('rd-scope'), { timeout: 60000 });
  await page.evaluate(() => {
    if (typeof applySampleData === 'function' && typeof SAMPLE_DATA !== 'undefined') {
      applySampleData(SAMPLE_DATA);
    }
    if (typeof applyDarkMode === 'function') applyDarkMode(true);
    else {
      document.body.classList.add('dark-mode');
      document.body.setAttribute('data-theme', 'dark');
    }
    if (typeof data !== 'undefined') {
      if (!data.setup) data.setup = {};
      data.setup.darkMode = true;
      if (typeof save === 'function') save();
    }
    try {
      const key = localStorage.getItem('covenant_active_profile') || 'default';
      const dataKey = key === 'default' ? 'covenant_planner_v1' : `covenant_planner_v1_${key}`;
      const raw = localStorage.getItem(dataKey);
      const parsed = raw ? JSON.parse(raw) : (typeof data !== 'undefined' ? JSON.parse(JSON.stringify(data)) : {});
      if (!parsed.setup) parsed.setup = {};
      parsed.setup.darkMode = true;
      localStorage.setItem(dataKey, JSON.stringify(parsed));
      localStorage.setItem('covenant_dark_mode', '1');
    } catch (e) { /* ignore */ }
  });
  await wait(800);
  await dismissChrome(page);
  await wait(800);
  await dismissChrome(page);
  await wait(600);
}

function hint(el) {
  if (el.id) return `#${el.id}`;
  const cls = [...el.classList].slice(0, 3).join('.');
  return cls ? `${el.tagName.toLowerCase()}.${cls}` : el.tagName.toLowerCase();
}

function scanLabelTabStatic(root, panelId) {
  const offenders = [];
  const seen = new Set();
  if (!root) return offenders;

  for (const el of root.querySelectorAll(LABEL_TAB_SELECTOR)) {
    const tag = el.tagName.toLowerCase();
    if (['svg', 'path', 'img'].includes(tag)) continue;
    const cs = getComputedStyle(el);
    if (cs.display === 'none' || cs.visibility === 'hidden' || cs.opacity === '0') continue;
    const rect = el.getBoundingClientRect();
    if (rect.width < 4 || rect.height < 4) continue;

    const bgRgb = parseRgb(cs.backgroundColor);
    const fgRgb = parseRgb(cs.color);
    const bgLum = bgRgb && bgRgb.a >= 0.08 ? luminance(bgRgb) : null;
    const kind = el.matches('.rd-sectiontabs, .rd-tabs, .rd-subnav, .rd-drawer__tabs, .rd-pd-tabs, .rd-set__nav, .rd-viewswitch, .rd-seg') ? 'tab-strip'
      : el.matches('.rd-sectiontabs__item, .rd-tab, .rd-subnav__item, .rd-drawer__tabs > button, .rd-pd-tab, .rd-set__nav-item, .rd-viewswitch__item, .rd-viewswitch > button, .rd-seg__opt') ? 'tab'
      : 'label';

    if (bgLum !== null && bgLum > LUMINANCE_THRESHOLD) {
      const key = `${hint(el)}|light-bg|${cs.backgroundColor}`;
      if (!seen.has(key)) {
        seen.add(key);
        offenders.push({
          selector: hint(el),
          kind,
          type: 'light-bg',
          bg: cs.backgroundColor,
          luminance: Math.round(bgLum),
          text: (el.textContent || '').replace(/\s+/g, ' ').trim().slice(0, 60),
          state: 'static',
          panel: panelId,
        });
      }
    }

    if (isBrownOnDark(fgRgb, bgRgb)) {
      const key = `${hint(el)}|brown|${cs.color}`;
      if (!seen.has(key)) {
        seen.add(key);
        offenders.push({
          selector: hint(el),
          kind,
          type: 'brown-on-dark',
          fg: cs.color,
          bg: cs.backgroundColor,
          text: (el.textContent || '').replace(/\s+/g, ' ').trim().slice(0, 60),
          state: 'static',
          panel: panelId,
        });
      }
    }
  }

  return offenders;
}

async function prepareLabelTabNodes(page, rootSelector, panelId) {
  return page.evaluate(({ rootSelector, panelId, labelTabSelector }) => {
    const root = rootSelector ? document.querySelector(rootSelector) : document.getElementById(`panel-${panelId}`);
    if (!root) return { active: false, items: [] };

    root.querySelectorAll('[data-dm-lt-id]').forEach((el) => el.removeAttribute('data-dm-lt-id'));

    const items = [];
    for (const el of root.querySelectorAll(labelTabSelector)) {
      const tag = el.tagName.toLowerCase();
      if (['svg', 'path', 'img'].includes(tag)) continue;
      const cs = getComputedStyle(el);
      if (cs.display === 'none' || cs.visibility === 'hidden' || cs.opacity === '0') continue;
      const rect = el.getBoundingClientRect();
      if (rect.width < 8 || rect.height < 8) continue;
      if (!el.matches('button, [role="tab"], .rd-tab, .rd-subnav__item, .rd-sectiontabs__item, .rd-viewswitch__item, .rd-viewswitch > button, .rd-seg__opt, .rd-drawer__tabs > button, .rd-pd-tab, .rd-set__nav-item')) continue;

      const id = items.length;
      el.setAttribute('data-dm-lt-id', String(id));
      const cls = [...el.classList].slice(0, 3).join('.');
      const hintLocal = el.id ? `#${el.id}` : `${tag}${cls ? `.${cls}` : ''}`;
      items.push({
        id,
        hint: hintLocal,
        text: (el.textContent || '').replace(/\s+/g, ' ').trim().slice(0, 60),
      });
    }

    return { active: true, items };
  }, { rootSelector, panelId, labelTabSelector: LABEL_TAB_SELECTOR });
}

async function scanLabelTabHover(page, cdp, rootSelector, panelId) {
  const prep = await prepareLabelTabNodes(page, rootSelector, panelId);
  if (!prep.active) return [];

  const offenders = [];
  const seen = new Set();
  const doc = await cdp.send('DOM.getDocument');
  const scope = rootSelector || `#panel-${panelId}`;

  for (const item of prep.items.slice(0, LABEL_TAB_HOVER_CAP)) {
    const { nodeId } = await cdp.send('DOM.querySelector', {
      nodeId: doc.root.nodeId,
      selector: `${scope} [data-dm-lt-id="${item.id}"]`,
    });
    if (!nodeId) continue;

    for (const pseudo of [['hover'], ['focus'], ['active']]) {
      await cdp.send('CSS.forcePseudoState', { nodeId, forcedPseudoClasses: pseudo });
      const res = await cdp.send('CSS.getComputedStyleForNode', { nodeId });
      const bg = res.computedStyle.find((x) => x.name === 'background-color')?.value || '';
      const fg = res.computedStyle.find((x) => x.name === 'color')?.value || '';
      await cdp.send('CSS.forcePseudoState', { nodeId, forcedPseudoClasses: [] });

      const bgRgb = parseRgb(bg);
      const fgRgb = parseRgb(fg);
      const bgLum = bgRgb && bgRgb.a >= 0.08 ? luminance(bgRgb) : null;
      const state = pseudo[0];

      if (bgLum !== null && bgLum > LUMINANCE_THRESHOLD) {
        const key = `${item.hint}|${state}|light-bg|${bg}`;
        if (!seen.has(key)) {
          seen.add(key);
          offenders.push({
            selector: item.hint,
            kind: 'tab',
            type: 'light-bg',
            bg,
            luminance: Math.round(bgLum),
            text: item.text,
            state,
            panel: panelId || rootSelector,
          });
        }
      }

      if (isBrownOnDark(fgRgb, bgRgb)) {
        const key = `${item.hint}|${state}|brown|${fg}`;
        if (!seen.has(key)) {
          seen.add(key);
          offenders.push({
            selector: item.hint,
            kind: 'tab',
            type: 'brown-on-dark',
            fg,
            bg,
            text: item.text,
            state,
            panel: panelId || rootSelector,
          });
        }
      }
    }
  }

  await page.evaluate(({ scope }) => {
    document.querySelectorAll(`${scope} [data-dm-lt-id]`).forEach((el) => el.removeAttribute('data-dm-lt-id'));
  }, { scope });

  return offenders.slice(0, 40);
}

async function scanLabelTabRegion(page, cdp, { panelId, rootSelector, label }) {
  if (panelId) {
    await page.evaluate((id) => window.showPanel(id), panelId);
    await wait(1500);
    await dismissChrome(page);
    await wait(400);
  }

  const staticOffenders = await page.evaluate(({ panelId, rootSelector, threshold, labelTabSelector, brownFg, darkBg, label }) => {
    const root = rootSelector ? document.querySelector(rootSelector) : document.getElementById(`panel-${panelId}`);
    if (!root) return [];
    if (panelId && !root.classList.contains('active')) return [];

    function parseRgbLocal(bg) {
      const m = bg.match(/rgba?\((\d+),\s*(\d+),\s*(\d+)/);
      if (!m) return null;
      const a = bg.includes('rgba') ? parseFloat(bg.split(',').pop()) : 1;
      return { r: +m[1], g: +m[2], b: +m[3], a };
    }
    function lum(c) { return (c.r + c.g + c.b) / 3; }
    function isBrown(fgRgb, bgRgb) {
      if (!fgRgb) return false;
      if (lum(fgRgb) >= brownFg) return false;
      const bgLum = bgRgb && bgRgb.a >= 0.08 ? lum(bgRgb) : 30;
      if (bgLum >= darkBg) return false;
      return fgRgb.r > 80 && fgRgb.g > 60 && fgRgb.b < 130;
    }
    function hintLocal(el) {
      if (el.id) return `#${el.id}`;
      const cls = [...el.classList].slice(0, 3).join('.');
      return cls ? `${el.tagName.toLowerCase()}.${cls}` : el.tagName.toLowerCase();
    }

    const offenders = [];
    const seen = new Set();
    for (const el of root.querySelectorAll(labelTabSelector)) {
      const tag = el.tagName.toLowerCase();
      if (['svg', 'path', 'img'].includes(tag)) continue;
      const cs = getComputedStyle(el);
      if (cs.display === 'none' || cs.visibility === 'hidden' || cs.opacity === '0') continue;
      const rect = el.getBoundingClientRect();
      if (rect.width < 4 || rect.height < 4) continue;
      const bgRgb = parseRgbLocal(cs.backgroundColor);
      const fgRgb = parseRgbLocal(cs.color);
      const bgLum = bgRgb && bgRgb.a >= 0.08 ? lum(bgRgb) : null;
      const region = label || panelId || rootSelector;
      const kind = el.matches('.rd-sectiontabs, .rd-tabs, .rd-subnav, .rd-drawer__tabs, .rd-pd-tabs, .rd-set__nav, .rd-viewswitch, .rd-seg') ? 'tab-strip'
        : el.matches('.rd-sectiontabs__item, .rd-tab, .rd-subnav__item, .rd-drawer__tabs > button, .rd-pd-tab, .rd-set__nav-item, .rd-viewswitch__item, .rd-viewswitch > button, .rd-seg__opt') ? 'tab'
        : 'label';

      if (bgLum !== null && bgLum > threshold) {
        const key = `${hintLocal(el)}|light-bg|${cs.backgroundColor}`;
        if (!seen.has(key)) {
          seen.add(key);
          offenders.push({ selector: hintLocal(el), kind, type: 'light-bg', bg: cs.backgroundColor, luminance: Math.round(bgLum), text: (el.textContent || '').replace(/\s+/g, ' ').trim().slice(0, 60), state: 'static', panel: region });
        }
      }
      if (isBrown(fgRgb, bgRgb)) {
        const key = `${hintLocal(el)}|brown|${cs.color}`;
        if (!seen.has(key)) {
          seen.add(key);
          offenders.push({ selector: hintLocal(el), kind, type: 'brown-on-dark', fg: cs.color, bg: cs.backgroundColor, text: (el.textContent || '').replace(/\s+/g, ' ').trim().slice(0, 60), state: 'static', panel: region });
        }
      }
    }
    return offenders;
  }, {
    panelId,
    rootSelector,
    label: label || panelId || rootSelector,
    labelTabSelector: LABEL_TAB_SELECTOR,
    threshold: LUMINANCE_THRESHOLD,
    brownFg: BROWN_FG_LUM_THRESHOLD,
    darkBg: DARK_BG_LUM_THRESHOLD,
  });

  const hoverOffenders = await scanLabelTabHover(page, cdp, rootSelector, panelId || label);
  return {
    label: label || panelId,
    staticOffenders,
    hoverOffenders,
    offenders: [...staticOffenders, ...hoverOffenders],
  };
}

async function prepareInteractiveNodes(page, panelId) {
  return page.evaluate(({ panelId, interactiveSelector }) => {
    const panel = document.getElementById(`panel-${panelId}`) || document.getElementById(panelId);
    if (!panel || !panel.classList.contains('active')) {
      return { active: false, items: [] };
    }

    panel.querySelectorAll('[data-dm-hover-id]').forEach((el) => el.removeAttribute('data-dm-hover-id'));

    const items = [];
    for (const el of panel.querySelectorAll(interactiveSelector)) {
      const tag = el.tagName.toLowerCase();
      if (['svg', 'path', 'img'].includes(tag)) continue;
      const cs = getComputedStyle(el);
      if (cs.display === 'none' || cs.visibility === 'hidden' || cs.opacity === '0') continue;
      const rect = el.getBoundingClientRect();
      if (rect.width < 8 || rect.height < 8) continue;

      const id = items.length;
      el.setAttribute('data-dm-hover-id', String(id));
      const cls = [...el.classList].slice(0, 3).join('.');
      const hintLocal = el.id ? `#${el.id}` : `${tag}${cls ? `.${cls}` : ''}`;
      items.push({
        id,
        hint: hintLocal,
        text: (el.textContent || '').replace(/\s+/g, ' ').trim().slice(0, 60),
      });
    }

    return { active: true, items };
  }, { panelId, interactiveSelector: INTERACTIVE_SELECTOR });
}

async function scanHoverOffenders(page, cdp, panelId, threshold) {
  const prep = await prepareInteractiveNodes(page, panelId);
  if (!prep.active) return [];

  const offenders = [];
  const seen = new Set();
  const doc = await cdp.send('DOM.getDocument');
  const panelRoot = `#panel-${panelId}`;

  for (const item of prep.items.slice(0, HOVER_CAP_PER_PANEL)) {
    const { nodeId } = await cdp.send('DOM.querySelector', {
      nodeId: doc.root.nodeId,
      selector: `${panelRoot} [data-dm-hover-id="${item.id}"]`,
    });
    if (!nodeId) continue;

    for (const pseudo of [['hover'], ['focus'], ['active']]) {
      await cdp.send('CSS.forcePseudoState', { nodeId, forcedPseudoClasses: pseudo });
      const res = await cdp.send('CSS.getComputedStyleForNode', { nodeId });
      const bg = res.computedStyle.find((x) => x.name === 'background-color')?.value || '';
      await cdp.send('CSS.forcePseudoState', { nodeId, forcedPseudoClasses: [] });

      const rgb = parseRgb(bg);
      if (!rgb || rgb.a < 0.08) continue;
      const lum = luminance(rgb);
      if (lum <= threshold) continue;

      const state = pseudo[0];
      const key = `${item.hint}|${state}|${bg}`;
      if (seen.has(key)) continue;
      seen.add(key);

      offenders.push({
        selector: item.hint,
        bg,
        luminance: Math.round(lum),
        text: item.text,
        state,
        panel: panelId,
      });
    }
  }

  await page.evaluate((pid) => {
    document.querySelectorAll(`#panel-${pid} [data-dm-hover-id]`).forEach((el) => el.removeAttribute('data-dm-hover-id'));
  }, panelId);

  offenders.sort((a, b) => b.luminance - a.luminance);
  return offenders.slice(0, 40);
}

async function scanPanel(page, cdp, panelId) {
  await page.evaluate((id) => window.showPanel(id), panelId);
  await wait(1800);
  await dismissChrome(page);
  await wait(400);

  const staticResult = await page.evaluate(({ panelId, threshold }) => {
    const panel = document.getElementById(`panel-${panelId}`) || document.getElementById(panelId);
    if (!panel || !panel.classList.contains('active')) {
      return { panelId, active: false, offenders: [] };
    }

    function parseRgbLocal(bg) {
      const m = bg.match(/rgba?\((\d+),\s*(\d+),\s*(\d+)/);
      if (!m) return null;
      const a = bg.includes('rgba') ? parseFloat(bg.split(',').pop()) : 1;
      return { r: +m[1], g: +m[2], b: +m[3], a };
    }

    const offenders = [];
    const seen = new Set();

    function hintLocal(el) {
      if (el.id) return `#${el.id}`;
      const cls = [...el.classList].slice(0, 3).join('.');
      return cls ? `${el.tagName.toLowerCase()}.${cls}` : el.tagName.toLowerCase();
    }

    for (const el of panel.querySelectorAll('*')) {
      const tag = el.tagName.toLowerCase();
      if (['svg', 'path', 'circle', 'rect', 'line', 'polyline', 'polygon', 'g', 'defs', 'clipPath', 'use', 'img'].includes(tag)) continue;
      const cs = getComputedStyle(el);
      if (cs.display === 'none' || cs.visibility === 'hidden' || cs.opacity === '0') continue;
      const rect = el.getBoundingClientRect();
      if (rect.width < 8 || rect.height < 8) continue;

      const bg = cs.backgroundColor;
      const rgb = parseRgbLocal(bg);
      if (!rgb || rgb.a < 0.08) continue;
      const lum = (rgb.r + rgb.g + rgb.b) / 3;
      if (lum <= threshold) continue;

      if (['span', 'a', 'strong', 'em', 'b', 'i', 'label', 'small'].includes(tag) && rect.height < 24) continue;

      const key = `${hintLocal(el)}|${bg}|${Math.round(rect.width)}x${Math.round(rect.height)}`;
      if (seen.has(key)) continue;
      seen.add(key);

      const text = (el.textContent || '').replace(/\s+/g, ' ').trim().slice(0, 60);
      offenders.push({
        selector: hintLocal(el),
        bg,
        luminance: Math.round(lum),
        area: Math.round(rect.width * rect.height),
        text,
        state: 'static',
      });
    }

    offenders.sort((a, b) => b.area - a.area);
    return { panelId, active: true, offenders: offenders.slice(0, 40) };
  }, { panelId, threshold: LUMINANCE_THRESHOLD });

  if (!staticResult.active) {
    return { panelId, active: false, staticOffenders: [], hoverOffenders: [], offenders: [], labelTab: { offenders: [] } };
  }

  const hoverOffenders = await scanHoverOffenders(page, cdp, panelId, LUMINANCE_THRESHOLD);
  const labelTab = await scanLabelTabRegion(page, cdp, { panelId });
  const offenders = [...staticResult.offenders, ...hoverOffenders];

  return {
    panelId,
    active: true,
    staticOffenders: staticResult.offenders,
    hoverOffenders,
    labelTab,
    offenders,
  };
}

async function openProfileDrawer(page) {
  await page.evaluate(() => {
    if (typeof openProfileDrawer === 'function') openProfileDrawer();
    else {
      const btn = document.getElementById('rd-profile-btn') || document.querySelector('[onclick*="Profile"]');
      if (btn) btn.click();
    }
  });
  await wait(800);
}

async function openSettings(page) {
  await page.evaluate(() => {
    if (typeof openSettingsWindow === 'function') openSettingsWindow();
    else if (typeof toggleSettings === 'function') toggleSettings(true);
    else {
      const btn = document.querySelector('.rd-settings-open, [onclick*="Settings"]');
      if (btn) btn.click();
    }
  });
  await wait(800);
}

(async () => {
  const browser = await puppeteer.launch({
    headless: 'new',
    args: ['--no-sandbox', '--disable-setuid-sandbox', '--window-size=1440,900'],
    defaultViewport: { width: 1440, height: 900 },
  });
  const page = await browser.newPage();
  const cdp = await page.createCDPSession();
  await cdp.send('DOM.enable');
  await cdp.send('CSS.enable');

  const report = {
    threshold: LUMINANCE_THRESHOLD,
    panels: {},
    labelTabRegions: {},
    totalStaticOffenders: 0,
    totalHoverOffenders: 0,
    totalOffenders: 0,
    totalLabelTabStatic: 0,
    totalLabelTabHover: 0,
    totalLabelTabOffenders: 0,
    shots: [],
  };

  try {
    await bootPlanner(page);

    for (const panelId of PANELS) {
      const result = await scanPanel(page, cdp, panelId);
      report.panels[panelId] = result;
      report.totalStaticOffenders += result.staticOffenders?.length || 0;
      report.totalHoverOffenders += result.hoverOffenders?.length || 0;
      report.totalOffenders += result.offenders?.length || 0;
      report.totalLabelTabStatic += result.labelTab?.staticOffenders?.length || 0;
      report.totalLabelTabHover += result.labelTab?.hoverOffenders?.length || 0;
      report.totalLabelTabOffenders += result.labelTab?.offenders?.length || 0;

      const staticN = result.staticOffenders?.length || 0;
      const hoverN = result.hoverOffenders?.length || 0;
      const ltN = result.labelTab?.offenders?.length || 0;
      console.log(`\n=== ${panelId} (static=${staticN}, hover=${hoverN}, labelTab=${ltN}) ===`);
      for (const o of (result.labelTab?.offenders || []).slice(0, 6)) {
        console.log(`  [LT/${o.state}] ${o.type} ${o.selector}  "${o.text || ''}"`);
      }
      for (const o of (result.offenders || []).slice(0, 4)) {
        console.log(`  [${o.state}] ${o.selector}  ${o.bg}  lum=${o.luminance}  "${o.text || ''}"`);
      }

      if (['dashboard', 'guests', 'catering', 'contracts', 'setup', 'tables'].includes(panelId) && (staticN || hoverN || ltN)) {
        const shot = path.join(OUT, `audit-dark-${panelId}.png`);
        await page.screenshot({ path: shot, fullPage: false });
        report.shots.push(shot);
        console.log('  screenshot:', shot);
      }
    }

    // Profile drawer label/tab pass
    await page.evaluate(() => window.showPanel('dashboard'));
    await wait(800);
    await openProfileDrawer(page);
    const profileLt = await scanLabelTabRegion(page, cdp, { rootSelector: '#profile-drawer.rd-profile-drawer', label: 'profile-drawer' });
    report.labelTabRegions['profile-drawer'] = profileLt;
    report.totalLabelTabStatic += profileLt.staticOffenders.length;
    report.totalLabelTabHover += profileLt.hoverOffenders.length;
    report.totalLabelTabOffenders += profileLt.offenders.length;
    console.log(`\n=== profile-drawer (labelTab=${profileLt.offenders.length}) ===`);
    profileLt.offenders.slice(0, 8).forEach((o) => console.log(`  [LT/${o.state}] ${o.type} ${o.selector}`));
    const profileShot = path.join(OUT, 'audit-dark-profile-drawer.png');
    await page.screenshot({ path: profileShot, fullPage: false });
    report.shots.push(profileShot);

    // Settings tabs pass
    await page.evaluate(() => {
      const drawer = document.getElementById('profile-drawer');
      if (drawer) drawer.setAttribute('hidden', '');
    });
    await openSettings(page);
    const settingsLt = await scanLabelTabRegion(page, cdp, { rootSelector: '.rd-settings-window', label: 'settings' });
    report.labelTabRegions.settings = settingsLt;
    report.totalLabelTabStatic += settingsLt.staticOffenders.length;
    report.totalLabelTabHover += settingsLt.hoverOffenders.length;
    report.totalLabelTabOffenders += settingsLt.offenders.length;
    console.log(`\n=== settings (labelTab=${settingsLt.offenders.length}) ===`);
    settingsLt.offenders.slice(0, 8).forEach((o) => console.log(`  [LT/${o.state}] ${o.type} ${o.selector}`));

    // Walkthrough screenshots: tab strips + label areas
    for (const [panelId, filename] of [
      ['dashboard', 'dm8-dashboard-labels-tabs.png'],
      ['guests', 'dm8-guests-labels-tabs.png'],
      ['setup', 'dm8-setup-labels-tabs.png'],
    ]) {
      await page.evaluate(() => {
        document.querySelector('.rd-settings-overlay.is-open')?.classList.remove('is-open');
      });
      await page.evaluate((id) => window.showPanel(id), panelId);
      await wait(1200);
      await dismissChrome(page);
      const shot = path.join(OUT, filename);
      await page.screenshot({ path: shot, fullPage: false });
      report.shots.push(shot);
      console.log('walkthrough:', shot);
    }

    await page.evaluate(() => {
      document.querySelector('.rd-settings-overlay.is-open')?.classList.remove('is-open');
    });
    await openProfileDrawer(page);
    const profileWalk = path.join(OUT, 'dm8-profile-drawer-tabs.png');
    await page.screenshot({ path: profileWalk, fullPage: false });
    report.shots.push(profileWalk);
    console.log('walkthrough:', profileWalk);

    // dm-sweep13: overlays + drawer-slot cream scan
    await page.evaluate(() => {
      // Force-open furniture sheets + a drawer slot so computed styles are measurable
      ['rd-filter-builder-overlay', 'rd-views-mgr-overlay', 'rd-trash-overlay'].forEach((id) => {
        const el = document.getElementById(id);
        if (el) {
          el.hidden = false;
          el.style.display = 'flex';
          el.removeAttribute('hidden');
        }
      });
      const slot = document.querySelector('[id$="-drawer-slot"]');
      if (slot) slot.classList.add('is-open');
      const gs = document.querySelector('.gs-results');
      if (gs) { gs.classList.add('open'); gs.style.display = 'block'; }
    });
    await wait(400);
    const chromeScan = await page.evaluate(({ threshold }) => {
      function parseRgbLocal(bg) {
        const m = bg.match(/rgba?\((\d+),\s*(\d+),\s*(\d+)/);
        if (!m) return null;
        const a = bg.includes('rgba') ? parseFloat(bg.split(',').pop()) : 1;
        return { r: +m[1], g: +m[2], b: +m[3], a };
      }
      function lum(rgb) { return (rgb.r + rgb.g + rgb.b) / 3; }
      function hint(el) {
        if (el.id) return `#${el.id}`;
        const cls = [...el.classList].slice(0, 3).join('.');
        return cls ? `${el.tagName.toLowerCase()}.${cls}` : el.tagName.toLowerCase();
      }
      const selectors = [
        '[id$="-overlay"]',
        '[id$="-overlay"] > *',
        '[id$="-drawer-slot"].is-open',
        '.gs-results',
        '.rd-gaps-pop',
        '.rd-avatar-menu',
        '.rd-help-menu',
        '.rd-undo-flyout',
        '.rd-mobile-tabbar',
        '#planner-context-sidebar.is-rail-overlay',
        '.rd-filter-builder',
        '.rd-views-mgr',
        '.rd-bulk-edit',
        '.rd-share',
        '.rd-template-picker',
        '.rd-trash',
        '.rd-merge',
      ];
      const offenders = [];
      const seen = new Set();
      for (const sel of selectors) {
        for (const el of document.querySelectorAll(sel)) {
          const cs = getComputedStyle(el);
          if (cs.display === 'none' || cs.visibility === 'hidden') continue;
          const rgb = parseRgbLocal(cs.backgroundColor);
          if (!rgb || rgb.a < 0.08) continue;
          const L = lum(rgb);
          if (L <= threshold) continue;
          const key = `${hint(el)}|${cs.backgroundColor}`;
          if (seen.has(key)) continue;
          seen.add(key);
          offenders.push({
            selector: hint(el),
            bg: cs.backgroundColor,
            luminance: Math.round(L),
            kind: 'chrome-overlay',
          });
        }
      }
      return offenders;
    }, { threshold: LUMINANCE_THRESHOLD });
    report.chromeOverlayOffenders = chromeScan;
    console.log(`\n=== chrome overlays/drawer-slots (light-bg=${chromeScan.length}) ===`);
    chromeScan.slice(0, 12).forEach((o) => console.log(`  ${o.selector}  ${o.bg}  lum=${o.luminance}`));

    fs.writeFileSync(REPORT, JSON.stringify(report, null, 2));
    console.log('\nTOTAL STATIC OFFENDERS:', report.totalStaticOffenders);
    console.log('TOTAL HOVER OFFENDERS:', report.totalHoverOffenders);
    console.log('TOTAL OFFENDERS:', report.totalOffenders);
    console.log('TOTAL LABEL/TAB OFFENDERS:', report.totalLabelTabOffenders);
    console.log('  (static:', report.totalLabelTabStatic, 'hover:', report.totalLabelTabHover, ')');
    console.log('CHROME OVERLAY OFFENDERS:', chromeScan.length);
    console.log('REPORT:', REPORT);

    if (report.totalOffenders > 0 || report.totalLabelTabOffenders > 0 || chromeScan.length > 0) {
      process.exitCode = 1;
    }
  } finally {
    await browser.close();
  }
})().catch((e) => {
  console.error(e);
  process.exit(1);
});
