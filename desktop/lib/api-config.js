'use strict';

const fs = require('fs');
const path = require('path');

/** Packaged / production default — same Railway API used by the hosted planner. */
const PACKAGED_DEFAULT =
  'https://the-covenant-wedding-planner-production.up.railway.app';

function normalizeBase(raw) {
  const s = String(raw || '').trim().replace(/\/+$/, '');
  if (!s) return '';
  if (!/^https?:\/\//i.test(s)) return '';
  return s;
}

/**
 * Resolve API base for desktop:
 * 1) COVENANT_API_BASE / COVENANT_API_DEFAULT env
 * 2) userData/api-base.txt (user override)
 * 3) packaged default (always for Electron so Settings can pre-fill sync)
 */
function resolveApiBase(userDataPath) {
  const fromEnv = normalizeBase(
    process.env.COVENANT_API_BASE || process.env.COVENANT_API_DEFAULT || ''
  );
  if (fromEnv) return fromEnv;

  try {
    const file = path.join(userDataPath, 'api-base.txt');
    if (fs.existsSync(file)) {
      const fromFile = normalizeBase(fs.readFileSync(file, 'utf8').split(/\r?\n/)[0]);
      if (fromFile) return fromFile;
    }
  } catch (_) {
    /* ignore */
  }

  return PACKAGED_DEFAULT;
}

function writeApiBase(userDataPath, base) {
  const normalized = normalizeBase(base);
  if (!normalized) {
    throw new Error('API base must be an http(s) URL');
  }
  fs.mkdirSync(userDataPath, { recursive: true });
  fs.writeFileSync(path.join(userDataPath, 'api-base.txt'), normalized + '\n', 'utf8');
  return normalized;
}

module.exports = {
  PACKAGED_DEFAULT,
  normalizeBase,
  resolveApiBase,
  writeApiBase
};
