-- ============================================================
-- SPORTKAS — Skema Database Supabase
-- Aplikasi manajemen keuangan event olahraga
-- Jalankan file ini di Supabase Dashboard > SQL Editor
-- ============================================================

create extension if not exists "pgcrypto";

-- ------------------------------------------------------------
-- EVENTS — satu baris = satu event olahraga (mis. "Turnamen Voli
-- Agustusan 2026"). Semua data lain terikat ke event_id, kecuali
-- panitia (master data orang, dipakai lintas event).
-- ------------------------------------------------------------
create table if not exists events (
  id uuid primary key default gen_random_uuid(),
  nama text not null,
  lokasi text,
  tanggal_mulai date,
  tanggal_selesai date,
  is_active boolean not null default true,
  created_at timestamptz not null default now()
);

-- ------------------------------------------------------------
-- KAS — Buku Utama. Setiap baris = satu transaksi uang masuk/keluar.
-- `sumber` membedakan entri manual (diketik langsung di Buku Utama)
-- vs entri otomatis yang di-generate dari modul lain (tiket, parkir,
-- sponsorship, insentif). `ref_id` menunjuk ke baris asal di modul
-- sumbernya — dipakai untuk update/hapus otomatis kalau baris asal
-- diubah/dihapus, supaya Buku Utama tidak pernah "nyangkut" data lama.
-- ------------------------------------------------------------
create table if not exists kas (
  id uuid primary key default gen_random_uuid(),
  event_id uuid not null references events(id) on delete cascade,
  tanggal date not null,
  keterangan text not null,
  tipe text not null check (tipe in ('masuk','keluar')),
  kategori text,
  jumlah numeric not null default 0,
  sumber text not null default 'manual' check (sumber in ('manual','tiket','parkir','sponsorship','insentif')),
  ref_id uuid,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create index if not exists idx_kas_event on kas(event_id);
create index if not exists idx_kas_ref on kas(sumber, ref_id);

-- ------------------------------------------------------------
-- TIKET_PARKIR_HARIAN — satu baris per tanggal per event. Harga
-- tiket & parkir SENGAJA disimpan per-baris (bukan setting global),
-- supaya bisa beda tiap hari (mis. hari final harga naik).
-- ------------------------------------------------------------
create table if not exists tiket_parkir_harian (
  id uuid primary key default gen_random_uuid(),
  event_id uuid not null references events(id) on delete cascade,
  tanggal date not null,
  harga_tiket numeric not null default 0,
  harga_parkir numeric not null default 0,
  jumlah_tiket_terjual integer not null default 0,
  jumlah_kendaraan integer not null default 0,
  catatan text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique(event_id, tanggal)
);

-- ------------------------------------------------------------
-- SPONSORSHIP — satu baris per sponsor per event. `status` menentukan
-- apakah nominalnya sudah ikut masuk ke Buku Utama (lihat 07-sponsorship.js):
-- hanya nominal yang sudah 'lunas' yang dicatat sebagai uang masuk real.
-- ------------------------------------------------------------
create table if not exists sponsorship (
  id uuid primary key default gen_random_uuid(),
  event_id uuid not null references events(id) on delete cascade,
  nama_sponsor text not null,
  jenis text not null default 'uang' check (jenis in ('uang','barang')),
  nominal numeric not null default 0,
  deskripsi text,
  kontak text,
  status text not null default 'belum_lunas' check (status in ('belum_lunas','sebagian','lunas')),
  nominal_diterima numeric not null default 0,
  tanggal date,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- ------------------------------------------------------------
-- PANITIA — master data orang, TIDAK terikat event (bisa dipakai
-- lintas event olahraga berikutnya).
-- ------------------------------------------------------------
create table if not exists panitia (
  id uuid primary key default gen_random_uuid(),
  nama text not null,
  jabatan text,
  kontak text,
  created_at timestamptz not null default now()
);

-- ------------------------------------------------------------
-- INSENTIF_PANITIA — honor/insentif tiap panitia PER EVENT. Hanya
-- baris berstatus 'lunas' yang dicatat sebagai uang keluar di Buku Utama.
-- ------------------------------------------------------------
create table if not exists insentif_panitia (
  id uuid primary key default gen_random_uuid(),
  event_id uuid not null references events(id) on delete cascade,
  panitia_id uuid not null references panitia(id) on delete cascade,
  jumlah numeric not null default 0,
  status text not null default 'belum_bayar' check (status in ('belum_bayar','lunas')),
  tanggal_bayar date,
  catatan text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- ------------------------------------------------------------
-- USERS — login sederhana (admin & bendahara). Password di-hash
-- dengan pgcrypto (crypt/gen_salt), TIDAK PERNAH disimpan plain text.
-- ------------------------------------------------------------
create table if not exists app_users (
  id uuid primary key default gen_random_uuid(),
  username text not null unique,
  nama text not null,
  password_hash text not null,
  role text not null default 'bendahara' check (role in ('admin','bendahara')),
  created_at timestamptz not null default now()
);

-- Admin default: username "admin", password "admin123" — GANTI SEGERA
-- setelah setup lewat menu Manajemen User.
insert into app_users (username, nama, password_hash, role)
values ('admin', 'Admin Utama', crypt('admin123', gen_salt('bf')), 'admin')
on conflict (username) do nothing;

-- ------------------------------------------------------------
-- RLS — buka baca/tulis untuk anon key (aplikasi 100% frontend static,
-- proteksi login dilakukan di level aplikasi). Kalau butuh proteksi
-- lebih ketat, ganti dengan RPC + session token seperti pola Merdeka.
-- ------------------------------------------------------------
alter table events enable row level security;
alter table kas enable row level security;
alter table tiket_parkir_harian enable row level security;
alter table sponsorship enable row level security;
alter table panitia enable row level security;
alter table insentif_panitia enable row level security;
alter table app_users enable row level security;

do $$
declare t text;
begin
  foreach t in array array['events','kas','tiket_parkir_harian','sponsorship','panitia','insentif_panitia']
  loop
    execute format('drop policy if exists allow_all_%1$s on %1$s', t);
    execute format('create policy allow_all_%1$s on %1$s for all using (true) with check (true)', t);
  end loop;
end $$;

-- app_users sengaja TIDAK dibuka for-all: hanya boleh dibaca lewat RPC login
-- di bawah (SECURITY DEFINER), supaya password_hash tidak pernah terkirim ke browser.
drop policy if exists no_direct_access_app_users on app_users;
create policy no_direct_access_app_users on app_users for all using (false);

-- ------------------------------------------------------------
-- RPC LOGIN — verifikasi username/password di server, return data user
-- TANPA password_hash. Browser tidak pernah melihat hash sama sekali.
-- ------------------------------------------------------------
create or replace function rpc_login(p_username text, p_password text)
returns json
language plpgsql
security definer
as $$
declare
  u app_users%rowtype;
begin
  select * into u from app_users where username = p_username;
  if u.id is null or u.password_hash <> crypt(p_password, u.password_hash) then
    return json_build_object('error', 'Username atau password salah');
  end if;
  return json_build_object(
    'id', u.id, 'username', u.username, 'nama', u.nama, 'role', u.role
  );
end;
$$;
