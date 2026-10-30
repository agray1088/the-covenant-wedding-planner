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
