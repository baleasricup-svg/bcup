/* ============================================================
   SPONSORSHIP — daftar sponsor per event. Hanya nominal yang
   BENAR-BENAR diterima (status 'lunas' pakai `nominal`, status
   'sebagian' pakai `nominal_diterima`) yang dicatat sebagai uang
   masuk otomatis di Buku Utama. Status 'belum_lunas' tidak membuat
   entri kas (masih janji, belum uang riil).
   ============================================================ */
let sponsorshipList = [];

async function loadSponsorship(eventId){
  sponsorshipList = await dbFetchAll('sponsorship', eventId);
  return sponsorshipList;
}

async function renderSponsorship(container){
  const ev = getActiveEvent();
  if(!ev){ container.innerHTML = emptyEventState(); return; }
  await loadSponsorship(ev.id);
  container.innerHTML = sponsorshipTemplate(ev);
  bindSponsorshipEvents();
}

function statusLabel(s){ return {belum_lunas:'Belum Lunas', sebagian:'Sebagian', lunas:'Lunas'}[s] || s; }
function statusClass(s){ return {belum_lunas:'badge-red', sebagian:'badge-yellow', lunas:'badge-green'}[s] || ''; }

function sponsorshipTemplate(ev){
  const rows = [...sponsorshipList].sort((a,b)=>(a.tanggal||'').localeCompare(b.tanggal||''));
  const totalJanji = rows.reduce((s,r)=>s+Number(r.nominal),0);
  const totalDiterima = rows.reduce((s,r)=> s + (r.status==='lunas' ? Number(r.nominal) : r.status==='sebagian' ? Number(r.nominal_diterima) : 0), 0);

  const rowsHtml = rows.map(r=>`
    <tr>
      <td>${esc(r.nama_sponsor)}</td>
      <td>${r.jenis==='uang'?'Uang':'Barang'}</td>
      <td class="num">${fmtRp(r.nominal)}</td>
      <td class="num">${fmtRp(r.status==='lunas'?r.nominal:r.nominal_diterima)}</td>
      <td><span class="badge ${statusClass(r.status)}">${statusLabel(r.status)}</span></td>
      <td>${esc(r.deskripsi||'-')}</td>
      <td>
        <button class="btn-icon" data-edit="${r.id}" title="Edit">✏️</button>
        <button class="btn-icon" data-del="${r.id}" title="Hapus">🗑️</button>
      </td>
    </tr>`).join('') || `<tr><td colspan="7" class="empty">Belum ada data sponsorship.</td></tr>`;

  return `
    <div class="page-header">
      <h2>🤝 Sponsorship — ${esc(ev.nama)}</h2>
      <button id="btnTambahSponsor" class="btn-primary">+ Tambah Sponsor</button>
    </div>
    <div class="stat-cards">
      <div class="stat-card"><div class="stat-label">Total Nilai Kesepakatan</div><div class="stat-value">${fmtRp(totalJanji)}</div></div>
      <div class="stat-card"><div class="stat-label">Sudah Diterima (masuk Buku Utama)</div><div class="stat-value text-green">${fmtRp(totalDiterima)}</div></div>
      <div class="stat-card"><div class="stat-label">Belum Diterima</div><div class="stat-value text-red">${fmtRp(totalJanji-totalDiterima)}</div></div>
    </div>
    <div class="table-wrap">
      <table>
        <thead><tr><th>Sponsor</th><th>Jenis</th><th>Nominal Kesepakatan</th><th>Diterima</th><th>Status</th><th>Keterangan</th><th>Aksi</th></tr></thead>
        <tbody>${rowsHtml}</tbody>
      </table>
    </div>
    <div id="modalRoot"></div>`;
}

function bindSponsorshipEvents(){
  document.getElementById('btnTambahSponsor')?.addEventListener('click', ()=> openSponsorModal());
  document.querySelectorAll('[data-edit]').forEach(btn=>{
    btn.addEventListener('click', ()=> openSponsorModal(sponsorshipList.find(r=>r.id===btn.dataset.edit)));
  });
  document.querySelectorAll('[data-del]').forEach(btn=>{
    btn.addEventListener('click', async ()=>{
      if(!confirmDialog('Hapus data sponsor ini?')) return;
      const ok = await dbDelete('sponsorship', btn.dataset.del);
      if(ok){ await removeAutoKas('sponsorship', btn.dataset.del); toast('Sponsor dihapus'); renderApp(); }
    });
  });
}

function openSponsorModal(row){
  const ev = getActiveEvent();
  const isEdit = !!row;
  const html = `
    <div class="modal-backdrop">
      <div class="modal">
        <h3>${isEdit?'Edit':'Tambah'} Sponsor</h3>
        <form id="sponsorForm">
          <label>Nama Sponsor</label>
          <input type="text" name="nama_sponsor" required value="${esc(row?.nama_sponsor||'')}" />
          <div class="form-row">
            <div>
              <label>Jenis</label>
              <select name="jenis">
                <option value="uang" ${row?.jenis==='uang'?'selected':''}>Uang</option>
                <option value="barang" ${row?.jenis==='barang'?'selected':''}>Barang</option>
              </select>
            </div>
            <div>
              <label>Nominal Kesepakatan (Rp)</label>
              <input type="number" name="nominal" min="0" required value="${row?.nominal ?? ''}" />
            </div>
          </div>
          <div class="form-row">
            <div>
              <label>Status</label>
              <select name="status" id="sponsorStatus">
                <option value="belum_lunas" ${row?.status==='belum_lunas'?'selected':''}>Belum Lunas</option>
                <option value="sebagian" ${row?.status==='sebagian'?'selected':''}>Sebagian</option>
                <option value="lunas" ${row?.status==='lunas'?'selected':''}>Lunas</option>
              </select>
            </div>
            <div id="nominalDiterimaWrap">
              <label>Nominal Diterima (Rp)</label>
              <input type="number" name="nominal_diterima" min="0" value="${row?.nominal_diterima ?? 0}" />
            </div>
          </div>
          <label>Tanggal</label>
          <input type="date" name="tanggal" value="${row?.tanggal || todayISO()}" />
          <label>Kontak (opsional)</label>
          <input type="text" name="kontak" value="${esc(row?.kontak||'')}" />
          <label>Keterangan (opsional)</label>
          <input type="text" name="deskripsi" value="${esc(row?.deskripsi||'')}" />
          <div class="modal-actions">
            <button type="button" class="btn-ghost" id="btnCancelSponsor">Batal</button>
            <button type="submit" class="btn-primary">Simpan</button>
          </div>
        </form>
      </div>
    </div>`;
  document.getElementById('modalRoot').innerHTML = html;
  document.getElementById('btnCancelSponsor').addEventListener('click', ()=> document.getElementById('modalRoot').innerHTML='');
  document.getElementById('sponsorForm').addEventListener('submit', async (e)=>{
    e.preventDefault();
    const fd = new FormData(e.target);
    const status = fd.get('status');
    const nominal = Number(fd.get('nominal'));
    const nominalDiterima = status === 'lunas' ? nominal : Number(fd.get('nominal_diterima')) || 0;
    const payload = {
      event_id: ev.id,
      nama_sponsor: fd.get('nama_sponsor').trim(),
      jenis: fd.get('jenis'),
      nominal,
      nominal_diterima: nominalDiterima,
      status,
      tanggal: fd.get('tanggal') || null,
      kontak: fd.get('kontak').trim() || null,
      deskripsi: fd.get('deskripsi').trim() || null,
    };
    const saved = isEdit ? await dbUpdate('sponsorship', row.id, payload) : await dbInsert('sponsorship', payload);
    if(!saved) return;
    if(status === 'belum_lunas'){
      await removeAutoKas('sponsorship', saved.id);
    } else {
      await syncAutoKas({
        event_id: ev.id, ref_id: saved.id, sumber: 'sponsorship',
        tanggal: saved.tanggal || todayISO(),
        keterangan: `Sponsorship — ${saved.nama_sponsor}${status==='sebagian'?' (sebagian)':''}`,
        tipe: 'masuk', kategori: 'Sponsorship',
        jumlah: status==='lunas' ? nominal : nominalDiterima,
      });
    }
    toast('Data sponsor disimpan');
    renderApp();
  });
}
