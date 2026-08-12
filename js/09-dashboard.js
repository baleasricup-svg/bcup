/* ============================================================
   DASHBOARD — ringkasan cepat kondisi keuangan event aktif.
   ============================================================ */
async function renderDashboard(container){
  const ev = getActiveEvent();
  if(!ev){ container.innerHTML = emptyEventState(); return; }

  const [kas, tiketParkir, sponsor, insentif] = await Promise.all([
    dbFetchAll('kas', ev.id),
    dbFetchAll('tiket_parkir_harian', ev.id),
    dbFetchAll('sponsorship', ev.id),
    dbFetchAll('insentif_panitia', ev.id),
  ]);

  const totalMasuk = kas.filter(k=>k.tipe==='masuk').reduce((s,k)=>s+Number(k.jumlah),0);
  const totalKeluar = kas.filter(k=>k.tipe==='keluar').reduce((s,k)=>s+Number(k.jumlah),0);
  const saldo = totalMasuk - totalKeluar;

  const pendapatanTiket = tiketParkir.reduce((s,r)=>s+Number(r.harga_tiket)*Number(r.jumlah_tiket_terjual),0);
  const pendapatanParkir = tiketParkir.reduce((s,r)=>s+Number(r.harga_parkir)*Number(r.jumlah_kendaraan),0);

  const sponsorDiterima = sponsor.reduce((s,r)=> s + (r.status==='lunas'?Number(r.nominal):r.status==='sebagian'?Number(r.nominal_diterima):0), 0);
  const insentifBelumBayar = insentif.filter(r=>r.status==='belum_bayar').reduce((s,r)=>s+Number(r.jumlah),0);

  container.innerHTML = `
    <div class="page-header"><h2>📊 Dashboard — ${esc(ev.nama)}</h2></div>
    <div class="stat-cards">
      <div class="stat-card highlight"><div class="stat-label">Saldo Kas Saat Ini</div><div class="stat-value">${fmtRp(saldo)}</div></div>
      <div class="stat-card"><div class="stat-label">Total Masuk</div><div class="stat-value text-green">${fmtRp(totalMasuk)}</div></div>
      <div class="stat-card"><div class="stat-label">Total Keluar</div><div class="stat-value text-red">${fmtRp(totalKeluar)}</div></div>
    </div>
    <div class="stat-cards">
      <div class="stat-card"><div class="stat-label">Pendapatan Tiket</div><div class="stat-value">${fmtRp(pendapatanTiket)}</div></div>
      <div class="stat-card"><div class="stat-label">Pendapatan Parkir</div><div class="stat-value">${fmtRp(pendapatanParkir)}</div></div>
      <div class="stat-card"><div class="stat-label">Sponsorship Diterima</div><div class="stat-value">${fmtRp(sponsorDiterima)}</div></div>
      <div class="stat-card ${insentifBelumBayar>0?'warn':''}"><div class="stat-label">Insentif Panitia Belum Dibayar</div><div class="stat-value">${fmtRp(insentifBelumBayar)}</div></div>
    </div>
    <p class="muted">Event: ${fmtDate(ev.tanggal_mulai)} ${ev.tanggal_selesai && ev.tanggal_selesai!==ev.tanggal_mulai ? '– '+fmtDate(ev.tanggal_selesai) : ''} ${ev.lokasi ? '· '+esc(ev.lokasi) : ''}</p>
  `;
}
