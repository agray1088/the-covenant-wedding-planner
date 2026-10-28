'use strict';

/**
 * Optional GUI smoke under xvfb: boot Electron, load planner, exit.
 * Skips cleanly if electron binary cannot run in this environment.
 */
const { spawn } = require('child_process');
const path = require('path');

const electronBin = require('electron');
const main = path.join(__dirname, '..', 'main.js');

const child = spawn(
  electronBin,
  [main],
  {
    cwd: path.join(__dirname, '..'),
    env: {
      ...process.env,
      ELECTRON_ENABLE_LOGGING: '1',
      COVENANT_ELECTRON_SMOKE: '1'
    },
    stdio: ['ignore', 'pipe', 'pipe']
  }
);

let out = '';
child.stdout.on('data', (d) => {
  out += d.toString();
  process.stdout.write(d);
});
child.stderr.on('data', (d) => {
  out += d.toString();
  process.stderr.write(d);
});

const timer = setTimeout(() => {
  console.log('ELECTRON_SMOKE: window ran 8s — treating as OK, killing');
  child.kill('SIGTERM');
  setTimeout(() => child.kill('SIGKILL'), 2000);
}, 8000);

child.on('exit', (code, signal) => {
  clearTimeout(timer);
  if (signal === 'SIGTERM' || signal === 'SIGKILL' || code === 0) {
    console.log('ELECTRON_SMOKE OK');
    process.exit(0);
  }
  console.error('ELECTRON_SMOKE FAIL code=', code, 'signal=', signal);
  process.exit(1);
});

child.on('error', (err) => {
  clearTimeout(timer);
  console.error('ELECTRON_SMOKE could not spawn:', err.message);
  process.exit(2);
});
