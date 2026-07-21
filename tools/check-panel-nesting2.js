const fs = require('fs');
const path = require('path');
const html = fs.readFileSync(path.join(__dirname, '..', 'index.html'), 'utf8');
const mainStart = html.indexOf('id="main"');
const mainSlice = html.slice(mainStart, mainStart + 250000);

const stack = [];
const panelParents = {};
const re = /<\/?([a-zA-Z][a-zA-Z0-9]*)[^>]*?(?:id="([^"]+)")?[^>]*>/g;
let m;
while ((m = re.exec(mainSlice))) {
  const tag = m[1].toLowerCase();
  const id = m[2];
  const isClose = m[0].startsWith('</');
  if (isClose) {
    if (stack.length && stack[stack.length - 1].tag === tag) stack.pop();
    else {
      // mismatched close - pop until match or empty
      const idx = stack.map(s => s.tag).lastIndexOf(tag);
      if (idx >= 0) stack.splice(idx);
    }
  } else if (!/\/>$/.test(m[0]) && !['meta','link','input','img','br','hr','source','option','symbol','path','circle','rect','use','button'].includes(tag)) {
    stack.push({ tag, id: id || null });
    if (id && id.startsWith('panel-')) {
      panelParents[id] = stack.slice(0, -1).map(s => s.id || s.tag).filter(Boolean);
    }
  }
}

['panel-tasks', 'panel-catering', 'panel-guests', 'panel-timeline', 'panel-venue'].forEach(id => {
  console.log(id + ' ancestors:', (panelParents[id] || []).join(' > ') || '(direct under main)');
});

// Check if panel-catering is descendant of panel-tasks
const tasksAncestors = panelParents['panel-catering'] || [];
console.log('catering inside tasks?', tasksAncestors.includes('panel-tasks'));

// Unclosed tags at end
console.log('unclosed stack depth:', stack.length);
if (stack.length) console.log('unclosed:', stack.slice(-5).map(s => (s.id || s.tag)).join(', '));
