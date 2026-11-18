const { contextBridge, ipcRenderer } = require('electron');
contextBridge.exposeInMainWorld('posDesk', {
  saveBackup: (name, text, keep) => ipcRenderer.invoke('bk:save', name, text, keep),
  list: () => ipcRenderer.invoke('bk:list'),
  read: (name) => ipcRenderer.invoke('bk:read', name),
  refocus: () => ipcRenderer.send('win:refocus'),
  devMode: (role, silent) => ipcRenderer.invoke('dev:mode', role, silent),
  devSaved: (role) => ipcRenderer.invoke('dev:saved', role),
  devForget: (role) => ipcRenderer.invoke('dev:forget', role)
});
