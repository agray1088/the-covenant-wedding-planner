const fs = require('fs');
const path = require('path');
const html = fs.readFileSync(path.join(__dirname, '..', 'index.html'), 'utf8');
const ids = ['panel-tasks', 'panel-catering', 'panel-guests', 'panel-timeline'];
const stack = [];
const parents = {};
const re = /<(\/?)div\b[^>]*(?:id="([^"]+)")?[^>]*>/gi;
let m;
while ((m = re.exec(html))) {
  if (m[1] === '') {
    stack.push(m[2] || null);
    if (m[2] && m[2].startsWith('panel-')) {
      parents[m[2]] = stack.slice(0, -1).filter(Boolean);
    }
  } else {
    stack.pop();
  }
}
for (const id of ids) {
  console.log(id + ' parents:', (parents[id] || []).join(' > ') || '(none)');
}
const tasksIdx = html.indexOf('id="panel-tasks"');
const cateringIdx = html.indexOf('id="panel-catering"');
console.log('tasks before catering:', tasksIdx < cateringIdx);
const tasksSlice = html.slice(tasksIdx, tasksIdx + 5000);
console.log('catering refs inside panel-tasks slice:', (tasksSlice.match(/catering|cat-title|Menu Builder|cwp-menu/gi) || []).length);
