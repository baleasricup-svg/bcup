/* ============================================================
   AUTH — login sederhana lewat rpc_login (verifikasi password
   di server, browser tidak pernah melihat hash password).
   ============================================================ */
const AUTH_STORAGE_KEY = 'sk_auth_user';

function getCurrentUser(){
  try{ const raw = localStorage.getItem(AUTH_STORAGE_KEY); if(raw) return JSON.parse(raw); }catch(e){}
  return null;
}
function setCurrentUser(user){
  if(user) localStorage.setItem(AUTH_STORAGE_KEY, JSON.stringify(user));
  else localStorage.removeItem(AUTH_STORAGE_KEY);
}
function isAdmin(){ const u = getCurrentUser(); return !!u && u.role === 'admin'; }
function isLoggedIn(){ return !!getCurrentUser(); }

async function doLogin(username, password){
  const { data, error } = await sb.rpc('rpc_login', { p_username: username, p_password: password });
  if(error){ toast('Gagal login: ' + error.message); return false; }
  if(data && data.error){ toast(data.error); return false; }
  setCurrentUser(data);
  return true;
}

function doLogout(){
  setCurrentUser(null);
  location.reload();
}

function renderLoginScreen(){
  const app = document.getElementById('app');
  app.innerHTML = `
    <div class="login-wrap">
      <form id="loginForm" class="login-card">
        <h1>🏆 SportKas</h1>
        <p class="sub">Manajemen Keuangan Event Olahraga</p>
        <label>Username</label>
        <input type="text" id="loginUsername" autocomplete="username" required />
        <label>Password</label>
        <input type="password" id="loginPassword" autocomplete="current-password" required />
        <button type="submit" class="btn-primary">Masuk</button>
        <p class="hint">Default: admin / admin123 (segera ganti setelah setup)</p>
      </form>
    </div>`;
  document.getElementById('loginForm').addEventListener('submit', async (e)=>{
    e.preventDefault();
    const username = document.getElementById('loginUsername').value.trim();
    const password = document.getElementById('loginPassword').value;
    const btn = e.target.querySelector('button');
    btn.disabled = true; btn.textContent = 'Memproses...';
    const ok = await doLogin(username, password);
    if(ok) initApp();
    else { btn.disabled = false; btn.textContent = 'Masuk'; }
  });
}
