/* ============================================================
   NAVIGATION — routing SPA + render sidebar
   ============================================================ */
const SECTIONS = [
  {key:'dashboard',    label:'Dasbor',                sub:'Ringkasan turnamen aktif', icon:'grid',       adminOnly:false, eventless:true},
  {key:'tim',          label:'Tim & Pemain',          sub:'Daftar tim dan roster',    icon:'users',      adminOnly:false},
  {key:'pertandingan', label:'Pertandingan',          sub:'Jadwal & input skor',       icon:'flag',       adminOnly:false},
  {key:'klasemen',     label:'Klasemen',              sub:'Poin, menang, kalah',       icon:'trophy',     adminOnly:false},
  {key:'statistik',    label:'Statistik Pemain',      sub:'Top skor & performa',       icon:'chart',      adminOnly:false},
  {key:'turnamen',     label:'Turnamen',              sub:'Kelola turnamen',           icon:'calendar',   adminOnly:true,  eventless:true},
  {key:'pengaturan',   label:'Pengaturan',            sub:'Profil, user, backup',      icon:'gear',       adminOnly:true,  eventless:true},
];

const ICONS = {
  grid:'<rect width="7" height="7" x="3" y="3" rx="1" stroke="currentColor" stroke-width="1.6" fill="none" stroke-linecap="round" stroke-linejoin="round"/><rect width="7" height="7" x="14" y="3" rx="1" stroke="currentColor" stroke-width="1.6" fill="none" stroke-linecap="round" stroke-linejoin="round"/><rect width="7" height="7" x="14" y="14" rx="1" stroke="currentColor" stroke-width="1.6" fill="none" stroke-linecap="round" stroke-linejoin="round"/><rect width="7" height="7" x="3" y="14" rx="1" stroke="currentColor" stroke-width="1.6" fill="none" stroke-linecap="round" stroke-linejoin="round"/>',
  users:'<path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2" stroke="currentColor" stroke-width="1.6" fill="none" stroke-linecap="round" stroke-linejoin="round"/><path d="M16 3.128a4 4 0 0 1 0 7.744" stroke="currentColor" stroke-width="1.6" fill="none" stroke-linecap="round" stroke-linejoin="round"/><path d="M22 21v-2a4 4 0 0 0-3-3.87" stroke="currentColor" stroke-width="1.6" fill="none" stroke-linecap="round" stroke-linejoin="round"/><circle cx="9" cy="7" r="4" stroke="currentColor" stroke-width="1.6" fill="none" stroke-linecap="round" stroke-linejoin="round"/>',
  trophy:'<path d="M6 9H4.5a2.5 2.5 0 0 1 0-5H6" stroke="currentColor" stroke-width="1.6" fill="none" stroke-linecap="round" stroke-linejoin="round"/><path d="M18 9h1.5a2.5 2.5 0 0 0 0-5H18" stroke="currentColor" stroke-width="1.6" fill="none" stroke-linecap="round" stroke-linejoin="round"/><path d="M4 22h16" stroke="currentColor" stroke-width="1.6" fill="none" stroke-linecap="round" stroke-linejoin="round"/><path d="M10 14.66V17c0 .55-.47.98-.97 1.21C7.85 18.75 7 20.24 7 22" stroke="currentColor" stroke-width="1.6" fill="none" stroke-linecap="round" stroke-linejoin="round"/><path d="M14 14.66V17c0 .55.47.98.97 1.21C16.15 18.75 17 20.24 17 22" stroke="currentColor" stroke-width="1.6" fill="none" stroke-linecap="round" stroke-linejoin="round"/><path d="M18 2H6v7a6 6 0 0 0 12 0V2Z" stroke="currentColor" stroke-width="1.6" fill="none" stroke-linecap="round" stroke-linejoin="round"/>',
  flag:'<path d="M4 22V4a1 1 0 0 1 .4-.8A6 6 0 0 1 8 2c3 0 5 2 7.333 2q2 0 3.067-.8A1 1 0 0 1 20 4v10a1 1 0 0 1-.4.8A6 6 0 0 1 16 16c-3 0-5-2-8-2a6 6 0 0 0-4 1.528" stroke="currentColor" stroke-width="1.6" fill="none" stroke-linecap="round" stroke-linejoin="round"/>',
  chart:'<path d="M3 3v18h18" stroke="currentColor" stroke-width="1.6" fill="none" stroke-linecap="round" stroke-linejoin="round"/><path d="M7 15l4-4 3 3 5-6" stroke="currentColor" stroke-width="1.6" fill="none" stroke-linecap="round" stroke-linejoin="round"/>',
  calendar:'<path d="M8 2v4" stroke="currentColor" stroke-width="1.6" fill="none" stroke-linecap="round" stroke-linejoin="round"/><path d="M16 2v4" stroke="currentColor" stroke-width="1.6" fill="none" stroke-linecap="round" stroke-linejoin="round"/><rect width="18" height="18" x="3" y="4" rx="2" stroke="currentColor" stroke-width="1.6" fill="none" stroke-linecap="round" stroke-linejoin="round"/><path d="M3 10h18" stroke="currentColor" stroke-width="1.6" fill="none" stroke-linecap="round" stroke-linejoin="round"/>',
  gear:'<path d="M9.671 4.136a2.34 2.34 0 0 1 4.659 0 2.34 2.34 0 0 0 3.319 1.915 2.34 2.34 0 0 1 2.33 4.033 2.34 2.34 0 0 0 0 3.831 2.34 2.34 0 0 1-2.33 4.033 2.34 2.34 0 0 0-3.319 1.915 2.34 2.34 0 0 1-4.659 0 2.34 2.34 0 0 0-3.32-1.915 2.34 2.34 0 0 1-2.33-4.033 2.34 2.34 0 0 0 0-3.831A2.34 2.34 0 0 1 6.35 6.051a2.34 2.34 0 0 0 3.319-1.915" stroke="currentColor" stroke-width="1.6" fill="none" stroke-linecap="round" stroke-linejoin="round"/><circle cx="12" cy="12" r="3" stroke="currentColor" stroke-width="1.6" fill="none" stroke-linecap="round" stroke-linejoin="round"/>',
};
function icon(name){ return `<svg viewBox="0 0 24 24">${ICONS[name]||''}</svg>`; }

let currentSection = 'dashboard';

function renderTopbar(){
  const user = getCurrentUser();
  const nameText = document.getElementById('user-name-text');
  const userIcon = document.getElementById('user-icon');
  const btnLogin = document.getElementById('btn-login');
  const btnLogout = document.getElementById('btn-logout');
  if(user){
    nameText.textContent = user.name;
    userIcon.textContent = user.role==='admin' ? '⚡' : '👁️';
    btnLogin.style.display='none';
    btnLogout.style.display='inline-block';
  }else{
    nameText.textContent='Pengunjung';
    userIcon.textContent='👤';
    btnLogin.style.display='inline-block';
    btnLogout.style.display='none';
  }
  const logo = document.getElementById('brand-logo');
  if(logo) logo.textContent = db.org.logo || '🏐';
}

function renderSidebar(){
  const sel = document.getElementById('event-select');
  sel.innerHTML = db.turnamen.length
    ? db.turnamen.map(t=>`<option value="${t.id}" ${t.id===db.activeTurnamenId?'selected':''}>${esc(t.nama)}</option>`).join('')
    : `<option value="">— Belum ada turnamen —</option>`;

  renderTopbar();

  const user = getCurrentUser();
  const isAdminUser = !!(user && user.role==='admin');
  document.getElementById('btn-new-event').style.display = isAdminUser ? 'inline-block' : 'none';

  const visible = SECTIONS
    .filter(s => !s.adminOnly || isAdminUser)
    .filter(s => isLoggedIn() || s.eventless || s.key==='dashboard');

  const renderItem = s => `
    <div class="nav-item ${s.key===currentSection?'active':''}" data-nav="${s.key}" title="${esc(s.label)}">
      ${icon(s.icon)} <span>${esc(s.label)}</span>
      ${s.adminOnly && !isAdminUser ? `<span class="lock">🔒</span>` : ''}
    </div>`;
  document.getElementById('nav').innerHTML = visible.filter(s=>!s.eventless).map(renderItem).join('');
  document.getElementById('nav-global').innerHTML = visible.filter(s=>s.eventless).map(renderItem).join('');
}

function goSection(key){
  const section = SECTIONS.find(s=>s.key===key);
  const user = getCurrentUser();
  if(section && section.adminOnly && !(user && user.role==='admin')){
    toast('⛔ Hanya Admin yang bisa mengakses halaman ini');
    if(key!=='dashboard') return goSection('dashboard');
    return;
  }
  if(section && !isLoggedIn() && !section.eventless && key!=='dashboard'){
    toast('⛔ Silakan login untuk mengakses halaman ini');
    openLoginModal();
    return;
  }
  currentSection = key;
  try{ localStorage.setItem(LAST_SECTION_KEY, key); }catch(e){}
  const meta = SECTIONS.find(s=>s.key===key);
  document.getElementById('page-title').textContent = meta ? meta.label : 'Dasbor';
  document.getElementById('page-sub').textContent = meta ? meta.sub : '';
  renderSidebar();
  renderTopbarSaldo();
  renderContent();
  closeSidebar();
  window.scrollTo({top:0, behavior:'instant'});
}

function showSection(key){ goSection(key); }

function renderTopbarSaldo(){
  const chip = document.getElementById('saldo-chip');
  const t = activeTurnamen();
  if(!t){ chip.style.visibility='hidden'; return; }
  const main = SECTIONS.find(s=>s.key===currentSection);
  if(main && main.eventless){ chip.style.visibility='hidden'; return; }
  chip.style.visibility='visible';
  const played = (t.pertandingan||[]).filter(p=>p.selesai).length;
  const total = (t.pertandingan||[]).length;
  document.getElementById('saldo-lbl').textContent = 'Pertandingan';
  document.getElementById('saldo-val').textContent = `${played}/${total}`;
}

function renderContent(){
  const el = document.getElementById('content');
  const isAdminUser = isAdmin();
  const section = SECTIONS.find(s=>s.key===currentSection);

  if(section && section.adminOnly && !isAdminUser){
    el.innerHTML = `<div class="empty-state"><h3>⛔ Akses Ditolak</h3><p>Halaman ini hanya untuk Admin.</p><button class="btn" onclick="goSection('dashboard')">Kembali ke Dasbor</button></div>`;
    return;
  }

  if(!activeTurnamen() && !(section && section.eventless)){
    const logged = isLoggedIn();
    el.innerHTML = `<div class="empty-state"><h3>Belum ada turnamen aktif</h3>
      <p>${logged ? 'Buat turnamen baru untuk mulai mencatat pertandingan.' : 'Login untuk membuat atau mengelola turnamen.'}</p>
      ${isAdminUser
        ? `<button class="btn" onclick="openTurnamenModal()">+ Buat Turnamen</button>`
        : `<button class="btn" onclick="openLoginModal()">🔑 Login untuk Mengelola</button>`}
    </div>`;
    return;
  }

  switch(currentSection){
    case 'dashboard':    el.innerHTML = renderDashboard(); break;
    case 'turnamen':     el.innerHTML = renderTurnamen(); break;
    case 'tim':          el.innerHTML = renderTim(); break;
    case 'pertandingan': el.innerHTML = renderPertandingan(); break;
    case 'klasemen':     el.innerHTML = renderKlasemen(); break;
    case 'statistik':    el.innerHTML = renderStatistik(); break;
    case 'pengaturan':   el.innerHTML = renderPengaturan(); break;
    default:             el.innerHTML = renderDashboard();
  }
}

function closeSidebar(){
  document.getElementById('sidebar').classList.remove('open');
  document.getElementById('sidebar-backdrop').classList.remove('show');
}
