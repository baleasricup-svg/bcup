/* ============================================================
   UTILITAS UMUM
   ============================================================ */
function uid(){ return (crypto.randomUUID ? crypto.randomUUID() : 'id-'+Date.now()+'-'+Math.random().toString(16).slice(2)); }

function todayISO(){ const d=new Date(); return `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,'0')}-${String(d.getDate()).padStart(2,'0')}`; }

function fmtRp(n){ return new Intl.NumberFormat('id-ID',{style:'currency',currency:'IDR',minimumFractionDigits:0}).format(Number(n)||0); }

function fmtDate(iso){ if(!iso) return '-'; const d=new Date(iso+'T00:00:00'); return d.toLocaleDateString('id-ID',{day:'numeric',month:'short',year:'numeric'}); }

function fmtDateHari(iso){ if(!iso) return '-'; const d=new Date(iso+'T00:00:00'); return d.toLocaleDateString('id-ID',{weekday:'long',day:'numeric',month:'long',year:'numeric'}); }

function esc(s){ return String(s??'').replace(/[&<>"']/g, c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c])); }

function toast(msg, ms=3000){
  let el = document.getElementById('toast');
  if(!el){
    el = document.createElement('div');
    el.id = 'toast';
    document.body.appendChild(el);
  }
  el.textContent = msg;
  el.classList.add('show');
  clearTimeout(el._t);
  el._t = setTimeout(()=> el.classList.remove('show'), ms);
}

function confirmDialog(msg){ return window.confirm(msg); }

// Debounce sederhana — dipakai untuk input pencarian/angka supaya tidak
// spam request ke Supabase tiap ketikan.
function debounce(fn, wait=400){
  let t;
  return (...args) => { clearTimeout(t); t = setTimeout(()=>fn(...args), wait); };
}
