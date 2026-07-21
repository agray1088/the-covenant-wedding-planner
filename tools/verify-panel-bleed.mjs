import { chromium } from 'playwright';

const url = process.argv[2] || 'http://localhost:13203/index.html';

const browser = await chromium.launch({ headless: true });
const page = await browser.newPage({ viewport: { width: 1400, height: 900 } });
await page.goto(url, { waitUntil: 'networkidle', timeout: 120000 });
await page.waitForFunction(() => typeof window.showPanel === 'function', null, { timeout: 120000 });
await page.evaluate(() => showPanel('tasks'));

const report = await page.evaluate(() => {
  const tasks = document.getElementById('panel-tasks');
  const catering = document.getElementById('panel-catering');
  const cs = (el) => el ? getComputedStyle(el).display : null;
  const cateringInsideTasks = tasks ? !!tasks.querySelector('#panel-catering, #cwp-menu, .cat-title, [data-cat-table]') : false;
  const menuInTasks = tasks ? tasks.querySelectorAll('.cat-title, [data-cat-table], #cwp-menu, #catering-stats').length : 0;
  return {
    activePanel: document.body.getAttribute('data-active-panel'),
    tasksActive: tasks?.classList.contains('active'),
    cateringActive: catering?.classList.contains('active'),
    tasksDisplay: cs(tasks),
    cateringDisplay: cs(catering),
    cateringInsideTasks,
    menuMarkersInTasks: menuInTasks,
    tasksChildPanels: tasks ? [...tasks.querySelectorAll('.panel')].map(p => p.id) : [],
    cateringIsDescendantOfTasks: catering ? tasks?.contains(catering) : false,
    visibleCateringTitles: [...document.querySelectorAll('.cat-title, .cat-table-section')].filter(el => {
      const p = el.closest('.panel');
      return p && getComputedStyle(p).display !== 'none' && getComputedStyle(el).display !== 'none';
    }).map(el => ({ text: el.textContent?.trim().slice(0, 60), panel: el.closest('.panel')?.id }))
  };
});

console.log(JSON.stringify(report, null, 2));
await browser.close();
