/* Rewrites the GEN block in sw.js: versioned precache list derived from index.html
   (script src / link href), plus wasm, manifest and icons. config.js is listed but
   excluded from the version hash (it is generated per deploy and served network-first).
   Usage: node scripts/gen-sw-manifest.mjs [--check] */
import fs from 'node:fs';
import path from 'node:path';
import crypto from 'node:crypto';
import { fileURLToPath } from 'node:url';

const ROOT = path.resolve(process.env.SW_ROOT || path.join(path.dirname(fileURLToPath(import.meta.url)), '..'));
const SW = path.join(ROOT, 'sw.js');
const PAGES = ['index.html', 'vendor-portal.html'];
const LOCAL = /^(?!([a-z]+:)?\/\/)(?!data:)(?!#)/i;

const set = new Set(['./', ...PAGES, 'config.js', 'manifest.webmanifest', 'js/vendor/sql-wasm.wasm']);
for (const page of PAGES) {
  const html = fs.readFileSync(path.join(ROOT, page), 'utf8').replace(/<!--[\s\S]*?-->/g, '');
  const re = /<(?:script|link)\b[^>]*?\b(?:src|href)\s*=\s*"([^"]+)"[^>]*>/gi;
  let m;
  while ((m = re.exec(html))) {
    const tag = m[0];
    if (/<link\b/i.test(tag) && !/rel\s*=\s*"(stylesheet|manifest|apple-touch-icon|icon)"/i.test(tag)) continue;
    const ref = m[1].split('#')[0].split('?')[0];
    if (!ref || !LOCAL.test(ref)) continue;
    set.add(ref.replace(/^\.\//, ''));
  }
}
for (const f of fs.readdirSync(path.join(ROOT, 'assets', 'icons'))) if (f.endsWith('.png')) set.add('assets/icons/' + f);

const list = [...set].sort();
const missing = list.filter((p) => p !== './' && !fs.existsSync(path.join(ROOT, p)));
if (missing.length) { console.error('Missing precache files:', missing); process.exit(1); }

const h = crypto.createHash('sha256');
for (const p of list) {
  h.update(p);
  if (p !== './' && p !== 'config.js') h.update(fs.readFileSync(path.join(ROOT, p)));
}
const version = h.digest('hex').slice(0, 12);

const block = `/* GEN:BEGIN */\nconst VERSION = '${version}';\nconst PRECACHE = ${JSON.stringify(list, null, 2)};\n/* GEN:END */`;
const src = fs.readFileSync(SW, 'utf8');
const next = src.replace(/\/\* GEN:BEGIN \*\/[\s\S]*?\/\* GEN:END \*\//, () => block);
if (process.argv.includes('--check')) {
  if (next !== src) { console.error('sw.js precache is stale - run: node scripts/gen-sw-manifest.mjs'); process.exit(1); }
  console.log('sw.js precache up to date (' + version + ')');
} else {
  fs.writeFileSync(SW, next);
  console.log(`sw.js: version ${version}, ${list.length} precache entries`);
}
