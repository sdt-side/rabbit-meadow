const CACHE='rabbit-meadow-v16';
const ASSETS=['./','./manifest.webmanifest','./icon.svg'];

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

function patchIndex(html){
  // Party members follow the player but are no longer interaction targets.
  html=html.replace(
    "npcs.forEach((n,i)=>{let q=Math.hypot(rabbit.x-n.x,rabbit.y-n.y);",
    "npcs.forEach((n,i)=>{if(n.friend)return;let q=Math.hypot(rabbit.x-n.x,rabbit.y-n.y);"
  );

  // Rocks remain visible scenery but no longer block movement.
  html=html.replace(
    "for(const r of rocks)if(Math.hypot(x-r.x,y-r.y)<12)return true;",
    ""
  );

  // Footprints appear on any clearly non-grass walkable surface.
  const oldTerrain="function onBridge(x,y){return x>river.x-8&&x<river.x+river.w+8&&y>bridge.y&&y<bridge.y+bridge.h}function inRiver(x,y){return x>river.x&&x<river.x+river.w&&!onBridge(x,y)}function inSand(x,y){return !secret&&sand.some(s=>x>s.x&&x<s.x+s.w&&y>s.y&&y<s.y+s.h)}";
  const newTerrain=oldTerrain+"function segDist(px0,py0,x1,y1,x2,y2){let vx=x2-x1,vy=y2-y1,wx=px0-x1,wy=py0-y1,c1=vx*wx+vy*wy,c2=vx*vx+vy*vy,t=c2?Math.max(0,Math.min(1,c1/c2)):0,dx=px0-(x1+t*vx),dy=py0-(y1+t*vy);return Math.hypot(dx,dy)}function nonGrass(x,y){if(secret)return false;if(inSand(x,y)||onBridge(x,y))return true;if(x>farm.x&&x<farm.x+farm.w&&y>farm.y&&y<farm.y+farm.h)return true;if(x>845&&x<1415&&y>455&&y<485)return true;let p=[[river.x,bridge.y+bridge.h/2],[665,430],[555,380],[455,322],[house.doorX,house.doorY+20]];for(let i=0;i<p.length-1;i++)if(segDist(x,y,p[i][0],p[i][1],p[i+1][0],p[i+1][1])<15)return true;return false}";
  html=html.replace(oldTerrain,newTerrain);
  html=html.replace(
    "if(!secret&&inSand(rabbit.x,rabbit.y)&&performance.now()-lastFoot>260)",
    "if(!secret&&nonGrass(rabbit.x,rabbit.y)&&performance.now()-lastFoot>260)"
  );

  // Replace the rock pickup with a sprout pickup.
  html=html.replace("roll<.9?'🍀':'🪨'","roll<.9?'🍀':'🌱'");
  html=html.replace(
    "else if(icon==='🍀'){rabbit.home=Math.max(0,rabbit.home-18);say('なんだか落ち着く 🍀',2.2)}else say('ひろった！ '+icon,2.2)",
    "else if(icon==='🍀'){rabbit.home=Math.max(0,rabbit.home-18);say('なんだか落ち着く 🍀',2.2)}else if(icon==='🌱'){rabbit.hunger=Math.min(100,rabbit.hunger+8);say('やわらかい芽 🌱',2.2)}else say('ひろった！ '+icon,2.2)"
  );
  return html;
}

async function patchedNavigation(request){
  let response;
  try{response=await fetch(request,{cache:'no-store'});}catch(e){response=await caches.match('./index.html')}
  if(!response)return response;
  const html=patchIndex(await response.text());
  const patched=new Response(html,{status:200,headers:{'Content-Type':'text/html; charset=utf-8','Cache-Control':'no-cache'}});
  const copy=patched.clone();
  caches.open(CACHE).then(cache=>cache.put('./index.html',copy));
  return patched;
}

self.addEventListener('fetch',event=>{
  if(event.request.mode==='navigate'){
    event.respondWith(patchedNavigation(event.request));
    return;
  }
  event.respondWith(caches.match(event.request).then(cached=>cached||fetch(event.request)));
});