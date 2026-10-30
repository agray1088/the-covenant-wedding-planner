'use strict';

const { contextBridge, ipcRenderer } = require('electron');

contextBridge.exposeInMainWorld('covenantDesktop', {
  isDesktop: true,
  getInfo: () => ipcRenderer.invoke('covenant:get-desktop-info'),
  setApiBase: (base) => ipcRenderer.invoke('covenant:set-api-base', base),
  /**
   * Native OS confirm via Electron dialog.showMessageBox.
   * @param {{ title?: string, message?: string, detail?: string, okText?: string, cancelText?: string, danger?: boolean, type?: string }} opts
   * @returns {Promise<boolean>} true if the user chose OK / primary action
   */
  confirm: (opts) => ipcRenderer.invoke('covenant:confirm', opts || {}),
  /** Native Help → About (also used by the desktop ribbon). */
  showAbout: () => ipcRenderer.invoke('covenant:show-about'),
  zoomIn: () => ipcRenderer.invoke('covenant:zoom', 'in'),
  zoomOut: () => ipcRenderer.invoke('covenant:zoom', 'out'),
  zoomReset: () => ipcRenderer.invoke('covenant:zoom', 'reset'),
  /** Subscribe to native menu commands from the main process. Returns unsubscribe. */
  onMenuAction: (handler) => {
    if (typeof handler !== 'function') return () => {};
    const listener = (_event, action, payload) => {
      try {
        handler(action, payload);
      } catch (err) {
        // eslint-disable-next-line no-console
        console.error('covenantDesktop.onMenuAction', err);
      }
    };
    ipcRenderer.on('covenant:menu-action', listener);
    return () => ipcRenderer.removeListener('covenant:menu-action', listener);
  }
});
