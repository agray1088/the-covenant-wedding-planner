import { chromium } from 'playwright';
import fs from 'fs';
import path from 'path';

const BASE = 'http://localhost:8000/index.html';
const OUT = '/tmp/fidelity-shots';
fs.mkdirSync(OUT, { recursive: true });

async function boot(page) {
  await page.goto(BASE, { waitUntil: 'networkidle', timeout: 60000 });
  await page.waitForFunction(() => typeof showPanel === 'function', null, { timeout: 30000 });
  // dismiss backup banner if present
  await page.evaluate(() => {
    try {
      sessionStorage.setItem('covenant_backup_banner_dismissed', '1');
      document.documentElement.classList.add('backup-banner-dismissed-early');
    } catch (e) {}
    if (typeof uxRevealPanel === 'function') uxRevealPanel('setup');
  });
}

async function shot(page, name) {
  const p = path.join(OUT, name + '.png');
  await page.screenshot({ path: p, fullPage: false });
  console.log('saved', p);
  return p;
}

async function main() {
  const browser = await chromium.launch({ headless: true });
  const page = await browser.newPage({ viewport: { width: 1440, height: 900 } });
  await boot(page);

  // 15a Wedding Setup
  await page.evaluate(() => {
    window._setupView = 'current';
    showPanel('setup', true);
    if (typeof renderSetupRd === 'function') renderSetupRd();
  });
  await page.waitForTimeout(800);
  await shot(page, '15a-setup');

  // 11c earlier drawing
  await page.evaluate(() => {
    if (typeof rdSetupSetView === 'function') rdSetupSetView('earlier');
    else { window._setupView = 'earlier'; if (typeof renderSetupRd === 'function') renderSetupRd(); }
  });
  await page.waitForTimeout(600);
  await shot(page, '11c-setup-earlier');

  // 15b Get Started
  await page.evaluate(() => {
    showPanel('instructions', true);
    if (typeof renderGetStartedRd === 'function') renderGetStartedRd();
  });
  await page.waitForTimeout(600);
  await shot(page, '15b-getstarted');

  // 15c FAQ
  await page.evaluate(() => {
    showPanel('faq', true);
    if (typeof renderFaqRd === 'function') renderFaqRd();
  });
  await page.waitForTimeout(600);
  await shot(page, '15c-faq');

  // 15d + 33i table
  await page.evaluate(() => {
    showPanel('guide', true);
    if (typeof renderGuideRd === 'function') renderGuideRd();
    if (typeof rdGuideSetView === 'function') rdGuideSetView('table');
  });
  await page.waitForTimeout(600);
  await shot(page, '33i-guide-table');

  // 33j print
  await page.evaluate(() => {
    if (typeof rdGuideSetView === 'function') rdGuideSetView('print');
  });
  await page.waitForTimeout(400);
  await shot(page, '33j-guide-print');

  // 49a profile drawer
  await page.evaluate(() => {
    if (typeof openProfileDrawer === 'function') openProfileDrawer();
    else if (typeof toggleProfileDrawer === 'function') toggleProfileDrawer();
  });
  await page.waitForTimeout(600);
  await shot(page, '49a-profile-drawer');

  // 49b theme builder
  await page.evaluate(() => {
    if (typeof closeProfileDrawer === 'function') closeProfileDrawer();
    if (typeof openThemeBuilder === 'function') openThemeBuilder();
  });
  await page.waitForTimeout(600);
  await shot(page, '49b-theme-builder');

  // close theme, 49c settings
  await page.evaluate(() => {
    const ov = document.getElementById('theme-builder-overlay');
    if (ov) ov.classList.remove('open');
    if (typeof openSettingsWindow === 'function') openSettingsWindow();
  });
  await page.waitForTimeout(600);
  await shot(page, '49c-settings');

  // 49d top bar
  await page.evaluate(() => {
    const sw = document.getElementById('settings-window');
    if (sw) sw.classList.remove('open');
    showPanel('setup', true);
  });
  await page.waitForTimeout(400);
  await page.locator('#top-bar, .rd-topbar, header.planner-top').first().screenshot({ path: path.join(OUT, '49d-topbar.png') });
  console.log('saved', path.join(OUT, '49d-topbar.png'));

  // Night variants
  await page.evaluate(() => {
    if (typeof toggleDarkMode === 'function') toggleDarkMode(true);
    else document.body.classList.add('night');
    document.body.classList.add('rd-scope');
  });
  await page.waitForTimeout(500);
  await page.evaluate(() => { if (typeof openProfileDrawer === 'function') openProfileDrawer(); });
  await page.waitForTimeout(400);
  await shot(page, '49a-n-profile');

  await browser.close();
  console.log('done');
}

main().catch(e => { console.error(e); process.exit(1); });
