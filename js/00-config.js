/* ============================================================
   SUPABASE CONFIG
   Ganti dengan Project URL & anon public key dari
   Supabase Dashboard > Project Settings > API, SETELAH
   menjalankan sql/schema.sql di SQL Editor.
   ============================================================ */
const SUPABASE_URL = 'GANTI_DENGAN_SUPABASE_URL_ANDA';
const SUPABASE_ANON_KEY = 'GANTI_DENGAN_SUPABASE_ANON_KEY_ANDA';

const sb = supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
  global: { fetch: (url, options = {}) => fetch(url, { ...options, cache: 'no-store' }) },
});

/* ============================================================
   GLOBAL ERROR HANDLER — tangkap error tak terduga supaya user
   diberi tahu lewat toast (bukan app terlihat "diam"/hang).
   ============================================================ */
window.addEventListener('error', (e) => {
  console.error('Uncaught error:', e.error || e.message);
  try { toast('⚠️ Terjadi kesalahan tak terduga. Coba muat ulang halaman.', 5000); } catch(_) {}
});
window.addEventListener('unhandledrejection', (e) => {
  console.error('Unhandled promise rejection:', e.reason);
});
