/* ============================================================
   DASHBOARD — ringkasan turnamen aktif
   ============================================================ */
function renderDashboard(){
  const t = activeTurnamen();
  if(!t){
    const total = db.turnamen.length;
    return `
      <div class="empty-state">
        <div style="font-size:46px;margin-bottom:10px">🏆</div>
        <h3>Selamat datang di Baleasri Event</h3>
        <p>Aplikasi manajemen turnamen yang universal — bola voli, futsal, basket, badminton, dan lainnya.</p>
        ${isAdmin()
          ? `<button class="btn" onclick="openTurnamenModal()">+ Buat Turnamen Pertama</button>`
          : `<button class="btn" onclick="openLoginModal()">🔑 Login sebagai Admin</button>`}
        ${total ? `<p class="small muted" style="margin-top:14px">Ada ${total} turnamen tersimpan. Pilih dari menu "Turnamen Aktif" di atas.</p>` : ''}
      </div>`;
  }
  const o = olahragaInfo(t.olahraga);
  const tim = t.tim||[];
  const pert = t.pertandingan||[];
  const played = pert.filter(p=>p.selesai).length;
  const upcoming = pert.filter(p=>!p.selesai);
  const klasemen = hitungKlasemen(t);
  const top = klasemen.slice(0,3);

  return `
    <div class="flex-between" style="margin-bottom:16px">
      <div class="flex">
        <div class="brand-logo" style="background:var(--teal-100);color:var(--teal-700);font-size:24px">${o.icon}</div>
        <div>
          <h3 style="margin:0;font-size:19px">${esc(t.nama)}</h3>
          <span class="muted small">${esc(o.label)} · ${esc(SISTEM[t.sistem]?SISTEM[t.sistem].label:'')}</span>
        </div>
      </div>
      <span class="tag ${t.status==='berlangsung'?'sukses':(t.status==='selesai'?'neutral':'sand')}">${esc(t.status||'draft')}</span>
    </div>

    <div class="grid cols-4">
      <div class="stat"><div class="k">Tim</div><div class="v">${tim.length}</div><div class="s">terdaftar</div></div>
      <div class="stat"><div class="k">Pertandingan</div><div class="v">${pert.length}</div><div class="s">${played} selesai</div></div>
      <div class="stat"><div class="k">Pemain</div><div class="v sand">${(tim.reduce((a,tm)=>a+(tm.pemain||[]).length,0))}</div><div class="s">total roster</div></div>
      <div class="stat"><div class="k">Jadwal</div><div class="v">${upcoming.length}</div><div class="s">belum dimainkan</div></div>
    </div>

    ${top.length ? `
      <div class="section-title">Peringkat Teratas</div>
      <div class="grid cols-3">
        ${top.map((r,i)=>`
          <div class="panel" style="display:flex;align-items:center;gap:12px">
            <div class="v" style="font-size:26px;color:${i===0?'var(--sand)':'var(--teal-700)'}">${i+1}</div>
            <div style="min-width:0">
              <div style="font-weight:700">${esc(r.timNama)}</div>
              <div class="muted small">${r.main} M · ${r.poin} poin</div>
            </div>
          </div>`).join('')}
      </div>` : ''}

    ${upcoming.length ? `
      <div class="section-title">Pertandingan Berikutnya</div>
      ${upcoming.slice(0,4).map(p=>matchCard(t,p,false)).join('')}
    ` : played ? `
      <div class="empty-state" style="padding:30px"><p class="muted">Semua pertandingan sudah selesai. Lihat <a href="#" onclick="goSection('klasemen')" style="color:var(--teal-700)">klasemen akhir</a>.</p></div>
    ` : `
      <div class="empty-state"><h3>Belum ada pertandingan</h3><p>Buat tim dulu, lalu generate jadwal otomatis.</p>
        <button class="btn" onclick="goSection('tim')">➕ Kelola Tim</button></div>
    `}

    <div class="flex" style="margin-top:20px;gap:10px;flex-wrap:wrap">
      <button class="pill-btn" onclick="goSection('pertandingan')">📋 Lihat Semua Pertandingan</button>
      <button class="pill-btn" onclick="goSection('klasemen')">🏆 Klasemen</button>
      <button class="pill-btn" onclick="goSection('tim')">👥 Tim & Pemain</button>
    </div>
  `;
}
