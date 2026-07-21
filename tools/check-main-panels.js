const fs = require('fs');
const path = require('path');
const html = fs.readFileSync(path.join(__dirname, '..', 'index.html'), 'utf8');
const mainMatch = html.match(/<main id="main">([\s\S]*?)<\/main>/);
if (!mainMatch) { console.log('no main'); process.exit(1); }
const main = mainMatch[1];
const panels = [...main.matchAll(/<div id="(panel-[^"]+)" class="panel[^"]*">/g)].map(m => m[1]);
console.log('panels under main:', panels.length);
console.log(panels.join('\n'));
// check if any panel id appears inside another panel's content by line positions
const lines = html.split('\n');
const panelLines = {};
lines.forEach((line, i) => {
  const m = line.match(/id="(panel-[^"]+)"/);
  if (m) panelLines[m[1]] = i + 1;
});
const sorted = Object.entries(panelLines).sort((a,b)=>a[1]-b[1]);
for (let i = 0; i < sorted.length - 1; i++) {
  const [id, start] = sorted[i];
  const [nextId, nextStart] = sorted[i+1];
  const slice = lines.slice(start - 1, nextStart - 1).join('\n');
  const nested = [...slice.matchAll(/id="(panel-[^"]+)"/g)].map(m => m[1]).filter(x => x !== id);
  if (nested.length) console.log(`${id} contains nested panels:`, nested);
}
