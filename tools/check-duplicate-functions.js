#!/usr/bin/env node
/*
 * check-duplicate-functions.js
 *
 * Guards against last-wins duplicate-declaration bloat in js/planner.js.
 *
 * When the same `function NAME(){...}` is declared more than once at the top
 * level of a single script, JavaScript hoists all of them and the LAST
 * declaration silently overwrites the earlier ones at runtime. The earlier
 * declarations are therefore dead code that only inflates the file and invites
 * confusion. This checker fails CI whenever such duplicate top-level function
 * declarations exist so they get cleaned up (keeping the last, removing the
 * earlier duplicates is behavior-preserving by definition).
 *
 * No dependencies. Run from the build root:  node "tools/check-duplicate-functions.js"
 */

'use strict';

const fs = require('fs');
const path = require('path');

const TARGET = path.resolve(__dirname, '..', 'js', 'planner.js');

// Anchored at column 0 (no leading whitespace) so we only match top-level
// function declarations, never indented nested/inner functions or methods.
const TOP_LEVEL_FN = /^function\s+([A-Za-z_$][\w$]*)\s*\(/;

function main() {
  let source;
  try {
    source = fs.readFileSync(TARGET, 'utf8');
  } catch (err) {
    console.error(`Unable to read ${TARGET}: ${err.message}`);
    process.exit(2);
  }

  const lines = source.split(/\r?\n/);
  const occurrences = new Map(); // name -> [lineNumber, ...]

  for (let i = 0; i < lines.length; i++) {
    const match = TOP_LEVEL_FN.exec(lines[i]);
    if (match) {
      const name = match[1];
      if (!occurrences.has(name)) occurrences.set(name, []);
      occurrences.get(name).push(i + 1); // 1-based line numbers
    }
  }

  const duplicates = [];
  for (const [name, linesList] of occurrences) {
    if (linesList.length >= 2) {
      duplicates.push({ name, lines: linesList });
    }
  }

  if (duplicates.length === 0) {
    console.log('NO DUPLICATE TOP-LEVEL FUNCTIONS');
    process.exit(0);
  }

  duplicates.sort((a, b) => a.lines[0] - b.lines[0]);

  console.log('DUPLICATES FOUND');
  console.log(`${duplicates.length} function name(s) declared 2+ times at top level:\n`);
  for (const dup of duplicates) {
    console.log(`  ${dup.name} (${dup.lines.length}x) -> lines ${dup.lines.join(', ')}`);
  }
  process.exit(1);
}

main();
