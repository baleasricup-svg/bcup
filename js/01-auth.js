/* ============================================================
   AUTH — login user (admin / viewer), session di localStorage
   ============================================================ */
function getCurrentUser(){
  try{
    const raw = localStorage.getItem(SESSION_KEY);
    if(!raw) return null;
    return JSON.parse(raw);
  }catch(e){ return null; }
}
function saveSession(user){
  try{
    const {id,name,role,username} = user;
    localStorage.setItem(SESSION_KEY, JSON.stringify({id,name,role,username}));
  }catch(e){}
}
function clearSession(){ try{ localStorage.removeItem(SESSION_KEY); }catch(e){} }
function isAdmin(){ const u = getCurrentUser(); return !!(u && u.role==='admin'); }
function canEdit(){ return !!getCurrentUser(); }
function isLoggedIn(){ return !!getCurrentUser(); }

function login(username, password){
  const u = db.users.find(x => x.username === username && x.password === password);
  if(!u) return {ok:false, msg:'Username atau kata sandi salah'};
  saveSession(u);
  return {ok:true, user:u};
}
function logout(){
  clearSession();
  renderSidebar();
  renderTopbar();
  toast('👋 Sampai jumpa!');
  showSection('dashboard');
}

function openLoginModal(){
  const body = `
    <div class="form-row">
      <label>Username</label>
      <input id="login-user" placeholder="admin" autocomplete="username">
    </div>
    <div class="form-row">
      <label>Kata Sandi</label>
      <input id="login-pass" type="password" placeholder="••••••" autocomplete="current-password" onkeydown="if(event.key==='Enter')submitLogin()">
    </div>
    <p class="small muted">Akun bawaan: <span class="kbd">admin</span> / <span class="kbd">admin</span></p>
  `;
  setModal('Login', body, [
    {label:'Batal', cls:'secondary', onclick:closeModal},
    {label:'Masuk', cls:'', onclick:submitLogin},
  ]);
  setTimeout(()=>{ const i=document.getElementById('login-user'); if(i) i.focus(); }, 60);
}
function submitLogin(){
  const u = document.getElementById('login-user').value.trim();
  const p = document.getElementById('login-pass').value;
  const res = login(u, p);
  if(!res.ok){ toast('⛔ '+res.msg); return; }
  closeModal();
  renderSidebar();
  renderTopbar();
  toast('✅ Login berhasil sebagai '+res.user.name);
  showSection(currentSection);
}
