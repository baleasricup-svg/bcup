/* ============================================================
   TURNAMEN — CRUD multi-turnamen + set aktif
   Struktur turnamen:
   { id, nama, olahraga, sistem, jumlahSet, poinMenang, poinKalah,
     status, lokasi, mulai, selesai, tim:[], pertandingan:[], knockout }
   ============================================================ */
function defaultTurnamen(){
  return {
    id: uid(), nama:'', olahraga:'voli', sistem:'roundrobin',
    jumlahSet:3, poinMenang:2, poinKalah:0, status:'draft', lokasi:'', mulai:'', selesai:'',
    tim:[], pertandingan:[], knockout:null, _createdAt: Date.now(),
  };
}

function renderTurnamen(){
  const list = [...db.turnamen].sort((a,b)=> (b._createdAt||0)-(a._createdAt||0));
  return `
    <div class="toolbar">
      <h3 style="margin:0;font-size:18px">Daftar Turnamen</h3>
      <div class="spacer"></div>
      <button class="btn" onclick="openTurnamenModal()">+ Turnamen Baru</button>
    </div>
    ${list.length ? `
      <div class="grid cols-2">
        ${list.map(t=>{
          const o = olahragaInfo(t.olahraga);
          const aktif = t.id===db.activeTurnamenId;
          return `
          <div class="panel" style="position:relative">
            ${aktif ? `<span class="tag sukses" style="position:absolute;top:14px;right:14px">Aktif</span>` : ''}
            <div class="flex" style="gap:11px;margin-bottom:8px">
              <div class="brand-logo" style="background:var(--teal-100);color:var(--teal-700);font-size:22px">${o.icon}</div>
              <div>
                <h3 style="margin:0">${esc(t.nama)}</h3>
                <span class="muted small">${esc(o.label)} · ${esc(SISTEM[t.sistem]?SISTEM[t.sistem].label:'')}</span>
              </div>
            </div>
            <div class="small muted" style="margin:6px 0 12px">
              ${t.tim.length} tim · ${t.pertandingan.length} pertandingan · ${esc(t.status)}
            </div>
            <div class="flex" style="gap:7px;flex-wrap:wrap">
              ${aktif ? '' : `<button class="pill-btn" onclick="pilihTurnamen('${t.id}')">✓ Jadikan Aktif</button>`}
              <button class="pill-btn" onclick="openTurnamenModal('${t.id}')">✎ Edit</button>
              <button class="pill-btn bahaya" onclick="hapusTurnamen('${t.id}')">🗑 Hapus</button>
            </div>
          </div>`;
        }).join('')}
      </div>
    ` : `
      <div class="empty-state"><h3>Belum ada turnamen</h3>
        <p>Buat turnamen pertama untuk mulai mencatat pertandingan.</p>
        <button class="btn" onclick="openTurnamenModal()">+ Buat Turnamen</button></div>
    `}
  `;
}

function openTurnamenModal(id){
  if(!isAdmin()){ toast('⛔ Hanya Admin.'); return; }
  const t = id ? getTurnamen(id) : null;
  const preset = [...OLAHRAGA_PRESET, ...(db.org.olahragaKustom||[])];
  const body = `
    <div class="form-row">
      <label>Nama Turnamen</label>
      <input id="t-nama" placeholder="mis. Turnamen Voli Antar RW 2026" value="${esc(t?t.nama:'')}">
    </div>
    <div class="row2">
      <div class="form-row">
        <label>Cabang Olahraga</label>
        <select id="t-olahraga">${preset.map(o=>`<option value="${o.key}" ${t&&t.olahraga===o.key?'selected':''}>${o.icon} ${esc(o.label)}</option>`).join('')}</select>
      </div>
      <div class="form-row">
        <label>Sistem Kompetisi</label>
        <select id="t-sistem">${Object.entries(SISTEM).map(([k,v])=>`<option value="${k}" ${t&&t.sistem===k?'selected':''}>${esc(v.label)}</option>`).join('')}</select>
      </div>
    </div>
    <div class="row3">
      <div class="form-row"><label>Jumlah Set / Babak</label>
        <input id="t-set" type="number" min="1" max="9" value="${t?t.jumlahSet:3}"></div>
      <div class="form-row"><label>Poin Menang</label>
        <input id="t-pm" type="number" min="0" value="${t?t.poinMenang:2}"></div>
      <div class="form-row"><label>Poin Kalah</label>
        <input id="t-pk" type="number" min="0" value="${t?t.poinKalah:0}"></div>
    </div>
    <div class="row2">
      <div class="form-row"><label>Tanggal Mulai</label>
        <input id="t-mulai" type="date" value="${t?t.mulai:todayISO()}"></div>
      <div class="form-row"><label>Lokasi / Venue</label>
        <input id="t-lokasi" placeholder="mis. Lapangan RW 03" value="${esc(t?t.lokasi:'')}"></div>
    </div>
    <div class="form-row"><label>Status</label>
      <select id="t-status">
        ${['draft','berlangsung','selesai'].map(s=>`<option value="${s}" ${t&&t.status===s?'selected':''}>${esc(s)}</option>`).join('')}
      </select>
    </div>
  `;
  setModal(t?'Edit Turnamen':'Turnamen Baru', body, [
    {label:'Batal', cls:'secondary', onclick:closeModal},
    {label: t?'Simpan':'Buat', cls:'', onclick:()=>simpanTurnamen(id)},
  ]);
}

function simpanTurnamen(id){
  const nama = document.getElementById('t-nama').value.trim();
  if(!nama){ toast('⛔ Nama turnamen wajib diisi'); return; }
  const data = {
    nama,
    olahraga: document.getElementById('t-olahraga').value,
    sistem: document.getElementById('t-sistem').value,
    jumlahSet: Math.max(1, parseInt(document.getElementById('t-set').value)||3),
    poinMenang: parseInt(document.getElementById('t-pm').value)||0,
    poinKalah: parseInt(document.getElementById('t-pk').value)||0,
    mulai: document.getElementById('t-mulai').value,
    lokasi: document.getElementById('t-lokasi').value.trim(),
    status: document.getElementById('t-status').value,
  };
  if(id){
    const t = getTurnamen(id);
    Object.assign(t, data);
    toast('✅ Turnamen diperbarui');
  }else{
    const t = Object.assign(defaultTurnamen(), data);
    db.turnamen.push(t);
    db.activeTurnamenId = t.id;
    try{ localStorage.setItem(ACTIVE_TURNAMEN_KEY, t.id); }catch(e){}
    toast('✅ Turnamen dibuat');
  }
  saveDB(); closeModal();
  renderSidebar(); renderTopbarSaldo();
  showSection(id ? 'turnamen' : 'tim');
}

function pilihTurnamen(id){
  setActiveTurnamen(id);
  renderSidebar(); renderTopbarSaldo(); renderContent();
  const t = getTurnamen(id);
  toast('✓ Turnamen aktif: '+t.nama);
}

function hapusTurnamen(id){
  const t = getTurnamen(id);
  if(!t) return;
  setModal('Hapus Turnamen', `<p>Yakin hapus <b>${esc(t.nama)}</b> beserta semua tim & pertandingannya? Tindakan tidak bisa dibatalkan.</p>`, [
    {label:'Batal', cls:'secondary', onclick:closeModal},
    {label:'Hapus', cls:'bahaya', onclick:()=>{
      db.turnamen = db.turnamen.filter(x=>x.id!==id);
      if(db.activeTurnamenId===id) db.activeTurnamenId = db.turnamen[0] ? db.turnamen[0].id : null;
      saveDB(); closeModal(); renderSidebar(); renderTopbarSaldo();
      toast('🗑 Turnamen dihapus'); showSection('turnamen');
    }},
  ]);
}
