# SportKas — Manajemen Keuangan Event Olahraga

PWA sederhana (HTML/CSS/JS murni, tanpa framework, tanpa build step)
untuk mencatat keuangan event olahraga: buku utama kas masuk/keluar,
laporan harian tiket & parkir (harga bisa beda tiap hari), sponsorship,
dan insentif panitia.

Kerangka kerjanya terinspirasi dari pola aplikasi Merdeka (Karang
Taruna): modul JS non-ES-module yang saling terhubung lewat variabel
global, deploy sebagai static site, backend Supabase.

## Fitur

- **Buku Utama** — ledger kas masuk/keluar dengan saldo berjalan.
  Bisa diisi manual, TAPI juga otomatis terisi dari 3 modul di bawah
  supaya tidak perlu catat dobel.
- **Tiket & Parkir Harian** — satu baris per tanggal, harga tiket &
  parkir bisa diatur beda tiap hari, otomatis menghitung pendapatan.
- **Sponsorship** — daftar sponsor, status Belum Lunas/Sebagian/Lunas;
  hanya yang sudah diterima yang masuk Buku Utama.
- **Panitia & Insentif** — master data panitia (lintas event) + honor
  per event; status Lunas otomatis tercatat sebagai uang keluar.
- **Dashboard** — ringkasan saldo & angka penting event aktif.
- **Kelola Event** (admin) — bisa buat banyak event (mis. tiap tahun
  event baru), data event lama tetap tersimpan.

## Setup

1. Buat project baru di [supabase.com](https://supabase.com).
2. Buka **SQL Editor**, jalankan seluruh isi `sql/schema.sql`.
   Ini membuat semua tabel, RLS policy, dan RPC login, plus 1 user
   admin default (`admin` / `admin123`).
3. Buka **Project Settings > API**, salin **Project URL** dan
   **anon public key**.
4. Buka `js/00-config.js`, ganti `SUPABASE_URL` dan `SUPABASE_ANON_KEY`
   dengan nilai dari langkah 3.
5. Buka `index.html` langsung di browser (atau serve dengan static
   server apa pun — tidak butuh proses build), login dengan
   `admin` / `admin123`, lalu **segera ganti password** lewat
   Supabase Dashboard (update tabel `app_users`, kolom `password_hash`
   pakai `crypt('password_baru', gen_salt('bf'))` di SQL Editor) —
   halaman Manajemen User belum dibuat di versi ini.
6. Buat event pertama di menu **Kelola Event**.

## Deploy

Situs 100% file statis — bisa dideploy ke Cloudflare Pages/Workers,
Netlify, Vercel, GitHub Pages, atau hosting statis apa pun. Tidak ada
proses build, tinggal upload folder ini apa adanya.

## Arsitektur singkat

- Tidak ada ES modules — semua file `js/NN-nama.js` adalah script
  biasa, saling bergantung lewat fungsi/variabel global. Urutan load
  di `index.html` penting.
- Tiap modul fetch & simpan data-nya sendiri langsung ke Supabase
  (lihat helper generik `dbFetchAll/dbInsert/dbUpdate/dbUpsert/dbDelete`
  di `js/03-db-core.js`) — tidak ada satu object `db` besar yang
  di-diff seperti pola aplikasi lain; lebih simpel karena skala
  pemakai kecil (bendahara + panitia inti).
- **Sinkronisasi otomatis ke Buku Utama**: `syncAutoKas()`/`removeAutoKas()`
  di `js/05-buku-utama.js` dipanggil oleh modul Tiket/Parkir,
  Sponsorship, dan Insentif tiap kali datanya disimpan/dihapus/berubah
  status. Baris otomatis di tabel `kas` ditandai `sumber != 'manual'`
  dan tidak bisa diedit langsung dari Buku Utama — harus lewat halaman
  modul asalnya, supaya datanya selalu konsisten dengan sumbernya.

## Yang belum ada (pengembangan lanjutan)

- Halaman Manajemen User (ganti password, tambah user bendahara baru)
  dari dalam aplikasi — untuk sekarang harus lewat SQL Editor.
- Ekspor laporan ke PDF/Excel.
- Multi-device conflict detection (pola Merdeka) — saat ini simpan
  langsung tanpa deteksi konflik, cukup untuk tim kecil yang jarang
  edit bersamaan di baris yang sama.
- Notifikasi (Telegram/WhatsApp) tiap transaksi baru.
