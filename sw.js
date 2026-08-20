/* PixelTodo service worker: 离线缓存，改版时把 CACHE 版本号 +1 即可强制刷新 */
'use strict';

var CACHE='pixel-todo-v4';
var ASSETS=[
  './',
  './index.html',
  './style.css?v=4',
  './app.js?v=4',
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

  /* 页面导航：网络优先，离线回退缓存（保证能收到新版本） */
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

  /* 静态资源：缓存优先，未命中走网络并写入缓存 */
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
