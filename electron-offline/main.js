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

// Ingat perangkat yang pernah dipilih (disimpan di folder data aplikasi) supaya setelah aplikasi ditutup/dibuka
// printer & scanner tersambung lagi otomatis, tanpa memilih port/pairing ulang.
const devFile = () => path.join(app.getPath('userData'), 'devices.json');
const devLoad = () => { try { return JSON.parse(fs.readFileSync(devFile(), 'utf8')) || {}; } catch (e) { return {}; } };
const devSave = (role, v) => { try { const o = devLoad(); o[role] = v; fs.writeFileSync(devFile(), JSON.stringify(o), 'utf8'); } catch (e) {} };
let devReq = { role: '', auto: false, t: 0 };
const takeReq = () => { const r = devReq; devReq = { role: '', auto: false, t: 0 }; return (r.role && Date.now() - r.t < 20000) ? r : { role: '', auto: false }; };
const same = (a, b) => String(a) === String(b);
function findSerial(list, sv) {
  if (!sv) return null;
  if (sv.deviceInstanceId) { const h = list.find((p) => p.deviceInstanceId && p.deviceInstanceId === sv.deviceInstanceId); if (h) return h; }
  if (sv.portName) { const h = list.find((p) => p.portName === sv.portName && (!sv.vendorId || same(p.vendorId, sv.vendorId))); if (h) return h; }
  if (sv.vendorId && sv.productId) { const c = list.filter((p) => same(p.vendorId, sv.vendorId) && same(p.productId, sv.productId)); if (c.length === 1) return c[0]; }
  return null;
}
ipcMain.handle('dev:role', (_e, role) => { devReq = { role: /^(printer|scan)$/.test(role) ? role : '', auto: false, t: Date.now() }; return true; });
ipcMain.handle('dev:reconnect', async (e, roles) => {
  for (const r of (Array.isArray(roles) ? roles : [])) {
    if (!/^(printer|scan)$/.test(r)) continue;
    devReq = { role: r, auto: true, t: Date.now() };
    try { await e.sender.executeJavaScript('window.dkAutoConn&&window.dkAutoConn(' + JSON.stringify(r) + ')', true); } catch (err) {}
  }
  devReq = { role: '', auto: false, t: 0 };
  return true;
});
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
    const rq = takeReq();
    if (rq.auto) { // sambung ulang otomatis: pakai perangkat tersimpan, tanpa dialog apa pun
      const h = findSerial(portList, devLoad()[rq.role]);
      return callback(h ? h.portId : '');
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
    const pp = portList.find((x) => x.portId === id);
    if (rq.role && pp) devSave(rq.role, { portName: pp.portName, displayName: pp.displayName || '', vendorId: pp.vendorId || '', productId: pp.productId || '', serialNumber: pp.serialNumber || '', deviceInstanceId: pp.deviceInstanceId || '' });
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
