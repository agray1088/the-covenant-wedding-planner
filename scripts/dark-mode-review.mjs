import puppeteer from 'puppeteer';
import fs from 'fs';
import path from 'path';

const BASE = 'http://127.0.0.1:8765';
const OUT = '/opt/cursor/artifacts/screenshots';
fs.mkdirSync(OUT, { recursive: true });

const shots = [];

async function snap(page, name) {
  const file = path.join(OUT, `${name}.png`);
  await page.screenshot({ path: file, fullPage: false });
  shots.push(file);
  console.log('saved', file);
}

async function wait(ms) {
  return new Promise((r) => setTimeout(r, ms));
}

async function bootPlanner(page) {
  await page.goto(`${BASE}/index.html`, { waitUntil: 'networkidle2', timeout: 120000 });
  await page.waitForFunction(() => typeof window.showPanel === 'function', { timeout: 60000 });
  await page.evaluate(() => {
    // Load sample data first (SAMPLE_DATA.setup.darkMode is false — override after).
    if (typeof window.applySampleData === 'function' && typeof window.SAMPLE_DATA !== 'undefined') {
      window.applySampleData(window.SAMPLE_DATA);
    }
    // Apply dark mode and persist to covenant_planner_v1 for vendor portal sync.
    if (typeof window.applyDarkMode === 'function') window.applyDarkMode(true);
    else {
      document.body.classList.add('dark-mode');
      document.body.setAttribute('data-theme', 'dark');
    }
    if (typeof window.data !== 'undefined') {
      if (!window.data.setup) window.data.setup = {};
      window.data.setup.darkMode = true;
      if (typeof window.save === 'function') window.save();
    }
    try {
      const key = localStorage.getItem('covenant_active_profile') || 'default';
      const dataKey = key === 'default' ? 'covenant_planner_v1' : `covenant_planner_v1_${key}`;
      const raw = localStorage.getItem(dataKey);
      const parsed = raw ? JSON.parse(raw) : (window.data ? JSON.parse(JSON.stringify(window.data)) : {});
      if (!parsed.setup) parsed.setup = {};
      parsed.setup.darkMode = true;
      localStorage.setItem(dataKey, JSON.stringify(parsed));
      localStorage.setItem('covenant_dark_mode', '1');
    } catch (e) { /* ignore */ }
    // Dismiss welcome modals so pages are visible for screenshots
    if (typeof window.closeSetupWizard === 'function') window.closeSetupWizard(true);
    document.querySelectorAll('.cov-modal-overlay, .setup-wizard-overlay, .cov-toast, .toast').forEach((el) => el.remove());
    const wiz = document.getElementById('wizard-modal');
    if (wiz) { wiz.classList.remove('open'); wiz.style.display = 'none'; }
  });
  await wait(2500);
}

async function go(page, panelId) {
  await page.evaluate((id) => window.showPanel(id), panelId);
  await wait(1800);
}

(async () => {
  const browser = await puppeteer.launch({
    headless: 'new',
    args: ['--no-sandbox', '--disable-setuid-sandbox', '--window-size=1440,900'],
    defaultViewport: { width: 1440, height: 900 },
  });
  const page = await browser.newPage();

  try {
    await bootPlanner(page);
    await snap(page, 'dark-01-dashboard');

    await go(page, 'guests');
    await snap(page, 'dark-02-guests');

    await go(page, 'calendar');
    await snap(page, 'dark-03-calendar');

    await go(page, 'tasks');
    await snap(page, 'dark-04-tasks');

    await go(page, 'budget');
    await snap(page, 'dark-05-budget');

    await go(page, 'setup');
    await snap(page, 'dark-06-setup');

    // Profile drawer if present
    const profileBtn = await page.$('#profile-drawer-btn');
    if (profileBtn) {
      await profileBtn.click();
      await wait(1200);
      await snap(page, 'dark-07-profile-drawer');
      await page.keyboard.press('Escape');
      await wait(500);
    }

    // Vendor portal (reads planner darkMode from localStorage)
    await page.goto(`${BASE}/vendor-portal.html`, { waitUntil: 'networkidle2' });
    await wait(1500);
    await snap(page, 'dark-08-vendor-portal');

    // Collect light-pixel heuristic on main surfaces
    const audit = await page.evaluate(() => {
      const isDark = document.body.classList.contains('dark-mode') || document.body.getAttribute('data-theme') === 'dark';
      const els = [...document.querySelectorAll('.vp-shell, .vp-body, .vp-card')].slice(0, 8);
      const bg = els.map((el) => {
        const s = getComputedStyle(el);
        return { tag: el.className, bg: s.backgroundColor };
      });
      return { isDark, bg };
    });
    console.log('vendor audit', JSON.stringify(audit, null, 2));
  } finally {
    await browser.close();
  }

  console.log('SCREENSHOTS:', shots.join('\n'));
})().catch((e) => {
  console.error(e);
  process.exit(1);
});
