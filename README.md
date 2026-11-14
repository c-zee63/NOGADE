## Pembaruan: keamanan data (backup terenkripsi, jejak audit, build reprodusibel, backup otomatis)
- **Backup terenkripsi**: semua backup (manual, Google Drive, otomatis) dienkripsi **AES-256-GCM**; kunci diturunkan dari kata sandi backup lewat PBKDF2-SHA256 (300.000 putaran), salt dan IV acak per file. File berformat `backup-pos-TAHUN-BULAN-TGL-JAMMENIT.enc.json`. Atur kata sandi di Pengaturan -> Cadangan data. **Kata sandi yang hilang tidak bisa dipulihkan.** File yang diubah atau kata sandi salah ditolak. Backup format lama (tidak terenkripsi) masih bisa dipulihkan, dengan peringatan. Aplikasi tidak lagi membuat backup tanpa enkripsi.
- **Jejak audit** (Pengaturan -> Jejak audit): mencatat siapa, kapan, dan alasan untuk void, hapus transaksi, hapus semua transaksi, ubah harga (nilai lama -> baru), ubah/hapus/impor barang, stok masuk/opname, harga manual/diskon saat jual, pulihkan backup, dan masuk/keluar mode Owner. Catatan hanya bisa ditambah dari aplikasi (tidak ada tombol ubah/hapus) dan ikut tersimpan di backup; saat pulihkan backup, jejak audit digabung, bukan ditimpa. "Siapa" = nama yang diisi di dialog (default: Nama kasir di Pengaturan) + mode (Kasir/Owner) + Kode HP. Aplikasi belum punya akun per orang, jadi pastikan Nama kasir diganti per shift/orang.
- **Void** sekarang meminta nama pelaksana + alasan, dan menyimpan `voidBy`, `voidAt`, `voidReason` di transaksi (ikut tersinkron).
- **Hapus transaksi tidak lagi permanen**: salinan utuh disimpan di **Tempat Sampah** sebelum dihapus (juga untuk "Hapus semua transaksi" dan transaksi yang hilang akibat pulihkan backup atau hapus dari HP lain via sinkronisasi) dan bisa **dipulihkan** (stok disesuaikan lagi). Hapus semua transaksi wajib mengetik HAPUS.
- **Backup otomatis terjadwal** (Pengaturan -> Backup otomatis terjadwal): harian pada jam tertentu, tiap 12 jam, atau tiap 6 jam; menyimpan N file terakhir (default 7) di folder `POS-Backup` (Android: Dokumen, bila ditolak sistem dipakai folder aplikasi; komputer: Dokumen; browser: penyimpanan browser). Berjalan selama aplikasi terbuka; backup yang terlewat dijalankan saat aplikasi dibuka lagi (Android tidak mengizinkan aplikasi web menjalankan tugas saat tertutup). Ada tombol "Pulihkan dari backup otomatis" dan "Kirim / simpan backup terakhir" (untuk menyalin keluar HP). Backup di HP yang sama tidak melindungi dari HP hilang/rusak.
- **Build reprodusibel**: build APK kini memakai `npm ci` + `package-lock.json`. **Langkah sekali jalan**: tab Actions -> *Buat package-lock.json* -> Run workflow (membuat dan meng-commit lockfile untuk aplikasi dan `electron-offline`). Sebelum lockfile ada, build APK sengaja berhenti dengan pesan jelas. `.npmrc` memakai `save-exact=true` sehingga paket baru yang ditambahkan nanti tidak memakai `^`. Mengganti versi dependensi: ubah `package.json`, lalu jalankan lagi workflow lockfile.
- Database lokal naik ke versi 2 (menambah penyimpanan `audit` dan `trash`); data lama tetap aman.

## Pembaruan: keranjang potret & stok menipis berdasarkan Stok minimum
- **Keranjang mode potret**: nama barang memanjang selebar baris, lalu Qty, Harga, Subtotal (dan Laba bila tampil) berada di bawahnya dengan tulisan labelnya di bawah tiap kolom. Hanya berlaku saat layar potret (`orientation:portrait`, lebar <= 900px); mode lanskap tidak berubah. Alur dan rumus penjumlahan tidak diubah (hanya CSS dan penanda `data-l` pada kolom).
- **Laporan > Stok menipis**: batas tetap 6 karton (`LOW_LIMIT`) dihapus. Produk masuk daftar bila stok <= **Stok minimum** di menu Barang (induk + eceran dihitung setara karton).
- **Warna**: bagian minus merah, bagian yang masih ada hijau, nol abu-abu. Contoh Aqua: stok 4 krt + 30 btl dipaksa jual 5 krt tampil **-1 krt** (merah) + **30 btl** (hijau).
- **Popup**: ketuk kartu Stok menipis untuk daftar; ketuk nama produk untuk popup rinci (status MINUS/HABIS/MENIPIS, stok per satuan, total setara, stok minimum, kekurangan, dan penjelasan bila minus karena penjualan dipaksa melebihi stok ready). Tombol "Daftar stok menipis" kembali ke daftar.

## Pembaruan: Stok menipis di Laporan (mode Owner)
- Kartu **Stok menipis** di paling bawah menu **Laporan** sekarang bisa diketuk. Isinya: jumlah produk yang menipis dan 5 produk teratas sebagai pratinjau.
- Ketuk kartu untuk membuka **daftar lengkap**: produk (+ kategori), supplier, stok, dan harga beli. Urut per supplier (lalu stok paling sedikit) agar mudah dijadikan daftar order ke sales/distributor.
- **Aturan**: produk masuk daftar bila stok induk (karton) **kurang dari 6**. Sisa eceran ikut dihitung sebagai pecahan karton (mis. 5 karton + 12 botol isi 24 = 5,5 karton, masuk daftar). Karton 6 atau lebih tidak masuk, berapa pun sisa eceran. Barang eceran tidak tampil sendiri, melainkan digabung ke induknya. Barang tanpa induk dihitung dari stoknya sendiri.
- Batas 6 bisa diubah lewat konstanta `LOW_LIMIT` di `www/index.html`.
- Menu **Barang** (centang Stok menipis) tidak diubah dan masih memakai Stok minimum per barang.

## Pembaruan: menu Tutorial
- Tombol **📖 Tutorial** berdiri sendiri di baris paling atas (di atas header), tampil di semua halaman dan semua mode.
- Isi: 38 tutorial langkah demi langkah (mode Kasir/Owner, lisensi, PIN, penjualan, scan barcode, harga bertingkat Grosir/Normal, scan beruntun Quick/Slow, harga manual, diskon, pembayaran, struk, tahan transaksi, input barang baru dan arti tiap kolomnya, stok masuk, opname, tambah produk dari Stok, riwayat, void, hapus, laporan, pengaturan toko/logo/PIN/scanner/printer, backup, dan masalah umum). Sinkronisasi Firebase sengaja tidak dimasukkan.
- Ada kolom cari dan tombol Buka semua / Tutup semua. Tiap judul diberi label **Semua** (kasir & owner) atau **Owner**.
- Untuk mengubah teks, edit array `TUT` di `www/index.html`.

## Pembaruan: alur bayar cepat
- Tekan **BAYAR** (atau F8) saat kolom Dibayar masih kosong: kursor langsung masuk ke kolom Dibayar (keyboard angka).
- Setelah angka diketik, tombol **=>** (Go) di keyboard HP / Enter sama dengan menekan BAYAR.
- Setelah transaksi tunai berhasil muncul popup **Kembalian** besar (atau "Uang pas"). Tekan OK untuk lanjut; jika "Kirim struk digital" dicentang, jendela struk muncul setelahnya.

## Pembaruan: kunci harga, hak akses kasir, tambah produk dari Stok
- **Kotak centang Grosir / Normal** di Kasir (dekat ikon ⌨️ 📷, semua mode). *Grosir*: harga otomatis ikut harga bertingkat saat qty mencapai batasnya. *Normal*: harga tetap harga satuan walau qty mencapai harga bertingkat. Pilihan diingat.
- **Kotak centang Quick / Slow** (scan barcode beruntun). *Slow* (awal, sama seperti sebelumnya): setelah scan, isi jumlah dulu baru masuk keranjang. *Quick*: hasil scan langsung masuk keranjang jumlah 1; scan barang yang sama lagi menambah jumlahnya. Kamera HP dibuka ulang otomatis (jeda 1 detik) sampai dibatalkan; berhenti bila barcode tidak dikenal; bacaan ganda <0,5 detik dihitung sekali; ada peringatan bila melebihi stok. Berlaku juga untuk scanner USB/Bluetooth/serial (barcode cocok persis). Pilihan diingat.
- **Tombol Help (?)** kecil di baris header, paling kanan (menggantikan strip Tutorial di paling atas) – membuka halaman tutorial.
- **Harga ubah langsung (Owner)** berlaku di kedua mode. Jika di bawah harga modal, kolom harga menjadi **merah** dan transaksi tidak bisa dibayar.
- **Stok (mode Kasir)**: harga beli baru tidak boleh lebih rendah dari harga lama; muncul pemberitahuan dan data tidak disimpan. Hanya Owner yang boleh menurunkan.
- **Barang**: tombol Ubah hanya di mode Owner. Klik nama produk untuk melihat informasi produk (tombol Ubah di jendela itu hanya muncul untuk Owner).
- **Riwayat**: klik satu transaksi untuk melihat isi lengkapnya di semua mode; tombol Hapus hanya untuk Owner.
- **Stok > Jenis > "Tambah produk baru"** (paling atas): form sama seperti + Barang (termasuk scan barcode). Barcode yang sudah ada ditolak.

## Pembaruan: Struk digital
- Gambar struk (PNG) berisi logo, nama/alamat/telepon toko, no. transaksi, waktu, kasir, daftar item lengkap (qty, harga, diskon, subtotal), total, metode bayar, kembalian, dan teks bawah. Transaksi void diberi stempel VOID.
- Buka lewat tombol **Kirim** di tiap baris Riwayat, tombol **Struk digital** di jendela detail (Owner), atau centang **Kirim struk digital setelah bayar** di Kasir.
- **Bagikan gambar** membuka menu share Android/browser (WhatsApp, Email, Telegram, dll.). Tombol **WhatsApp (teks)** dapat langsung ke nomor pelanggan (08xx otomatis jadi 62xx), **Email (teks)** membuka aplikasi email, **Simpan gambar** menyimpan PNG. Tidak butuh internet untuk membuat struk, dan tidak ada plugin baru, jadi build APK tetap sama.

## Pembaruan: nama toko di header
- Nama toko memakai huruf serif elegan (Georgia/Palatino), lebih besar (27px; 21px di HP), kapital dengan jarak huruf, warna putih ke emas lembut dan bayangan halus. Tinggi header dan letak kolom di bawahnya tidak berubah. Nama yang terlalu panjang dipotong dengan "…".

## Pembaruan: PIN, warna menu, pengaturan struk
- **PIN Owner 4 angka**: masuk mode Owner otomatis begitu 4 angka benar diketik (tanpa tombol Masuk). Jika salah, kolom dikosongkan. Di Pengaturan, PIN wajib tepat 4 angka. (PIN lama yang bukan 4 angka tetap bisa dipakai lewat tombol Masuk sampai diganti.)
- **Menu berwarna**: Kasir (biru), Barang (oranye), Stok (ungu), Riwayat (hijau), Laporan (pink), Pengaturan (abu-biru); kartu tiap halaman punya garis atas dan judul tabel dengan warna menu masing-masing.
- **Pengaturan struk baru**: *Karakter sebelum detail item* (mis. `*` atau `-`, tampil sebelum jumlah, mis. `* 2 KG x 16.000`) dan *Jarak antar produk* (0-3 baris kosong). Berlaku di struk browser maupun printer ESC/POS/RawBT, dan ikut tersinkron antar HP.

## Perbaikan Riwayat Penjualan (terbaru)
- **Semua metode bayar tampil** (Tunai/QRIS/Transfer/Debit): ada filter *Semua metode*, centang *Tampilkan void*, tombol *Semua tanggal*, dan ringkasan total per metode di atas daftar.
- **Tanggal otomatis ikut hari ini**: jika aplikasi dibiarkan terbuka melewati tengah malam, filter tanggal Riwayat/Laporan ikut berganti (sebelumnya tertinggal di tanggal lama sehingga transaksi baru tidak terlihat).
- **Nomor transaksi tidak bisa bentrok lagi**: nomor baru selalu di atas nomor terbesar yang sudah ada (sebelumnya bisa dobel setelah pulihkan backup / pasang ulang / dua HP berkode sama, sehingga satu transaksi menimpa transaksi lain, mis. #100010).
- **Hapus transaksi (khusus Owner)**: tombol *Hapus* di tiap baris Riwayat dan di jendela detail. Stok dikembalikan otomatis (dicatat di Riwayat stok). Transaksi yang sudah di-void tidak mengembalikan stok dua kali. Penghapusan ikut tersinkron ke HP lain.

# POS Toko – paket build

## Perubahan pada HTML (www/index.html)
- Daftar hasil pencarian produk: baris yang AKAN di-input (dipilih panah/Enter) berwarna solid teal + garis kuning di kiri;
  baris yang hanya dilewati kursor mouse berwarna tint lembut. Light & dark mode.
- Penyesuaian layar HP (safe-area, padding). Ekspor CSV/backup memakai Simpan/Bagikan saat berjalan di APK.

## Fitur khusus APK
- Tombol Enter/=> di keyboard HP: ada tombol "✓ Masuk" di samping kolom Jumlah sebagai cadangan.
- Ikon ⌨️ / 📷 di Kasir untuk memilih ketik atau scan barcode dengan kamera (ML Kit, modul Google diunduh sekali).
- Printer struk: Bluetooth HP lewat aplikasi RawBT (pasangkan printer di Bluetooth HP & di RawBT).

## Perubahan terbaru
- **Perbaikan barcode "tidak dikenal"**: pencarian/scan barcode di Kasir sekarang toleran terhadap spasi/karakter tersembunyi, huruf besar-kecil, barcode tersimpan sebagai angka (bukan teks), nol di depan (UPC-A 12 digit = EAN-13 dengan 0 di depan), apostrof Excel, dan akhiran ".0". Data produk dinormalisasi otomatis saat aplikasi dibuka dan setelah Pulihkan backup / Impor CSV. Barcode/kode yang disimpan lewat Ubah barang juga dibersihkan, dan cek duplikat tidak lagi peka huruf besar-kecil/spasi.
- **Detail transaksi (khusus Owner)**: di Riwayat, klik baris transaksi untuk melihat daftar produk yang terjual (qty, harga, diskon, subtotal, total, bayar, kembali) + tombol Cetak. Di mode Kasir, klik baris tidak melakukan apa-apa.
- **Hapus barang khusus Owner**: di menu Barang, mode Kasir hanya punya tombol Ubah; tombol Hapus hanya muncul di mode Owner.
- **Scan kamera di form barang**: kolom Barcode di Barang → + Barang / Ubah punya tombol 📷. Di APK, kamera otomatis terbuka saat menambah barang baru
  dan angka barcode terbaca langsung masuk ke kolom. (Matikan buka-otomatis dengan `AUTO_SCAN_NEW=false` di `www/index.html`; tombol 📷 tetap ada.)
  Jika barcode sudah dipakai barang lain, muncul peringatan.
- **PPN dihapus**: baris PPN di Kasir, pengaturan PPN (%), serta baris PPN di struk (browser & ESC/POS) sudah dihilangkan. Total = subtotal - diskon.
- **Centang "Cetak struk setelah bayar"** di Kasir (di atas tombol BAYAR). Pilihan diingat antar sesi. Cetak ulang dari Riwayat tetap berfungsi.

## APK (tanpa Android Studio)
1. Upload folder ini ke repo GitHub.
2. Tab Actions → "Build APK" → Run workflow.
3. Unduh `POS-Toko-apk` → `app-debug.apk`, instal di HP.
Lokal: `npm install && npx cap add android && npx cap sync android && cd android && ./gradlew assembleDebug`

## Desktop
- Nativefier (butuh URL hosting): `nativefier/build.bat https://domain-anda/index.html`
- Offline penuh (tanpa hosting): `cd electron-offline && npm install && npm run dist`

## Catatan
- Data tersimpan di IndexedDB per aplikasi: data di APK/desktop TIDAK sama dengan data di browser. Pindahkan via backup/restore.
- Web Serial/WebUSB (scanner serial, printer ESC/POS) tidak tersedia di Android WebView dan di Nativefier.
  Scanner mode keyboard tetap jalan. Cetak struk di desktop: pakai mode "driver Windows".

## Perbaikan bug "registerPlugin is not a function"
- `@capacitor/core` tidak ikut dimuat di halaman web, sehingga `Capacitor.registerPlugin` tidak ada.
- `www/index.html` sekarang memakai `Capacitor.nativePromise` (disediakan native-bridge) lewat fungsi `plug()`.
  `nativeSave()` (backup/ekspor) juga memakai `plug()`. Berlaku untuk RawBT, Filesystem, Share, dan scanner.
- Nama file konfigurasi harus `capacitor.config.json` (titik, bukan garis bawah).

## Lisensi / aktivasi (Mode Owner & Pengaturan)
- Mode Owner (otomatis juga Pengaturan/Laporan) terkunci sampai pembeli memasukkan **Key Registrasi**. Dialog aktivasi menampilkan **Kode Perangkat** (8 karakter, acak, dibuat saat aplikasi pertama dibuka) dan kontak penjual 085252371110 (tombol WhatsApp/Telepon).
- Key dibuat dengan **POS-Keygen** (`keygen.html`, tanda tangan digital Ed25519). Aplikasi hanya memuat kunci PUBLIK (konstanta `PUB` di `www/index.html`), jadi key tidak bisa dipalsukan dari isi APK. Key hanya cocok dengan satu Kode Perangkat dan cukup dimasukkan sekali.
- Menghapus data aplikasi / instal ulang / ganti HP menghasilkan Kode Perangkat baru, sehingga perlu key baru.
- Folder POS-Keygen (berisi `private.key`) JANGAN diunggah ke GitHub. Tidak perlu secret GitHub atau pengaturan build tambahan.
- `LIC_STRICT=true` di `www/index.html` mengunci seluruh aplikasi (bukan hanya Owner) sampai diaktifkan.

- **Konversi satuan (pecah karton otomatis)**: di Barang → Ubah pada barang ECERAN, pilih **Induk** (karton) dan **Isi per induk** (mis. 24). Bila stok eceran kurang saat penjualan dibayar, stok induk dipecah otomatis (contoh: karton 5, botol 2, jual 3 botol → karton 4, botol 23). Tercatat di Riwayat stok sebagai *Pecah karton*, ikut tersinkron. Void/hapus mengembalikan stok ke barang eceran.

## Pembaruan: tampilan Kasir, popup, dan pengingat backup
- **Kotak centang Kasir**: kolom kiri kini *Normal* (atas) dan *Grosir* (bawah); kolom kanan *Quick* (atas) dan *Slow* (bawah), sehingga Normal sejajar Quick dan Grosir sejajar Slow.
- **Bingkai popup**: semua jendela popup (informasi barang, detail transaksi, kembalian, dll.) punya bingkai amber tebal dan latar gelap. Warna diatur lewat variabel CSS `--pop` di `www/index.html`.
- **Teks berjalan** di header (di sebelah nama toko): pengingat agar data (.json) dicadangkan rutin lewat Pengaturan.
- **Pengaturan → Cadangan data**: tombol "Unduh backup (.json)" diganti "Upload/Cadangkan backup (.json)".
- Isi **Tutorial** disesuaikan dengan semua perubahan di atas.
