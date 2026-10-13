import fs from 'fs';

const html = fs.readFileSync('Redesign/Planner Screens Master.dc.html', 'utf8');
const m = html.match(/var SCREEN_HTML = (\{[\s\S]*?\});/);
if (!m) throw new Error('SCREEN_HTML not found');
const data = eval('(' + m[1] + ')');

function extract(id, sec) {
  const s = data[sec];
  const needle = 'id="' + id + '"';
  const idx = s.indexOf(needle);
  if (idx < 0) return null;
  const start = s.lastIndexOf('<div', idx);
  let depth = 0;
  let i = start;
  for (; i < s.length; i++) {
    if (s.slice(i, i + 4) === '<div') depth++;
    else if (s.slice(i, i + 6) === '</div>') {
      depth--;
      if (depth === 0) {
        i += 6;
        break;
      }
    }
  }
  return s.slice(start, i);
}

const screens = {
  '5a': 's02',
  '11c': 's35',
  '15a': 's35',
  '15b': 's36',
  '15c': 's36',
  '15d': 's36',
  '33i': 's36',
  '33j': 's36',
  '33k': 's31',
  '33l': 's31',
  '49a': 's39',
  '49b': 's39',
  '49c': 's39',
  '49d': 's39',
};

for (const [id, sec] of Object.entries(screens)) {
  const chunk = extract(id, sec);
  fs.writeFileSync('/tmp/mock-' + id + '.html', chunk || 'NOT FOUND');
  console.log(id, chunk ? chunk.length : 'NOT FOUND');
}
