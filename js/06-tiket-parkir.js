/* ============================================================
   TIKET & PARKIR HARIAN — satu baris per tanggal, harga tiket &
   parkir bisa beda tiap hari. Tiap disimpan, otomatis membuat/
   memperbarui 2 baris di Buku Utama (pendapatan Tiket & Parkir)
   lewat syncAutoKas() — lihat 05-buku-utama.js.
   ============================================================ */
let tiketParkirList = [];

async function loadTiketParkir(eventId){
  tiketParkirList = await dbFetchAll('tiket_parkir_harian', eventId);
  return tiketParkirList;
}

async function renderTiketParkir(container){
  const ev = getActiveEvent();
  if(!ev){ container.innerHTML = emptyEventState(); return; }
  await loadTiketParkir(ev.id);
  container.innerHTML = tiketParkirTemplate(ev);
  bindTiketParkirEvents();
}

function tiketParkirTemplate(ev){
  const rows = [...tiketParkirList].sort((a,b)=>a.tanggal.localeCompare(b.tanggal));
  let totalTiket=0, totalParkir=0;
  const rowsHtml = rows.map(r=>{
    const pendapatanTiket = Number(r.harga_tiket) * Number(r.jumlah_tiket_terjual);
    const pendapatanParkir = Number(r.harga_parkir) * Number(r.jumlah_kendaraan);
    totalTiket += pendapatanTiket; totalParkir += pendapatanParkir;
    return `
      <tr>
        <td>${fmtDateHari(r.tanggal)}</td>
        <td class="num">${fmtRp(r.harga_tiket)}</td>
        <td class="num">${r.jumlah_tiket_terjual}</td>
        <td class="num">${fmtRp(pendapatanTiket)}</td>
        <td class="num">${fmtRp(r.harga_parkir)}</td>
        <td class="num">${r.jumlah_kendaraan}</td>
        <td class="num">${fmtRp(pendapatanParkir)}</td>
        <td class="num text-green"><b>${fmtRp(pendapatanTiket+pendapatanParkir)}</b></td>
        <td>
          <button class="btn-icon" data-edit="${r.id}" title="Edit">✏️</button>
          <button class="btn-icon" data-del="${r.id}" title="Hapus">🗑️</button>
        </td>
      </tr>`;
  }).join('') || `<tr><td colspan="9" class="empty">Belum ada laporan harian.</td></tr>`;

  return `
    <div class="page-header">
      <h2>🎟️ Tiket & Parkir Harian — ${esc(ev.nama)}</h2>
      <button id="btnTambahHarian" class="btn-primary">+ Tambah Laporan Harian</button>
    </div>
    <div class="stat-cards">
      <div class="stat-card"><div class="stat-label">Total Pendapatan Tiket</div><div class="stat-value">${fmtRp(totalTiket)}</div></div>
      <div class="stat-card"><div class="stat-label">Total Pendapatan Parkir</div><div class="stat-value">${fmtRp(totalParkir)}</div></div>
      <div class="stat-card"><div class="stat-label">Total Keseluruhan</div><div class="stat-value text-green">${fmtRp(totalTiket+totalParkir)}</div></div>
    </div>
    <div class="table-wrap">
      <table>
        <thead><tr>
          <th>Tanggal</th><th>Harga Tiket</th><th>Tiket Terjual</th><th>Pendapatan Tiket</th>
          <th>Harga Parkir</th><th>Kendaraan</th><th>Pendapatan Parkir</th><th>Total</th><th>Aksi</th>
        </tr></thead>
        <tbody>${rowsHtml}</tbody>
      </table>
    </div>
    <div id="modalRoot"></div>`;
}

function bindTiketParkirEvents(){
  document.getElementById('btnTambahHarian')?.addEventListener('click', ()=> openTiketParkirModal());
  document.querySelectorAll('[data-edit]').forEach(btn=>{
    btn.addEventListener('click', ()=> openTiketParkirModal(tiketParkirList.find(r=>r.id===btn.dataset.edit)));
  });
  document.querySelectorAll('[data-del]').forEach(btn=>{
    btn.addEventListener('click', async ()=>{
      if(!confirmDialog('Hapus laporan harian ini? Entri terkait di Buku Utama juga akan terhapus.')) return;
      const ok = await dbDelete('tiket_parkir_harian', btn.dataset.del);
      if(ok){
        await removeAutoKas('tiket', btn.dataset.del);
        await removeAutoKas('parkir', btn.dataset.del);
        toast('Laporan dihapus');
        renderApp();
      }
    });
  });
}

function openTiketParkirModal(row){
  const ev = getActiveEvent();
  const isEdit = !!row;
  const html = `
    <div class="modal-backdrop">
      <div class="modal">
        <h3>${isEdit?'Edit':'Tambah'} Laporan Harian</h3>
        <form id="tpForm">
          <label>Tanggal</label>
          <input type="date" name="tanggal" required value="${row?.tanggal || todayISO()}" ${isEdit?'':''} />
          <div class="form-row">
            <div>
              <label>Harga Tiket (Rp)</label>
              <input type="number" name="harga_tiket" min="0" required value="${row?.harga_tiket ?? ''}" />
            </div>
            <div>
              <label>Jumlah Tiket Terjual</label>
              <input type="number" name="jumlah_tiket_terjual" min="0" required value="${row?.jumlah_tiket_terjual ?? ''}" />
            </div>
          </div>
          <div class="form-row">
            <div>
              <label>Harga Parkir (Rp)</label>
              <input type="number" name="harga_parkir" min="0" required value="${row?.harga_parkir ?? ''}" />
            </div>
            <div>
              <label>Jumlah Kendaraan</label>
              <input type="number" name="jumlah_kendaraan" min="0" required value="${row?.jumlah_kendaraan ?? ''}" />
            </div>
          </div>
          <label>Catatan (opsional)</label>
          <input type="text" name="catatan" value="${esc(row?.catatan||'')}" />
          <div class="modal-actions">
            <button type="button" class="btn-ghost" id="btnCancelTp">Batal</button>
            <button type="submit" class="btn-primary">Simpan</button>
          </div>
        </form>
      </div>
    </div>`;
  document.getElementById('modalRoot').innerHTML = html;
  document.getElementById('btnCancelTp').addEventListener('click', ()=> document.getElementById('modalRoot').innerHTML='');
  document.getElementById('tpForm').addEventListener('submit', async (e)=>{
    e.preventDefault();
    const fd = new FormData(e.target);
    const payload = {
      event_id: ev.id,
      tanggal: fd.get('tanggal'),
      harga_tiket: Number(fd.get('harga_tiket')),
      jumlah_tiket_terjual: Number(fd.get('jumlah_tiket_terjual')),
      harga_parkir: Number(fd.get('harga_parkir')),
      jumlah_kendaraan: Number(fd.get('jumlah_kendaraan')),
      catatan: fd.get('catatan').trim() || null,
    };
    // unique(event_id, tanggal) di skema — pakai upsert supaya kalau tanggal
    // yang sama sudah ada baris (mis. user tambah baru tapi tanggalnya bentrok),
    // otomatis ter-update, bukan error constraint.
    const saved = await dbUpsert('tiket_parkir_harian', isEdit ? {...payload, id: row.id} : payload, 'event_id,tanggal');
    if(!saved) return;
    await syncAutoKas({
      event_id: ev.id, ref_id: saved.id, sumber: 'tiket',
      tanggal: saved.tanggal, keterangan: `Pendapatan Tiket — ${fmtDate(saved.tanggal)}`,
      tipe: 'masuk', kategori: 'Tiket Masuk',
      jumlah: Number(saved.harga_tiket) * Number(saved.jumlah_tiket_terjual),
    });
    await syncAutoKas({
      event_id: ev.id, ref_id: saved.id, sumber: 'parkir',
      tanggal: saved.tanggal, keterangan: `Pendapatan Parkir — ${fmtDate(saved.tanggal)}`,
      tipe: 'masuk', kategori: 'Parkir',
      jumlah: Number(saved.harga_parkir) * Number(saved.jumlah_kendaraan),
    });
    toast('Laporan harian disimpan');
    renderApp();
  });
}
