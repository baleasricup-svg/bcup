/* ============================================================
   NAV / ROUTING — SPA sederhana berbasis hash URL.
   ============================================================ */
const SECTIONS = [
  { key:'dashboard',  label:'Dashboard',        icon:'📊', render: renderDashboard },
  { key:'buku-utama', label:'Buku Utama',        icon:'📖', render: renderBukuUtama },
  { key:'tiket',      label:'Tiket & Parkir',    icon:'🎟️', render: renderTiketParkir },
  { key:'sponsorship',label:'Sponsorship',       icon:'🤝', render: renderSponsorship },
  { key:'panitia',    label:'Panitia & Insentif',icon:'👷', render: renderPanitiaInsentif },
  { key:'event',      label:'Kelola Event',      icon:'⚙️', render: renderKelolaEvent, adminOnly:true },
];

let currentSection = 'dashboard';

function navigateTo(key){
  currentSection = key;
  location.hash = key;
  renderApp();
}

window.addEventListener('hashchange', () => {
  const key = location.hash.replace('#','') || 'dashboard';
  if(SECTIONS.some(s=>s.key===key)){ currentSection = key; renderApp(); }
});

function renderShell(){
  const user = getCurrentUser();
  const ev = getActiveEvent();
  const visibleSections = SECTIONS.filter(s => !s.adminOnly || isAdmin());
  return `
    <div class="app-shell">
      <header class="topbar">
        <div class="brand">🏆 SportKas</div>
        <div class="event-picker">
          ${ev ? `<span class="event-name">${esc(ev.nama)}</span>` : `<span class="event-name muted">Belum ada event</span>`}
        </div>
        <div class="user-info">
          <span>${esc(user.nama)} <span class="role-badge">${esc(user.role)}</span></span>
          <button id="btnLogout" class="btn-ghost">Keluar</button>
        </div>
      </header>
      <nav class="sidebar">
        ${visibleSections.map(s => `
          <button class="nav-item ${s.key===currentSection?'active':''}" data-key="${s.key}">
            <span class="nav-icon">${s.icon}</span> ${esc(s.label)}
          </button>`).join('')}
      </nav>
      <main class="content" id="content"></main>
    </div>`;
}

async function renderApp(){
  const app = document.getElementById('app');
  app.innerHTML = renderShell();
  document.getElementById('btnLogout').addEventListener('click', doLogout);
  document.querySelectorAll('.nav-item').forEach(btn=>{
    btn.addEventListener('click', ()=> navigateTo(btn.dataset.key));
  });

  const section = SECTIONS.find(s=>s.key===currentSection) || SECTIONS[0];
  const content = document.getElementById('content');
  content.innerHTML = `<div class="loading">Memuat...</div>`;
  try{
    await section.render(content);
  }catch(e){
    console.error(e);
    content.innerHTML = `<div class="error-box">Gagal memuat halaman: ${esc(e.message||String(e))}</div>`;
  }
}
