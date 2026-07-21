import { chromium } from 'playwright';

const url = process.argv[2] || 'http://localhost:13203/index.html';

async function snapshot(page, label) {
  return page.evaluate((label) => {
    const tasks = document.getElementById('panel-tasks');
    const catering = document.getElementById('panel-catering');
    const cs = (el) => el ? getComputedStyle(el).display : null;
    const visible = (el) => {
      if (!el) return false;
      const st = getComputedStyle(el);
      if (st.display === 'none' || st.visibility === 'hidden' || st.opacity === '0') return false;
      const r = el.getBoundingClientRect();
      return r.width > 0 && r.height > 0;
    };
    const texts = (root, sel) => root ? [...root.querySelectorAll(sel)].filter(visible).map(el => el.textContent.trim().slice(0, 80)) : [];
    return {
      label,
      activePanel: document.body.getAttribute('data-active-panel'),
      tasksDisplay: cs(tasks),
      cateringDisplay: cs(catering),
      tasksText: tasks?.innerText?.slice(0, 500),
      cateringMarkersInTasks: texts(tasks, '.cat-title, .cat-table-section, #cwp-menu, #catering-stats, [data-cat-table]'),
      cwpTasksTitles: texts(tasks, '.cwp-section-title'),
      visibleCatTitles: texts(document, '.cat-title').filter(t => t.includes('Catering') || t.includes('Menu')),
      panelCatVisible: visible(catering),
      scrollY: window.scrollY,
      mainHeight: document.getElementById('main')?.scrollHeight
    };
  }, label);
}

const browser = await chromium.launch({ headless: true });
const page = await browser.newPage({ viewport: { width: 1400, height: 900 } });
await page.goto(url, { waitUntil: 'networkidle', timeout: 120000 });
await page.waitForFunction(() => typeof window.showPanel === 'function', null, { timeout: 120000 });

const results = [];
for (const step of [
  async () => { await page.evaluate(() => showPanel('tasks')); },
  async () => { await page.evaluate(() => window.scrollTo(0, document.body.scrollHeight)); },
  async () => { await page.evaluate(() => showPanel('catering')); },
  async () => { await page.evaluate(() => showPanel('tasks')); },
  async () => { await page.evaluate(() => window.scrollTo(0, document.body.scrollHeight)); },
]) {
  await step();
  await page.waitForTimeout(300);
  results.push(await snapshot(page, results.length + 1));
}

console.log(JSON.stringify(results, null, 2));
await browser.close();
