/* ============================================================
   PERTANDINGAN — jadwal + input skor per set
   ============================================================ */
function timNama(t, id){
  if(!id) return 'BYE';
  const tm = getTim(t,id);
  return tm ? tm.nama : '—';
}

function matchCard(t, p, withButtons){
  const nmA = timNama(t,p.timA), nmB = timNama(t,p.timB);
  const setHtml = (p.set||[]).map((s,i)=>`
    <div class="set-box">
      <span class="tag-set">Set ${i+1}</span>
      <input type="number" min="0" data-m="a" data-i="${i}" data-p="${p.id}" value="${s.a==null?'':s.a}" ${p.selesai?'readonly':''} onchange="updateSet('${p.id}',${i},'a',this.value)">
      <span class="sep">:</span>
      <input type="number" min="0" data-m="b" data-i="${i}" data-p="${p.id}" value="${s.b==null?'':s.b}" ${p.selesai?'readonly':''} onchange="updateSet('${p.id}',${i},'b',this.value)">
    </div>`).join('');

  const pemenangBadge = p.selesai && p.pemenang
    ? `<span class="tag sukses">🏆 ${esc(timNama(t,p.pemenang))}</span>`
    : (p.selesai ? `<span class="tag neutral">Seri</span>` : '');

  return `
    <div class="match-card">
      <div class="mc-head">
        <span class="tag ${p.grup?'sand':'neutral'}">${esc(p.babak||'')}${p.grup?` · Grup ${esc(p.grup)}`:''} ${p.lapangan?`· Lap ${p.lapangan}`:''}</span>
        <div class="flex" style="gap:6px">
          <span class="muted small">${fmtDateJam(p.tanggal,p.jam)}</span>
          ${withButtons && !p.selesai ? `<button class="pill-btn" onclick="openPertandinganModal('${p.id}')">✎</button>` : ''}
          ${withButtons && !p.selesai ? `<button class="pill-btn" onclick="tandaiSelesai('${p.id}')">✓ Selesai</button>` : ''}
        </div>
      </div>
      <div class="mc-teams">
        <div class="mc-team"><div class="mc-team nm" style="font-weight:${p.pemenang===p.timA?'700':'600'};color:${p.pemenang===p.timA?'var(--sukses)':'inherit'}">${esc(nmA)}</div></div>
        <div class="mc-vs">VS</div>
        <div class="mc-team"><div class="mc-team nm" style="font-weight:${p.pemenang===p.timB?'700':'600'};color:${p.pemenang===p.timB?'var(--sukses)':'inherit'}">${esc(nmB)}</div></div>
      </div>
      <div class="set-row">${setHtml}</div>
      ${p.selesai ? `<div class="flex" style="justify-content:center;margin-top:8px">${pemenangBadge}</div>` : ''}
      ${p.catatan ? `<div class="muted small" style="margin-top:6px;text-align:center">${esc(p.catatan)}</div>` : ''}
    </div>`;
}

function renderPertandingan(){
  const t = activeTurnamen();
  if(!t) return emptyTurnamen();
  const list = t.pertandingan||[];
  if(!list.length){
    return `<div class="toolbar"><h3 style="margin:0;font-size:18px">Pertandingan</h3></div>
      <div class="empty-state"><h3>Belum ada jadwal</h3>
      <p>Tambahkan tim lalu generate jadwal otomatis.</p>
      <button class="btn" onclick="goSection('tim')">👥 Kelola Tim</button></div>`;
  }

  const sorted = [...list].sort((a,b)=> (a.tanggal||'').localeCompare(b.tanggal||'') || (a.jam||'').localeCompare(b.jam||''));
  const groups = {};
  sorted.forEach(p=>{ const k=p.babak||'Lainnya'; (groups[k]=groups[k]||[]).push(p); });
  const groupKeys = Object.keys(groups).sort();

  return `
    <div class="toolbar">
      <h3 style="margin:0;font-size:18px">Pertandingan</h3>
      <div class="spacer"></div>
      ${canEdit()?`<button class="btn ghost" onclick="openPertandinganModal()">+ Manual</button>`:''}
      <button class="btn" onclick="exportPertandingan()">⬇️ CSV</button>
    </div>
    ${groupKeys.map(k=>`
      <div class="section-title">${esc(k)} <span class="muted">(${groups[k].length})</span></div>
      ${groups[k].map(p=>matchCard(t,p,true)).join('')}
    `).join('')}
  `;
}

function openPertandinganModal(id){
  if(!canEdit()){ toast('⛔ Login untuk mengedit'); return; }
  const t = activeTurnamen();
  const p = id ? getPertandingan(t,id) : null;
  const timOpts = t.tim.map(tm=>`<option value="${tm.id}" ${p&&p.timA===tm.id?'selected':''}>${esc(tm.nama)}</option>`).join('');
  const setRows = (p?p.set:Array.from({length:t.jumlahSet},()=>({a:null,b:null}))).map((s,i)=>`
    <div class="set-row" style="justify-content:flex-start;margin-bottom:5px">
      <span class="tag" style="min-width:54px">Set ${i+1}</span>
      <input type="number" min="0" id="ps-a-${i}" value="${s.a==null?'':s.a}" style="width:64px;text-align:center" placeholder="A">
      <span class="muted">:</span>
      <input type="number" min="0" id="ps-b-${i}" value="${s.b==null?'':s.b}" style="width:64px;text-align:center" placeholder="B">
    </div>`).join('');
  const body = `
    <div class="row2">
      <div class="form-row"><label>Tim A</label>
        <select id="p-timA"><option value="">— pilih —</option>${t.tim.map(tm=>`<option value="${tm.id}" ${p&&p.timA===tm.id?'selected':''}>${esc(tm.nama)}</option>`).join('')}</select>
      </div>
      <div class="form-row"><label>Tim B</label>
        <select id="p-timB"><option value="">— pilih —</option>${t.tim.map(tm=>`<option value="${tm.id}" ${p&&p.timB===tm.id?'selected':''}>${esc(tm.nama)}</option>`).join('')}</select>
      </div>
    </div>
    <div class="row3">
      <div class="form-row"><label>Tanggal</label><input id="p-tgl" type="date" value="${p?p.tanggal:todayISO()}"></div>
      <div class="form-row"><label>Jam</label><input id="p-jam" type="time" value="${p?p.jam:'09:00'}"></div>
      <div class="form-row"><label>Lapangan</label><input id="p-lap" type="text" placeholder="1" value="${p?p.lapangan:''}"></div>
    </div>
    <div class="form-row"><label>Babak / Grup</label>
      <input id="p-babak" placeholder="mis. Putaran 1 / Grup A" value="${esc(p?p.babak:'')}"></div>
    <div class="section-title" style="margin:10px 0 6px">Skor per Set</div>
    <div id="p-set-list">${setRows}</div>
    ${id?`<div class="form-row" style="margin-top:8px"><label><input type="checkbox" id="p-selesai" ${p.selesai?'checked':''} style="width:auto;margin-right:6px">Tandai selesai</label></div>`:''}
  `;
  setModal(id?'Edit Pertandingan':'Pertandingan Baru', body, [
    {label:'Batal', cls:'secondary', onclick:closeModal},
    {label: id?'Simpan':'Tambah', cls:'', onclick:()=>simpanPertandingan(id)},
  ]);
}

function simpanPertandingan(id){
  const t = activeTurnamen();
  const timA = document.getElementById('p-timA').value;
  const timB = document.getElementById('p-timB').value;
  if(!timA || !timB){ toast('⛔ Pilih kedua tim'); return; }
  if(timA===timB){ toast('⛔ Tim A & B tidak boleh sama'); return; }
  const set=[];
  for(let i=0;i<t.jumlahSet;i++){
    const a=document.getElementById('ps-a-'+i).value;
    const b=document.getElementById('ps-b-'+i).value;
    set.push({a: a===''&&!id?null:parseInt(a)||0, b: b===''&&!id?null:parseInt(b)||0});
  }
  const data = {
    timA, timB,
    tanggal: document.getElementById('p-tgl').value,
    jam: document.getElementById('p-jam').value,
    lapangan: document.getElementById('p-lap').value.trim(),
    babak: document.getElementById('p-babak').value.trim(),
    set,
  };
  if(id){
    const p=getPertandingan(t,id);
    Object.assign(p,data);
    if(document.getElementById('p-selesai') && document.getElementById('p-selesai').checked) p.selesai=true;
    computeWinner(t,p);
    toast('✅ Pertandingan diperbarui');
  }else{
    const p=Object.assign({id:uid(), selesai:false, pemenang:null, catatan:''}, data);
    t.pertandingan.push(p);
    toast('✅ Pertandingan ditambahkan');
  }
  saveDB(); closeModal(); renderContent(); renderTopbarSaldo();
}

function updateSet(pid, idx, side, val){
  const t = activeTurnamen();
  const p = getPertandingan(t,pid);
  if(!p || p.selesai) return;
  p.set[idx][side] = (val===''||val==null) ? null : parseInt(val)||0;
  saveDB();
  const allFilled = p.set.every(s=>s.a!=null && s.b!=null);
  if(allFilled) computeWinner(t,p);
}

function computeWinner(t, p){
  let setA=0, setB=0;
  p.set.forEach(s=>{
    if(s.a==null||s.b==null) return;
    if(s.a>s.b) setA++; else if(s.b>s.a) setB++;
  });
  if(setA>setB){ p.pemenang=p.timA; }
  else if(setB>setA){ p.pemenang=p.timB; }
  else { p.pemenang=null; }
  if(p.set.every(s=>s.a!=null&&s.b!=null)) p.selesai=true;
  else p.selesai=false;
}

function tandaiSelesai(pid){
  const t = activeTurnamen();
  const p=getPertandingan(t,pid);
  if(!p) return;
  const allFilled = p.set.every(s=>s.a!=null&&s.b!=null);
  if(!allFilled){ toast('⛔ Isi semua skor set dulu'); return; }
  computeWinner(t,p);
  p.selesai=true;
  saveDB(); renderContent(); renderTopbarSaldo();
  toast('✅ Pertandingan ditandai selesai');
}

function exportPertandingan(){
  const t = activeTurnamen();
  const rows = [['Babak/Grup','Tanggal','Jam','Lap','Tim A','Tim B','Skor','Pemenang','Selesai']];
  (t.pertandingan||[]).forEach(p=>{
    const skor = p.set.map(s=>`${s.a??'-'}-${s.b??'-'}`).join(' ');
    rows.push([p.babak||'', p.tanggal||'', p.jam||'', p.lapangan||'', timNama(t,p.timA), timNama(t,p.timB), skor, timNama(t,p.pemenang), p.selesai?'YA':'TIDAK']);
  });
  const csv = rows.map(r=>r.map(c=>`"${String(c).replace(/"/g,'""')}"`).join(',')).join('\n');
  downloadFile(`pertandingan_${t.nama.replace(/\s+/g,'_')}.csv`, csv, 'text/csv');
  toast('✅ Diekspor ke CSV');
}
function downloadFile(name, content, mime){
  const blob = new Blob([content], {type:mime});
  const url = URL.createObjectURL(blob);
  const a=document.createElement('a'); a.href=url; a.download=name; a.click();
  setTimeout(()=>URL.revokeObjectURL(url), 2000);
}
