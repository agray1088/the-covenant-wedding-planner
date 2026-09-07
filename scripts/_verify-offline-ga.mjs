#!/usr/bin/env node
/**
 * Static checks for honest single-device offline GA hardening.
 */
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const read = (p) => fs.readFileSync(path.join(root, p), 'utf8');
const issues = [];
function ok(label, cond) {
  if (!cond) issues.push(label);
}

const index = read('index.html');
const planner = read('js/planner.js');
const vp = read('js/vendor-portal.js');
const vn = read('js/vendor-redesign.js');
const pkt = read('js/packets-redesign.js');
const ship = read('SHIP_OFFLINE_GA.md');
const vpHtml = read('vendor-portal.html');

ok('ship title default', /<title>The Covenant Wedding Planner<\/title>/.test(index));
ok('dev mode gated', /covenant_developer_mode/.test(index) && /params\.get\('dev'\)/.test(index));
ok('production title reset when not dev', /document\.title = 'The Covenant Wedding Planner'/.test(index));
ok('no Developer Editable title by default path', !/<title>[^<]*Developer Editable/.test(index));
ok('Preview Mode local presenting copy', /Lock editing for presenting on this device/.test(index));
ok('partner handoff clarifies local packet links', /local previews, not hosted multi-device/.test(index));

ok('Live packet label softened', /From your planner:/.test(planner));
ok('no Live packet: label', !/<strong>Live packet:<\/strong>/.test(planner));

ok('vendor portal offline notes', /OFFLINE_LOCAL_NOTE/.test(vp) && /OFFLINE_DEMO_NOTE/.test(vp));
ok('vendor portal demo flag', /isDemo:\s*true/.test(vp));
ok('vendor portal no live-records banner claim', !/live records, not a copy/.test(vp));
ok('vendor portal honest toasts', /Demo only — nothing was sent/.test(vp));
ok('dietary counts do not invent guests', !/covers \|\| 142/.test(vp));

ok('vendor page local/demo banner', /Local \/ demo only/.test(vn));
ok('vendor open button labeled local', /Open local portal preview/.test(vn));

ok('packet links are local portal paths', /vendor-portal\.html\?g=/.test(pkt));
ok('packet mode copy is linked-local', /Linked — refreshes from this device/.test(pkt));
ok('packet empty state honest handoff', /print or save a PDF for handoff/.test(pkt));

ok('SHIP_OFFLINE_GA.md present', /single-device offline GA/.test(ship));
ok('SHIP lists Postgres later', /Postgres/.test(ship));
ok('cache-bust offline-ga01 planner', /planner\.js\?v=offline-ga01/.test(index));
ok('vendor-portal.html cache-bust', /vendor-portal\.js\?v=offline-ga01/.test(vpHtml));

/* Demo seeds must stay gated (do not re-enable). */
ok('packets master seed gated', /Demo fiction is opt-in via Load sample data only/.test(pkt));

if (issues.length) {
  console.error('offline-ga verify FAILED:');
  issues.forEach((i) => console.error(' -', i));
  process.exit(1);
}
console.log('offline-ga verify ok (' + [
  'prod defaults',
  'honest copy',
  'vendor portal labeling',
  'packet local links',
  'ship checklist'
].join(', ') + ')');
