/* ============================================================
   KLASMEN — dihitung otomatis dari pertandingan yang selesai
   ============================================================ */
function hitungKlasemen(t){
  const timMap={};
  (t.tim||[]).forEach(tm=>{ timMap[tm.id]={timId:tm.id, timNama:tm.nama, grup:tm.grup||'', main:0, menang:0, kalah:0, seri:0, setMenang:0, setKalah:0, poin:0, skor:0}; });

  (t.pertandingan||[]).forEach(p=>{
    if(!p.selesai) return;
    const a=timMap[p.timA], b=timMap[p.timB];
    if(!a || !b) return;
    a.main++; b.main++;

    p.set.forEach(s=>{
      const x = s.a==null?0:s.a;
      const y = s.b==null?0:s.b;
      a.skor += x; b.skor += y;
      if(s.a==null || s.b==null) return;
      if(x>y){ a.setMenang++; b.setKalah++; }
      else if(y>x){ b.setMenang++; a.setKalah++; }
    });

    if(p.pemenang===null){
      a.seri++; b.seri++; a.poin += t.poinKalah; b.poin += t.poinKalah;
    }else if(p.pemenang===p.timA){
      a.menang++; b.kalah++; a.poin += t.poinMenang; b.poin += t.poinKalah;
    }else if(p.pemenang===p.timB){
      b.menang++; a.kalah++; b.poin += t.poinMenang; a.poin += t.poinKalah;
    }
  });

  const arr = Object.values(timMap);
  arr.forEach(r=>{ r.setDiff = r.setMenang - r.setKalah; });
  arr.sort((x,y)=> y.poin-x.poin || y.menang-x.menang || y.setDiff-x.setDiff || y.skor-x.skor);
  return arr;
}

function renderKlasemen(){
  const t = activeTurnamen();
  if(!t) return emptyTurnamen();
  const klas = hitungKlasemen(t);

  const grupMode = t.sistem==='grup';
  const grupList = grupMode ? Array.from(new Set((t.tim||[]).map(x=>x.grup).filter(Boolean))).sort() : [];

  const tabelKlasemen = (rows, withRank)=>`
    <div class="table-wrap">
      <table>
        <thead><tr>
          ${withRank?'<th>#</th>':''}
          <th>Tim</th>
          <th class="center">M</th><th class="center">Mng</th><th class="center">Klh</th>
          <th class="center">Set</th><th class="center">Poin</th><th class="center">Skor</th>
        </tr></thead>
        <tbody>
          ${rows.length?rows.map((r,i)=>`
            <tr>
              ${withRank?`<td class="center"><b>${i+1}</b></td>`:''}
              <td><div class="flex" style="gap:8px"><div class="avatar" style="width:26px;height:26px;font-size:11px">${esc(inisial(r.timNama))}</div>${esc(r.timNama)}</div></td>
              <td class="center">${r.main}</td>
              <td class="center win">${r.menang}</td>
              <td class="center lose">${r.kalah}</td>
              <td class="center">${r.setMenang}-${r.setKalah}</td>
              <td class="center"><b>${r.poin}</b></td>
              <td class="center">${r.skor}</td>
            </tr>`).join(''):`<tr><td colspan="${withRank?7:6}" class="muted">Belum ada pertandingan selesai</td></tr>`}
        </tbody>
      </table>
    </div>`;

  let html = `<div class="toolbar"><h3 style="margin:0;font-size:18px">Klasemen</h3>
    <div class="spacer"></div>
    <button class="btn" onclick="exportKlasemen()">⬇️ CSV</button></div>`;

  if(grupMode && grupList.length){
    html += grupList.map(g=>{
      const rows = klas.filter(r=>r.grup===g);
      return `<div class="section-title">Grup ${esc(g)}</div>${tabelKlasemen(rows,true)}`;
    }).join('');
    html += `<div class="section-title">Ranking Keseluruhan</div>${tabelKlasemen(klas,true)}`;
  }else{
    html += tabelKlasemen(klas,true);
  }

  if((t.sistem==='knockout' || t.sistem==='grup') && (t.pertandingan||[]).some(p=>/babak|final|semifinal|perempat/i.test(p.babak||''))){
    html += `<div class="section-title">Bracket</div>${renderBracket(t)}`;
  }

  return html;
}

function renderBracket(t){
  const order = [];
  (t.pertandingan||[]).forEach(p=>{ if(!order.includes(p.babak)) order.push(p.babak); });
  const cols = order.map(k=>(t.pertandingan||[]).filter(p=>p.babak===k));
  return `<div class="bracket">${cols.map(matches=>`
    <div class="bracket-col">
      <div class="muted small" style="text-align:center">${esc(matches[0].babak)}</div>
      ${matches.map(p=>`
        <div class="panel" style="padding:9px 11px">
          <div class="flex-between" style="font-size:13px">
            <span class="${p.pemenang===p.timA?'win':''}">${esc(timNama(t,p.timA))}</span>
            <b>${p.set.filter(s=>s.a!=null).reduce((a,s)=>a+(s.a>s.b?1:0),0)}</b>
          </div>
          <div class="flex-between" style="font-size:13px">
            <span class="${p.pemenang===p.timB?'win':''}">${esc(timNama(t,p.timB))}</span>
            <b>${p.set.filter(s=>s.b!=null).reduce((a,s)=>a+(s.b>s.a?1:0),0)}</b>
          </div>
        </div>`).join('')}
    </div>`).join('')}</div>`;
}

function exportKlasemen(){
  const t = activeTurnamen();
  const klas = hitungKlasemen(t);
  const rows = [['Peringkat','Tim','Main','Menang','Kalah','Set Menang','Set Kalah','Poin','Skor']];
  klas.forEach((r,i)=>rows.push([i+1, r.timNama, r.main, r.menang, r.kalah, r.setMenang, r.setKalah, r.poin, r.skor]));
  const csv = rows.map(r=>r.map(c=>`"${String(c).replace(/"/g,'""')}"`).join(',')).join('\n');
  downloadFile(`klasemen_${t.nama.replace(/\s+/g,'_')}.csv`, csv, 'text/csv');
  toast('✅ Diekspor ke CSV');
}

/* ============================================================
   STATISTIK PEMAIN — ringkasan roster & performa tim
   ============================================================ */
function renderStatistik(){
  const t = activeTurnamen();
  if(!t) return emptyTurnamen();
  const tim = t.tim||[];
  const totalPemain = tim.reduce((a,tm)=>a+(tm.pemain||[]).length,0);
  const posisiCount = {};
  tim.forEach(tm=>(tm.pemain||[]).forEach(p=>{ const k=p.posisi||'–'; posisiCount[k]=(posisiCount[k]||0)+1; }));
  const klas = hitungKlasemen(t);
  const topSkor = [...klas].sort((a,b)=>b.skor-a.skor).slice(0,5);

  const posisiRows = Object.entries(posisiCount).sort((a,b)=>b[1]-a[1])
    .map(([k,v])=>`<div class="flex-between" style="padding:7px 0;border-bottom:1px solid var(--line)"><span>${esc(k)}</span><b class="mono">${v}</b></div>`).join('');

  return `
    <div class="toolbar"><h3 style="margin:0;font-size:18px">Statistik Pemain</h3></div>
    <div class="grid cols-4">
      <div class="stat"><div class="k">Total Tim</div><div class="v">${tim.length}</div></div>
      <div class="stat"><div class="k">Total Pemain</div><div class="v sand">${totalPemain}</div></div>
      <div class="stat"><div class="k">Rata²/ Tim</div><div class="v">${tim.length?Math.round(totalPemain/tim.length):0}</div></div>
      <div class="stat"><div class="k">Pertandingan</div><div class="v">${(t.pertandingan||[]).length}</div></div>
    </div>
    <div class="grid cols-2" style="margin-top:16px">
      <div class="panel">
        <h3>Tim dengan Skor Terbanyak</h3>
        <p class="panel-sub">Total angka/point yang dikumpulkan (kumulatif seluruh set)</p>
        ${topSkor.map((r,i)=>`
          <div class="flex-between" style="padding:8px 0;border-bottom:1px solid var(--line)">
            <div class="flex" style="gap:9px"><span class="muted mono" style="width:18px">${i+1}</span>
              <div class="avatar" style="width:26px;height:26px;font-size:11px">${esc(inisial(r.timNama))}</div>
              <b>${esc(r.timNama)}</b></div>
            <b class="mono" style="color:var(--teal-700)">${r.skor}</b>
          </div>`).join('')}
      </div>
      <div class="panel">
        <h3>Distribusi Posisi</h3>
        <p class="panel-sub">Jumlah pemain per posisi</p>
        ${posisiRows || '<p class="muted small">Belum ada data posisi</p>'}
      </div>
    </div>
    <div class="section-title">Daftar Pemain per Tim</div>
    ${tim.map(tm=>`
      <div class="panel" style="margin-bottom:12px">
        <div class="flex-between"><h3 style="margin:0">${esc(tm.nama)}</h3><span class="tag">${(tm.pemain||[]).length} pemain</span></div>
        ${(tm.pemain||[]).length ? `
          <div class="table-wrap" style="margin-top:10px;border:none">
            <table><tbody>
              ${(tm.pemain||[]).map(p=>`<tr><td style="width:40px" class="mono">${esc(p.nomor||'#')}</td><td>${esc(p.nama)}</td><td class="muted">${esc(p.posisi||'—')}</td></tr>`).join('')}
            </tbody></table>
          </div>` : `<p class="muted small" style="margin-top:8px">Belum ada pemain</p>`}
      </div>`).join('')}
  `;
}
