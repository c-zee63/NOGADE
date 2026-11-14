# Panduan Sinkronisasi 2 HP atau lebih (Firebase)

## A. Menyiapkan Firebase (sekali saja)

1. https://console.firebase.google.com -> Add project (Google Analytics boleh dimatikan).
2. Build -> Authentication -> Get started -> Sign-in method -> Email/Password -> Enable.
   Tab Users -> Add user -> isi email (boleh fiktif, mis. toko@tokosaya.com) + password. Catat keduanya.
3. Build -> Firestore Database -> Create database -> pilih lokasi (asia-southeast2 Jakarta) -> Production mode.
4. Firestore -> tab Rules -> ganti isinya dengan yang di bawah -> Publish:

```
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    match /{document=**} {
      allow read, write: if request.auth != null;
    }
  }
}
```

5. Project settings (ikon roda gigi) -> General -> catat "Project ID".
   Di bagian "Your apps" tambahkan app Web (</>) -> salin nilai apiKey (AIzaSy...).

Pengaturan Firebase (project, rules, akun) TIDAK perlu diubah ketika aplikasi mendapat fitur/kolom baru:
data produk dan transaksi disimpan sebagai satu paket JSON per baris, jadi kolom baru ikut tersinkron otomatis.
Syaratnya semua HP memakai versi aplikasi yang sama.

## B. Aturan emas

* **HP Utama = Kode HP 1.** Dialah patokan data. Hanya HP Utama yang boleh mengubah identitas toko,
  teks struk, PIN, dan logo (di HP lain kolom itu terkunci).
* **Hubungkan HP Utama LEBIH DULU.** Ia mengunggah semua data ke cloud.
* HP kedua dst. (Kode 2, 3, ...) **hanya menerima**: datanya DIGANTI data cloud. Jika cloud masih kosong,
  HP kode 2 dst. ditolak dan tidak mengunggah apa pun.
* Setiap HP harus punya Kode HP berbeda. Aplikasi memberi peringatan bila kode sudah dipakai HP lain.

## C. Menghubungkan HP

1. HP Utama: Pengaturan -> Sinkronisasi -> isi Project ID, API Key, Email, Password, Kode HP = 1 -> Simpan & Hubungkan.
   Tunggu sampai status "Tersinkron".
2. HP kedua (APK terpasang): isi data yang sama, Kode HP = 2 -> Simpan & Hubungkan. Setujui pesan penggantian data.
3. Tombol "Sinkron sekarang" di HP Utama juga mengirim transaksi HP Utama yang ternyata belum ada di cloud.

## D. Bila data di cloud salah / berantakan (mis. sebelumnya dihubungkan dengan versi lama)

Gejala: transaksi HP Utama tidak muncul di HP lain, data tertukar, atau HP lain mengikuti data yang salah.

1. **Backup dulu** di HP Utama: Pengaturan -> Cadangan data -> Cadangkan sekarang (terenkripsi). Catat kata sandi backupnya.
2. Firebase Console -> Firestore Database -> Data. Pada setiap koleksi `products`, `sales`, `slog`, `cfg`, `meta`
   klik titik tiga (⋮) -> Delete collection.
3. Di HP lain (kode 2, dst.): Pengaturan -> Sinkronisasi -> Putuskan.
4. Di HP Utama (data yang benar): Simpan & Hubungkan (kode 1). Karena cloud kosong, semua datanya diunggah.
5. Hubungkan HP lain satu per satu (kode 2, 3, ...).

Bila data HP Utama sudah rusak, pulihkan dulu dari file backup (.enc.json, butuh kata sandi backup) sebelum langkah 4.
