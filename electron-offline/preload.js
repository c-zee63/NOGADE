const { contextBridge, ipcRenderer } = require('electron');
contextBridge.exposeInMainWorld('posDesk', {
  saveBackup: (name, text, keep) => ipcRenderer.invoke('bk:save', name, text, keep),
  list: () => ipcRenderer.invoke('bk:list'),
  read: (name) => ipcRenderer.invoke('bk:read', name)
});
