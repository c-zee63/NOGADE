const { app, BrowserWindow, ipcMain } = require('electron');
const path = require('path');
const fs = require('fs');

// Backup otomatis: file terenkripsi disimpan di Dokumen/POS-Backup.
// Nama file divalidasi ketat agar tidak bisa menulis/membaca di luar folder itu.
const BK_RE = /^backup-pos-[\d-]+\.enc\.json$/;
const bkDir = () => path.join(app.getPath('documents'), 'POS-Backup');
const okName = (n) => { if (!BK_RE.test(String(n))) throw new Error('Nama file tidak valid'); return String(n); };

ipcMain.handle('bk:save', (_e, name, text, keep) => {
  okName(name);
  const dir = bkDir();
  fs.mkdirSync(dir, { recursive: true });
  const file = path.join(dir, name);
  fs.writeFileSync(file, String(text), 'utf8');
  const all = fs.readdirSync(dir).filter((n) => BK_RE.test(n)).sort();
  const k = Math.max(1, Math.min(60, +keep || 7));
  all.slice(0, Math.max(0, all.length - k)).forEach((n) => { try { fs.unlinkSync(path.join(dir, n)); } catch (e) {} });
  return file;
});
ipcMain.handle('bk:list', () => {
  try { return fs.readdirSync(bkDir()).filter((n) => BK_RE.test(n)).sort().reverse(); } catch (e) { return []; }
});
ipcMain.handle('bk:read', (_e, name) => fs.readFileSync(path.join(bkDir(), okName(name)), 'utf8'));

app.whenReady().then(() => {
  const w = new BrowserWindow({
    width: 1280, height: 800, autoHideMenuBar: true,
    webPreferences: { preload: path.join(__dirname, 'preload.js'), contextIsolation: true, nodeIntegration: false, sandbox: true }
  });
  w.loadFile(path.join(__dirname, 'www', 'index.html'));
});
app.on('window-all-closed', () => app.quit());
