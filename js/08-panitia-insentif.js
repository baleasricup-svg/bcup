/* ============================================================
   PANITIA & INSENTIF — `panitia` = master data orang (lintas event,
   TIDAK terikat event_id). `insentif_panitia` = honor PER EVENT untuk
   tiap panitia. Hanya baris berstatus 'lunas' yang dicatat sebagai
   uang keluar otomatis di Buku Utama.
   ============================================================ */
let panitiaList = [];
let insentifList = [];

async function loadPanitiaInsentif(eventId){
  const [p, i] = await Promise.all([
    dbFetchAll('panitia'),               // tanpa filter event_id — master data
    dbFetchAll('insentif_panitia', eventId),
  ]);
  panitiaList = p; insentifList = i;
}

function namaPanitia(id){ return panitiaList.find(p=>p.id===id)?.nama || '(tidak diketahui)'; }
function jabatanPanitia(id){ return panitiaList.find(p=>p.id===id)?.jabatan || '-'; }

async function renderPanitiaInsentif(container){
  const ev = getActiveEvent();
  if(!ev){ container.innerHTML = emptyEventState(); return; }
  await loadPanitiaInsentif(ev.id);
  container.innerHTML = panitiaInsentifTemplate(ev);
  bindPanitiaInsentifEvents();
}

function panitiaInsentifTemplate(ev){
  const totalInsentif = insentifList.reduce((s,r)=>s+Number(r.jumlah),0);
  const totalLunas = insentifList.filter(r=>r.status==='lunas').reduce((s,r)=>s+Number(r.jumlah),0);

  const rowsHtml = insentifList.map(r=>`
    <tr>
      <td>${esc(namaPanitia(r.panitia_id))}</td>
      <td>${esc(jabatanPanitia(r.panitia_id))}</td>
      <td class="num">${fmtRp(r.jumlah)}</td>
      <td><span class="badge ${r.status==='lunas'?'badge-green':'badge-red'}">${r.status==='lunas'?'Lunas':'Belum Bayar'}</span></td>
      <td>${r.tanggal_bayar ? fmtDate(r.tanggal_bayar) : '-'}</td>
      <td>
        <button class="btn-icon" data-edit="${r.id}" title="Edit">✏️</button>
        <button class="btn-icon" data-del="${r.id}" title="Hapus">🗑️</button>
      </td>
    </tr>`).join('') || `<tr><td colspan="6" class="empty">Belum ada data insentif.</td></tr>`;

  const panitiaOptions = panitiaList.map(p=>`<option value="${p.id}">${esc(p.nama)} — ${esc(p.jabatan||'-')}</option>`).join('');

  return `
    <div class="page-header">
      <h2>👷 Panitia & Insentif — ${esc(ev.nama)}</h2>
      <div class="header-actions">
        <button id="btnTambahPanitia" class="btn-ghost">+ Panitia Baru</button>
        <button id="btnTambahInsentif" class="btn-primary">+ Tambah Insentif</button>
      </div>
    </div>
    <div class="stat-cards">
      <div class="stat-card"><div class="stat-label">Total Insentif Dianggarkan</div><div class="stat-value">${fmtRp(totalInsentif)}</div></div>
      <div class="stat-card"><div class="stat-label">Sudah Dibayar</div><div class="stat-value text-green">${fmtRp(totalLunas)}</div></div>
      <div class="stat-card"><div class="stat-label">Belum Dibayar</div><div class="stat-value text-red">${fmtRp(totalInsentif-totalLunas)}</div></div>
    </div>
    <div class="table-wrap">
      <table>
        <thead><tr><th>Nama Panitia</th><th>Jabatan</th><th>Jumlah</th><th>Status</th><th>Tgl Bayar</th><th>Aksi</th></tr></thead>
        <tbody>${rowsHtml}</tbody>
      </table>
    </div>
    <details class="collapsible"><summary>Kelola Master Data Panitia (${panitiaList.length})</summary>
      <div class="table-wrap">
        <table>
          <thead><tr><th>Nama</th><th>Jabatan</th><th>Kontak</th><th>Aksi</th></tr></thead>
          <tbody>${panitiaList.map(p=>`
            <tr>
              <td>${esc(p.nama)}</td><td>${esc(p.jabatan||'-')}</td><td>${esc(p.kontak||'-')}</td>
              <td><button class="btn-icon" data-del-panitia="${p.id}" title="Hapus">🗑️</button></td>
            </tr>`).join('') || `<tr><td colspan="4" class="empty">Belum ada panitia terdaftar.</td></tr>`}
          </tbody>
        </table>
      </div>
    </details>
    <div id="modalRoot" data-panitia-options="${esc(panitiaOptions)}"></div>`;
}

function bindPanitiaInsentifEvents(){
  document.getElementById('btnTambahPanitia')?.addEventListener('click', openPanitiaModal);
  document.getElementById('btnTambahInsentif')?.addEventListener('click', ()=> openInsentifModal());
  document.querySelectorAll('[data-edit]').forEach(btn=>{
    btn.addEventListener('click', ()=> openInsentifModal(insentifList.find(r=>r.id===btn.dataset.edit)));
  });
  document.querySelectorAll('[data-del]').forEach(btn=>{
    btn.addEventListener('click', async ()=>{
      if(!confirmDialog('Hapus data insentif ini?')) return;
      const ok = await dbDelete('insentif_panitia', btn.dataset.del);
      if(ok){ await removeAutoKas('insentif', btn.dataset.del); toast('Insentif dihapus'); renderApp(); }
    });
  });
  document.querySelectorAll('[data-del-panitia]').forEach(btn=>{
    btn.addEventListener('click', async ()=>{
      if(!confirmDialog('Hapus panitia ini? Data insentif terkait di semua event ikut terhapus.')) return;
      const ok = await dbDelete('panitia', btn.dataset.delPanitia);
      if(ok){ toast('Panitia dihapus'); renderApp(); }
    });
  });
}

function openPanitiaModal(){
  const html = `
    <div class="modal-backdrop">
      <div class="modal">
        <h3>Tambah Panitia</h3>
        <form id="panitiaForm">
          <label>Nama</label>
          <input type="text" name="nama" required />
          <label>Jabatan / Divisi</label>
          <input type="text" name="jabatan" placeholder="mis. Koordinator Lapangan" />
          <label>Kontak (opsional)</label>
          <input type="text" name="kontak" />
          <div class="modal-actions">
            <button type="button" class="btn-ghost" id="btnCancelPanitia">Batal</button>
            <button type="submit" class="btn-primary">Simpan</button>
          </div>
        </form>
      </div>
    </div>`;
  document.getElementById('modalRoot').innerHTML = html;
  document.getElementById('btnCancelPanitia').addEventListener('click', ()=> document.getElementById('modalRoot').innerHTML='');
  document.getElementById('panitiaForm').addEventListener('submit', async (e)=>{
    e.preventDefault();
    const fd = new FormData(e.target);
    const saved = await dbInsert('panitia', {
      nama: fd.get('nama').trim(),
      jabatan: fd.get('jabatan').trim() || null,
      kontak: fd.get('kontak').trim() || null,
    });
    if(saved){ toast('Panitia ditambahkan'); renderApp(); }
  });
}

function openInsentifModal(row){
  const ev = getActiveEvent();
  const isEdit = !!row;
  if(panitiaList.length === 0){
    toast('Tambah panitia dulu sebelum mengisi insentif.');
    return;
  }
  const panitiaOptions = panitiaList.map(p=>`<option value="${p.id}" ${row?.panitia_id===p.id?'selected':''}>${esc(p.nama)} — ${esc(p.jabatan||'-')}</option>`).join('');
  const html = `
    <div class="modal-backdrop">
      <div class="modal">
        <h3>${isEdit?'Edit':'Tambah'} Insentif Panitia</h3>
        <form id="insentifForm">
          <label>Panitia</label>
          <select name="panitia_id" required>${panitiaOptions}</select>
          <label>Jumlah Insentif (Rp)</label>
          <input type="number" name="jumlah" min="0" required value="${row?.jumlah ?? ''}" />
          <label>Status</label>
          <select name="status">
            <option value="belum_bayar" ${row?.status==='belum_bayar'?'selected':''}>Belum Dibayar</option>
            <option value="lunas" ${row?.status==='lunas'?'selected':''}>Lunas</option>
          </select>
          <label>Tanggal Bayar</label>
          <input type="date" name="tanggal_bayar" value="${row?.tanggal_bayar || todayISO()}" />
          <label>Catatan (opsional)</label>
          <input type="text" name="catatan" value="${esc(row?.catatan||'')}" />
          <div class="modal-actions">
            <button type="button" class="btn-ghost" id="btnCancelInsentif">Batal</button>
            <button type="submit" class="btn-primary">Simpan</button>
          </div>
        </form>
      </div>
    </div>`;
  document.getElementById('modalRoot').innerHTML = html;
  document.getElementById('btnCancelInsentif').addEventListener('click', ()=> document.getElementById('modalRoot').innerHTML='');
  document.getElementById('insentifForm').addEventListener('submit', async (e)=>{
    e.preventDefault();
    const fd = new FormData(e.target);
    const status = fd.get('status');
    const payload = {
      event_id: ev.id,
      panitia_id: fd.get('panitia_id'),
      jumlah: Number(fd.get('jumlah')),
      status,
      tanggal_bayar: status === 'lunas' ? (fd.get('tanggal_bayar') || todayISO()) : null,
      catatan: fd.get('catatan').trim() || null,
    };
    const saved = isEdit ? await dbUpdate('insentif_panitia', row.id, payload) : await dbInsert('insentif_panitia', payload);
    if(!saved) return;
    if(status === 'lunas'){
      await syncAutoKas({
        event_id: ev.id, ref_id: saved.id, sumber: 'insentif',
        tanggal: saved.tanggal_bayar || todayISO(),
        keterangan: `Insentif Panitia — ${namaPanitia(saved.panitia_id)}`,
        tipe: 'keluar', kategori: 'Insentif Panitia',
        jumlah: Number(saved.jumlah),
      });
    } else {
      await removeAutoKas('insentif', saved.id);
    }
    toast('Data insentif disimpan');
    renderApp();
  });
}
