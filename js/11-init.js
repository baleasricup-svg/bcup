/* ============================================================
   INIT — entry point aplikasi.
   ============================================================ */
async function initApp(){
  if(!isLoggedIn()){
    renderLoginScreen();
    return;
  }
  await loadEvents();
  currentSection = location.hash.replace('#','') || 'dashboard';
  if(!SECTIONS.some(s=>s.key===currentSection)) currentSection = 'dashboard';
  await renderApp();
}

document.addEventListener('DOMContentLoaded', initApp);
