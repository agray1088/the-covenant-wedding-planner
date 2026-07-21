import { chromium } from 'playwright';

const url = process.argv[2] || 'http://localhost:13203/index.html';

const browser = await chromium.launch({ headless: true });
const page = await browser.newPage({ viewport: { width: 1400, height: 900 } });
await page.goto(url, { waitUntil: 'networkidle', timeout: 120000 });
await page.waitForFunction(() => typeof window.showPanel === 'function' && typeof window.data !== 'undefined', null, { timeout: 120000 });

await page.evaluate(() => {
  data.menu = [
    { _id: 'MNU-1', course: 'Main', dish: 'Salmon', service: 'Plated', servings: 120, dietary: '', costBasis: '$45', unitCost: 45, status: 'Confirmed', notes: '' },
    { _id: 'MNU-2', course: 'Dessert', dish: 'Cake', service: 'Buffet', servings: 120, dietary: '', costBasis: 'Included', unitCost: 0, status: 'Idea', notes: '' }
  ];
  data.beverages = [{ _id: 'BEV-1', barType: 'Open Bar', name: 'House wine', service: 'Bar', qty: 1, costBasis: '$2000', unitCost: 2000, included: false, specialty: true, status: 'Confirmed', notes: '' }];
  data.tasks = [
    { _id: 'TSK-1', task: 'Book caterer', cat: 'Catering', phase: '6-9 Months Before', priority: 'High', date: '', suggestedDue: '', status: 'In Progress', assigned: 'Both', notes: '', subtasks: [] },
    { _id: 'TSK-2', task: 'Menu tasting', cat: 'Catering', phase: '3 Months Before', priority: 'Medium', date: '', suggestedDue: '', status: 'Not Started', assigned: 'Bride', notes: '', subtasks: [] }
  ];
  if (typeof renderTasks === 'function') renderTasks();
  if (typeof renderCateringPage === 'function') renderCateringPage();
  showPanel('tasks');
});

await page.waitForTimeout(500);

const report = await page.evaluate(() => {
  const tasks = document.getElementById('panel-tasks');
  const vis = (el) => {
    if (!el) return false;
    const st = getComputedStyle(el);
    if (st.display === 'none' || st.visibility === 'hidden') return false;
    const r = el.getBoundingClientRect();
    return r.width > 0 && r.height > 0;
  };
  const allCatSections = [...document.querySelectorAll('[data-cat-table], .cat-table-section, #cwp-menu, #cwp-beverages, .cat-top-grid')];
  return {
    activePanel: document.body.getAttribute('data-active-panel'),
    tasksDisplay: tasks ? getComputedStyle(tasks).display : null,
    cateringDisplay: getComputedStyle(document.getElementById('panel-catering')).display,
    visibleCatSections: allCatSections.filter(vis).map(el => ({
      id: el.id,
      cls: el.className,
      panel: el.closest('.panel')?.id,
      inTasks: tasks?.contains(el)
    })),
    tasksHTMLMarkers: {
      cwpMenu: !!tasks?.querySelector('#cwp-menu'),
      catTopGrid: !!tasks?.querySelector('.cat-top-grid'),
      catTableSection: tasks?.querySelectorAll('[data-cat-table]').length || 0
    },
    tasksBottomHTML: tasks?.innerHTML.slice(-1200)
  };
});

console.log(JSON.stringify(report, null, 2));
await browser.close();
