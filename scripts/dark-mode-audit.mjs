import puppeteer from 'puppeteer';
import fs from 'fs';
import path from 'path';

const BASE = 'http://127.0.0.1:8765';
const OUT = '/opt/cursor/artifacts/screenshots';
const REPORT = '/opt/cursor/artifacts/dark-mode-audit.json';
fs.mkdirSync(OUT, { recursive: true });

const LUMINANCE_THRESHOLD = 180;

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

const HOVER_CAP_PER_PANEL = 120;

function parseRgb(bg) {
  const m = bg.match(/rgba?\((\d+),\s*(\d+),\s*(\d+)/);
  if (!m) return null;
  return { r: +m[1], g: +m[2], b: +m[3], a: bg.includes('rgba') ? parseFloat(bg.split(',').pop()) : 1 };
}

function luminance(rgb) {
  return (rgb.r + rgb.g + rgb.b) / 3;
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
      const hint = el.id ? `#${el.id}` : `${tag}${cls ? `.${cls}` : ''}`;
      items.push({
        id,
        hint,
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

    function hint(el) {
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

      const key = `${hint(el)}|${bg}|${Math.round(rect.width)}x${Math.round(rect.height)}`;
      if (seen.has(key)) continue;
      seen.add(key);

      const text = (el.textContent || '').replace(/\s+/g, ' ').trim().slice(0, 60);
      offenders.push({
        selector: hint(el),
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
    return { panelId, active: false, staticOffenders: [], hoverOffenders: [], offenders: [] };
  }

  const hoverOffenders = await scanHoverOffenders(page, cdp, panelId, LUMINANCE_THRESHOLD);
  const offenders = [...staticResult.offenders, ...hoverOffenders];

  return {
    panelId,
    active: true,
    staticOffenders: staticResult.offenders,
    hoverOffenders,
    offenders,
  };
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
    totalStaticOffenders: 0,
    totalHoverOffenders: 0,
    totalOffenders: 0,
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

      const staticN = result.staticOffenders?.length || 0;
      const hoverN = result.hoverOffenders?.length || 0;
      console.log(`\n=== ${panelId} (static=${staticN}, hover=${hoverN}) ===`);
      for (const o of (result.offenders || []).slice(0, 8)) {
        console.log(`  [${o.state}] ${o.selector}  ${o.bg}  lum=${o.luminance}  "${o.text || ''}"`);
      }

      if (['dashboard', 'guests', 'catering', 'contracts', 'setup', 'tables'].includes(panelId) && (staticN || hoverN)) {
        const shot = path.join(OUT, `audit-dark-${panelId}.png`);
        await page.screenshot({ path: shot, fullPage: false });
        report.shots.push(shot);
        console.log('  screenshot:', shot);
      }
    }

    fs.writeFileSync(REPORT, JSON.stringify(report, null, 2));
    console.log('\nTOTAL STATIC OFFENDERS:', report.totalStaticOffenders);
    console.log('TOTAL HOVER OFFENDERS:', report.totalHoverOffenders);
    console.log('TOTAL OFFENDERS:', report.totalOffenders);
    console.log('REPORT:', REPORT);
  } finally {
    await browser.close();
  }
})().catch((e) => {
  console.error(e);
  process.exit(1);
});
