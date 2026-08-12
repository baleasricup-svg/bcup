/* ============================================================
   INIT — wiring DOM + boot aplikasi
   ============================================================ */

/* ---------- MODAL HELPERS ---------- */
function setModal(title, bodyHtml, buttons){
  document.getElementById('modal-title').textContent = title;
  document.getElementById('modal-body').innerHTML = bodyHtml;
  document.getElementById('modal-foot').innerHTML = '';
  const foot = document.getElementById('modal-foot');
  (buttons||[]).forEach(b=>{
    const btn=document.createElement('button');
    btn.className='btn '+(b.cls||'');
    btn.textContent=b.label;
    btn.type='button';
    btn.onclick=b.onclick;
    if(b.id) btn.id=b.id;
    foot.appendChild(btn);
  });
  document.getElementById('overlay').classList.add('show');
}
function closeModal(){
  document.getElementById('overlay').classList.remove('show');
  document.getElementById('modal-body').innerHTML='';
}
document.getElementById('modal-close').onclick = closeModal;
let _overlayMouseDownOnBackdrop=false;
document.getElementById('overlay').addEventListener('mousedown', e=>{ _overlayMouseDownOnBackdrop=(e.target.id==='overlay'); });
document.getElementById('overlay').addEventListener('click', e=>{ if(e.target.id==='overlay' && _overlayMouseDownOnBackdrop) closeModal(); _overlayMouseDownOnBackdrop=false; });

/* ---------- SIDEBAR EVENT ---------- */
document.getElementById('event-select').addEventListener('change', e=>{
  if(canEdit()) setActiveTurnamen(e.target.value);
  else { toast('⛔ Login untuk mengubah turnamen'); renderSidebar(); }
});
document.getElementById('btn-new-event').addEventListener('click', ()=>openTurnamenModal());
document.getElementById('nav').addEventListener('click', e=>{ const i=e.target.closest('[data-nav]'); if(i) goSection(i.dataset.nav); });
document.getElementById('nav-global').addEventListener('click', e=>{ const i=e.target.closest('[data-nav]'); if(i) goSection(i.dataset.nav); });
document.getElementById('menu-toggle').addEventListener('click', ()=>{
  document.getElementById('sidebar').classList.toggle('open');
  document.getElementById('sidebar-backdrop').classList.toggle('show');
});
document.getElementById('sidebar-close').addEventListener('click', closeSidebar);
document.getElementById('sidebar-backdrop').addEventListener('click', closeSidebar);

/* ---------- SIDEBAR COLLAPSE ---------- */
function applySidebarCollapsed(collapsed){
  const sb=document.getElementById('sidebar');
  sb.classList.toggle('collapsed', collapsed);
}
(function(){
  let collapsed=false;
  try{ collapsed = localStorage.getItem(SIDEBAR_COLLAPSED_KEY)==='1'; }catch(e){}
  applySidebarCollapsed(collapsed);
})();
document.getElementById('sidebar-collapse-toggle').addEventListener('click', ()=>{
  const collapsed=!document.getElementById('sidebar').classList.contains('collapsed');
  applySidebarCollapsed(collapsed);
  try{ localStorage.setItem(SIDEBAR_COLLAPSED_KEY, collapsed?'1':'0'); }catch(e){}
});

/* ---------- BOOT ---------- */
(async function initApp(){
  const contentEl=document.getElementById('content');
  contentEl.innerHTML=`<div class="initial-loading"><div class="spinner"></div><div class="msg">⏳ Memuat Baleasri Event...</div></div>`;

  db = loadDB();
  try{
    const saved=localStorage.getItem(ACTIVE_TURNAMEN_KEY);
    if(saved && db.turnamen.some(t=>t.id===saved)) db.activeTurnamenId=saved;
    else if(!db.activeTurnamenId && db.turnamen[0]) db.activeTurnamenId=db.turnamen[0].id;
  }catch(e){}

  renderSidebar();
  renderTopbar();
  renderTopbarSaldo();

  let last='dashboard';
  try{ const s=localStorage.getItem(LAST_SECTION_KEY); if(s && SECTIONS.some(x=>x.key===s)) last=s; }catch(e){}
  goSection(last);
})();
