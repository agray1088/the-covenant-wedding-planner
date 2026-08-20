import { chromium } from 'playwright';

const url = process.argv[2] || 'http://localhost:13579/index.html';

const browser = await chromium.launch({ headless: true });
const page = await browser.newPage({ viewport: { width: 1440, height: 960 } });
const errors = [];
page.on('pageerror', (err) => errors.push('pageerror: ' + err.message));
page.on('console', (msg) => { if (msg.type() === 'error') errors.push('console: ' + msg.text()); });

await page.goto(url, { waitUntil: 'networkidle', timeout: 120000 });
await page.waitForFunction(() => typeof window.showPanel === 'function', null, { timeout: 120000 });

const panels = ['instructions', 'guide', 'faq'];
const results = {};
for (const id of panels) {
  await page.evaluate((p) => showPanel(p), id);
  await page.waitForTimeout(150);
  results[id] = await page.evaluate((p) => {
    const panel = document.getElementById('panel-' + p);
    return {
      active: panel?.classList.contains('active'),
      hasPagehead: !!panel?.querySelector('.rd-pagehead'),
      title: panel?.querySelector('.rd-pagehead__title')?.textContent,
      hasRail: !!document.getElementById('planner-sidebar-context')?.querySelector('[data-page-rail="' + p + '"]'),
      railSectionCount: document.querySelectorAll('#planner-sidebar-context [data-page-rail="' + p + '"] .rd-rail__section').length,
      subnavNote: document.querySelector('.rd-subnav__note')?.textContent || null,
      bodyHtmlLength: panel?.innerHTML.length
    };
  }, id);
}

// Get Started specifics
await page.evaluate(() => showPanel('instructions'));
await page.waitForTimeout(150);
results.instructionsDetail = await page.evaluate(() => {
  const panel = document.getElementById('panel-instructions');
  return {
    stepCount: panel.querySelectorAll('.rd-step').length,
    hasLoadSampleBtn: !!panel.querySelector('[onclick*="loadSampleData()"]'),
    hasDownloadBackupBtn: !!panel.querySelector('[onclick*="downloadSqliteBackup()"]'),
    hasStatStrip: !!panel.querySelector('.rd-stats'),
    hasToolbar: !!panel.querySelector('.rd-toolbar'),
    hasBulkbar: !!panel.querySelector('.rd-bulkbar'),
    hasDrawer: !!panel.querySelector('.rd-drawer'),
    progressText: panel.querySelector('.rd-progressmeter__top')?.textContent
  };
});

// Guide specifics
await page.evaluate(() => showPanel('guide'));
await page.waitForTimeout(150);
results.guideDetail = await page.evaluate(() => {
  const panel = document.getElementById('panel-guide');
  return {
    rowCount: panel.querySelectorAll('.rd-table--guide tbody tr:not(.is-group)').length,
    groupCount: panel.querySelectorAll('.rd-table--guide tbody tr.is-group').length,
    hasViewSwitch: !!panel.querySelector('.rd-viewswitch'),
    hasSearch: !!panel.querySelector('.rd-search-input'),
    hasDrawer: !!panel.querySelector('.rd-drawer')
  };
});
await page.evaluate(() => window.rdGuideSetView('print'));
await page.waitForTimeout(150);
results.guidePrintDetail = await page.evaluate(() => {
  const panel = document.getElementById('panel-guide');
  return {
    hasPrintsheet: !!panel.querySelector('.rd-printsheet__paper'),
    colCount: panel.querySelectorAll('.rd-printsheet__col').length
  };
});
await page.evaluate(() => window.rdGuideSetView('table'));

// FAQ specifics
await page.evaluate(() => showPanel('faq'));
await page.waitForTimeout(150);
results.faqDetail = await page.evaluate(() => {
  const panel = document.getElementById('panel-faq');
  return {
    itemCount: panel.querySelectorAll('.rd-faq__item').length,
    chipCount: panel.querySelectorAll('.rd-toolbar .rd-chip').length,
    hasAside: !!panel.querySelector('.rd-faq-aside'),
    hasSearch: !!panel.querySelector('.rd-search-input'),
    hasDrawer: !!panel.querySelector('.rd-drawer')
  };
});
// toggle first FAQ item + category filter
await page.evaluate(() => { window.rdFaqToggle(0); window.rdFaqSetCat('Numbers'); });
await page.waitForTimeout(150);
results.faqInteraction = await page.evaluate(() => {
  const panel = document.getElementById('panel-faq');
  return {
    afterFilterCount: panel.querySelectorAll('.rd-faq__item').length,
    activeChip: panel.querySelector('.rd-chip.is-active')?.textContent?.trim()
  };
});

console.log(JSON.stringify({ results, errors }, null, 2));
await browser.close();
