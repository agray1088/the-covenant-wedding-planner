import { chromium } from 'playwright';
import fs from 'fs';
import path from 'path';

const BASE = 'http://localhost:8000/index.html';
const OUT = '/tmp/fidelity-shots-v2';
fs.mkdirSync(OUT, { recursive: true });

async function dismissChrome(page) {
  await page.evaluate(() => {
    try {
      localStorage.setItem('covenant_wizard_done', '1');
      localStorage.setItem('covenant_backup_welcome_dismissed', '1');
      sessionStorage.setItem('covenant_backup_banner_dismissed', '1');
      document.documentElement.classList.add('backup-banner-dismissed-early');
      const t = new Date(Date.now() - 3 * 86400000).toISOString();
      const d = typeof getCovenantPlannerData === 'function' ? getCovenantPlannerData() : (window.data || {});
      d.onboard = Object.assign({}, d.onboard || {}, {
        lastBackupTime: t,
        lastBackupSize: '1.8 MB',
        editsSinceBackup: 12,
        lastSaveTime: new Date().toISOString()
      });
      if (typeof save === 'function') save();
    } catch (e) { /* ignore */ }
    document.getElementById('wizard-modal')?.classList.remove('open');
    document.querySelectorAll('.cov-modal-overlay, .cov-modal-overlay--open').forEach(el => {
      el.classList.remove('cov-modal-overlay--open', 'open');
      el.remove();
    });
    document.body.classList.remove('cov-modal-open');
  });
}

async function shot(page, name) {
  const p = path.join(OUT, name + '.png');
  await page.screenshot({ path: p, fullPage: false });
  return p;
}

async function check(page, name, fn) {
  const r = await page.evaluate(fn);
  console.log(name + ':', JSON.stringify(r));
  return r;
}

async function main() {
  const browser = await chromium.launch({ headless: true });
  const page = await browser.newPage({ viewport: { width: 1440, height: 900 } });
  await page.goto(BASE, { waitUntil: 'networkidle', timeout: 60000 });
  await page.waitForFunction(() => typeof showPanel === 'function', null, { timeout: 30000 });
  await dismissChrome(page);

  // 15a
  await page.evaluate(() => { window._setupView = 'current'; showPanel('setup', true); renderSetupRd(); });
  await page.waitForTimeout(700);
  await check(page, '15a', () => ({
    legacyHidden: getComputedStyle(document.querySelector('#panel-setup .m-stats.rd-setup-legacy-hide')).display === 'none',
    statstrip: !!document.querySelector('.rd-setup-statstrip'),
    grid: document.querySelectorAll('.rd-setup-section').length,
    feeds: document.querySelectorAll('.rd-setup-feeds').length,
    danger: !!document.querySelector('#rd-setup-danger')
  }));
  await shot(page, '15a');

  // 11c
  await page.evaluate(() => rdSetupSetView('earlier'));
  await page.waitForTimeout(500);
  await check(page, '11c', () => ({
    stats: document.querySelector('.rd-setup-statstrip')?.innerText?.split('\n').filter(Boolean).slice(0, 10),
    menuHidden: getComputedStyle(document.querySelector('.menu-visibility-card')).display === 'none',
    dangerHidden: !document.querySelector('#rd-setup-danger') || getComputedStyle(document.querySelector('#rd-setup-danger')).display === 'none'
  }));
  await shot(page, '11c');

  // 15b
  await page.evaluate(() => { showPanel('instructions', true); renderGetStartedRd(); });
  await page.waitForTimeout(500);
  await check(page, '15b', () => ({
    body: !!document.querySelector('#rd-getstarted-body'),
    backupMeta: !!document.querySelector('.rd-getstarted-readfirst__backup'),
    backupMetaText: document.querySelector('.rd-getstarted-readfirst__backup')?.textContent?.slice(0, 80)
  }));
  await shot(page, '15b');

  // 15c FAQ
  await page.evaluate(() => { showPanel('faq', true); renderFaqRd(); });
  await page.waitForTimeout(500);
  await check(page, '15c', () => ({
    layout: !!document.querySelector('.rd-faq-layout'),
    quick: !!document.querySelector('#rd-faq-quick'),
    cols: getComputedStyle(document.querySelector('.rd-faq-layout')).gridTemplateColumns
  }));
  await shot(page, '15c');

  // 33i
  await page.evaluate(() => { showPanel('guide', true); renderGuideRd(); rdGuideSetView('table'); });
  await page.waitForTimeout(500);
  await check(page, '33i', () => ({
    filters: document.querySelectorAll('.rd-guide-filterchip').length,
    actions: document.querySelectorAll('.rd-guide-table-actions .rd-btn').length,
    rows: document.querySelectorAll('.rd-guide-contract tbody tr').length
  }));
  await shot(page, '33i');

  // 33j
  await page.evaluate(() => rdGuideSetView('print'));
  await page.waitForTimeout(400);
  await check(page, '33j', () => ({
    sheet: !!document.querySelector('.rd-guide-printsheet'),
    groups: document.querySelectorAll('.rd-guide-printgroup').length
  }));
  await shot(page, '33j');

  // 33k/l essentials
  await page.evaluate(() => { showPanel('essentials', true); if (typeof renderEssentialsRd === 'function') renderEssentialsRd(); if (typeof rdSetEssView === 'function') rdSetEssView('byPerson'); });
  await page.waitForTimeout(600);
  await shot(page, '33k');
  await page.evaluate(() => rdSetEssView('print'));
  await page.waitForTimeout(400);
  await shot(page, '33l');

  // 49a profile
  await page.evaluate(() => { showPanel('setup', true); openProfileDrawer(); });
  await page.waitForTimeout(500);
  await check(page, '49a', () => ({
    forest: getComputedStyle(document.querySelector('#profile-drawer .profile-drawer-head')).backgroundColor,
    width: getComputedStyle(document.getElementById('profile-drawer')).width,
    cards: document.querySelectorAll('#profile-templates-gallery .template-detail-card--compact').length
  }));
  await shot(page, '49a');

  // 49b theme
  await page.evaluate(() => { closeProfileDrawer(); openThemeBuilder(); });
  await page.waitForTimeout(500);
  await shot(page, '49b');

  // 49c settings
  await page.evaluate(() => {
    document.getElementById('theme-builder-overlay')?.classList.remove('open');
    openSettingsWindow?.();
  });
  await page.waitForTimeout(500);
  await check(page, '49c', () => ({
    overlay: !!document.getElementById('rd-settings-overlay'),
    banner: !!document.querySelector('.rd-set__note')
  }));
  await shot(page, '49c');

  // 49d topbar
  await page.evaluate(() => {
    document.getElementById('rd-settings-overlay')?.remove();
    showPanel('setup', true);
  });
  await page.locator('.rd-topbar, #planner-top-bar, header.planner-top, .top-bar-wrap').first().screenshot({ path: path.join(OUT, '49d.png') }).catch(async () => {
    await page.screenshot({ path: path.join(OUT, '49d.png'), clip: { x: 0, y: 0, width: 1440, height: 120 } });
  });

  // Night 49a-n
  await page.evaluate(() => { if (typeof toggleDarkMode === 'function') toggleDarkMode(true); else document.body.classList.add('night'); openProfileDrawer(); });
  await page.waitForTimeout(400);
  await shot(page, '49a-n');

  // 5a guest full editor
  await page.evaluate(() => {
    document.body.classList.remove('night');
    if (typeof toggleDarkMode === 'function') toggleDarkMode(false);
    closeProfileDrawer?.();
    showPanel('guests', true);
    if (typeof openRecordEditor === 'function') openRecordEditor('guest', null, true);
  });
  await page.waitForTimeout(800);
  await check(page, '5a', () => ({
    editor: !!document.querySelector('.record-editor-overlay.open, #record-editor-overlay.open, .rd-record-editor.is-open'),
    title: document.querySelector('.record-editor-title, .rd-re__title, .record-editor-head h2')?.textContent?.slice(0, 40)
  }));
  await shot(page, '5a');

  await browser.close();
  console.log('shots in', OUT);
}

main().catch(e => { console.error(e); process.exit(1); });
