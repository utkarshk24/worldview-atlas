// Offline cache: app shell and data are cached on first visit; live APIs always go to the network.
const V="worldview-v2";
const SHELL=["./","index.html","icon.svg","manifest.webmanifest","data/countries.json","data/curated.json","data/leaders.json","data/geo-india.json","data/geo-global.json"];
self.addEventListener("install",e=>{e.waitUntil(caches.open(V).then(c=>c.addAll(SHELL)).then(()=>self.skipWaiting()))});
self.addEventListener("activate",e=>{e.waitUntil(caches.keys().then(ks=>Promise.all(ks.filter(k=>k!==V).map(k=>caches.delete(k)))).then(()=>self.clients.claim()))});
self.addEventListener("fetch",e=>{const u=new URL(e.request.url);if(e.request.method!=="GET")return;
  const sameOrigin=u.origin===location.origin, cdn=/cdnjs|jsdelivr|fonts\.(googleapis|gstatic)/.test(u.host);
  if(!sameOrigin&&!cdn)return; // live APIs: network only
  e.respondWith(caches.open(V).then(async c=>{const hit=await c.match(e.request);const net=fetch(e.request).then(r=>{if(r.ok)c.put(e.request,r.clone());return r}).catch(()=>hit);return hit||net}))});
