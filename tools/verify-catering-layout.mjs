import { chromium } from 'playwright';

const url = process.argv[2] || 'http://localhost:13203/index.html';
const browser = await chromium.launch({ headless: true });
const page = await browser.newPage({ viewport: { width: 1400, height: 900 } });
await page.goto(url, { waitUntil: 'domcontentloaded', timeout: 180000 });
await page.waitForFunction(() => typeof window.showPanel === 'function', null, { timeout: 180000 });
await page.evaluate(async () => {
  document.querySelector('.cov-modal-backdrop, .cov-modal-overlay, [data-cov-modal-close]')?.click?.();
  document.body.classList.remove('cov-modal-open');
  data.snacks = [
    { _id: 'SNK-1', item: 'Fruit tray', when: 'Getting ready', qty: 2, cost: 45, notes: '' },
    { _id: 'SNK-2', item: 'Granola bars', when: 'Pre-ceremony', qty: 24, cost: 2, notes: '' }
  ];
  data.vendorMeals = [
    { _id: 'VM-1', vendor: 'Photographer', count: 2, cost: 35, notes: 'Vegetarian' }
  ];
  data.menu = [{ _id: 'MNU-1', course: 'Main', dish: 'Salmon', service: 'Plated', servings: 120, dietary: '', costBasis: '$45', unitCost: 45, status: 'Confirmed', notes: '' }];
  if (typeof addSnackRow === 'function') {
    addSnackRow();
    addSnackRow();
  }
  if (typeof addVendorMealRow === 'function') addVendorMealRow();
  if (typeof renderCateringPage === 'function') renderCateringPage();
  showPanel('catering');
  await new Promise((r) => requestAnimationFrame(() => requestAnimationFrame(r)));
});
await page.waitForFunction(() => {
  const p = document.getElementById('panel-catering');
  return p && getComputedStyle(p).display !== 'none';
}, null, { timeout: 30000 });
await page.waitForTimeout(500);
await page.evaluate(() => {
  document.querySelector('[data-cat-table="snacks"]')?.scrollIntoView({ block: 'center' });
});
await page.waitForTimeout(300);

const report = await page.evaluate(() => {
  const measure = (tableSel, sectionSel) => {
    const table = document.querySelector(tableSel);
    if (!table) return { missing: tableSel };
    const wrap = table.closest('.cwp-table-wrap');
    const thead = table.querySelector('thead tr');
    const ths = thead ? [...thead.children] : [];
    const thSum = ths.reduce((s, th) => s + th.getBoundingClientRect().width, 0);
    const tr = table.querySelector('tbody tr');
    const tds = tr ? [...tr.children] : [];
    const tdSum = tds.reduce((s, td) => s + td.getBoundingClientRect().width, 0);
    const tableR = table.getBoundingClientRect();
    const theadR = thead?.getBoundingClientRect();
    const wrapR = wrap?.getBoundingClientRect();
    const lastTh = ths[ths.length - 1];
    const lastThR = lastTh?.getBoundingClientRect();
    const section = document.querySelector(sectionSel);
    const title = section?.querySelector('.cat-table-title');
    const icon = title?.querySelector('.cat-section-icon');
    const titleH3 = title?.querySelector('h3');
    const iconR = icon?.getBoundingClientRect();
    const h3R = titleH3?.getBoundingClientRect();
    const card = section?.querySelector('.cat-table-card');
    const theadBg = ths[0] ? getComputedStyle(ths[0]).backgroundColor : null;
    return {
      tableW: Math.round(tableR.width),
      wrapW: wrapR ? Math.round(wrapR.width) : null,
      cardW: card ? Math.round(card.getBoundingClientRect().width) : null,
      theadRowW: theadR ? Math.round(theadR.width) : null,
      thSum: Math.round(thSum),
      tdSum: Math.round(tdSum),
      thCount: ths.length,
      tdCount: tds.length,
      tableLayout: getComputedStyle(table).tableLayout,
      iconOverlap: iconR && h3R ? iconR.right > h3R.left + 2 : null,
      iconW: iconR ? Math.round(iconR.width) : null,
      h3Left: h3R ? Math.round(h3R.left) : null,
      iconRight: iconR ? Math.round(iconR.right) : null,
      titleGap: iconR && h3R ? Math.round(h3R.left - iconR.right) : null,
      titleGridCols: title ? getComputedStyle(title).gridTemplateColumns : null,
      gapRight: lastThR ? Math.round(tableR.right - lastThR.right) : null,
      thWidths: ths.map((th) => Math.round(th.getBoundingClientRect().width)),
      theadBg,
    };
  };
  const panel = document.getElementById('panel-catering');
  const main = document.getElementById('main');
  const snacksMount = document.getElementById('cwp-snacks');
  const walkHidden = (el) => {
    const chain = [];
    let node = el;
    while (node && node !== document.body) {
      const st = getComputedStyle(node);
      chain.push({
        tag: node.tagName.toLowerCase(),
        id: node.id || null,
        cls: (node.className || '').toString().slice(0, 60) || null,
        display: st.display,
        visibility: st.visibility,
        opacity: st.opacity,
        w: Math.round(node.getBoundingClientRect().width),
        h: Math.round(node.getBoundingClientRect().height),
      });
      node = node.parentElement;
    }
    return chain;
  };
  const snacksSection = document.querySelector('#panel-catering [data-cat-table="snacks"]');
  return {
    snacks: measure('#panel-catering #cwp-snacks .cwp-table', '#panel-catering [data-cat-table="snacks"]'),
    vendorMeals: measure('#panel-catering #cwp-vendorMeals .cwp-table', '#panel-catering [data-cat-table="vendorMeals"]'),
    snacksMountRect: snacksMount ? {
      w: Math.round(snacksMount.getBoundingClientRect().width),
      h: Math.round(snacksMount.getBoundingClientRect().height),
      html: snacksMount.innerHTML.slice(0, 200),
    } : null,
    snacksSectionRect: snacksSection ? {
      w: Math.round(snacksSection.getBoundingClientRect().width),
      h: Math.round(snacksSection.getBoundingClientRect().height),
      display: getComputedStyle(snacksSection).display,
      parentPanel: snacksSection.closest('.panel')?.id,
      inCatering: !!snacksSection,
      cateringSectionDisplay: snacksSection ? getComputedStyle(snacksSection).display : null,
      hiddenChain: snacksSection ? walkHidden(snacksSection) : null,
    } : null,
    panelDisplay: panel ? getComputedStyle(panel).display : null,
    panelActive: panel?.classList.contains('active'),
    panelRect: panel ? {
      w: Math.round(panel.getBoundingClientRect().width),
      h: Math.round(panel.getBoundingClientRect().height),
    } : null,
    mainRect: main ? {
      w: Math.round(main.getBoundingClientRect().width),
      h: Math.round(main.getBoundingClientRect().height),
      display: getComputedStyle(main).display,
    } : null,
    bodyClasses: document.body.className,
    activePanel: document.body.getAttribute('data-active-panel'),
  };
});

console.log(JSON.stringify(report, null, 2));
await browser.close();
