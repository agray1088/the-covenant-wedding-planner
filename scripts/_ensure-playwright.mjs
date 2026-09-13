/**
 * Ensure root `playwright` package + Chromium browser are available
 * before second-device / other Playwright verify scripts run.
 *
 * On missing package, prints exact Windows CMD setup steps and exits 1.
 * Chromium install is idempotent (safe to re-run).
 */
import { spawnSync } from 'child_process';
import { createRequire } from 'module';
import { dirname, join } from 'path';
import { existsSync } from 'fs';

const SETUP_HINT = `
Cannot find package 'playwright' (required for verify:second-device).

From the repo root in Windows CMD:

  npm install
  npx playwright install chromium
  docker compose up -d
  npm run verify:second-device

Keep docker compose up so the sync API stays on host :18787.
`.trim();

function playwrightRequire() {
  return createRequire(import.meta.url);
}

export function ensurePlaywrightPackage() {
  try {
    playwrightRequire().resolve('playwright/package.json');
    return true;
  } catch {
    console.error(SETUP_HINT);
    return false;
  }
}

function resolvePlaywrightCli() {
  const require = playwrightRequire();
  const pkgJson = require.resolve('playwright/package.json');
  const cli = join(dirname(pkgJson), 'cli.js');
  if (!existsSync(cli)) {
    throw new Error('playwright cli.js not found next to package.json at ' + cli);
  }
  return cli;
}

export function ensurePlaywrightChromium() {
  let cli;
  try {
    cli = resolvePlaywrightCli();
  } catch (e) {
    console.error(SETUP_HINT);
    console.error(String(e && e.message ? e.message : e));
    return false;
  }

  console.log('Ensuring Playwright Chromium is installed…');
  const result = spawnSync(process.execPath, [cli, 'install', 'chromium'], {
    stdio: 'inherit',
    env: process.env
  });
  if (result.status !== 0) {
    console.error('Failed to install Playwright Chromium. From the repo root:');
    console.error('  npx playwright install chromium');
    return false;
  }
  return true;
}

const isDirectRun = process.argv[1] &&
  (process.argv[1].endsWith('_ensure-playwright.mjs') ||
   process.argv[1].endsWith('_ensure-playwright.js'));

if (isDirectRun) {
  if (!ensurePlaywrightPackage() || !ensurePlaywrightChromium()) {
    process.exit(1);
  }
}
