/* ============================================================
   SUPABASE CONFIG
   Ganti dengan Project URL & anon public key dari
   Supabase Dashboard > Project Settings > API, SETELAH
   menjalankan sql/schema.sql di SQL Editor.
   ============================================================ */
const SUPABASE_URL = 'https://hqbcdmmljnindtcyrvtd.supabase.co';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImhxYmNkbW1sam5pbmR0Y3lydnRkIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODExNDQ0MzYsImV4cCI6MjA5NjcyMDQzNn0.rWUC8gWAR4RKqfvbnRDKd94y3IWms6f7AVx48PC5Zkw';

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
