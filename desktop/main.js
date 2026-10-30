'use strict';

const path = require('path');
const fs = require('fs');
const { app, BrowserWindow, Menu, shell, dialog, ipcMain } = require('electron');
const { resolveApiBase, writeApiBase, PACKAGED_DEFAULT } = require('./lib/api-config');
const { startPlannerServer, plannerRootFromElectron } = require('./lib/static-server');

/** @type {import('http').Server | null} */
let plannerServer = null;
/** @type {BrowserWindow | null} */
let mainWindow = null;
let currentApiBase = PACKAGED_DEFAULT;

const gotLock = app.requestSingleInstanceLock();
if (!gotLock) {
  app.quit();
} else {
  app.on('second-instance', () => {
    if (mainWindow) {
      if (mainWindow.isMinimized()) mainWindow.restore();
      mainWindow.focus();
    }
  });
}

function iconPath() {
  const packaged = path.join(process.resourcesPath, 'planner', 'assets', 'icons', 'icon-512.png');
  const dev = path.join(__dirname, '..', 'assets', 'icons', 'icon-512.png');
  return app.isPackaged ? packaged : dev;
}

async function createWindow() {
  currentApiBase = resolveApiBase(app.getPath('userData'));
  const root = plannerRootFromElectron(app);
  const hosted = await startPlannerServer(root, currentApiBase);
  plannerServer = hosted;

  mainWindow = new BrowserWindow({
    width: 1280,
    height: 840,
    minWidth: 900,
    minHeight: 600,
    title: 'The Covenant Wedding Planner',
    icon: iconPath(),
    show: false,
    webPreferences: {
      preload: path.join(__dirname, 'preload.js'),
      contextIsolation: true,
      nodeIntegration: false,
      sandbox: true,
      spellcheck: true
    }
  });

  mainWindow.once('ready-to-show', () => {
    if (mainWindow) mainWindow.show();
  });

  mainWindow.webContents.setWindowOpenHandler(({ url }) => {
    try {
      const u = new URL(url);
      if (u.protocol === 'http:' || u.protocol === 'https:') {
        shell.openExternal(url);
      }
    } catch (_) {
      /* ignore */
    }
    return { action: 'deny' };
  });

  // Stay on the local planner origin; open external https in the OS browser.
  mainWindow.webContents.on('will-navigate', (event, url) => {
    try {
      const u = new URL(url);
      if (u.origin !== hosted.origin) {
        event.preventDefault();
        if (u.protocol === 'http:' || u.protocol === 'https:') shell.openExternal(url);
      }
    } catch (_) {
      event.preventDefault();
    }
  });

  await mainWindow.loadURL(hosted.url);
  buildMenu();

  if (process.env.COVENANT_ELECTRON_SMOKE === '1') {
    // Headless/CI: confirm load, then quit so smoke scripts can finish.
    mainWindow.webContents
      .executeJavaScript(
        '(' +
          'function(){' +
          'var desk=Boolean(window.COVENANT_DESKTOP&&window.COVENANT_API_DEFAULT);' +
          'var bridge=Boolean(window.covenantDesktop&&typeof window.covenantDesktop.onMenuAction==="function");' +
          'var chrome=document.documentElement.classList.contains("covenant-desktop")||(document.body&&document.body.classList.contains("covenant-desktop"));' +
          'var noFooter=!document.getElementById("planner-footer");' +
          'var banner=!!document.getElementById("scripture-banner");' +
          'return {desk:desk,bridge:bridge,chrome:chrome,noFooter:noFooter,banner:banner,ok:desk&&bridge&&chrome&&noFooter&&banner};' +
          '}' +
          ')()',
        true
      )
      .then((result) => {
        // eslint-disable-next-line no-console
        console.log('COVENANT_ELECTRON_SMOKE', JSON.stringify(result));
        if (!result || !result.ok) {
          app.exit(1);
          return;
        }
        setTimeout(() => app.quit(), 500);
      })
      .catch((err) => {
        // eslint-disable-next-line no-console
        console.error('COVENANT_ELECTRON_SMOKE failed', err);
        app.exit(1);
      });
  }
}

/** Send a menu command into the renderer (preload → injected bridge → planner globals). */
function sendMenuAction(action, payload) {
  if (!mainWindow || mainWindow.isDestroyed()) return;
  mainWindow.webContents.send('covenant:menu-action', action, payload);
}

function docsRoot() {
  if (app.isPackaged) {
    return path.join(process.resourcesPath, 'docs');
  }
  return path.join(__dirname, '..', 'docs');
}

function openDocFile(fileName) {
  const file = path.join(docsRoot(), fileName);
  if (fs.existsSync(file)) {
    shell.openPath(file);
    return;
  }
  dialog.showMessageBox({
    type: 'info',
    title: 'Documentation',
    message: fileName,
    detail:
      'That doc was not found in this build.\n' +
      'See the project repo docs/ folder, or Help → About for version and data paths.'
  });
}

function showAbout() {
  dialog.showMessageBox({
    type: 'info',
    title: 'About The Covenant Wedding Planner',
    message: 'The Covenant Wedding Planner',
    detail:
      'Christ-centered wedding planning — offline-first desktop shell (Electron).\n\n' +
      'Version ' +
      app.getVersion() +
      '\n\nCloud API default:\n' +
      currentApiBase +
      '\n\nData folder:\n' +
      app.getPath('userData')
  });
}

function showLicenseStub() {
  dialog.showMessageBox({
    type: 'info',
    title: 'Enter License…',
    message: 'License activation is not built yet.',
    detail:
      'This desktop build runs as a full local planner.\n' +
      'When licensing ships, Enter License… will collect a key and unlock trial / purchase status.\n\n' +
      'For now, see Help → Legal → License or your purchase documentation.'
  });
}

function showUpdatesStub() {
  dialog.showMessageBox({
    type: 'info',
    title: 'Check for Updates',
    message: 'Coming soon',
    detail: 'Automatic updates are not wired yet. Rebuild or reinstall from a newer desktop package when available.'
  });
}

function buildMenu() {
  const isMac = process.platform === 'darwin';
  const packaged = app.isPackaged;

  const viewSubmenu = [
    { role: 'reload' },
    { role: 'forceReload' },
    ...(packaged ? [] : [{ role: 'toggleDevTools' }]),
    { type: 'separator' },
    { role: 'resetZoom', label: 'Actual Size' },
    { role: 'zoomIn' },
    { role: 'zoomOut' },
    { type: 'separator' },
    {
      label: 'Dark Mode',
      accelerator: 'CmdOrCtrl+Shift+D',
      click: () => sendMenuAction('dark-mode')
    },
    {
      label: 'Profile & Display…',
      click: () => sendMenuAction('profile-display')
    },
    { type: 'separator' },
    { role: 'togglefullscreen' }
  ];

  const template = [
    ...(isMac
      ? [
          {
            label: app.name,
            submenu: [
              { label: 'About The Covenant Wedding Planner', click: () => showAbout() },
              { type: 'separator' },
              { role: 'services' },
              { type: 'separator' },
              { role: 'hide' },
              { role: 'hideOthers' },
              { role: 'unhide' },
              { type: 'separator' },
              { role: 'quit' }
            ]
          }
        ]
      : []),
    {
      label: 'File',
      submenu: [
        {
          label: 'Export Backup',
          accelerator: 'CmdOrCtrl+Shift+E',
          click: () => sendMenuAction('export-backup')
        },
        {
          label: 'Import Backup…',
          accelerator: 'CmdOrCtrl+Shift+I',
          click: () => sendMenuAction('import-backup')
        },
        { type: 'separator' },
        {
          label: 'Export CSV',
          click: () => sendMenuAction('export-csv')
        },
        {
          label: 'Print Section…',
          accelerator: 'CmdOrCtrl+P',
          click: () => sendMenuAction('print-section')
        },
        {
          label: 'Preview Mode',
          click: () => sendMenuAction('preview-mode')
        },
        { type: 'separator' },
        {
          label: 'Set Cloud API Base…',
          click: () => promptApiBase()
        },
        {
          label: 'Settings…',
          accelerator: 'CmdOrCtrl+,',
          click: () => sendMenuAction('settings')
        },
        {
          label: 'Open Data Folder',
          click: () => shell.openPath(app.getPath('userData'))
        },
        { type: 'separator' },
        isMac ? { role: 'close' } : { role: 'quit', label: 'Exit' }
      ]
    },
    {
      label: 'Edit',
      submenu: [
        {
          label: 'Undo',
          accelerator: 'CmdOrCtrl+Z',
          click: () => sendMenuAction('undo')
        },
        {
          label: 'Redo',
          accelerator: 'CmdOrCtrl+Shift+Z',
          click: () => sendMenuAction('redo')
        },
        { type: 'separator' },
        { role: 'cut' },
        { role: 'copy' },
        { role: 'paste' },
        { role: 'selectAll' }
      ]
    },
    {
      label: 'View',
      submenu: viewSubmenu
    },
    {
      label: 'Go',
      submenu: [
        {
          label: 'Quick Jump…',
          accelerator: 'CmdOrCtrl+J',
          click: () => sendMenuAction('quick-jump')
        },
        {
          label: 'Database Hub',
          accelerator: 'CmdOrCtrl+Shift+H',
          click: () => sendMenuAction('data-hub')
        },
        { type: 'separator' },
        { label: 'Dashboard', click: () => sendMenuAction('panel', 'dashboard') },
        { label: 'Smart Calendar', click: () => sendMenuAction('panel', 'calendar') },
        { label: 'Budget', click: () => sendMenuAction('panel', 'budget') },
        { label: 'Guest List', click: () => sendMenuAction('panel', 'guests') },
        { label: 'Payments', click: () => sendMenuAction('panel', 'payments') },
        { label: 'Share Packets', click: () => sendMenuAction('panel', 'packets') },
        { type: 'separator' },
        { label: 'Get Started', click: () => sendMenuAction('panel', 'instructions') },
        { label: 'Page-by-Page Guide', click: () => sendMenuAction('panel', 'guide') },
        { label: 'FAQ', click: () => sendMenuAction('panel', 'faq') },
        { label: 'Wedding Setup', click: () => sendMenuAction('panel', 'setup') }
      ]
    },
    {
      label: 'Help',
      submenu: [
        {
          label: 'Backup & Restore Help',
          click: () => sendMenuAction('backup-help')
        },
        {
          label: 'Documentation',
          submenu: [
            {
              label: 'Desktop App',
              click: () => openDocFile('DESKTOP_APP.md')
            },
            {
              label: 'Backup & Photos',
              click: () => openDocFile('BACKUP_AND_PHOTOS.md')
            },
            {
              label: 'Offline & Cloud Sync',
              click: () => openDocFile('OFFLINE_CLOUD_SYNC.md')
            },
            {
              label: 'PWA Install',
              click: () => openDocFile('PWA_INSTALL.md')
            }
          ]
        },
        { type: 'separator' },
        {
          label: 'Contact Support',
          click: () => sendMenuAction('connect', 'support')
        },
        {
          label: 'Website',
          click: () => sendMenuAction('connect', 'website')
        },
        {
          label: 'Instagram',
          click: () => sendMenuAction('connect', 'instagram')
        },
        {
          label: 'Pinterest',
          click: () => sendMenuAction('connect', 'pinterest')
        },
        {
          label: 'Shop / Etsy',
          click: () => sendMenuAction('connect', 'etsy')
        },
        { type: 'separator' },
        {
          label: 'Legal',
          submenu: [
            { label: 'Terms of Use', click: () => sendMenuAction('legal', 'terms') },
            { label: 'Privacy Policy', click: () => sendMenuAction('legal', 'privacy') },
            { label: 'Refund Policy', click: () => sendMenuAction('legal', 'refund') },
            { label: 'License', click: () => sendMenuAction('legal', 'license') }
          ]
        },
        {
          label: 'Enter License…',
          click: () => showLicenseStub()
        },
        {
          label: 'Check for Updates…',
          click: () => showUpdatesStub()
        },
        { type: 'separator' },
        ...(isMac
          ? []
          : [
              {
                label: 'About The Covenant Wedding Planner',
                click: () => showAbout()
              }
            ])
      ]
    }
  ];
  Menu.setApplicationMenu(Menu.buildFromTemplate(template));
}

async function promptApiBase() {
  // Electron has no built-in prompt; use a simple message + clipboard-friendly default.
  // Users can also set COVENANT_API_BASE or edit userData/api-base.txt.
  const result = await dialog.showMessageBox({
    type: 'question',
    buttons: ['Use packaged default', 'Open api-base.txt', 'Cancel'],
    defaultId: 0,
    cancelId: 2,
    title: 'Cloud API base',
    message: 'Optional cloud sync API base',
    detail:
      'Current: ' +
      currentApiBase +
      '\n\nPackaged default:\n' +
      PACKAGED_DEFAULT +
      '\n\nTo set a custom URL, choose “Open api-base.txt”, put a single https URL on the first line, save, then restart the app.\n' +
      'Or set environment variable COVENANT_API_BASE before launch.\n' +
      'You can also change the API base inside Settings → Cloud sync.'
  });
  if (result.response === 0) {
    try {
      currentApiBase = writeApiBase(app.getPath('userData'), PACKAGED_DEFAULT);
      dialog.showMessageBox({
        type: 'info',
        message: 'API base reset to packaged default. Reloading…',
        detail: currentApiBase
      });
      await restartServerAndReload();
    } catch (err) {
      dialog.showErrorBox('Could not save API base', String(err && err.message ? err.message : err));
    }
  } else if (result.response === 1) {
    const file = path.join(app.getPath('userData'), 'api-base.txt');
    try {
      writeApiBase(app.getPath('userData'), currentApiBase || PACKAGED_DEFAULT);
    } catch (_) {
      /* still try to open */
    }
    await shell.openPath(file);
  }
}

async function restartServerAndReload() {
  if (plannerServer && plannerServer.close) {
    try {
      await plannerServer.close();
    } catch (_) {
      /* ignore */
    }
    plannerServer = null;
  }
  currentApiBase = resolveApiBase(app.getPath('userData'));
  const root = plannerRootFromElectron(app);
  plannerServer = await startPlannerServer(root, currentApiBase);
  if (mainWindow && !mainWindow.isDestroyed()) {
    await mainWindow.loadURL(plannerServer.url);
  }
}

ipcMain.handle('covenant:get-desktop-info', () => ({
  isDesktop: true,
  apiBase: currentApiBase,
  userData: app.getPath('userData'),
  version: app.getVersion(),
  packaged: app.isPackaged
}));

ipcMain.handle('covenant:set-api-base', (_evt, base) => {
  currentApiBase = writeApiBase(app.getPath('userData'), base);
  return currentApiBase;
});

/**
 * Native destructive / confirm dialogs for the renderer (import wipe, sign-out, bulk delete).
 * Returns true when the user chooses the primary (OK) button.
 */
ipcMain.handle('covenant:confirm', async (evt, opts) => {
  opts = opts || {};
  const win = BrowserWindow.fromWebContents(evt.sender) || mainWindow;
  const danger = !!opts.danger;
  const okText = String(opts.okText || 'OK');
  const cancelText = String(opts.cancelText || 'Cancel');
  const title = String(opts.title || 'Please confirm');
  const message = String(opts.message != null ? opts.message : title);
  const detail = opts.detail != null ? String(opts.detail) : '';
  const result = await dialog.showMessageBox(win && !win.isDestroyed() ? win : undefined, {
    type: opts.type || (danger ? 'warning' : 'question'),
    buttons: [okText, cancelText],
    defaultId: danger ? 1 : 0,
    cancelId: 1,
    noLink: true,
    title,
    message,
    detail: detail || undefined
  });
  return result.response === 0;
});

app.whenReady().then(createWindow).catch((err) => {
  dialog.showErrorBox(
    'Failed to start',
    String(err && err.stack ? err.stack : err)
  );
  app.quit();
});

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') app.quit();
});

app.on('activate', () => {
  if (BrowserWindow.getAllWindows().length === 0) {
    createWindow().catch((err) => {
      dialog.showErrorBox('Failed to start', String(err && err.message ? err.message : err));
    });
  }
});

app.on('before-quit', () => {
  if (plannerServer && plannerServer.server) {
    try {
      plannerServer.server.close();
    } catch (_) {
      /* ignore */
    }
  }
});
