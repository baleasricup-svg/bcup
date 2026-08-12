/* ============================================================
   PENGATURAN — profil org, manajemen user, backup data
   ============================================================ */
function renderPengaturan(){
  if(!isAdmin()){ return `<div class="empty-state"><h3>⛔ Akses Ditolak</h3><p>Halaman ini hanya untuk Admin.</p><button class="btn" onclick="goSection('dashboard')">Kembali</button></div>`; }
  const o = db.org;
  const users = db.users||[];

  return `
    <div class="toolbar"><h3 style="margin:0;font-size:18px">Pengaturan</h3></div>

    <div class="panel" style="margin-bottom:16px">
      <h3>Profil Penyelenggara</h3>
      <p class="panel-sub">Nama & logo tampil di seluruh halaman</p>
      <div class="form-row">
        <label>Logo (emoji / 1 karakter)</label>
        <input id="o-logo" value="${esc(o.logo||'🏐')}" maxlength="4" style="max-width:80px;font-size:20px;text-align:center">
      </div>
      <div class="form-row">
        <label>Nama Aplikasi / Organisasi</label>
        <input id="o-nama" value="${esc(o.nama||'Baleasri Event')}" placeholder="Baleasri Event">
      </div>
      <div class="form-row">
        <label>Cabang Olahraga Tambahan (opsional)</label>
        <div id="o-olahraga-list"></div>
        <button class="pill-btn" type="button" onclick="tambahOlahragaRow()">+ Tambah Olahraga</button>
      </div>
      <button class="btn" onclick="simpanProfil()">Simpan Profil</button>
    </div>

    <div class="panel" style="margin-bottom:16px">
      <h3>Manajemen User</h3>
      <p class="panel-sub">Akun yang bisa login & mengelola data</p>
      <div class="table-wrap" style="margin-bottom:12px">
        <table><thead><tr><th>Nama</th><th>Username</th><th>Role</th><th></th></tr></thead>
        <tbody>
          ${users.map(u=>`<tr><td>${esc(u.name)}</td><td class="mono">${esc(u.username)}</td><td><span class="tag ${u.role==='admin'?'sand':'neutral'}">${esc(u.role)}</span></td>
            <td class="right"><button class="pill-btn" onclick="openUserModal('${u.id}')">✎</button>
            ${users.length>1?`<button class="pill-btn bahaya" onclick="hapusUser('${u.id}')">🗑</button>`:''}</td></tr>`).join('')}
        </tbody></table>
      </div>
      <button class="btn ghost" onclick="openUserModal()">+ User Baru</button>
    </div>

    <div class="panel">
      <h3>Cadangan Data</h3>
      <p class="panel-sub">Semua turnamen tersimpan di perangkat ini. Ekspor untuk aman-aman, impor untuk pulihkan.</p>
      <div class="flex" style="gap:10px;flex-wrap:wrap">
        <button class="btn" onclick="exportData()">⬇️ Ekspor Semua Data (JSON)</button>
        <button class="btn ghost" onclick="document.getElementById('import-file').click()">⬆️ Impor Data</button>
        <input id="import-file" type="file" accept="application/json" style="display:none" onchange="importData(this.files[0])">
      </div>
      <p class="small muted" style="margin-top:10px">⚠️ Impor akan MENIMPA semua data saat ini. Simpan cadangan dulu.</p>
    </div>
  `;
}

function simpanProfil(){
  db.org.logo = document.getElementById('o-logo').value.trim() || '🏐';
  db.org.nama = document.getElementById('o-nama').value.trim() || 'Baleasri Event';
  const rows=[...document.getElementById('o-olahraga-list').children];
  const kustom=[];
  rows.forEach(r=>{
    const i=r.querySelectorAll('input');
    const key=(i[0].value.trim()||'').toLowerCase().replace(/\s+/g,'_');
    const label=i[1].value.trim();
    if(key && label) kustom.push({key, label, icon: i[2].value.trim()||'🏅'});
  });
  db.org.olahragaKustom = kustom;
  saveDB(); renderSidebar(); renderTopbar();
  toast('✅ Profil disimpan');
}

function tambahOlahragaRow(){
  const wrap=document.getElementById('o-olahraga-list');
  const div=document.createElement('div');
  div.style.cssText='display:grid;grid-template-columns:1fr 1fr 60px 30px;gap:6px;margin-bottom:6px';
  div.innerHTML=`<input placeholder="key (mis. tenismeja)" oninput="this.dataset.v=this.value">
    <input placeholder="Label (Tenis Meja)" oninput="this.dataset.v=this.value">
    <input placeholder="🏓" style="text-align:center" oninput="this.dataset.v=this.value">
    <button class="pill-btn bahaya" type="button" onclick="this.parentNode.remove()">✕</button>`;
  wrap.appendChild(div);
}

/* ---------- USER ---------- */
function openUserModal(id){
  const u = id ? (db.users.find(x=>x.id===id)) : null;
  const body = `
    <div class="form-row"><label>Nama Lengkap</label><input id="u-name" value="${esc(u?u.name:'')}" placeholder="Nama Pengguna"></div>
    <div class="form-row"><label>Username (login)</label><input id="u-username" value="${esc(u?u.username:'')}" ${u&&u.username==='admin'?'readonly':''} placeholder="username"></div>
    <div class="form-row"><label>Kata Sandi${u?' (kosongkan = tidak diubah)':''}</label><input id="u-pass" type="password" placeholder="••••••" ${u&&u.username==='admin'?'readonly':''}></div>
    <div class="form-row"><label>Role</label>
      <select id="u-role"><option value="admin" ${u&&u.role==='admin'?'selected':''}>Admin (edit & kelola)</option>
      <option value="viewer" ${u&&u.role==='viewer'?'selected':''}>Viewer (lihat saja)</option></select>
    </div>`;
  setModal(u?'Edit User':'User Baru', body, [
    {label:'Batal', cls:'secondary', onclick:closeModal},
    {label:u?'Simpan':'Tambah', cls:'', onclick:()=>simpanUser(id)},
  ]);
}
function simpanUser(id){
  const name=document.getElementById('u-name').value.trim();
  const username=document.getElementById('u-username').value.trim();
  const pass=document.getElementById('u-pass').value;
  const role=document.getElementById('u-role').value;
  if(!name||!username){ toast('⛔ Nama & username wajib'); return; }
  if(!id && db.users.some(u=>u.username===username)){ toast('⛔ Username sudah dipakai'); return; }
  if(id){
    const u=db.users.find(x=>x.id===id);
    u.name=name; u.username=username; u.role=role;
    if(pass) u.password=pass;
    toast('✅ User diperbarui');
  }else{
    if(!pass){ toast('⛔ Kata sandi wajib untuk user baru'); return; }
    db.users.push({id:uid(), name, username, password:pass, role});
    toast('✅ User ditambahkan');
  }
  saveDB(); closeModal(); renderContent();
}
function hapusUser(id){
  const u=db.users.find(x=>x.id===id);
  if(!u) return;
  setModal('Hapus User', `<p>Yakin hapus user <b>${esc(u.name)}</b>?</p>`, [
    {label:'Batal', cls:'secondary', onclick:closeModal},
    {label:'Hapus', cls:'bahaya', onclick:()=>{
      db.users=db.users.filter(x=>x.id!==id); saveDB(); closeModal(); renderContent();
      toast('🗑 User dihapus');
    }},
  ]);
}

/* ---------- BACKUP ---------- */
function exportData(){
  const payload = {app:'baleasri-event', version:1, exportedAt:new Date().toISOString(), data: db};
  const json = JSON.stringify(payload, null, 2);
  downloadFile(`baleasri_backup_${todayISO()}.json`, json, 'application/json');
  toast('✅ Data diekspor');
}
function importData(file){
  if(!file){ return; }
  if(!confirm('Impor akan MENIMPA semua data saat ini. Lanjut?')) return;
  const reader=new FileReader();
  reader.onload=()=>{
    try{
      const parsed=JSON.parse(reader.result);
      const data = parsed.data || parsed;
      if(!data || !data.turnamen) throw new Error('Format tidak dikenali');
      db = Object.assign(defaultDB(), data);
      db.org = Object.assign(defaultDB().org, data.org||{});
      db.users = data.users && data.users.length ? data.users : defaultDB().users;
      saveDB();
      const cur=getCurrentUser();
      if(cur && db.users.find(u=>u.id===cur.id)){
        saveSession(db.users.find(u=>u.id===cur.id));
      }else{ clearSession(); }
      renderSidebar(); renderTopbar(); renderContent();
      toast('✅ Data diimpor');
    }catch(e){
      console.error(e);
      toast('⛔ Gagal impor: '+e.message);
    }
  };
  reader.readAsText(file);
}
