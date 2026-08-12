/* ============================================================
   BUKU UTAMA — ledger kas masuk/keluar per event.

   Berisi 2 jenis baris:
   - `sumber:'manual'`  → diketik langsung admin/bendahara di sini.
   - `sumber:'tiket'|'parkir'|'sponsorship'|'insentif'` → digenerate
     OTOMATIS oleh modul lain (06/07/08) tiap kali data sumbernya
     disimpan. Baris otomatis TIDAK BOLEH diedit/dihapus dari sini —
     harus lewat halaman modul asalnya, supaya Buku Utama selalu
     konsisten dengan data sumber (lihat syncAutoKas/removeAutoKas).
   ============================================================ */
let kasList = [];

async function loadKas(eventId){
  kasList = await dbFetchAll('kas', eventId);
  return kasList;
}

// Dipanggil modul lain (Tiket/Parkir, Sponsorship, Insentif) untuk
// menambah/memperbarui baris otomatis di Buku Utama. Satu (sumber, ref_id)
// = satu baris; kalau sudah ada, di-update; kalau belum, di-insert.
async function syncAutoKas({event_id, ref_id, sumber, tanggal, keterangan, tipe, kategori, jumlah}){
  const { data: existing } = await sb.from('kas').select('id').eq('sumber', sumber).eq('ref_id', ref_id).maybeSingle();
  const payload = { event_id, ref_id, sumber, tanggal, keterangan, tipe, kategori, jumlah, updated_at: new Date().toISOString() };
  if(existing){
    await sb.from('kas').update(payload).eq('id', existing.id);
  } else {
    await sb.from('kas').insert(payload);
  }
}

// Dipanggil saat baris sumber dihapus, atau statusnya balik jadi "belum
// lunas/bayar" (sehingga tidak lagi berhak masuk Buku Utama).
async function removeAutoKas(sumber, ref_id){
  await sb.from('kas').delete().eq('sumber', sumber).eq('ref_id', ref_id);
}

async function renderBukuUtama(container){
  const ev = getActiveEvent();
  if(!ev){ container.innerHTML = emptyEventState(); return; }
  await loadKas(ev.id);
  container.innerHTML = bukuUtamaTemplate(ev);
  bindBukuUtamaEvents();
}

function bukuUtamaTemplate(ev){
  const rows = [...kasList].sort((a,b)=> a.tanggal.localeCompare(b.tanggal) || a.created_at.localeCompare(b.created_at));
  let saldo = 0;
  const totalMasuk = rows.filter(r=>r.tipe==='masuk').reduce((s,r)=>s+Number(r.jumlah),0);
  const totalKeluar = rows.filter(r=>r.tipe==='keluar').reduce((s,r)=>s+Number(r.jumlah),0);

  const rowsHtml = rows.map(r=>{
    saldo += r.tipe==='masuk' ? Number(r.jumlah) : -Number(r.jumlah);
    const isManual = r.sumber === 'manual';
    return `
      <tr>
        <td>${fmtDate(r.tanggal)}</td>
        <td>${esc(r.keterangan)} ${!isManual ? `<span class="tag-auto">otomatis · ${esc(sumberLabel(r.sumber))}</span>` : ''}</td>
        <td>${esc(r.kategori||'-')}</td>
        <td class="num ${r.tipe==='masuk'?'text-green':'text-red'}">${r.tipe==='masuk'?'+':'-'} ${fmtRp(r.jumlah)}</td>
        <td class="num">${fmtRp(saldo)}</td>
        <td>
          ${isManual ? `
            <button class="btn-icon" data-edit="${r.id}" title="Edit">✏️</button>
            <button class="btn-icon" data-del="${r.id}" title="Hapus">🗑️</button>
          ` : `<span class="muted">-</span>`}
        </td>
      </tr>`;
  }).join('') || `<tr><td colspan="6" class="empty">Belum ada transaksi.</td></tr>`;

  return `
    <div class="page-header">
      <h2>📖 Buku Utama — ${esc(ev.nama)}</h2>
      <button id="btnTambahKas" class="btn-primary">+ Tambah Transaksi Manual</button>
    </div>
    <div class="stat-cards">
      <div class="stat-card"><div class="stat-label">Total Masuk</div><div class="stat-value text-green">${fmtRp(totalMasuk)}</div></div>
      <div class="stat-card"><div class="stat-label">Total Keluar</div><div class="stat-value text-red">${fmtRp(totalKeluar)}</div></div>
      <div class="stat-card"><div class="stat-label">Saldo Akhir</div><div class="stat-value">${fmtRp(totalMasuk-totalKeluar)}</div></div>
    </div>
    <div class="table-wrap">
      <table>
        <thead><tr><th>Tanggal</th><th>Keterangan</th><th>Kategori</th><th>Jumlah</th><th>Saldo</th><th>Aksi</th></tr></thead>
        <tbody>${rowsHtml}</tbody>
      </table>
    </div>
    <div id="modalRoot"></div>`;
}

function sumberLabel(s){
  return {tiket:'Tiket', parkir:'Parkir', sponsorship:'Sponsorship', insentif:'Insentif Panitia'}[s] || s;
}

function bindBukuUtamaEvents(){
  document.getElementById('btnTambahKas')?.addEventListener('click', ()=> openKasModal());
  document.querySelectorAll('[data-edit]').forEach(btn=>{
    btn.addEventListener('click', ()=> openKasModal(kasList.find(k=>k.id===btn.dataset.edit)));
  });
  document.querySelectorAll('[data-del]').forEach(btn=>{
    btn.addEventListener('click', async ()=>{
      if(!confirmDialog('Hapus transaksi ini?')) return;
      const ok = await dbDelete('kas', btn.dataset.del);
      if(ok){ toast('Transaksi dihapus'); renderApp(); }
    });
  });
}

function openKasModal(row){
  const ev = getActiveEvent();
  const isEdit = !!row;
  const html = `
    <div class="modal-backdrop">
      <div class="modal">
        <h3>${isEdit?'Edit':'Tambah'} Transaksi</h3>
        <form id="kasForm">
          <label>Tanggal</label>
          <input type="date" name="tanggal" required value="${row?.tanggal || todayISO()}" />
          <label>Tipe</label>
          <select name="tipe" required>
            <option value="masuk" ${row?.tipe==='masuk'?'selected':''}>Uang Masuk</option>
            <option value="keluar" ${row?.tipe==='keluar'?'selected':''}>Uang Keluar</option>
          </select>
          <label>Keterangan</label>
          <input type="text" name="keterangan" required value="${esc(row?.keterangan||'')}" placeholder="mis. Sewa lapangan" />
          <label>Kategori (opsional)</label>
          <input type="text" name="kategori" value="${esc(row?.kategori||'')}" placeholder="mis. Perlengkapan" />
          <label>Jumlah (Rp)</label>
          <input type="number" name="jumlah" required min="0" value="${row?.jumlah||''}" />
          <div class="modal-actions">
            <button type="button" class="btn-ghost" id="btnCancelKas">Batal</button>
            <button type="submit" class="btn-primary">Simpan</button>
          </div>
        </form>
      </div>
    </div>`;
  document.getElementById('modalRoot').innerHTML = html;
  document.getElementById('btnCancelKas').addEventListener('click', ()=> document.getElementById('modalRoot').innerHTML='');
  document.getElementById('kasForm').addEventListener('submit', async (e)=>{
    e.preventDefault();
    const fd = new FormData(e.target);
    const payload = {
      event_id: ev.id,
      tanggal: fd.get('tanggal'),
      tipe: fd.get('tipe'),
      keterangan: fd.get('keterangan').trim(),
      kategori: fd.get('kategori').trim() || null,
      jumlah: Number(fd.get('jumlah')),
      sumber: 'manual',
    };
    const ok = isEdit ? await dbUpdate('kas', row.id, payload) : await dbInsert('kas', payload);
    if(ok){ toast('Transaksi disimpan'); renderApp(); }
  });
}

function emptyEventState(){
  return `<div class="empty-state">
    <p>Belum ada event aktif.</p>
    ${isAdmin() ? `<p>Buat event dulu di menu <b>Kelola Event</b>.</p>` : `<p>Hubungi admin untuk membuat event.</p>`}
  </div>`;
}
