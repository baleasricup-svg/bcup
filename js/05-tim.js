/* ============================================================
   TIM & PEMAIN — CRUD tim + roster pemain
   ============================================================ */
function renderTim(){
  const t = activeTurnamen();
  if(!t) return emptyTurnamen();
  const grupMode = t.sistem==='grup';
  const grupList = grupMode ? Array.from(new Set((t.tim||[]).map(x=>x.grup).filter(Boolean))) : [];

  return `
    <div class="toolbar">
      <h3 style="margin:0;font-size:18px">Tim & Pemain</h3>
      <div class="spacer"></div>
      ${grupMode ? `<span class="muted small">${grupList.length} grup</span>` : ''}
      <button class="btn" onclick="openTimModal()">+ Tim</button>
    </div>

    ${(t.tim||[]).length ? '' : `
      <div class="empty-state"><h3>Belum ada tim</h3>
        <p>Tambahkan tim peserta, lalu generate jadwal pertandingan otomatis.</p>
        <button class="btn" onclick="openTimModal()">+ Tambah Tim</button></div>
    `}

    ${(t.tim||[]).length ? `
      <div class="grid cols-2">
        ${t.tim.map(tm=>`
          <div class="panel">
            <div class="flex-between" style="margin-bottom:8px">
              <div class="flex" style="gap:10px;min-width:0">
                <div class="avatar" style="width:38px;height:38px;font-size:14px">${esc(inisial(tm.nama))}</div>
                <div style="min-width:0">
                  <div style="font-weight:700">${esc(tm.nama)}</div>
                  <div class="muted small">${tm.pemain.length} pemain${tm.grup?` · Grup ${esc(tm.grup)}`:''}</div>
                </div>
              </div>
              <div class="flex" style="gap:5px">
                <button class="pill-btn" onclick="openTimModal('${tm.id}')">✎</button>
                <button class="pill-btn bahaya" onclick="hapusTim('${tm.id}')">🗑</button>
              </div>
            </div>
            ${tm.pemain.length ? `
              <div style="display:flex;flex-wrap:wrap;gap:5px;margin-top:6px">
                ${tm.pemain.map(p=>`<span class="tag">${esc(p.nama)}${p.nomor?' #'+esc(p.nomor):''}</span>`).join('')}
              </div>` : `<div class="muted small">Belum ada pemain</div>`}
          </div>`).join('')}
      </div>

      <div class="toolbar" style="margin-top:22px">
        <div class="section-title" style="margin:0">Generate Jadwal</div>
        <div class="spacer"></div>
        <button class="btn ghost" onclick="generateJadwal()">⚙️ Generate Otomatis</button>
      </div>
      <p class="small muted">Membuat jadwal pertandingan berdasarkan sistem kompetisi: setiap tim bertemu sekali (round robin), atau via babak grup + knock-out.</p>
    ` : ''}
  `;
}

function openTimModal(id){
  if(!canEdit()){ toast('⛔ Login untuk mengedit'); return; }
  const t = activeTurnamen();
  const tm = id ? getTim(t,id) : null;
  const grupMode = t.sistem==='grup';
  const body = `
    <div class="form-row"><label>Nama Tim</label>
      <input id="tm-nama" placeholder="mis. RW 03 Putra" value="${esc(tm?tm.nama:'')}"></div>
    ${grupMode ? `
    <div class="form-row"><label>Grup (A/B/C...)</label>
      <input id="tm-grup" placeholder="A" value="${esc(tm?tm.grup:'')}" maxlength="3" style="text-transform:uppercase;max-width:120px"></div>` : ''}
    <div class="section-title" style="margin:10px 0 6px">Daftar Pemain</div>
    <div id="tm-pemain-list"></div>
    <button class="pill-btn" type="button" onclick="tambahPemainRow()">+ Tambah Pemain</button>
  `;
  setModal(tm?'Edit Tim':'Tim Baru', body, [
    {label:'Batal', cls:'secondary', onclick:closeModal},
    {label: tm?'Simpan':'Tambah', cls:'', onclick:()=>simpanTim(id)},
  ]);
  const pemain = tm ? tm.pemain : [];
  if(pemain.length===0) tambahPemainRow();
  else pemain.forEach(p=>tambahPemainRow(p));
}

function tambahPemainRow(p){
  p = p || {id:uid(), nama:'', nomor:'', posisi:''};
  const wrap = document.getElementById('tm-pemain-list');
  const div = document.createElement('div');
  div.style.cssText='display:grid;grid-template-columns:1fr 64px 1fr 30px;gap:6px;margin-bottom:6px;align-items:center';
  div.innerHTML = `
    <input placeholder="Nama pemain" value="${esc(p.nama)}">
    <input placeholder="No" value="${esc(p.nomor)}" style="text-align:center">
    <input placeholder="Posisi" value="${esc(p.posisi)}">
    <button class="pill-btn bahaya" type="button" onclick="this.parentNode.remove()">✕</button>`;
  div.dataset.pid = p.id;
  wrap.appendChild(div);
}

function simpanTim(id){
  const t = activeTurnamen();
  const nama = document.getElementById('tm-nama').value.trim();
  if(!nama){ toast('⛔ Nama tim wajib diisi'); return; }
  const grup = t.sistem==='grup' ? document.getElementById('tm-grup').value.trim().toUpperCase() : '';
  const rows = [...document.getElementById('tm-pemain-list').children];
  const pemain = [];
  rows.forEach(r=>{
    const inputs = r.querySelectorAll('input');
    const nm = inputs[0].value.trim();
    if(!nm) return;
    pemain.push({ id: r.dataset.pid || uid(), nama: nm, nomor: inputs[1].value.trim(), posisi: inputs[2].value.trim() });
  });
  if(id){
    const tm = getTim(t,id);
    tm.nama = nama; tm.grup = grup; tm.pemain = pemain;
    toast('✅ Tim diperbarui');
  }else{
    t.tim.push({id:uid(), nama, grup, pemain});
    toast('✅ Tim ditambahkan');
  }
  saveDB(); closeModal(); renderContent();
}

function hapusTim(id){
  const t = activeTurnamen();
  const tm = getTim(t,id);
  if(!tm) return;
  const used = (t.pertandingan||[]).some(p=>p.timA===id || p.timB===id);
  setModal('Hapus Tim', `<p>Yakin hapus tim <b>${esc(tm.nama)}</b>?${used?' Pertandingan yang melibatkan tim ini juga akan dihapus.':''}</p>`, [
    {label:'Batal', cls:'secondary', onclick:closeModal},
    {label:'Hapus', cls:'bahaya', onclick:()=>{
      t.tim = t.tim.filter(x=>x.id!==id);
      t.pertandingan = t.pertandingan.filter(p=>p.timA!==id && p.timB!==id);
      saveDB(); closeModal(); renderContent(); renderTopbarSaldo();
      toast('🗑 Tim dihapus');
    }},
  ]);
}

/* ---------- GENERATE JADWAL ---------- */
function shuffle(arr){
  const a=[...arr];
  for(let i=a.length-1;i>0;i--){ const j=Math.floor(Math.random()*(i+1)); [a[i],a[j]]=[a[j],a[i]]; }
  return a;
}
function generateJadwal(){
  const t = activeTurnamen();
  if(!canEdit()){ toast('⛔ Login untuk mengedit'); return; }
  if((t.tim||[]).length<2){ toast('⛔ Butuh minimal 2 tim'); return; }
  setModal('Generate Jadwal', `<p>Membuat jadwal untuk <b>${esc(t.nama)}</b> dengan sistem <b>${esc(SISTEM[t.sistem].label)}</b>.<br>Jadwal yang sudah ada akan dihapus & dibuat ulang dari daftar tim saat ini.</p>
    <div class="form-row"><label>Tanggal & Jam Pertama</label>
      <div class="row2"><input id="gj-tgl" type="date" value="${t.mulai||todayISO()}"><input id="gj-jam" type="time" value="09:00"></div></div>
    <div class="form-row"><label>Jarak antar pertandingan (menit)</label>
      <input id="gj-jarak" type="number" min="15" value="60"></div>
  `, [
    {label:'Batal', cls:'secondary', onclick:closeModal},
    {label:'Generate', cls:'', onclick:()=>{
      const tgl = document.getElementById('gj-tgl').value || todayISO();
      const jamAwal = document.getElementById('gj-jam').value || '09:00';
      const jarak = Math.max(15, parseInt(document.getElementById('gj-jarak').value)||60);
      const pairs = buildSchedule(t);
      t.pertandingan = scheduleToMatches(t, pairs, tgl, jamAwal, jarak);
      saveDB(); closeModal(); renderContent(); renderTopbarSaldo();
      toast('✅ Jadwal dibuat: '+t.pertandingan.length+' pertandingan');
    }},
  ]);
}

function buildSchedule(t){
  const tim = t.tim.map(x=>x.id);
  if(t.sistem==='knockout'){
    const arr = shuffle(tim);
    const pairs=[]; const n=arr.length;
    for(let i=0;i+1<n;i+=2) pairs.push([arr[i],arr[i+1]]);
    if(n%2===1) pairs.push([arr[n-1], null]);
    return pairs.map((p,i)=>({babak:'Babak 1', grup:null, a:p[0], b:p[1]}));
  }
  if(t.sistem==='grup'){
    const grupMap={};
    t.tim.forEach(x=>{ const g=x.grup||'A'; (grupMap[g]=grupMap[g]||[]).push(x.id); });
    const pairs=[];
    Object.entries(grupMap).forEach(([g, ids])=>{
      roundRobin(ids).forEach((p)=> pairs.push({babak:'Grup '+g, grup:g, a:p[0], b:p[1]}));
    });
    return pairs;
  }
  const rr = roundRobin(tim);
  return rr.map((p,i)=>({babak:'Putaran 1', grup:null, a:p[0], b:p[1]}));
}
function roundRobin(ids){
  if(ids.length<2) return [];
  let arr = ids.slice();
  if(arr.length%2===1) arr.push(null);
  const n=arr.length, half=n/2;
  const fixtures=[];
  for(let r=0;r<n-1;r++){
    for(let i=0;i<half;i++){
      const a=arr[i], b=arr[n-1-i];
      if(a&&b) fixtures.push([a,b]);
    }
    arr.splice(1,0, arr.pop());
  }
  return fixtures;
}
function scheduleToMatches(t, pairs, tgl, jamAwal, jarakMenit){
  const [h,m] = jamAwal.split(':').map(Number);
  let cur = new Date(tgl+'T'+String(h).padStart(2,'0')+':'+String(m).padStart(2,'0')+':00');
  const out=[];
  let lastBabak=null, lap=1;
  pairs.forEach((p)=>{
    if(p.babak!==lastBabak){ lap=1; lastBabak=p.babak; } else lap++;
    const jam = `${String(cur.getHours()).padStart(2,'0')}:${String(cur.getMinutes()).padStart(2,'0')}`;
    out.push({
      id: uid(), babak: p.babak, grup: p.grup, lapangan: lap,
      timA: p.a, timB: p.b, tanggal: tgl, jam,
      set: Array.from({length:t.jumlahSet}, ()=>({a:null,b:null})),
      selesai:false, pemenang:null, catatan:'',
    });
    cur = new Date(cur.getTime()+jarakMenit*60000);
  });
  return out;
}

function emptyTurnamen(){
  return `<div class="empty-state"><h3>Belum ada turnamen aktif</h3>
    <p>Pilih atau buat turnamen dari menu Turnamen.</p>
    ${isAdmin()?`<button class="btn" onclick="openTurnamenModal()">+ Buat Turnamen</button>`:''}</div>`;
}
