const { contextBridge, ipcRenderer } = require('electron');
contextBridge.exposeInMainWorld('posDesk', {
  saveBackup: (name, text, keep) => ipcRenderer.invoke('bk:save', name, text, keep),
  list: () => ipcRenderer.invoke('bk:list'),
  read: (name) => ipcRenderer.invoke('bk:read', name),
  refocus: () => ipcRenderer.send('win:refocus'),
  // Kunci printer: ingat printer yang sudah dipilih supaya tidak perlu memilih lagi
  pickRole: (r) => ipcRenderer.sendSync('pr:role', r),
  autoPrinter: () => ipcRenderer.invoke('pr:auto'),
  forgetPrinter: () => ipcRenderer.sendSync('pr:forget')
});
