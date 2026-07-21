import { chromium, devices } from 'playwright';

const url = process.argv[2] || 'http://localhost:13203/index.html';

async function check(page, label) {
  return page.evaluate((label) => {
    const tasks = document.getElementById('panel-tasks');
    const catering = document.getElementById('panel-catering');
    const vis = (el) => {
      if (!el) return false;
      const st = getComputedStyle(el);
      if (st.display === 'none' || st.visibility === 'hidden') return false;
      const r = el.getBoundingClientRect();
      return r.width > 0 && r.height > 0;
    };
    const findBleed = () => {
      const markers = [...document.querySelectorAll('#main .cat-title, #main [data-cat-table], #main #cwp-menu, #main #catering-stats')];
      return markers.filter(el => {
        const panel = el.closest('.panel');
        return vis(el) && document.body.getAttribute('data-active-panel') === 'tasks' && panel?.id === 'panel-catering';
      }).map(el => ({ id: el.id, cls: el.className, panel: el.closest('.panel')?.id, text: el.textContent?.trim().slice(0, 60) }));
    };
    return {
      label,
      layout: document.body.className,
      activePanel: document.body.getAttribute('data-active-panel'),
      tasksDisplay: tasks ? getComputedStyle(tasks).display : null,
      cateringDisplay: catering ? getComputedStyle(catering).display : null,
      bleed: findBleed(),
      catTitleVisibleAnywhere: [...document.querySelectorAll('.cat-title')].filter(vis).map(el => ({ panel: el.closest('.panel')?.id, text: el.textContent?.trim().slice(0,40) }))
    };
  }, label);
}

const browser = await chromium.launch({ headless: true });
const contexts = [
  ['desktop', null],
  ['iphone', devices['iPhone 13']],
  ['ipad-landscape', devices['iPad Pro 11 landscape']]
];

for (const [name, device] of contexts) {
  const context = device ? await browser.newContext({ ...device }) : await browser.newContext({ viewport: { width: 1400, height: 900 } });
  const page = await context.newPage();
  await page.goto(url, { waitUntil: 'networkidle', timeout: 120000 });
  await page.waitForFunction(() => typeof window.showPanel === 'function', null, { timeout: 120000 });
  await page.evaluate(() => showPanel('tasks'));
  await page.waitForTimeout(500);
  console.log(name, JSON.stringify(await check(page, name), null, 2));
  await context.close();
}
await browser.close();
