'use strict';

const http = require('http');
const fs = require('fs');
const path = require('path');
const { pathToFileURL } = require('url');

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
  '.webmanifest': 'application/manifest+json; charset=utf-8',
  '.txt': 'text/plain; charset=utf-8'
};

const ALLOWED_TOP = new Set([
  'index.html',
  'vendor-portal.html',
  'config.js',
  'favicon.ico',
  'manifest.webmanifest',
  'sw.js'
]);
const ALLOWED_DIRS = ['js', 'css', 'Redesign', 'vendor', 'assets', 'img', 'fonts'];

function send(res, status, headers, body) {
  res.writeHead(status, headers);
  if (body === undefined) res.end();
  else res.end(body);
}

function resolveUnderRoot(root, urlPath) {
  let p;
  try {
    p = decodeURIComponent(urlPath);
  } catch {
    return null;
  }
  if (p.includes('\0')) return null;
  p = p.replace(/^\/+/, '');
  if (p === '') p = 'index.html';
  const parts = p.split('/');
  if (parts.some((s) => s === '..' || s.startsWith('.'))) return null;
  const okTop = parts.length === 1 && ALLOWED_TOP.has(parts[0]);
  const okDir = parts.length > 1 && ALLOWED_DIRS.includes(parts[0]);
  if (!okTop && !okDir) return null;
  const abs = path.resolve(root, p);
  if (!abs.startsWith(root + path.sep) && abs !== root) return null;
  return abs;
}

/**
 * Injected into every HTML page served by the desktop shell.
 * Wires native menu clicks (preload → IPC) to existing planner globals.
 */
function desktopMenuBridgeScript() {
  return (
    '<script>(function(){' +
    'function runMenu(action,payload){' +
    'try{' +
    "if(action==='export-backup'&&typeof downloadSqliteBackup==='function')return downloadSqliteBackup();" +
    "if(action==='import-backup'){var i=document.getElementById('importInput');if(i)i.click();return;}" +
    "if(action==='export-csv'&&typeof exportActivePanelCSV==='function')return exportActivePanelCSV();" +
    "if(action==='print-section'&&typeof printSelectedSection==='function')return printSelectedSection();" +
    "if(action==='preview-mode'&&typeof toggleReadOnlyMode==='function')return toggleReadOnlyMode();" +
    "if(action==='settings'){" +
    "if(typeof openSettingsWindow==='function')return openSettingsWindow();" +
    "var g=document.getElementById('rd-gear-btn');if(g)g.click();return;}" +
    "if(action==='undo'&&typeof undoPlannerChange==='function')return undoPlannerChange();" +
    "if(action==='redo'&&typeof redoPlannerChange==='function')return redoPlannerChange();" +
    "if(action==='dark-mode'&&typeof toggleDarkMode==='function')return toggleDarkMode();" +
    "if(action==='profile-display'){" +
    "if(typeof toggleProfileDrawer==='function')return toggleProfileDrawer();" +
    "var w=document.getElementById('rd-wedding-btn');if(w)w.click();return;}" +
    "if(action==='quick-jump'){" +
    "if(typeof openCommandPalette==='function')return openCommandPalette();" +
    "if(typeof toggleQuickJump==='function')return toggleQuickJump();" +
    "var s=document.getElementById('gs-input');if(s){s.focus();return;}}" +
    "if(action==='data-hub'&&typeof openDataHub==='function')return openDataHub();" +
    "if(action==='panel'&&payload&&typeof showPanel==='function')return showPanel(payload);" +
    "if(action==='backup-help'&&typeof openFooterBackupHelp==='function')return openFooterBackupHelp();" +
    "if(action==='connect'&&payload&&typeof openFooterConnect==='function')return openFooterConnect(payload);" +
    "if(action==='legal'&&payload&&typeof openFooterLegal==='function')return openFooterLegal(payload);" +
    "if(action==='about'){" +
    "if(window.covenantDesktop&&typeof window.covenantDesktop.showAbout==='function')return window.covenantDesktop.showAbout();" +
    "if(typeof openSettingsWindow==='function')return openSettingsWindow('about');}" +
    "if(action==='zoom-in'&&window.covenantDesktop&&typeof window.covenantDesktop.zoomIn==='function')return window.covenantDesktop.zoomIn();" +
    "if(action==='zoom-out'&&window.covenantDesktop&&typeof window.covenantDesktop.zoomOut==='function')return window.covenantDesktop.zoomOut();" +
    "if(action==='zoom-reset'&&window.covenantDesktop&&typeof window.covenantDesktop.zoomReset==='function')return window.covenantDesktop.zoomReset();" +
    '}catch(e){try{console.error("desktop menu",e);}catch(_){}}' +
    '}' +
    'function markDesktopChrome(){' +
    'try{' +
    'document.documentElement.classList.add("covenant-desktop");' +
    'if(document.body)document.body.classList.add("covenant-desktop");' +
    '}catch(_){}}' +
    'function bind(){' +
    'markDesktopChrome();' +
    'if(!window.covenantDesktop||typeof window.covenantDesktop.onMenuAction!=="function")return;' +
    'if(window.__covenantMenuBound)return;window.__covenantMenuBound=true;' +
    'window.covenantDesktop.onMenuAction(function(action,payload){return runMenu(action,payload);});' +
    '}' +
    'if(document.readyState==="loading")document.addEventListener("DOMContentLoaded",bind);' +
    'else bind();' +
    'setTimeout(bind,0);' +
    '})();</script>\n'
  );
}

function desktopBootstrap(apiBase) {
  const base = JSON.stringify(apiBase || '');
  return (
    '<script>(function(){try{' +
    'window.COVENANT_DESKTOP={isDesktop:true,shell:"electron"};' +
    'document.documentElement.classList.add("covenant-desktop");' +
    'window.COVENANT_API_DEFAULT=' +
    base +
    ';' +
    'window.COVENANT_CLOUD=Object.assign({apiBase:' +
    base +
    '},window.COVENANT_CLOUD||{});' +
    '}catch(e){}})();</script>\n' +
    desktopMenuBridgeScript()
  );
}

/** Strip PWA / browser-install meta that should not surface as desktop concepts. */
function scrubPwaChrome(html) {
  return String(html || '')
    .replace(/<link\b[^>]*\brel\s*=\s*["']manifest["'][^>]*>\s*/gi, '')
    .replace(/<meta\b[^>]*\bname\s*=\s*["']theme-color["'][^>]*>\s*/gi, '')
    .replace(/<meta\b[^>]*\bname\s*=\s*["']apple-mobile-web-app[^"']*["'][^>]*>\s*/gi, '')
    .replace(/<link\b[^>]*\brel\s*=\s*["']apple-touch-icon["'][^>]*>\s*/gi, '');
}

function injectBootstrap(html, apiBase) {
  const scrubbed = scrubPwaChrome(html);
  const boot = desktopBootstrap(apiBase);
  if (/<head[^>]*>/i.test(scrubbed)) {
    return scrubbed.replace(/<head[^>]*>/i, (m) => m + '\n' + boot);
  }
  return boot + scrubbed;
}

/**
 * Serve the planner static tree on 127.0.0.1 (ephemeral port).
 * Offline-first: all UI assets come from disk. Cloud sync still uses HTTPS when online.
 * Localhost origin keeps Railway CORS happy without changing API secrets.
 */
function startPlannerServer(plannerRoot, apiBase) {
  const root = path.resolve(plannerRoot);
  if (!fs.existsSync(path.join(root, 'index.html'))) {
    return Promise.reject(new Error('Planner index.html not found at ' + root));
  }

  const server = http.createServer((req, res) => {
    if (req.method !== 'GET' && req.method !== 'HEAD') {
      send(res, 405, { Allow: 'GET, HEAD', 'Content-Type': 'text/plain' }, 'Method not allowed');
      return;
    }

    let urlPath = '/';
    try {
      urlPath = new URL(req.url || '/', 'http://127.0.0.1').pathname;
    } catch {
      send(res, 400, { 'Content-Type': 'text/plain' }, 'Bad request');
      return;
    }

    // Desktop does not need the PWA service worker (shell is already local).
    if (urlPath === '/sw.js') {
      send(res, 404, { 'Content-Type': 'text/plain' }, 'Not found');
      return;
    }

    if (urlPath === '/config.js') {
      const body =
        '/* desktop shell — default API for optional cloud sync */\n' +
        'window.COVENANT_API_DEFAULT = ' +
        JSON.stringify(apiBase || '') +
        ';\n';
      send(
        res,
        200,
        {
          'Content-Type': 'text/javascript; charset=utf-8',
          'Cache-Control': 'no-cache',
          'X-Content-Type-Options': 'nosniff'
        },
        req.method === 'HEAD' ? undefined : body
      );
      return;
    }

    const abs = resolveUnderRoot(root, urlPath);
    if (!abs) {
      send(res, 404, { 'Content-Type': 'text/plain' }, 'Not found');
      return;
    }

    fs.stat(abs, (err, st) => {
      if (err || !st.isFile()) {
        send(res, 404, { 'Content-Type': 'text/plain' }, 'Not found');
        return;
      }
      const ext = path.extname(abs).toLowerCase();
      const type = MIME[ext] || 'application/octet-stream';

      if (ext === '.html') {
        fs.readFile(abs, 'utf8', (readErr, html) => {
          if (readErr) {
            send(res, 500, { 'Content-Type': 'text/plain' }, 'Read error');
            return;
          }
          const body = injectBootstrap(html, apiBase);
          send(
            res,
            200,
            {
              'Content-Type': type,
              'Cache-Control': 'no-cache',
              'X-Content-Type-Options': 'nosniff'
            },
            req.method === 'HEAD' ? undefined : body
          );
        });
        return;
      }

      const headers = {
        'Content-Type': type,
        'Cache-Control': ext === '.webmanifest' ? 'no-cache' : 'public, max-age=60',
        'X-Content-Type-Options': 'nosniff',
        'Content-Length': st.size
      };
      if (req.method === 'HEAD') {
        res.writeHead(200, headers);
        res.end();
        return;
      }
      res.writeHead(200, headers);
      fs.createReadStream(abs).on('error', () => {
        try {
          res.destroy();
        } catch (_) {
          /* ignore */
        }
      }).pipe(res);
    });
  });

  return new Promise((resolve, reject) => {
    server.once('error', reject);
    server.listen(0, '127.0.0.1', () => {
      const addr = server.address();
      const port = addr && addr.port;
      resolve({
        server,
        port,
        origin: 'http://127.0.0.1:' + port,
        url: 'http://127.0.0.1:' + port + '/',
        close: () =>
          new Promise((resClose, rejClose) => {
            server.close((e) => (e ? rejClose(e) : resClose()));
          })
      });
    });
  });
}

function plannerRootFromElectron(app) {
  if (app.isPackaged) {
    return path.join(process.resourcesPath, 'planner');
  }
  return path.join(__dirname, '..', '..');
}

module.exports = {
  startPlannerServer,
  plannerRootFromElectron,
  pathToFileURL
};
