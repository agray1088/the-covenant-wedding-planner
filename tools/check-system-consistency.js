const fs = require('fs');
const path = require('path');

const devRoot = path.resolve(__dirname, '..');
const packageRoot = path.resolve(devRoot, '..');
const indexPath = path.join(devRoot, 'index.html');
const plannerPath = path.join(devRoot, 'js', 'planner.js');
const componentsPath = path.join(devRoot, 'css', 'planner-components.css');
const customerPath = path.join(packageRoot, '02 Customer Download Version', 'The Covenant Wedding Planner - Customer Download.html');

function read(file) {
  return fs.existsSync(file) ? fs.readFileSync(file, 'utf8') : '';
}

const index = read(indexPath);
const planner = read(plannerPath);
const components = read(componentsPath);
const customer = read(customerPath);
const issues = [];

const registryBlock = planner.match(/const SYSTEM_PAGE_REGISTRY\s*=\s*\{([\s\S]*?)\n\};\s*const SYSTEM_STATUS_SEMANTICS/);
const navBlock = planner.match(/const NAV_CATEGORIES\s*=\s*\[([\s\S]*?)\n\];/);
if (!registryBlock || !navBlock) {
  issues.push('Unable to inspect navigation/page registry blocks');
} else {
  const registryIds = new Set([...registryBlock[1].matchAll(/^\s*(?:'([^']+)'|([A-Za-z][\w-]*))\s*:/gm)].map(m => m[1] || m[2]));
  const navCategoryIds = new Set(['start-here', 'start-planning', 'planning', 'finances', 'venue-vendors', 'people', 'ceremony', 'design', 'after', 'rhythms']);
  const navIds = [...navBlock[1].matchAll(/\{\s*id:\s*'([^']+)'/g)]
    .map(m => m[1] === 'plan' ? 'tasks' : m[1])
    .filter(id => id !== 'ui-system' && !navCategoryIds.has(id));
  const missingNav = [...new Set(navIds)].filter(id => !registryIds.has(id));
  if (missingNav.length) issues.push(`Navigation pages missing from registry: ${missingNav.join(', ')}`);
}

const tablesBlock = planner.match(/\s*const TABLES\s*=\s*\{([\s\S]*?)\n\s*\};[\s\S]*?const CWP_NO_BULK/);
if (!tablesBlock) {
  issues.push('Unable to inspect CWP table descriptor block');
} else {
  const tableLines = tablesBlock[1].split(/\r?\n/);
  const tableStarts = tableLines.map((line, index) => ({ line, index })).filter(({ line }) => /^\s{4}[A-Za-z][\w]*\s*:\s*\{/.test(line));
  const missingBulk = tableStarts.filter((entry, index) => {
    const end = index + 1 < tableStarts.length ? tableStarts[index + 1].index : tableLines.length;
    return !tableLines.slice(entry.index, end).some(line => /\bbulk\s*:/.test(line));
  }).map(({ line }) => line.trim().replace(/\s*:\s*\{$/, ''));
  if (missingBulk.length) issues.push(`CWP tables missing explicit bulk descriptors: ${missingBulk.join(', ')}`);
}

[
  ['developer-mode body flag in developer source', /<body[^>]+class="[^"]*\bdeveloper-mode\b/.test(index)],
  ['developer UI System panel in developer source', /id="panel-ui-system"/.test(index)],
  ['page registry in planner.js', /const SYSTEM_PAGE_REGISTRY\s*=/.test(planner)],
  ['bulk registry helper in planner.js', /function getSystemBulkActionRegistry\(\)/.test(planner)],
  ['panel renderer registry in planner.js', /const SYSTEM_PANEL_RENDERERS\s*=/.test(planner)],
  ['Batch 1 tracker contract in UI System panel', /Batch 1 Tracker Contract/.test(index)],
  ['inline tracker editor helper in planner.js', /function covInlineLoad\(/.test(planner) && /function saveInlineRecordEditor\(/.test(planner)],
  ['read-only preview row binding in planner.js', /function bindRoPreviewInline\(/.test(planner)],
  ['Guest tracker contract shell', /guest-inline-editor-body/.test(planner) && /id="cwp-guests" class="ro-preview"/.test(planner)],
  ['Payment tracker contract shell', /payment-inline-editor-body/.test(planner) && /id="cwp-payments" class="ro-preview"/.test(planner)],
  ['RO preview overlay allows row selection', /\.ro-preview::after[\s\S]*pointer-events:\s*none/.test(components)],
  ['customer rebundle strips dev-only blocks', /Remove-DevOnlyBlocks/.test(read(path.join(packageRoot, '03 Tools', 'Rebundle Developer Version.ps1')))]
].forEach(([label, ok]) => {
  if (!ok) issues.push(`Missing: ${label}`);
});

if (customer) {
  ['developer-mode', 'dev-only', 'panel-ui-system', 'DEV-ONLY-START', 'DEV-ONLY-END'].forEach(token => {
    if (customer.includes(token)) issues.push(`Customer bundle still contains ${token}`);
  });
}

if (issues.length) {
  console.error('System consistency check failed:');
  issues.forEach(issue => console.error(`- ${issue}`));
  process.exit(1);
}

console.log('System consistency check passed.');
