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

async function dismissChrome(page) {
  await page.evaluate(() => {
    if (typeof ensureOnboardData === 'function') {
      ensureOnboardData().wizardSeen = true;
      if (typeof save === 'function') save();
    }
    if (typeof closeSetupWizard === 'function') closeSetupWizard(true);
    const wiz = document.getElementById('wizard-modal');
    if (wiz) {
      wiz.classList.remove('open');
      wiz.style.display = 'none';
    }
    document.querySelectorAll('.modal-overlay.open, .cov-modal-overlay, .setup-wizard-overlay, .cov-alert-overlay').forEach((el) => {
      el.classList.remove('open');
      el.style.display = 'none';
    });
    document.querySelectorAll('.cov-toast, .toast, .show-toast').forEach((el) => el.remove());
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
  await wait(600);
  await dismissChrome(page);
  // Wizard auto-opens ~400ms after init on blank planners — close again
  await wait(600);
  await dismissChrome(page);
  await wait(800);
}

async function go(page, panelId) {
  await page.evaluate((id) => window.showPanel(id), panelId);
  await wait(1500);
  await dismissChrome(page);
  await wait(400);
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
    await page.evaluate(() => document.getElementById('dash-sections')?.scrollIntoView({ block: 'center' }));
    await wait(500);
    const secBtn = await page.$('#dash-sections .rd-dash-sec');
    if (secBtn) {
      await secBtn.hover();
      await wait(400);
    }
    await snap(page, 'browser-dark-01-dashboard');

    await page.evaluate(() => window.scrollTo(0, 0));
    await wait(300);

    await go(page, 'guests');
    await snap(page, 'browser-dark-02-guests');

    await go(page, 'calendar');
    await snap(page, 'browser-dark-03-calendar');

    await go(page, 'tasks');
    await snap(page, 'browser-dark-04-tasks');

    await go(page, 'budget');
    await snap(page, 'browser-dark-05-budget');

    await go(page, 'catering');
    await snap(page, 'browser-dark-05b-catering-headcount');

    await go(page, 'setup');
    await snap(page, 'browser-dark-06-setup');

    await go(page, 'contracts');
    await snap(page, 'browser-dark-06b-contracts');

    await go(page, 'tables');
    await snap(page, 'browser-dark-06c-tables');

    const profileBtn = await page.$('#profile-drawer-btn');
    if (profileBtn) {
      await profileBtn.click();
      await wait(1200);
      await snap(page, 'browser-dark-07-profile-drawer');
      await page.keyboard.press('Escape');
      await wait(500);
    }

    await page.goto(`${BASE}/vendor-portal.html`, { waitUntil: 'networkidle2' });
    await wait(1500);
    await snap(page, 'browser-dark-08-vendor-portal');

    const audit = await page.evaluate(() => {
      const isDark = document.body.classList.contains('dark-mode') || document.body.getAttribute('data-theme') === 'dark';
      const hatch = document.querySelector('.vp-row.is-hatch');
      const btn = document.querySelector('.vp-btn:not(.vp-btn--primary)');
      const cs = (el) => (el ? getComputedStyle(el).backgroundColor : null);
      return {
        isDark,
        shellBg: cs(document.querySelector('.vp-shell')),
        hatchBg: cs(hatch),
        btnBg: cs(btn),
      };
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
