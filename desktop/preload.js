'use strict';

const { contextBridge, ipcRenderer } = require('electron');

contextBridge.exposeInMainWorld('covenantDesktop', {
  isDesktop: true,
  getInfo: () => ipcRenderer.invoke('covenant:get-desktop-info'),
  setApiBase: (base) => ipcRenderer.invoke('covenant:set-api-base', base)
});
