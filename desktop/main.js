'use strict';

const path = require('path');
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
        'Boolean(window.COVENANT_DESKTOP && window.COVENANT_API_DEFAULT)',
        true
      )
      .then((ok) => {
        // eslint-disable-next-line no-console
        console.log('COVENANT_ELECTRON_SMOKE bootstrap=', ok);
        setTimeout(() => app.quit(), 500);
      })
      .catch((err) => {
        // eslint-disable-next-line no-console
        console.error('COVENANT_ELECTRON_SMOKE failed', err);
        app.exit(1);
      });
  }
}

function buildMenu() {
  const isMac = process.platform === 'darwin';
  const template = [
    ...(isMac
      ? [
          {
            label: app.name,
            submenu: [
              { role: 'about' },
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
          label: 'Set Cloud API Base…',
          click: () => promptApiBase()
        },
        {
          label: 'Open Data Folder',
          click: () => shell.openPath(app.getPath('userData'))
        },
        { type: 'separator' },
        isMac ? { role: 'close' } : { role: 'quit' }
      ]
    },
    {
      label: 'Edit',
      submenu: [
        { role: 'undo' },
        { role: 'redo' },
        { type: 'separator' },
        { role: 'cut' },
        { role: 'copy' },
        { role: 'paste' },
        { role: 'selectAll' }
      ]
    },
    {
      label: 'View',
      submenu: [
        { role: 'reload' },
        { role: 'forceReload' },
        { role: 'toggleDevTools' },
        { type: 'separator' },
        { role: 'resetZoom' },
        { role: 'zoomIn' },
        { role: 'zoomOut' },
        { type: 'separator' },
        { role: 'togglefullscreen' }
      ]
    },
    {
      label: 'Help',
      submenu: [
        {
          label: 'Desktop app docs',
          click: () => {
            const doc = app.isPackaged
              ? null
              : path.join(__dirname, '..', 'docs', 'DESKTOP_APP.md');
            if (doc) shell.openPath(doc);
            else {
              dialog.showMessageBox({
                type: 'info',
                title: 'The Covenant Wedding Planner',
                message:
                  'See docs/DESKTOP_APP.md in the project repo for build, install, data location, and backup notes.'
              });
            }
          }
        },
        {
          label: 'About',
          click: () => {
            dialog.showMessageBox({
              type: 'info',
              title: 'About',
              message: 'The Covenant Wedding Planner',
              detail:
                'Offline-first desktop shell (Electron).\n' +
                'Version ' +
                app.getVersion() +
                '\n\nCloud API default:\n' +
                currentApiBase +
                '\n\nData folder:\n' +
                app.getPath('userData')
            });
          }
        }
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
