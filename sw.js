const CACHE='rabbit-meadow-v6';
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

  // --- Restore the original player rabbit while keeping NPC rabbits simple ---
  const oldBunny="function drawBunny(x,y,col='#f2e8da',dir='down',npc=false){let sx=x-cam.x,sy=y-cam.y;ctx.save();ctx.translate(Math.round(sx),Math.round(sy));ctx.fillStyle='#32452e55';ctx.fillRect(-7,8,14,3);px(-4,-14,3,8,col);px(3,-15,3,9,col);px(-6,-8,12,10,col);px(-7,-6,2,6,col);px(5,-6,2,6,col);px(-6,-1,12,9,col);px(-5,5,10,4,col);if(dir==='down'){px(-3,-5,1,1,'#4b403b');px(3,-5,1,1,'#4b403b')}else if(dir==='left')px(-5,-5,1,1,'#4b403b');else if(dir==='right')px(5,-5,1,1,'#4b403b');ctx.restore();if(!npc)drawBubble(sx,sy)}";

  const restoredBunny="function drawBunny(x,y,col='#f2e8da',dir='down',npc=false){let sx=x-cam.x,sy=y-cam.y;ctx.save();ctx.translate(Math.round(sx),Math.round(sy));ctx.fillStyle='#32452e55';ctx.fillRect(-7,8,14,3);if(npc){px(-4,-14,3,8,col);px(3,-15,3,9,col);px(-6,-8,12,10,col);px(-7,-6,2,6,col);px(5,-6,2,6,col);px(-6,-1,12,9,col);px(-5,5,10,4,col);if(dir==='down'){px(-3,-5,1,1,'#4b403b');px(3,-5,1,1,'#4b403b')}else if(dir==='left')px(-5,-5,1,1,'#4b403b');else if(dir==='right')px(5,-5,1,1,'#4b403b')}else{let fur='#f2e8da',shade='#d8c9b7',pink='#d99ea8',dark='#4a403a';let walking=keys.up||keys.down||keys.left||keys.right;let hop=walking&&(Math.sin(rabbit.walk*10)>0?0:1);ctx.translate(0,-hop);px(-4,-14,3,8,fur);px(-3,-13,1,5,pink);px(3,-15,3,9,fur);px(4,-14,1,6,pink);px(-6,-1,12,9,fur);px(-5,5,10,4,fur);px(-7,1,2,5,shade);px(5,2,2,5,shade);px(-6,-8,12,10,fur);px(-5,-9,10,2,fur);px(-7,-6,2,6,fur);px(5,-6,2,6,fur);let step=walking?(Math.floor(rabbit.walk*8)%2):0;if(step===0){px(-6,8,5,2,shade);px(2,8,5,2,shade)}else{px(-7,8,5,2,shade);px(3,8,5,2,shade)}if(dir==='down'){px(-3,-5,1,1,dark);px(3,-5,1,1,dark);px(0,-2,1,1,pink);px(-1,0,1,1,dark);px(1,0,1,1,dark)}else if(dir==='up'){px(-4,-6,2,1,shade);px(3,-6,2,1,shade)}else if(dir==='left'){px(-5,-5,1,1,dark);px(-6,-2,1,1,pink);px(4,4,2,2,fur)}else{px(5,-5,1,1,dark);px(6,-2,1,1,pink);px(-6,4,2,2,fur)}}ctx.restore();if(!npc)drawBubble(sx,sy)}";
  html=html.replace(oldBunny,restoredBunny);

  // --- Audio: maximum two simultaneous tracks (1 BGM + 1 SFX) ---
  html=html.replace(
    "let muted=false,audio=null,lastStep=0,bgmTimer=null,raining=false,weatherT=18+Math.random()*22,randomTalkT=8+Math.random()*10,itemSpawnT=10+Math.random()*12;",
    "let muted=false,audio=null,lastStep=0,bgmTimer=null,bgmOsc=null,sfxOsc=null,raining=false,weatherT=18+Math.random()*22,randomTalkT=8+Math.random()*10,itemSpawnT=10+Math.random()*12;"
  );

  const oldAudio="function ensureAudio(){if(!audio){audio=new(window.AudioContext||window.webkitAudioContext)();startBgm()}if(audio.state==='suspended')audio.resume()}function beep(f=440,d=.05,type='square',v=.03){if(muted)return;ensureAudio();let o=audio.createOscillator(),g=audio.createGain();o.type=type;o.frequency.value=f;g.gain.setValueAtTime(v,audio.currentTime);g.gain.exponentialRampToValueAtTime(.0001,audio.currentTime+d);o.connect(g).connect(audio.destination);o.start();o.stop(audio.currentTime+d)}function startBgm(){let i=0,n=[523,659,784,659,587,698,880,698,523,659,698,587];bgmTimer=setInterval(()=>{if(audio&&!muted)beep(n[i++%n.length],.08,'square',.01)},330)}";
  const newAudio="function ensureAudio(){if(!audio){audio=new(window.AudioContext||window.webkitAudioContext)();startBgm()}if(audio.state==='suspended')audio.resume()}function stopOsc(o){try{o&&o.stop()}catch(e){}}function beep(f=440,d=.05,type='square',v=.03){if(muted)return;ensureAudio();stopOsc(sfxOsc);let o=audio.createOscillator(),g=audio.createGain();sfxOsc=o;o.type=type;o.frequency.value=f;g.gain.setValueAtTime(v,audio.currentTime);g.gain.exponentialRampToValueAtTime(.0001,audio.currentTime+d);o.connect(g).connect(audio.destination);o.start();o.stop(audio.currentTime+d);o.onended=()=>{if(sfxOsc===o)sfxOsc=null}}function bgmNote(f,d=.08){if(muted||!audio)return;stopOsc(bgmOsc);let o=audio.createOscillator(),g=audio.createGain();bgmOsc=o;o.type='square';o.frequency.value=f;g.gain.setValueAtTime(.01,audio.currentTime);g.gain.exponentialRampToValueAtTime(.0001,audio.currentTime+d);o.connect(g).connect(audio.destination);o.start();o.stop(audio.currentTime+d);o.onended=()=>{if(bgmOsc===o)bgmOsc=null}}function startBgm(){let i=0,n=[523,659,784,659,587,698,880,698,523,659,698,587];bgmTimer=setInterval(()=>{if(audio&&!muted)bgmNote(n[i++%n.length],.08)},330)}";
  html=html.replace(oldAudio,newAudio);

  // --- Extra water spots on the east side ---
  html=html.replace(
    "const river={x:770,w:74},bridge={y:405,h:54},house={x:250,y:160,w:136,h:96,doorX:318,doorY:238},farm={x:1010,y:610,w:250,h:170};",
    "const river={x:770,w:74},bridge={y:405,h:54},house={x:250,y:160,w:136,h:96,doorX:318,doorY:238},farm={x:1010,y:610,w:250,h:170},waterSpots=[{x:1045,y:340,r:43,type:'pond'},{x:1310,y:250,r:24,type:'well'}];"
  );

  html=html.replace(
    "function nearWater(){let dx=Math.min(Math.abs(rabbit.x-river.x),Math.abs(rabbit.x-(river.x+river.w)));return dx<25&&!onBridge(rabbit.x,rabbit.y)}",
    "function nearWater(){let dx=Math.min(Math.abs(rabbit.x-river.x),Math.abs(rabbit.x-(river.x+river.w)));if(dx<25&&!onBridge(rabbit.x,rabbit.y))return true;for(const w of waterSpots){let d=Math.hypot(rabbit.x-w.x,rabbit.y-w.y);if(d<w.r+22)return true}return false}"
  );

  // --- Richer east-side map: pond, well, path, grove, flowers, bench and stones ---
  const eastDecor="function drawEastDecor(){let pathY=455-cam.y;ctx.fillStyle='#c9b781';ctx.fillRect(845-cam.x,pathY,570,30);for(let i=0;i<18;i++){px(860-cam.x+i*31,pathY+8+(i%3)*5,9,3,'#b6a472')}let p=waterSpots[0],px0=p.x-cam.x,py0=p.y-cam.y;ctx.fillStyle='#3f8fba';ctx.beginPath();ctx.ellipse(px0,py0,50,35,0,0,Math.PI*2);ctx.fill();ctx.fillStyle='#78c3df';ctx.beginPath();ctx.ellipse(px0-8,py0-5,29,13,0,0,Math.PI*2);ctx.fill();for(let i=0;i<8;i++){px(px0-48+i*13,py0+27-(i%2)*4,3,7,'#4c8945')}let w=waterSpots[1],wx=w.x-cam.x,wy=w.y-cam.y;px(wx-17,wy-10,34,20,'#9a9b91');px(wx-14,wy-7,28,14,'#4f8ead');px(wx-20,wy-14,40,5,'#c2bda9');px(wx-15,wy-26,4,15,'#77563d');px(wx+11,wy-26,4,15,'#77563d');px(wx-15,wy-29,30,4,'#8c6547');let benchX=910-cam.x,benchY=525-cam.y;px(benchX,benchY,42,5,'#9b6841');px(benchX+4,benchY+8,34,4,'#865a3a');px(benchX+5,benchY+12,4,10,'#684832');px(benchX+33,benchY+12,4,10,'#684832');const grove=[{x:905,y:210},{x:955,y:245},{x:1120,y:190},{x:1190,y:265},{x:1360,y:360},{x:1280,y:395}];for(const t of grove)tree(t);const eastRocks=[{x:900,y:365},{x:1180,y:410},{x:1360,y:560},{x:1270,y:160}];for(const r of eastRocks)rock(r);const flowers=[[880,500],[935,565],[1000,520],[1080,500],[1150,540],[1230,515],[1340,500],[980,285],[1160,300],[1370,300]];for(const f of flowers){let x=f[0]-cam.x,y=f[1]-cam.y;px(x,y,1,4,'#4e8744');px(x-2,y-2,5,3,'#f2d4e0');px(x,y-3,1,1,'#ffe995')}}";
  html=html.replace('function tree(t){',eastDecor+'function tree(t){');
  html=html.replace('drawRiver();drawFarm()','drawRiver();drawFarm();drawEastDecor()');

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