#!/usr/bin/env node
/**
 * Static + logic checks for first-run overlay coordinator (firstrun-seq01).
 * Ensures boot no longer schedules backup / wizard / coach in parallel.
 */
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const planner = fs.readFileSync(path.join(root, 'js/planner.js'), 'utf8');
const index = fs.readFileSync(path.join(root, 'index.html'), 'utf8');
const issues = [];

function ok(label, cond) {
  if (!cond) issues.push(label);
}

ok('defines FIRST_RUN_SEQ', /var FIRST_RUN_SEQ\s*=/.test(planner));
ok('defines runFirstRunSequence', /async function runFirstRunSequence\(/.test(planner));
ok('defines scheduleFirstRunSequence', /function scheduleFirstRunSequence\(/.test(planner));
ok('defines firstRunPrimaryOverlayOpen', /function firstRunPrimaryOverlayOpen\(/.test(planner));
ok('closeSetupWizard notifies coordinator', /firstRunNotifyWizardClosed/.test(planner));
ok('boot calls scheduleFirstRunSequence', /scheduleFirstRunSequence\(\)/.test(planner));
ok('cache-bust offline-ga or firstrun', /planner\.js\?v=(offline-ga01|firstrun-seq01)/.test(index));
ok('shippable title default', /<title>The Covenant Wedding Planner<\/title>/.test(index));
ok('developer-mode gated at runtime', /covenant_developer_mode/.test(index) && /params\.get\('dev'\)/.test(index));
ok('developer-mode still in body source', /<body[^>]+class="[^"]*\bdeveloper-mode\b/.test(index));

/* Parallel boot paths must not remain as the primary path. */
const bootChunk = planner.slice(
  planner.indexOf('scheduleFirstRunSequence'),
  planner.indexOf('scheduleFirstRunSequence') + 2500
);
ok(
  'boot prefers coordinator over parallel timeouts',
  /scheduleFirstRunSequence\(\)/.test(bootChunk) &&
    !/maybeAutoOpenWizard\(\);\s*\n\s*setTimeout\(function\(\)\{\s*if \(typeof maybeStartCoach/.test(planner.replace(/\s+/g, ' '))
);

/* Overlay detector must recognize real wizard + covConfirm classes. */
ok(
  'overlay detector checks wizard-modal.open',
  /wizard-modal[\s\S]{0,80}classList\.contains\('open'\)/.test(planner) ||
    /#wizard-modal\.open/.test(planner)
);
ok(
  'overlay detector checks cov-modal-overlay--open',
  /cov-modal-overlay--open/.test(planner)
);
ok(
  'maybeStartCoach uses firstRunPrimaryOverlayOpen',
  /function maybeStartCoach\(\)\{[\s\S]*?firstRunPrimaryOverlayOpen/.test(planner)
);
ok(
  'backup modal refuses to stack',
  /function maybeShowBackupEducationModal[\s\S]*?firstRunPrimaryOverlayOpen/.test(planner)
);

/* Priority comments / phase order */
ok('phase backup before wizard', /phase = 'backup'[\s\S]*?phase = 'wizard'[\s\S]*?phase = 'coach'/.test(planner));

if (issues.length) {
  console.error('firstrun-seq verify FAILED:');
  issues.forEach((i) => console.error(' -', i));
  process.exit(1);
}
console.log('firstrun-seq verify ok (' + [
  'coordinator',
  'ordered phases',
  'overlay detectors',
  'cache-bust',
  'dev gate'
].join(', ') + ')');
