const CACHE='rabbit-meadow-v9';
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
  try{response=await fetch(request,{cache:'no-store'});}catch(e){response=await caches.match('./index.html');}
  if(!response)return response;
  let html=await response.text();

  const patch=`<style id="control-position-patch">
    #pad{left:max(84px,calc(env(safe-area-inset-left) + 84px))!important;}
    #act{right:max(90px,calc(env(safe-area-inset-right) + 90px))!important;font-size:0!important;}
  </style>`;
  html=html.replace('</head>',patch+'</head>');
  html=html.replace('>アクション</button>','></button>');

  const initialBunny="function drawBunny(x,y,col='#f2e8da',dir='down',npc=false){let sx=x-cam.x,sy=y-cam.y;if(npc){ctx.save();ctx.translate(Math.round(sx),Math.round(sy));ctx.fillStyle='#32452e55';ctx.fillRect(-7,8,14,3);px(-4,-14,3,8,col);px(3,-15,3,9,col);px(-6,-8,12,10,col);px(-7,-6,2,6,col);px(5,-6,2,6,col);px(-6,-1,12,9,col);px(-5,5,10,4,col);if(dir==='down'){px(-3,-5,1,1,'#4b403b');px(3,-5,1,1,'#4b403b')}else if(dir==='left')px(-5,-5,1,1,'#4b403b');else if(dir==='right')px(5,-5,1,1,'#4b403b');ctx.restore();return}let moving=keys.up||keys.down||keys.left||keys.right,hop=moving&&Math.sin(rabbit.walk*11)>0?0:1;ctx.save();ctx.translate(Math.round(sx),Math.round(sy-hop));ctx.fillStyle='#32452e55';ctx.fillRect(-7,8,14,3);let fur='#f2e8da',sh='#d9cbbb',pk='#db9da9',dk='#4b403b';px(-4,-14,3,8,fur);px(-3,-13,1,5,pk);px(3,-15,3,9,fur);px(4,-14,1,6,pk);px(-6,-8,12,10,fur);px(-7,-6,2,6,fur);px(5,-6,2,6,fur);px(-6,-1,12,9,fur);px(-5,5,10,4,fur);px(-6,8,5,2,sh);px(2,8,5,2,sh);if(dir==='down'){px(-3,-5,1,1,dk);px(3,-5,1,1,dk);px(0,-2,1,1,pk)}else if(dir==='left'){px(-5,-5,1,1,dk);px(4,4,2,2,fur)}else if(dir==='right'){px(5,-5,1,1,dk);px(-6,4,2,2,fur)}ctx.restore();drawBubble(sx,sy)}";
  html=html.replace(/function drawBunny\(x,y,col='#f2e8da',dir='down',npc=false\)\{[\s\S]*?(?=function bubble)/,initialBunny);

  html=html.replace("let muted=false,audio=null,lastStep=0,bgmTimer=null,raining=false,weatherT=18+Math.random()*22,randomTalkT=8+Math.random()*10,itemSpawnT=10+Math.random()*12;","let muted=false,audio=null,lastStep=0,bgmTimer=null,bgmOsc=null,sfxOsc=null,raining=false,weatherT=999999,randomTalkT=8+Math.random()*10,itemSpawnT=10+Math.random()*12;");
  const oldAudio="function ensureAudio(){if(!audio){audio=new(window.AudioContext||window.webkitAudioContext)();startBgm()}if(audio.state==='suspended')audio.resume()}function beep(f=440,d=.05,type='square',v=.03){if(muted)return;ensureAudio();let o=audio.createOscillator(),g=audio.createGain();o.type=type;o.frequency.value=f;g.gain.setValueAtTime(v,audio.currentTime);g.gain.exponentialRampToValueAtTime(.0001,audio.currentTime+d);o.connect(g).connect(audio.destination);o.start();o.stop(audio.currentTime+d)}function startBgm(){let i=0,n=[523,659,784,659,587,698,880,698,523,659,698,587];bgmTimer=setInterval(()=>{if(audio&&!muted)beep(n[i++%n.length],.08,'square',.01)},330)}";
  const newAudio="function ensureAudio(){if(!audio){audio=new(window.AudioContext||window.webkitAudioContext)();startBgm()}if(audio.state==='suspended')audio.resume()}function stopOsc(o){try{o&&o.stop()}catch(e){}}function beep(f=440,d=.05,type='square',v=.03){if(muted)return;ensureAudio();stopOsc(sfxOsc);let o=audio.createOscillator(),g=audio.createGain();sfxOsc=o;o.type=type;o.frequency.value=f;g.gain.setValueAtTime(v,audio.currentTime);g.gain.exponentialRampToValueAtTime(.0001,audio.currentTime+d);o.connect(g).connect(audio.destination);o.start();o.stop(audio.currentTime+d);o.onended=()=>{if(sfxOsc===o)sfxOsc=null}}function bgmNote(f,d=.08){if(muted||!audio)return;stopOsc(bgmOsc);let o=audio.createOscillator(),g=audio.createGain();bgmOsc=o;o.type='square';o.frequency.value=f;g.gain.setValueAtTime(.01,audio.currentTime);g.gain.exponentialRampToValueAtTime(.0001,audio.currentTime+d);o.connect(g).connect(audio.destination);o.start();o.stop(audio.currentTime+d);o.onended=()=>{if(bgmOsc===o)bgmOsc=null}}function startBgm(){let i=0,n=[523,659,784,659,587,698,880,698,523,659,698,587];bgmTimer=setInterval(()=>{if(audio&&!muted)bgmNote(n[i++%n.length],.08)},330)}";
  html=html.replace(oldAudio,newAudio);

  html=html.replace("const river={x:770,w:74},bridge={y:405,h:54},house={x:250,y:160,w:136,h:96,doorX:318,doorY:238},farm={x:1010,y:610,w:250,h:170};","const river={x:770,w:74},bridge={y:405,h:54},house={x:250,y:160,w:136,h:96,doorX:318,doorY:238},farm={x:1010,y:610,w:250,h:170},waterSpots=[{x:1045,y:340,r:43,type:'pond'},{x:1310,y:250,r:24,type:'well'},{x:930,y:560,r:24,type:'well'},{x:1370,y:690,r:24,type:'well'},{x:1160,y:120,r:24,type:'well'}],farmCarrots=[{x:1050,y:650,e:0},{x:1120,y:650,e:0},{x:1190,y:650,e:0},{x:1085,y:715,e:0},{x:1160,y:715,e:0},{x:1230,y:715,e:0}];");
  html=html.replace("function nearWater(){let dx=Math.min(Math.abs(rabbit.x-river.x),Math.abs(rabbit.x-(river.x+river.w)));return dx<25&&!onBridge(rabbit.x,rabbit.y)}","function nearWater(){let dx=Math.min(Math.abs(rabbit.x-river.x),Math.abs(rabbit.x-(river.x+river.w)));if(dx<25&&!onBridge(rabbit.x,rabbit.y))return true;for(const w of waterSpots){if(Math.hypot(rabbit.x-w.x,rabbit.y-w.y)<w.r+22)return true}return false}");
  html=html.replace("function nearestItem(){let b=null,d=999;for(const i of items){let q=Math.hypot(rabbit.x-i.x,rabbit.y-i.y);if(q<d){d=q;b=i}}return{i:b,d}}","function nearestItem(){let b=null,d=999;for(const i of items){let q=Math.hypot(rabbit.x-i.x,rabbit.y-i.y);if(q<d){d=q;b=i}}return{i:b,d}}function nearestFarmCarrot(){let b=null,d=999;for(const f of farmCarrots)if(!f.e){let q=Math.hypot(rabbit.x-f.x,rabbit.y-f.y);if(q<d){d=q;b=f}}return{f:b,d}}");
  html=html.replace("function interact(){let it=nearestItem();if(it.i&&it.d<28){say('ひろった！ '+it.i.icon,2.2);items.splice(items.indexOf(it.i),1);beep(988,.06,'square',.045);return}let n=nearestFood();","function interact(){let it=nearestItem();if(it.i&&it.d<28){say('ひろった！ '+it.i.icon,2.2);items.splice(items.indexOf(it.i),1);beep(988,.06,'square',.045);return}let fc=nearestFarmCarrot();if(fc.f&&fc.d<30){fc.f.e=1;rabbit.hunger=Math.min(100,rabbit.hunger+34);say('畑のにんじん！ 🥕',2.2);beep(900,.07,'square',.045);return}let n=nearestFood();");

  const oldFarm="function drawFarm(){let x=farm.x-cam.x,y=farm.y-cam.y;ctx.fillStyle='#8b603e';ctx.fillRect(x,y,farm.w,farm.h);for(let yy=12;yy<farm.h-8;yy+=24){ctx.fillStyle='#6f472d';ctx.fillRect(x+10,y+yy,farm.w-20,10);for(let xx=22;xx<farm.w-20;xx+=30){px(x+xx,y+yy-3,2,5,'#3e813e');px(x+xx-2,y+yy-1,6,3,'#58a34f');px(x+xx,y+yy+5,3,4,'#d66c35')}}ctx.strokeStyle='#d8b071';ctx.lineWidth=4;ctx.strokeRect(x-3,y-3,farm.w+6,farm.h+6)}";
  const newFarm="function drawFarm(){let x=farm.x-cam.x,y=farm.y-cam.y;ctx.fillStyle='#8b603e';ctx.fillRect(x,y,farm.w,farm.h);for(let yy=18;yy<farm.h-8;yy+=32){ctx.fillStyle='#6f472d';ctx.fillRect(x+10,y+yy,farm.w-20,8)}ctx.strokeStyle='#d8b071';ctx.lineWidth=4;ctx.strokeRect(x-3,y-3,farm.w+6,farm.h+6);for(const f of farmCarrots){if(f.e)continue;let fx=f.x-cam.x,fy=f.y-cam.y;px(fx,fy-8,2,6,'#3f833f');px(fx-2,fy-7,6,3,'#58a34f');px(fx-2,fy-1,6,9,'#e67b3d');px(fx-1,fy+8,4,2,'#c55d32')}}";
  html=html.replace(oldFarm,newFarm);

  const eastDecor="function drawEastDecor(){let pathY=455-cam.y;ctx.fillStyle='#c9b781';ctx.fillRect(845-cam.x,pathY,570,30);for(let i=0;i<18;i++){px(860-cam.x+i*31,pathY+8+(i%3)*5,9,3,'#b6a472')}let p=waterSpots[0],px0=p.x-cam.x,py0=p.y-cam.y;ctx.fillStyle='#3f8fba';ctx.beginPath();ctx.ellipse(px0,py0,50,35,0,0,Math.PI*2);ctx.fill();ctx.fillStyle='#78c3df';ctx.beginPath();ctx.ellipse(px0-8,py0-5,29,13,0,0,Math.PI*2);ctx.fill();for(let i=0;i<8;i++){px(px0-48+i*13,py0+27-(i%2)*4,3,7,'#4c8945')}for(const w of waterSpots){if(w.type!=='well')continue;let wx=w.x-cam.x,wy=w.y-cam.y;px(wx-17,wy-10,34,20,'#9a9b91');px(wx-14,wy-7,28,14,'#4f8ead');px(wx-20,wy-14,40,5,'#c2bda9');px(wx-15,wy-26,4,15,'#77563d');px(wx+11,wy-26,4,15,'#77563d');px(wx-15,wy-29,30,4,'#8c6547')}let benchX=910-cam.x,benchY=525-cam.y;px(benchX,benchY,42,5,'#9b6841');px(benchX+4,benchY+8,34,4,'#865a3a');px(benchX+5,benchY+12,4,10,'#684832');px(benchX+33,benchY+12,4,10,'#684832');const grove=[{x:905,y:210},{x:955,y:245},{x:1120,y:190},{x:1190,y:265},{x:1360,y:360},{x:1280,y:395}];for(const t of grove)tree(t);const eastRocks=[{x:900,y:365},{x:1180,y:410},{x:1360,y:560},{x:1270,y:160}];for(const r of eastRocks)rock(r);const flowers=[[880,500],[935,565],[1000,520],[1080,500],[1150,540],[1230,515],[1340,500],[980,285],[1160,300],[1370,300]];for(const f of flowers){let x=f[0]-cam.x,y=f[1]-cam.y;px(x,y,1,4,'#4e8744');px(x-2,y-2,5,3,'#f2d4e0');px(x,y-3,1,1,'#ffe995')}}";
  html=html.replace('function tree(t){',eastDecor+'function tree(t){');
  html=html.replace('drawRiver();drawFarm()','drawRiver();drawFarm();drawEastDecor()');

  html=html.replace("function rain(){if(!raining)return;ctx.fillStyle='#7ea2b529';ctx.fillRect(0,0,W,H);ctx.strokeStyle='#b9d8e8';ctx.lineWidth=1;for(let i=0;i<45;i++){let x=(i*47+performance.now()*.18)%W,y=(i*73+performance.now()*.32)%H;ctx.beginPath();ctx.moveTo(x,y);ctx.lineTo(x-3,y+7);ctx.stroke()}}","function rain(){}");
  html=html.replace("weatherT-=dt;if(weatherT<0){raining=!raining;weatherT=raining?18+Math.random()*24:25+Math.random()*35;say(raining?'雨だ… ☔':'雨やんだ',1.8)}","weatherT=999999;");
  html=html.replace("'雨のにおいがする',","");
  html=html.replace("'雨ふるかな',","");

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