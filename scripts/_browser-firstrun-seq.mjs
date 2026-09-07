#!/usr/bin/env node
/**
 * Browser verify: clear LS+IDB, hard load, assert only one first-run overlay
 * is visible at a time (backup → wizard → coach ambient).
 */
import { chromium } from 'playwright';
import path from 'path';
import fs from 'fs';
import { fileURLToPath } from 'url';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const artifacts = '/tmp/cursor/artifacts';
fs.mkdirSync(artifacts, { recursive: true });

const BASE = process.env.FIRSTRUN_BASE || 'http://127.0.0.1:8765/index.html';

function overlayState(page) {
  return page.evaluate(() => {
    const wiz = document.getElementById('wizard-modal');
    const wizardOpen = !!(wiz && wiz.classList.contains('open'));
    const backupOpen = !!document.querySelector('.cov-modal-overlay--open');
    const coachFraming = !!document.getElementById('coach-framing');
    const coachOpen = typeof COACH !== 'undefined' && !!COACH.open;
    const coachAmbient = !!document.getElementById('coach-ambient');
    const phase = typeof FIRST_RUN_SEQ !== 'undefined' ? FIRST_RUN_SEQ.phase : null;
    const title = document.title;
    const devMode = document.body.classList.contains('developer-mode');
    const openCount = [wizardOpen, backupOpen, coachFraming || coachOpen].filter(Boolean).length;
    return { wizardOpen, backupOpen, coachFraming, coachOpen, coachAmbient, phase, title, devMode, openCount };
  });
}

async function main() {
  const browser = await chromium.launch({
    headless: true,
    executablePath: process.env.CHROME_PATH || '/usr/local/bin/google-chrome',
    args: ['--no-sandbox', '--disable-dev-shm-usage']
  });
  const context = await browser.newContext({ viewport: { width: 1440, height: 900 } });
  const page = await context.newPage();

  // Clear storage before first paint via init script
  await context.addInitScript(() => {
    try { localStorage.clear(); sessionStorage.clear(); } catch (e) {}
  });

  await page.goto(BASE, { waitUntil: 'domcontentloaded', timeout: 60000 });

  // Wipe IDB after load start as well (sqlite DB)
  await page.evaluate(async () => {
    try {
      if (indexedDB && indexedDB.databases) {
        const dbs = await indexedDB.databases();
        await Promise.all((dbs || []).map(d => new Promise((res) => {
          const req = indexedDB.deleteDatabase(d.name);
          req.onsuccess = req.onerror = req.onblocked = () => res();
        })));
      }
    } catch (e) {}
    try { localStorage.clear(); sessionStorage.clear(); } catch (e) {}
  });

  // Hard reload for true first-run
  await page.reload({ waitUntil: 'domcontentloaded', timeout: 60000 });

  // Wait for coordinator to start
  await page.waitForFunction(() => typeof FIRST_RUN_SEQ !== 'undefined' && FIRST_RUN_SEQ.started, null, { timeout: 20000 }).catch(() => {});

  const samples = [];
  for (let i = 0; i < 12; i++) {
    await page.waitForTimeout(350);
    const s = await overlayState(page);
    samples.push({ t: i * 350, ...s });
    if (s.openCount > 1) {
      await page.screenshot({ path: path.join(artifacts, 'firstrun_stack_FAIL.png'), fullPage: false });
      console.error('STACK DETECTED', s);
      console.error(JSON.stringify(samples, null, 2));
      await browser.close();
      process.exit(1);
    }
  }

  const afterBoot = samples[samples.length - 1];
  await page.screenshot({ path: path.join(artifacts, 'firstrun_after_boot.png'), fullPage: false });

  // Dismiss backup if present, then capture wizard-only
  const mid = await overlayState(page);
  if (mid.backupOpen) {
    await page.screenshot({ path: path.join(artifacts, 'firstrun_01_backup_only.png'), fullPage: false });
    // Remind me later
    const cancel = page.locator('.cov-modal-overlay--open [data-cov="cancel"], .cov-modal-overlay--open button:has-text("Remind me later")').first();
    if (await cancel.count()) await cancel.click();
    await page.waitForTimeout(600);
  }

  let afterBackup = await overlayState(page);
  if (afterBackup.wizardOpen) {
    await page.screenshot({ path: path.join(artifacts, 'firstrun_02_wizard_only.png'), fullPage: false });
    // Ensure backup is gone while wizard open
    if (afterBackup.backupOpen || afterBackup.coachFraming || afterBackup.coachOpen) {
      console.error('Stacked after dismissing backup', afterBackup);
      await browser.close();
      process.exit(1);
    }
    // Skip wizard
    const skip = page.locator('#wizard-modal.open .wz-skip, #wizard-modal.open button:has-text("Skip")').first();
    if (await skip.count()) await skip.click();
    else await page.evaluate(() => { if (typeof closeSetupWizard === 'function') closeSetupWizard(true); });
    await page.waitForTimeout(700);
  }

  const afterWizard = await overlayState(page);
  await page.screenshot({ path: path.join(artifacts, 'firstrun_03_after_wizard.png'), fullPage: false });

  // Coach framing should NOT auto-open after wizard; ambient is OK
  if (afterWizard.wizardOpen || afterWizard.backupOpen || afterWizard.coachFraming || afterWizard.coachOpen) {
    console.error('Unexpected primary overlay after wizard', afterWizard);
    await browser.close();
    process.exit(1);
  }

  // Title / developer gate
  if (/Developer Editable/i.test(afterWizard.title) || afterWizard.devMode) {
    console.error('Developer chrome still on for default first-run', afterWizard);
    await browser.close();
    process.exit(1);
  }

  // Max openCount across samples must be <= 1
  const maxOpen = Math.max(...samples.map(s => s.openCount), afterBackup.openCount, afterWizard.openCount);
  console.log(JSON.stringify({
    ok: true,
    maxOpen,
    phases: samples.map(s => s.phase),
    final: afterWizard,
    artifacts: fs.readdirSync(artifacts).filter(f => f.startsWith('firstrun_'))
  }, null, 2));

  await browser.close();
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
