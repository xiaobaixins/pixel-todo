/* PixelTodo service worker: offline cache, cache-busting via version bump */
'use strict';

var CACHE='pixel-todo-v1';
var ASSETS=[
  './',
  './index.html',
  './style.css',
  './app.js',
  './manifest.webmanifest',
  './icons/icon-192.png',
  './icons/icon-512.png',
  './icons/icon-maskable-512.png',
  './icons/apple-touch-icon.png',
  './fonts/zpix.woff2'
];

self.addEventListener('install',function(e){
  e.waitUntil(
    caches.open(CACHE).then(function(c){return c.addAll(ASSETS);})
    .then(function(){return self.skipWaiting();})
  );
});

self.addEventListener('activate',function(e){
  e.waitUntil(
    caches.keys().then(function(keys){
      return Promise.all(keys.filter(function(k){return k!==CACHE;}).map(function(k){return caches.delete(k);}));
    }).then(function(){return self.clients.claim();})
  );
});

self.addEventListener('fetch',function(e){
  var req=e.request;
  if(req.method!=='GET')return;
  var url=new URL(req.url);
  if(url.origin!==location.origin)return;

  /* navigation: network first, cache fallback (so updates propagate) */
  if(req.mode==='navigate'){
    e.respondWith(
      fetch(req).then(function(res){
        var cp=res.clone();
        caches.open(CACHE).then(function(c){c.put('./index.html',cp);});
        return res;
      }).catch(function(){return caches.match('./index.html');})
    );
    return;
  }

  /* assets: cache first, network fallback + refresh */
  e.respondWith(
    caches.match(req).then(function(hit){
      return hit||fetch(req).then(function(res){
        if(res.ok){
          var cp=res.clone();
          caches.open(CACHE).then(function(c){c.put(req,cp);});
        }
        return res;
      });
    })
  );
});
