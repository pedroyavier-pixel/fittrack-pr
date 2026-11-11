import { readdir, readFile, writeFile } from "node:fs/promises";
import { createHash } from "node:crypto";
const files = (await readdir("dist/assets")).map((f) => "assets/" + f);
const version = createHash("sha256")
  .update(files.join())
  .digest("hex")
  .slice(0, 12);
const sw = `const CACHE='fittrack-${version}';const BASE=new URL('./',self.location).href;const FILES=${JSON.stringify(["", "index.html", "manifest.webmanifest", "icon-192.png", "icon-512.png", ...files])}.map(f=>new URL(f,BASE).href);
self.addEventListener('install',e=>e.waitUntil(caches.open(CACHE).then(c=>c.addAll(FILES)).then(()=>self.skipWaiting())));
self.addEventListener('activate',e=>e.waitUntil(caches.keys().then(keys=>Promise.all(keys.filter(k=>k.startsWith('fittrack-')&&k!==CACHE).map(k=>caches.delete(k)))).then(()=>self.clients.claim())));
self.addEventListener('fetch',e=>{const u=new URL(e.request.url);if(e.request.method!=='GET'||u.origin!==self.location.origin||!u.href.startsWith(BASE))return;if(e.request.mode==='navigate'){e.respondWith(fetch(e.request).then(r=>{if(r.ok){const c=r.clone();caches.open(CACHE).then(cache=>cache.put(new URL('index.html',BASE).href,c));}return r;}).catch(()=>caches.match(new URL('index.html',BASE).href)));return;}if(FILES.includes(u.href))e.respondWith(caches.match(e.request).then(c=>c||fetch(e.request)));});`;
const push = `
self.addEventListener('push',e=>{e.waitUntil((async()=>{
 const hour=Number(new Intl.DateTimeFormat('en-US',{timeZone:'America/Puerto_Rico',hour:'2-digit',hourCycle:'h23'}).format(new Date()));
 const late=hour===20;
 await self.registration.showNotification(late?'Aún estás a tiempo':'Tu entrenamiento de hoy',{
 body:late?'Un día a la vez, a tu ritmo.':'Tu entrenamiento está disponible. Haz lo que puedas hoy.',
 icon:new URL('icon-192.png',BASE).href,badge:new URL('icon-192.png',BASE).href,
 tag:'fittrack-workout-reminder',renotify:true
 });
})());});
self.addEventListener('notificationclick',e=>{e.notification.close();e.waitUntil((async()=>{
 const windows=await self.clients.matchAll({type:'window',includeUncontrolled:true});
 const found=windows.find(w=>w.url.startsWith(BASE));
 if(found)return found.focus();return self.clients.openWindow(BASE);
})());});`;
await writeFile("dist/sw.js", sw + push);
