'use strict';

const { contextBridge, ipcRenderer } = require('electron');

contextBridge.exposeInMainWorld('covenantDesktop', {
  isDesktop: true,
  getInfo: () => ipcRenderer.invoke('covenant:get-desktop-info'),
  setApiBase: (base) => ipcRenderer.invoke('covenant:set-api-base', base),
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
