/* ============================================================
   SERVICE WORKER — cache app shell agar bisa dibuka offline.
   ============================================================ */
const CACHE = 'baleasri-v1';
const SHELL = [
  '.',
  'index.html',
  'style.css',
  'manifest.json',
  'js/00-config.js',
  'js/01-auth.js',
  'js/02-navigation.js',
  'js/03-dashboard.js',
  'js/04-turnamen.js',
  'js/05-tim.js',
  'js/06-pertandingan.js',
  'js/07-klasemen.js',
  'js/08-pengaturan.js',
  'js/09-init.js',
  'icons/icon-192.png',
  'icons/icon-512.png',
];

self.addEventListener('install', e=>{
  e.waitUntil(caches.open(CACHE).then(c=>c.addAll(SHELL).catch(()=>{})).then(()=>self.skipWaiting()));
});
self.addEventListener('activate', e=>{
  e.waitUntil(caches.keys().then(keys=>Promise.all(keys.filter(k=>k!==CACHE).map(k=>caches.delete(k)))).then(()=>self.clients.claim()));
});
self.addEventListener('fetch', e=>{
  const req=e.request;
  if(req.method!=='GET') return;
  const url=new URL(req.url);
  if(url.origin!==location.origin){
    e.respondWith(fetch(req).catch(()=>caches.match(url.pathname).then(r=>r||Response.error())));
    return;
  }
  if(req.mode==='navigate'){
    e.respondWith(fetch(req).catch(()=>caches.match('index.html')));
    return;
  }
  e.respondWith(
    caches.match(req).then(r=>{
      const net=fetch(req).then(res=>{
        if(res && res.status===200) caches.open(CACHE).then(c=>c.put(req, res.clone()));
        return res;
      }).catch(()=>r);
      return r || net;
    })
  );
});
