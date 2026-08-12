/* ============================================================
   BALEASRI EVENT — aplikasi web manajemen event / turnamen
   (bola voli, futsal, basket, badminton, dll) yang universal.
   PWA mandiri: data disimpan di localStorage perangkat, tanpa
   server. Backup via ekspor/impor file JSON.

   Arsitektur mengikuti pola proyek referensi (Merdeka):
   - Script global (bukan ES module), saling bergantung lewat
     variabel/fungsi global.
   - Satu object `db` sebagai sumber data tunggal di memori.
   - Setiap perubahan data → panggil saveDB().
   - Routing SPA via hash + showSection().
   ============================================================ */

/* ---------- GLOBAL ERROR HANDLER ---------- */
let _lastGlobalErrorToast = 0, _globalErrorCount = 0;
function _reportGlobalError(label, err){
  console.error(label, err);
  const msg = (err && (err.message || String(err))) || String(err || '');
  if(/ResizeObserver loop/i.test(msg)) return;
  _globalErrorCount++;
  const now = Date.now();
  if(now - _lastGlobalErrorToast < 8000) return;
  _lastGlobalErrorToast = now;
  try{ toast('⚠️ Terjadi kesalahan tak terduga. Coba muat ulang halaman.', 6000); }catch(e){}
}
window.addEventListener('error', e => _reportGlobalError('Uncaught error:', e.error || e.message));
window.addEventListener('unhandledrejection', e => _reportGlobalError('Unhandled promise rejection:', e.reason));

/* ---------- KONSTANTA ---------- */
const DB_KEY = 'baleasri_db_v1';
const SESSION_KEY = 'baleasri_session_v1';
const ACTIVE_TURNAMEN_KEY = 'baleasri_active_turnamen_v1';
const LAST_SECTION_KEY = 'baleasri_last_section_v1';
const SIDEBAR_COLLAPSED_KEY = 'baleasri_sidebar_collapsed_v1';

const OLAHRAGA_PRESET = [
  {key:'voli',  label:'Bola Voli',   icon:'🏐', setDefault:3, poinMenang:2, poinKalah:0},
  {key:'futsal',label:'Futsal',      icon:'⚽', setDefault:1, poinMenang:3, poinKalah:0},
  {key:'basket',label:'Basket',      icon:'🏀', setDefault:1, poinMenang:2, poinKalah:0},
  {key:'badminton',label:'Badminton',icon:'🏸', setDefault:3, poinMenang:1, poinKalah:0},
  {key:'tenis', label:'Tenis',       icon:'🎾', setDefault:3, poinMenang:1, poinKalah:0},
  {key:'sepaktakraw',label:'Sepak Takraw',icon:'🤾',setDefault:3, poinMenang:2, poinKalah:0},
];

function olahragaInfo(key){
  return OLAHRAGA_PRESET.find(o=>o.key===key) || {key, label:key||'Turnamen', icon:'🏆', setDefault:3, poinMenang:2, poinKalah:0};
}

const SISTEM = {
  roundrobin: {label:'Round Robin (Satu Putaran)', desc:'Setiap tim bertemu sekali'},
  grup:       {label:'Grup + Knockout',            desc:'Babak grup lalu eliminasi'},
  knockout:   {label:'Knockout (Eliminasi)',       desc:'Kalah = tersingkir'},
};

/* ---------- UTIL ---------- */
function uid(){ return (crypto.randomUUID ? crypto.randomUUID() : 'id-'+Date.now()+'-'+Math.random().toString(16).slice(2)); }
function todayISO(){
  const d=new Date();
  return `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,'0')}-${String(d.getDate()).padStart(2,'0')}`;
}
function esc(s){ return String(s??'').replace(/[&<>\"']/g, c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c])); }
function fmtRp(n){ return new Intl.NumberFormat('id-ID',{style:'currency',currency:'IDR',minimumFractionDigits:0}).format(Number(n)||0); }
function fmtDate(iso){
  if(!iso) return '-';
  const d=new Date(iso+'T00:00:00');
  if(isNaN(d.getTime())) return iso;
  return d.toLocaleDateString('id-ID',{day:'numeric',month:'short',year:'numeric'});
}
function fmtDateHari(iso){
  if(!iso) return '-';
  const d=new Date(iso+'T00:00:00');
  if(isNaN(d.getTime())) return iso;
  return d.toLocaleDateString('id-ID',{weekday:'long',day:'numeric',month:'long',year:'numeric'});
}
function fmtDateJam(iso, jam){
  const tgl = fmtDateHari(iso);
  return jam ? `${tgl} · ${esc(jam)}` : tgl;
}
function inisial(nama){
  return (nama||'?').trim().split(/\s+/).slice(0,2).map(w=>w[0]).join('').toUpperCase();
}

let _toastTimer;
function toast(msg, ms){
  const el = document.getElementById('toast');
  if(!el) return;
  el.textContent = msg;
  el.className = 'toast show';
  if(/⚠|⛔|❌/.test(msg)) el.classList.add('bahaya');
  else if(/✅|Berhasil/.test(msg)) el.classList.add('sukses');
  clearTimeout(_toastTimer);
  _toastTimer = setTimeout(()=>{ el.className='toast'; }, ms||2600);
}

/* ============================================================
   DATA LAYER — localStorage (offline-first, tanpa server)
   Semua data event ada di satu object global `db`.
   ============================================================ */
function defaultDB(){
  return {
    org: { nama:'Baleasri Event', logo:'🏐', olahragaKustom:[] },
    users: [ {id:'u-admin', name:'Administrator', username:'admin', password:'admin', role:'admin'} ],
    turnamen: [],
    activeTurnamenId: null,
    settings: {},
  };
}
let db = defaultDB();

function saveDB(){
  try{ localStorage.setItem(DB_KEY, JSON.stringify(db)); }
  catch(e){ console.error('Gagal menyimpan DB:', e); toast('⚠️ Gagal menyimpan data ke perangkat'); }
}
function loadDB(){
  try{
    const raw = localStorage.getItem(DB_KEY);
    if(!raw) return defaultDB();
    const parsed = JSON.parse(raw);
    const merged = Object.assign(defaultDB(), parsed);
    merged.org = Object.assign(defaultDB().org, parsed.org || {});
    merged.users = parsed.users && parsed.users.length ? parsed.users : defaultDB().users;
    merged.turnamen = parsed.turnamen || [];
    return merged;
  }catch(e){
    console.error('Gagal memuat DB:', e);
    return defaultDB();
  }
}

function activeTurnamen(){ return db.turnamen.find(t => t.id === db.activeTurnamenId) || null; }
function getTurnamen(id){ return db.turnamen.find(t => t.id === id) || null; }
function setActiveTurnamen(id){
  db.activeTurnamenId = id;
  try{ localStorage.setItem(ACTIVE_TURNAMEN_KEY, id || ''); }catch(e){}
  saveDB();
}
function getTim(turnamen, id){ return (turnamen.tim||[]).find(t => t.id === id) || null; }
function getPertandingan(turnamen, id){ return (turnamen.pertandingan||[]).find(p => p.id === id) || null; }
