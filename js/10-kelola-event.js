/* ============================================================
   KELOLA EVENT — admin bisa membuat event olahraga baru dan
   berpindah event aktif (mis. tahun depan buat event baru, tapi
   data event lama tetap tersimpan & bisa dilihat lagi).
   ============================================================ */
async function renderKelolaEvent(container){
  if(!isAdmin()){ container.innerHTML = `<div class="empty-state"><p>Khusus admin.</p></div>`; return; }
  await loadEvents();
  container.innerHTML = kelolaEventTemplate();
  bindKelolaEventEvents();
}

function kelolaEventTemplate(){
  const activeId = ACTIVE_EVENT_ID;
  const rowsHtml = allEvents.map(e=>`
    <tr class="${e.id===activeId?'row-active':''}">
      <td>${esc(e.nama)}</td>
      <td>${esc(e.lokasi||'-')}</td>
      <td>${fmtDate(e.tanggal_mulai)}${e.tanggal_selesai && e.tanggal_selesai!==e.tanggal_mulai ? ' – '+fmtDate(e.tanggal_selesai) : ''}</td>
      <td>${e.id===activeId ? '<span class="badge badge-green">Aktif</span>' : `<button class="btn-ghost btn-sm" data-activate="${e.id}">Jadikan Aktif</button>`}</td>
    </tr>`).join('') || `<tr><td colspan="4" class="empty">Belum ada event. Buat event pertama di bawah.</td></tr>`;

  return `
    <div class="page-header"><h2>⚙️ Kelola Event</h2></div>
    <div class="table-wrap">
      <table>
        <thead><tr><th>Nama Event</th><th>Lokasi</th><th>Tanggal</th><th>Status</th></tr></thead>
        <tbody>${rowsHtml}</tbody>
      </table>
    </div>
    <h3 style="margin-top:24px">+ Buat Event Baru</h3>
    <form id="eventForm" class="inline-form">
      <label>Nama Event</label>
      <input type="text" name="nama" required placeholder="mis. Turnamen Voli Agustusan 2026" />
      <div class="form-row">
        <div><label>Tanggal Mulai</label><input type="date" name="tanggal_mulai" required /></div>
        <div><label>Tanggal Selesai</label><input type="date" name="tanggal_selesai" /></div>
      </div>
      <label>Lokasi (opsional)</label>
      <input type="text" name="lokasi" />
      <button type="submit" class="btn-primary">Buat Event</button>
    </form>
  `;
}

function bindKelolaEventEvents(){
  document.querySelectorAll('[data-activate]').forEach(btn=>{
    btn.addEventListener('click', ()=>{ setActiveEvent(btn.dataset.activate); renderApp(); });
  });
  document.getElementById('eventForm').addEventListener('submit', async (e)=>{
    e.preventDefault();
    const fd = new FormData(e.target);
    const saved = await createEvent({
      nama: fd.get('nama').trim(),
      tanggal_mulai: fd.get('tanggal_mulai'),
      tanggal_selesai: fd.get('tanggal_selesai') || fd.get('tanggal_mulai'),
      lokasi: fd.get('lokasi').trim() || null,
      is_active: true,
    });
    if(saved){ toast('Event dibuat & dijadikan aktif'); renderApp(); }
  });
}
