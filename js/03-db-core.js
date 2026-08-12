/* ============================================================
   DATA LAYER — manajemen Event Aktif + helper CRUD generik.

   Beda dari pola "satu object db besar" ala aplikasi lain: di sini
   tiap modul (Buku Utama, Tiket/Parkir, Sponsorship, Panitia/Insentif)
   fetch & simpan data-nya SENDIRI langsung ke tabel Supabase masing-
   masing (lewat helper generik di bawah), disimpan di variabel modul
   sendiri. Lebih simpel karena tidak perlu diff/sync satu payload besar
   — cocok untuk skala tim kecil (1 event olahraga aktif dalam satu waktu).
   ============================================================ */

let ACTIVE_EVENT_ID = localStorage.getItem('sk_active_event_id') || null;
let allEvents = [];

function getActiveEvent(){
  return allEvents.find(e => e.id === ACTIVE_EVENT_ID) || null;
}

function setActiveEvent(id){
  ACTIVE_EVENT_ID = id;
  localStorage.setItem('sk_active_event_id', id || '');
}

async function loadEvents(){
  const { data, error } = await sb.from('events').select('*').order('created_at', {ascending:false});
  if(error){ toast('Gagal memuat daftar event: ' + error.message); return []; }
  allEvents = data || [];
  // Kalau belum ada event aktif tersimpan (atau sudah dihapus), pakai
  // event ter-flag is_active, atau event pertama yang ada.
  if(!getActiveEvent()){
    const fallback = allEvents.find(e=>e.is_active) || allEvents[0];
    if(fallback) setActiveEvent(fallback.id);
  }
  return allEvents;
}

async function createEvent(payload){
  const { data, error } = await sb.from('events').insert(payload).select().single();
  if(error){ toast('Gagal membuat event: ' + error.message); return null; }
  allEvents.unshift(data);
  setActiveEvent(data.id);
  return data;
}

async function updateEvent(id, payload){
  const { error } = await sb.from('events').update(payload).eq('id', id);
  if(error){ toast('Gagal memperbarui event: ' + error.message); return false; }
  const idx = allEvents.findIndex(e=>e.id===id);
  if(idx>-1) allEvents[idx] = { ...allEvents[idx], ...payload };
  return true;
}

/* ------------------------------------------------------------
   HELPER CRUD GENERIK — dipakai semua modul supaya tidak menulis
   ulang pola select/insert/update/delete + toast error di tiap file.
   ------------------------------------------------------------ */
async function dbFetchAll(table, eventId){
  let q = sb.from(table).select('*');
  if(eventId !== undefined) q = q.eq('event_id', eventId);
  const { data, error } = await q.order('created_at', {ascending:true});
  if(error){ toast(`Gagal memuat data ${table}: ` + error.message); return []; }
  return data || [];
}

async function dbInsert(table, payload){
  const { data, error } = await sb.from(table).insert(payload).select().single();
  if(error){ toast(`Gagal menyimpan ke ${table}: ` + error.message); return null; }
  return data;
}

async function dbUpsert(table, payload, conflictCols){
  const opts = conflictCols ? { onConflict: conflictCols } : undefined;
  const { data, error } = await sb.from(table).upsert(payload, opts).select().single();
  if(error){ toast(`Gagal menyimpan ke ${table}: ` + error.message); return null; }
  return data;
}

async function dbUpdate(table, id, payload){
  const { data, error } = await sb.from(table).update(payload).eq('id', id).select().single();
  if(error){ toast(`Gagal memperbarui ${table}: ` + error.message); return null; }
  return data;
}

async function dbDelete(table, id){
  const { error } = await sb.from(table).delete().eq('id', id);
  if(error){ toast(`Gagal menghapus dari ${table}: ` + error.message); return false; }
  return true;
}
