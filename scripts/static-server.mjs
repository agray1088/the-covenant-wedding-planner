/* Minimal zero-dependency static host for the Covenant planner frontend.
   Serves only an allowlist of frontend paths. Listens on $PORT (Railway). */
import http from 'node:http';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = path.resolve(process.env.STATIC_ROOT || path.join(path.dirname(fileURLToPath(import.meta.url)), '..'));
const PORT = Number(process.env.PORT || 8080);
const API_BASE_URL = String(process.env.API_BASE_URL || '').trim().replace(/\/+$/, '');

const ALLOWED_TOP = new Set(['index.html', 'vendor-portal.html', 'config.js', 'favicon.ico']);
const ALLOWED_DIRS = ['js', 'css', 'Redesign', 'vendor', 'assets', 'img', 'fonts'];

const MIME = {
  '.html': 'text/html; charset=utf-8',
  '.js': 'text/javascript; charset=utf-8',
  '.mjs': 'text/javascript; charset=utf-8',
  '.css': 'text/css; charset=utf-8',
  '.json': 'application/json; charset=utf-8',
  '.map': 'application/json; charset=utf-8',
  '.wasm': 'application/wasm',
  '.svg': 'image/svg+xml',
  '.png': 'image/png',
  '.jpg': 'image/jpeg',
  '.jpeg': 'image/jpeg',
  '.gif': 'image/gif',
  '.webp': 'image/webp',
  '.ico': 'image/x-icon',
  '.woff': 'font/woff',
  '.woff2': 'font/woff2',
  '.ttf': 'font/ttf',
  '.txt': 'text/plain; charset=utf-8'
};

function cacheControl(ext) {
  if (ext === '.html') return 'no-cache';
  if (ext === '.js' || ext === '.css' || ext === '.json') return 'public, max-age=60, must-revalidate';
  return 'public, max-age=86400';
}

const SECURITY = {
  'X-Content-Type-Options': 'nosniff',
  'Referrer-Policy': 'strict-origin-when-cross-origin',
  'X-Frame-Options': 'SAMEORIGIN'
};

function send(res, status, headers, body) {
  res.writeHead(status, { ...SECURITY, ...headers });
  res.end(body);
}

function configJs() {
  return `/* generated from API_BASE_URL at container start */\nwindow.COVENANT_API_DEFAULT = ${JSON.stringify(API_BASE_URL)};\n`;
}

function resolveFile(urlPath) {
  let p;
  try { p = decodeURIComponent(urlPath); } catch { return null; }
  if (p.includes('\0')) return null;
  p = p.replace(/^\/+/, '');
  if (p === '') p = 'index.html';
  const parts = p.split('/');
  if (parts.some((s) => s === '..' || s.startsWith('.'))) return null;
  const okTop = parts.length === 1 && ALLOWED_TOP.has(parts[0]);
  const okDir = parts.length > 1 && ALLOWED_DIRS.includes(parts[0]);
  if (!okTop && !okDir) return null;
  const abs = path.resolve(ROOT, p);
  if (!abs.startsWith(ROOT + path.sep)) return null;
  return abs;
}

const server = http.createServer((req, res) => {
  if (req.method !== 'GET' && req.method !== 'HEAD') {
    send(res, 405, { Allow: 'GET, HEAD' }, 'Method not allowed');
    return;
  }
  const urlPath = (req.url || '/').split('?')[0];
  if (urlPath === '/health') {
    send(res, 200, { 'Content-Type': 'text/plain; charset=utf-8', 'Cache-Control': 'no-store' }, 'ok');
    return;
  }
  if (urlPath === '/config.js') {
    send(res, 200, { 'Content-Type': MIME['.js'], 'Cache-Control': 'no-cache' }, req.method === 'HEAD' ? '' : configJs());
    return;
  }
  const file = resolveFile(urlPath);
  if (!file) {
    send(res, 404, { 'Content-Type': 'text/plain; charset=utf-8' }, 'Not found');
    return;
  }
  fs.stat(file, (err, st) => {
    if (err || !st.isFile()) {
      send(res, 404, { 'Content-Type': 'text/plain; charset=utf-8' }, 'Not found');
      return;
    }
    const ext = path.extname(file).toLowerCase();
    res.writeHead(200, {
      ...SECURITY,
      'Content-Type': MIME[ext] || 'application/octet-stream',
      'Content-Length': st.size,
      'Cache-Control': cacheControl(ext)
    });
    if (req.method === 'HEAD') { res.end(); return; }
    fs.createReadStream(file).on('error', () => res.destroy()).pipe(res);
  });
});

server.listen(PORT, '0.0.0.0', () => {
  console.log(`[covenant-static] :${PORT} root=${ROOT} API_BASE_URL=${API_BASE_URL || '(unset)'}`);
});
