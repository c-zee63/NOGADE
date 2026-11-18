const { app, BrowserWindow, ipcMain, dialog } = require('electron');
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

// Perbaikan Electron: kolom isian kadang tidak bisa diketik setelah confirm()/alert().
ipcMain.on('win:refocus', (e) => {
  const w = BrowserWindow.fromWebContents(e.sender);
  if (w && !w.isDestroyed()) { w.blur(); w.focus(); e.sender.focus(); }
});

// ===== Printer/scanner langsung di Electron =====
// Web Serial (printer Bluetooth yang muncul sebagai port COM, scanner serial) dan WebUSB (printer USB langsung)
// butuh pemilih perangkat dari proses utama; tanpa ini tombol "Hubungkan printer" tidak menampilkan apa pun.
const hex = (n) => (n == null ? '----' : Number(n).toString(16).toUpperCase().padStart(4, '0'));
let chooserBusy = false;
// Ingat port COM printer/scanner terakhir yang dipilih agar tidak perlu memilih/pairing lagi setiap aplikasi dibuka.
const portsFile = () => path.join(app.getPath('userData'), 'ports.json');
let savedPorts = {};
try { savedPorts = JSON.parse(fs.readFileSync(portsFile(), 'utf8')) || {}; } catch (e) { savedPorts = {}; }
const writePorts = () => { try { fs.writeFileSync(portsFile(), JSON.stringify(savedPorts)); } catch (e) {} };
let devRole = 'printer', devSilent = false;
ipcMain.handle('dev:mode', (_e, role, silent) => { devRole = role === 'scan' ? 'scan' : 'printer'; devSilent = !!silent; return !!savedPorts[devRole]; });
ipcMain.handle('dev:saved', (_e, role) => !!savedPorts[role === 'scan' ? 'scan' : 'printer']);
ipcMain.handle('dev:forget', (_e, role) => { delete savedPorts[role === 'scan' ? 'scan' : 'printer']; writePorts(); });
async function pilih(win, judul, pesan, items) {
  // items: [{ id, label }] -> mengembalikan id yang dipilih, atau '' bila dibatalkan
  if (chooserBusy) return '';
  chooserBusy = true;
  try {
    const list = items.slice(0, 12);
    const r = await dialog.showMessageBox(win, {
      type: 'question', title: judul, message: judul, detail: pesan,
      buttons: list.map((i) => i.label).concat('Batal'), cancelId: list.length, defaultId: 0, noLink: true
    });
    return r.response < list.length ? list[r.response].id : '';
  } finally { chooserBusy = false; }
}
function setupDevices(win) {
  const ses = win.webContents.session;
  ses.setPermissionCheckHandler(() => true);
  ses.setDevicePermissionHandler((d) => d.deviceType === 'serial' || d.deviceType === 'usb');
  ses.on('select-serial-port', async (event, portList, _wc, callback) => {
    event.preventDefault();
    if (devSilent) { // sambung ulang otomatis ke port tersimpan, tanpa dialog
      devSilent = false;
      const sv = savedPorts[devRole];
      const hit = sv && (portList.find((p) => p.portName === sv.portName) ||
        (sv.vendorId ? portList.find((p) => p.vendorId === sv.vendorId && p.productId === sv.productId) : null));
      return callback(hit ? hit.portId : '');
    }
    if (!portList.length) {
      await dialog.showMessageBox(win, {
        type: 'info', title: 'Port serial tidak ditemukan', message: 'Tidak ada port serial/COM yang terdeteksi.',
        detail: 'Printer Bluetooth: pasangkan dulu di Windows (Settings > Bluetooth & devices), lalu cek di Device Manager bagian Ports (COM & LPT) bahwa muncul port COM "Outgoing". Nyalakan printer, lalu coba lagi.'
      });
      return callback('');
    }
    const id = await pilih(win, 'Pilih port serial / COM', 'Pilih port printer (atau scanner) yang akan dihubungkan:',
      portList.map((p) => ({ id: p.portId, label: (p.displayName || p.portName) + '  [' + p.portName + (p.vendorId ? ', VID ' + hex(p.vendorId) + ':' + hex(p.productId) : '') + ']' })));
    const ch = portList.find((p) => p.portId === id);
    if (ch) { savedPorts[devRole] = { portName: ch.portName, displayName: ch.displayName || '', vendorId: ch.vendorId || 0, productId: ch.productId || 0 }; writePorts(); }
    callback(id);
  });
  ses.on('select-usb-device', async (event, details, callback) => {
    event.preventDefault();
    const dl = details.deviceList || [];
    if (!dl.length) {
      await dialog.showMessageBox(win, { type: 'info', title: 'Perangkat USB tidak ditemukan', message: 'Tidak ada perangkat USB yang bisa dipilih.', detail: 'Pastikan printer menyala dan kabel USB terpasang, lalu coba lagi.' });
      return callback();
    }
    const id = await pilih(win, 'Pilih printer USB', 'Pilih perangkat USB printer struk:',
      dl.map((d) => ({ id: d.deviceId, label: (d.productName || 'Perangkat USB') + (d.manufacturerName ? ' - ' + d.manufacturerName : '') + '  [' + hex(d.vendorId) + ':' + hex(d.productId) + ']' })));
    id ? callback(id) : callback();
  });
}

app.whenReady().then(() => {
  const w = new BrowserWindow({
    width: 1280, height: 800, autoHideMenuBar: true,
    webPreferences: { preload: path.join(__dirname, 'preload.js'), contextIsolation: true, nodeIntegration: false, sandbox: true }
  });
  setupDevices(w);
  w.maximize();
  w.loadFile(path.join(__dirname, 'www', 'index.html'));
});
app.on('window-all-closed', () => app.quit());
