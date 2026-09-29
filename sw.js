const CACHE='rabbit-meadow-v4';
const ASSETS=['./','./index.html','./manifest.webmanifest','./icon.svg'];

self.addEventListener('install',event=>{
  self.skipWaiting();
  event.waitUntil(caches.open(CACHE).then(cache=>cache.addAll(ASSETS)));
});

self.addEventListener('activate',event=>{
  event.waitUntil(Promise.all([
    caches.keys().then(keys=>Promise.all(keys.filter(key=>key!==CACHE).map(key=>caches.delete(key)))),
    self.clients.claim()
  ]));
});

async function patchedIndex(request){
  let response;
  try{
    response=await fetch(request,{cache:'no-store'});
  }catch(e){
    response=await caches.match('./index.html');
  }
  if(!response)return response;
  let html=await response.text();
  const patch=`<style id="control-position-patch">
    #pad{left:max(84px,calc(env(safe-area-inset-left) + 84px))!important;}
    #act{right:max(90px,calc(env(safe-area-inset-right) + 90px))!important;font-size:0!important;}
  </style>`;
  html=html.replace('</head>',patch+'</head>');
  return new Response(html,{status:200,headers:{'Content-Type':'text/html; charset=utf-8','Cache-Control':'no-cache'}});
}

self.addEventListener('fetch',event=>{
  const url=new URL(event.request.url);
  if(event.request.mode==='navigate'||url.pathname.endsWith('/rabbit-meadow/')||url.pathname.endsWith('/rabbit-meadow/index.html')){
    event.respondWith(patchedIndex(event.request));
    return;
  }
  event.respondWith(caches.match(event.request).then(cached=>cached||fetch(event.request)));
});