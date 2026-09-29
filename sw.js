const CACHE='rabbit-meadow-v5';
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
  html=html.replace('>アクション</button>','></button>');

  const oldBunny="function drawBunny(x,y,col='#f2e8da',dir='down',npc=false){let sx=x-cam.x,sy=y-cam.y;ctx.save();ctx.translate(Math.round(sx),Math.round(sy));ctx.fillStyle='#32452e55';ctx.fillRect(-7,8,14,3);px(-4,-14,3,8,col);px(3,-15,3,9,col);px(-6,-8,12,10,col);px(-7,-6,2,6,col);px(5,-6,2,6,col);px(-6,-1,12,9,col);px(-5,5,10,4,col);if(dir==='down'){px(-3,-5,1,1,'#4b403b');px(3,-5,1,1,'#4b403b')}else if(dir==='left')px(-5,-5,1,1,'#4b403b');else if(dir==='right')px(5,-5,1,1,'#4b403b');ctx.restore();if(!npc)drawBubble(sx,sy)}";

  const restoredBunny="function drawBunny(x,y,col='#f2e8da',dir='down',npc=false){let sx=x-cam.x,sy=y-cam.y;ctx.save();ctx.translate(Math.round(sx),Math.round(sy));ctx.fillStyle='#32452e55';ctx.fillRect(-7,8,14,3);if(npc){px(-4,-14,3,8,col);px(3,-15,3,9,col);px(-6,-8,12,10,col);px(-7,-6,2,6,col);px(5,-6,2,6,col);px(-6,-1,12,9,col);px(-5,5,10,4,col);if(dir==='down'){px(-3,-5,1,1,'#4b403b');px(3,-5,1,1,'#4b403b')}else if(dir==='left')px(-5,-5,1,1,'#4b403b');else if(dir==='right')px(5,-5,1,1,'#4b403b')}else{let fur='#f2e8da',shade='#d8c9b7',pink='#d99ea8',dark='#4a403a';let walking=keys.up||keys.down||keys.left||keys.right;let hop=walking&&(Math.sin(rabbit.walk*10)>0?0:1);ctx.translate(0,-hop);px(-4,-14,3,8,fur);px(-3,-13,1,5,pink);px(3,-15,3,9,fur);px(4,-14,1,6,pink);px(-6,-1,12,9,fur);px(-5,5,10,4,fur);px(-7,1,2,5,shade);px(5,2,2,5,shade);px(-6,-8,12,10,fur);px(-5,-9,10,2,fur);px(-7,-6,2,6,fur);px(5,-6,2,6,fur);let step=walking?(Math.floor(rabbit.walk*8)%2):0;if(step===0){px(-6,8,5,2,shade);px(2,8,5,2,shade)}else{px(-7,8,5,2,shade);px(3,8,5,2,shade)}if(dir==='down'){px(-3,-5,1,1,dark);px(3,-5,1,1,dark);px(0,-2,1,1,pink);px(-1,0,1,1,dark);px(1,0,1,1,dark)}else if(dir==='up'){px(-4,-6,2,1,shade);px(3,-6,2,1,shade)}else if(dir==='left'){px(-5,-5,1,1,dark);px(-6,-2,1,1,pink);px(4,4,2,2,fur)}else{px(5,-5,1,1,dark);px(6,-2,1,1,pink);px(-6,4,2,2,fur)}}ctx.restore();if(!npc)drawBubble(sx,sy)}";

  html=html.replace(oldBunny,restoredBunny);

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