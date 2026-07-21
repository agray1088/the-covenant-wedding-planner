const fs = require('fs');
const path = require('path');
const cssDir = path.join(__dirname, '..', 'css');
for (const file of fs.readdirSync(cssDir).filter(f => f.endsWith('.css'))) {
  const text = fs.readFileSync(path.join(cssDir, file), 'utf8');
  const blocks = text.split(/\}(?=\s*[\.\#@a-z])/);
  blocks.forEach(block => {
    if (!/\.panel/.test(block) || !/display\s*:/.test(block)) return;
    const sel = block.split('{')[0].trim().replace(/\s+/g, ' ');
    const disp = (block.match(/display\s*:\s*([^;!]+)/) || [])[1];
    if (disp) console.log(`${file}: ${sel} => display:${disp.trim()}`);
  });
}
