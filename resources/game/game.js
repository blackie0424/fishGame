
/* =====================================================================
   蘭嶼釣魚趣 — 互動版
   規則依《蘭嶼釣魚趣》說明書；魚牌組成取自 blackie0424/fishGame 資料
===================================================================== */
import { FISH_SPECIES, TARGET_SET } from './data/fish.js';
import { SITE_CARDS } from './data/sites.js';
import { ROLES } from './data/roles.js';
import { ACTION_INFO, ENV_INFO } from './data/cards.js';
import { shuffle, rnd, buildFishSupply, buildActionDeck, buildDestinyDeck, buildEnvDeck } from './utils/deck.js';
import { siteTier, fishPass, fishAuto, fishNeedText } from './utils/rules.js';
import { FISH_ART } from './data/fishArt.js';
import { drawFish, drawAvatar, getFishArt, drawPixFisher } from './renderer/sprites.js';
import { drawSeaBands, drawFishShadow, drawRockRight, tickDrops } from './renderer/scene.js';
import { createGameState, advanceTurn } from './state/GameState.js';
import { pickBannedSpots as pickBanned, siteCaps as calcSiteCaps, boardHasFish as hasBoardFish, refillBoard } from './utils/board.js';
import { applyServerConfig as applyCfg } from './config/serverConfig.js';
import { INTRO_SCENES } from './data/intro.js';
import { startFight } from './renderer/fight.js';

/* ---------------- 動態遊戲參數（可由 Laravel 後台調整） ---------------- */
let CFG={rounds:15, goal:21, randomFishRatio:.35, bgmSpeedRound:10};

/* 場地縮圖：以浪高、礁石、急流、氛圍呈現環境，玩家從畫面與敘述自行判斷 */
function siteThumb(card,w=150,h=84){
  const c=document.createElement("canvas"); c.width=w; c.height=h;
  const g=c.getContext("2d"); g.imageSmoothingEnabled=false;
  const v=card.vis, hz=h*.30;
  const sky=v.dark?["#1a2238","#2a3452"]:v.dusk?["#c97e52","#e8a45f"]:["#2a4a74","#4a6d94"];
  g.fillStyle=sky[0]; g.fillRect(0,0,w,hz*.6);
  g.fillStyle=sky[1]; g.fillRect(0,hz*.6,w,hz*.4);
  const seaC=v.dark?["#08203a","#0e3a63","#155a95"]:["#0e3a63","#1b6bad","#2b93d6"];
  const bh=(h-hz)/3;
  seaC.forEach((cc,i)=>{g.fillStyle=cc; g.fillRect(0,hz+i*bh,w,bh+1);});
  // 浪（依 wave 級數）
  g.fillStyle="rgba(255,255,255,.75)";
  for(let i=0;i<(v.wave+1)*4;i++){
    const y=hz+4+(i*13)%(h-hz-10), amp=2+v.wave*3;
    for(let x=(i*23)%16;x<w;x+=18) g.fillRect(x, y+Math.sin(x*.2+i)*amp*.3, 6+v.wave*3, 2+(v.wave>=2?1:0));
  }
  if(v.wave>=2){ g.fillStyle="rgba(255,255,255,.9)"; for(let i=0;i<5;i++){const x=(i*37)%w; g.fillRect(x,hz+2+(i%3)*4,14,3);} }
  // 急流線
  if(v.cur){ g.fillStyle="rgba(160,220,255,.5)"; for(let i=0;i<v.cur*4;i++){const y=hz+8+(i*17)%(h-hz-14); g.fillRect(0,y,w,1);} }
  // 礁石
  g.fillStyle="#5c574e";
  for(let i=0;i<v.rock*3;i++){ const x=(i*53+9)%w, rw=12+(i%3)*8, rh=6+(i%4)*4; g.fillRect(x,h-14-rh+(i%2)*4,rw,rh); g.fillStyle="#6b6558"; g.fillRect(x+2,h-14-rh+(i%2)*4,rw-4,2); g.fillStyle="#5c574e"; }
  if(v.cliff){ g.fillStyle="#57524a"; g.fillRect(0,0,16,h); g.fillStyle="#6b6558"; g.fillRect(14,0,3,h); }
  if(v.cave){ g.fillStyle="#22201c"; g.beginPath(); g.ellipse(w*.82,h*.34,14,10,0,0,7); g.fill(); }
  if(v.dome){ g.fillStyle="#66604f"; g.beginPath(); g.ellipse(w*.8,h-16,16,12,0,Math.PI,0); g.fill(); }
  if(v.sand){ g.fillStyle="#c9b98a"; g.fillRect(0,h-8,w,8); }
  // 岸線
  g.fillStyle="#4e4a44"; g.fillRect(0,h-6,w,6);
  return c;
}

/* ---------------- 工具 ---------------- */
const $=s=>document.querySelector(s);
const sleep=ms=>new Promise(r=>setTimeout(r,ms));

/* =====================================================================
   音效引擎（Web Audio 合成，無外部檔案）
===================================================================== */
const SFX=(()=>{
  let ctx=null, muted=false, ambOn=false;
  function ac(){ if(!ctx) ctx=new (window.AudioContext||window.webkitAudioContext)(); if(ctx.state==="suspended") ctx.resume(); return ctx; }
  function tone(f,dur,type="square",vol=.18,when=0,slide=0){
    if(muted) return; const c=ac(), t=c.currentTime+when;
    const o=c.createOscillator(), g=c.createGain();
    o.type=type; o.frequency.setValueAtTime(f,t);
    if(slide) o.frequency.exponentialRampToValueAtTime(Math.max(30,f+slide),t+dur);
    g.gain.setValueAtTime(vol,t); g.gain.exponentialRampToValueAtTime(.0001,t+dur);
    o.connect(g).connect(c.destination); o.start(t); o.stop(t+dur+.02);
  }
  function noise(dur,vol=.2,fc=1200,when=0){
    if(muted) return; const c=ac(), t=c.currentTime+when;
    const b=c.createBuffer(1,c.sampleRate*dur,c.sampleRate), d=b.getChannelData(0);
    for(let i=0;i<d.length;i++) d[i]=Math.random()*2-1;
    const src=c.createBufferSource(); src.buffer=b;
    const f=c.createBiquadFilter(); f.type="lowpass"; f.frequency.value=fc;
    const g=c.createGain(); g.gain.setValueAtTime(vol,t); g.gain.exponentialRampToValueAtTime(.0001,t+dur);
    src.connect(f).connect(g).connect(c.destination); src.start(t);
  }
  function ambient(){ // 海浪環境音：緩慢起伏的濾波噪音
    if(ambOn||muted) return; ambOn=true; const c=ac();
    const b=c.createBuffer(1,c.sampleRate*2,c.sampleRate), d=b.getChannelData(0);
    for(let i=0;i<d.length;i++) d[i]=Math.random()*2-1;
    const src=c.createBufferSource(); src.buffer=b; src.loop=true;
    const f=c.createBiquadFilter(); f.type="lowpass"; f.frequency.value=420;
    const g=c.createGain(); g.gain.value=.045;
    const lfo=c.createOscillator(), lg=c.createGain();
    lfo.frequency.value=.13; lg.gain.value=.03; lfo.connect(lg).connect(g.gain);
    src.connect(f).connect(g).connect(c.destination); src.start(); lfo.start();
  }
  /* --- 背景音樂：輕快海島五聲音階 chiptune 循環 --- */
  let bgmTimer=null, bgmStep=0;
  const SCALE=[262,294,330,392,440,523,587,659]; // C 五聲延伸
  const MELODY=[5,-1,4,5,-1,3,2,-1, 3,4,-1,5,7,-1,5,4, 2,-1,3,2,-1,0,1,-1, 3,-1,2,1,-1,0,-1,-1];
  const BASSLN=[0,-1,-1,-1,2,-1,-1,-1,3,-1,-1,-1,1,-1,-1,-1];
  /* 回合越後期，節奏越急促：第 10 回合起逐步加速，倒數兩回合旋律拉高八度 */
  function bgmRound(){ return (typeof G!=="undefined"&&G.players&&G.players.length&&!G.over)?G.round:1; }
  function bgmInterval(){
    const k=Math.max(0,Math.min(6,bgmRound()-(CFG.bgmSpeedRound-1)));
    return 190-k*13;                                 // 190ms → 最快 112ms
  }
  function bgmTick(){
    if(muted) return;
    const r=bgmRound();
    const oct=r>=CFG.rounds-1?2:1;                             // 最後兩回合旋律高八度
    const m=MELODY[bgmStep%MELODY.length];
    if(m>=0) tone(SCALE[m]*oct,.2,"square",r>=12?.055:.045,0.02);
    const b=BASSLN[bgmStep%BASSLN.length];
    if(b>=0) tone(SCALE[b]/2,.36,"triangle",r>=12?.062:.05,0.02);
    if(bgmStep%8===0) noise(.06,.02,5000,0.02);      // 輕拍
    if(r>=CFG.rounds-3&&bgmStep%2===0) noise(.035,.028,6500,0.01);  // 後期急促打點
    if(r>=CFG.rounds-1&&bgmStep%4===2) tone(SCALE[0]*4,.05,"square",.04,0.02); // 倒數高音催促
    bgmStep++;
  }
  function bgmStart(){
    if(bgmTimer||muted) return;
    const loop=()=>{ bgmTick(); bgmTimer=setTimeout(loop,bgmInterval()); }; // 每拍讀取當前回合節奏
    bgmTimer=setTimeout(loop,bgmInterval());
  }
  function bgmStop(){ if(bgmTimer){clearTimeout(bgmTimer); bgmTimer=null;} }
  return {
    init(){ ac(); ambient(); bgmStart(); },
    toggle(){ muted=!muted; if(!muted){ambOn=false; ambient(); bgmStart();} else bgmStop(); return muted; },
    reel(n=3){ for(let i=0;i<n;i++) tone(1400+rnd(300),.03,"square",.06,i*.09); },
    shore(){ noise(1.4,.12,500); noise(.7,.08,1500,.15); },
    step(){ noise(.05,.05,900); },
    diceThrow(){ noise(.28,.15,2600); tone(720,.22,"sine",.08,0,-380); },
    knock(){ tone(130+rnd(70),.08,"square",.18,0,-50); noise(.06,.12,650); },
    diceTick(){ tone(950+rnd(400),.03,"square",.05); },
    settle(){ tone(320,.07,"square",.1); tone(240,.06,"square",.07,.06); },
    jumpS(){ noise(.25,.08,1400); tone(420,.15,"sine",.05,0,-160); },
    creak(){ tone(90+rnd(40),.3,"sawtooth",.07,0,40); },
    click(){ tone(680,.06,"square",.12); },
    cast(){ noise(.35,.18,2400); tone(900,.3,"sine",.1,0,-700); },
    splash(){ noise(.5,.3,900); tone(300,.25,"sine",.14,0,-180); },
    flip(){ noise(.12,.14,3000); tone(500,.08,"triangle",.1); },
    dice(){ for(let i=0;i<7;i++) tone(200+rnd(500),.05,"square",.08,i*.07); },
    good(){ [523,659,784,1047].forEach((f,i)=>tone(f,.16,"square",.14,i*.09)); },
    great(){ [523,659,784,1047,1319].forEach((f,i)=>tone(f,.2,"square",.15,i*.1)); noise(.3,.1,3000,.5); },
    bad(){ tone(220,.25,"sawtooth",.12,0,-90); tone(160,.3,"sawtooth",.1,.12,-60); },
    wave(){ noise(1.1,.3,600); },
    eel(){ tone(150,.5,"sawtooth",.12,0,120); tone(95,.4,"sawtooth",.1,.2,60); },
    turn(){ tone(440,.09,"square",.1); tone(660,.09,"square",.1,.1); },
    win(){ [392,523,659,784,1047,784,1047].forEach((f,i)=>tone(f,.22,"square",.16,i*.13)); },
    lose(){ [392,330,262,196].forEach((f,i)=>tone(f,.3,"sawtooth",.13,i*.22)); },
  };
})();

/* =====================================================================
   像素魚繪製（程序化 sprite，依魚種色盤 + 名稱種子花紋）
===================================================================== */
function fishCanvas(species,scale){ const c=document.createElement("canvas"); drawFish(c,species,scale); return c; }
function avatarCanvas(role,scale){ const c=document.createElement("canvas"); drawAvatar(c,role,scale); return c; }

/* =====================================================================
   遊戲狀態
===================================================================== */
const G={
  mode:"ai", count:4, siteIdx:0, site:null, humanRole:0,
  players:[], round:1, turnIdx:0,
  fishSupply:[], actionDeck:[], envDeck:[],
  spots:[[],[],[],[],[],[]],
  spotCap:[3,3,3,3,2,2],
  activeBanned: new Set(),
  discard:[],
  busy:false, over:false,
};
let speciesByName={};
function rebuildSpeciesIndex(){ speciesByName={}; FISH_SPECIES.forEach(sp=>speciesByName[sp.name]=sp); }
rebuildSpeciesIndex();

/* 依難度分桶補魚：純邏輯已抽至 utils/board.js（refactor phase5） */
function refillSpots(log=false){
  G.spotCap=siteCaps();
  refillBoard({ spots:G.spots, fishSupply:G.fishSupply, spotCap:G.spotCap,
                activeBanned:G.activeBanned, randomFishRatio:CFG.randomFishRatio });
  if(log) addLog("補充魚牌：各點位已補滿。","lg-sys");
  renderSpots();
}
/* 場上（未禁放點位）是否還有魚 */
function boardHasFish(){ return hasBoardFish(G.spots, G.activeBanned); }
/* 場面全空但魚庫（補充堆）還有魚 → 立刻從魚庫補滿場面。
   只有連魚庫都空了（近終局，52 條幾乎都被釣走）才會真的無魚可補。
   修正：舊版遞補只在場上 6 個點位之間搬魚，抓乾後即誤報「沒有魚」，
   卻忽略魚庫中通常還有 30～40 條未上場的魚。 */
function ensureBoardHasFish(){
  if(boardHasFish()) return true;
  if(G.fishSupply.length){ refillSpots(); return boardHasFish(); }
  return false;
}
function reshuffleBoard(){
  let all=G.spots.flat(); G.spots=[[],[],[],[],[],[]];
  all=shuffle(all);
  let i=0;
  outer: while(i<all.length){
    let placed=false;
    for(let s=0;s<6;s++){
      if(isBanned(s)) continue;
      if(G.spots[s].length<G.spotCap[s] && i<all.length){ G.spots[s].push(all[i++]); placed=true; }
    }
    if(!placed) break outer;
  }
  while(i<all.length) G.fishSupply.push(all[i++]);
  renderSpots();
}

/* =====================================================================
   UI 基礎
===================================================================== */
function showScreen(id){ document.querySelectorAll(".screen").forEach(s=>s.classList.remove("active")); $(id).classList.add("active"); window.scrollTo(0,0); }
function addLog(msg,cls=""){ const p=document.createElement("p"); p.className=cls; p.innerHTML=msg; const L=$("#log"); L.prepend(p); while(L.children.length>40) L.lastChild.remove(); }
async function toast(msg,ms=2000){ $("#toast-text").innerHTML=msg; $("#ov-toast").classList.add("show"); await sleep(ms); $("#ov-toast").classList.remove("show"); }

function needText(spot){ return G.site.rule==="gt" ? `骰出 > ${spot+1}` : `骰出 ≥ ${spot+1}`; }
function passCheck(roll,spot){ return G.site.rule==="gt" ? roll>spot+1 : roll>=spot+1; }
function isBanned(spot){ return G.activeBanned.has(spot); }
/* 每回合隨機決定禁放點位／容量分配：純邏輯已抽至 utils/board.js */
function pickBannedSpots(){ G.activeBanned=pickBanned(G.site); }
function siteCaps(){ return calcSiteCaps(G.site, G.activeBanned); }

function renderSpots(){ syncShadows(); /* 點位為隱藏機率區：僅以隨機游動的魚影呈現 */ }

function taskHTML(p){
  const cnt=p.catch.length;
  const okCnt=cnt>=p.role.need;
  let t=`<span class="${okCnt?"done":""}">魚 ${cnt}/${p.role.need}</span>`;
  if(p.role.target){
    const has=p.catch.some(f=>p.role.target.includes(f.name));
    t+=` ・<span class="${has?"done":""}">${p.role.target.join("/").toLowerCase()} ${has?"✓":"✗"}</span>`;
  }
  return t;
}
let __lastPool=0;
function renderPool(){
  const box=$("#pool-fish"); box.innerHTML="";
  let total=0;
  G.players.forEach(p=>{
    p.catch.forEach(f=>{
      total++;
      const d=document.createElement("div");
      d.className="pf"+(TARGET_SET.has(f.name)?" tgt":"")+(total>__lastPool?" new":"");
      d.title=`${f.name}（${p.name} 釣獲）`;
      d.appendChild(fishCanvas(f,2));
      const i=document.createElement("i"); i.textContent=p.name.slice(0,1); d.appendChild(i);
      box.appendChild(d);
    });
  });
  if(!total) box.innerHTML='<span id="pool-empty">還沒有漁獲，快下竿吧！</span>';
  $("#pool-count").textContent=`${total}/${CFG.goal}`;
  __lastPool=total;
}
function renderMyHud(){
  // 岸邊水窪：全體玩家的漁獲都養在這裡（部落共同的魚池）
  POOL_VIEW.fishes=[];
  G.players.forEach(pl=>{
    pl.catch.forEach(f=>{
      POOL_VIEW.fishes.push({
        body:(FISH_ART[f.name]||{body:"#7fb2c9"}).body,
        belly:(FISH_ART[f.name]||{belly:"#d8e8ef"}).belly,
      });
    });
  });
}
function renderPlayers(){
  renderPool(); renderMyHud();
  const row=$("#players-row"); row.innerHTML="";
  const total=G.players.reduce((a,p)=>a+p.catch.length,0);
  $("#ui-goalfill").style.width=Math.min(100,total/CFG.goal*100)+"%";
  $("#ui-goaltext").textContent=`全體漁獲 ${total} / ${CFG.goal}`;
  $("#ui-round").textContent=G.round;
  G.players.forEach((p,i)=>{
    const c=document.createElement("div");
    c.className="pcard pixel-panel"+(i===G.turnIdx&&!G.over?" turn":"");
    let badges="";
    if(p.human) badges+=`<span class="badge-you">${G.mode==="ai"?"你":"真人"}</span>`;
    if(p.rest>0) badges+=`<span class="badge-rest">休息</span>`;
    c.innerHTML=badges+`<div class="pname">${p.name}</div><div class="prole">${p.role.emoji} ${p.role.name}</div>
      <div class="pcatch">🐟 ${p.catch.length} 條</div><div class="ptask">${taskHTML(p)}</div>`;
    c.insertBefore(avatarCanvas(p.role,4), c.querySelector(".pname"));
    row.appendChild(c);
  });
}

/* 浪花粒子 */
function splashFX(){
  for(let i=0;i<14;i++){
    const d=document.createElement("div"); d.className="splash-dot";
    const x=innerWidth/2, y=innerHeight/2;
    d.style.left=x+"px"; d.style.top=y+"px";
    document.body.appendChild(d);
    const ang=Math.random()*Math.PI*2, v=3+Math.random()*5;
    let vx=Math.cos(ang)*v, vy=Math.sin(ang)*v-3, px=x, py=y, life=0;
    (function anim(){ life++; px+=vx; py+=vy; vy+=.4;
      d.style.transform=`translate(${px-x}px,${py-y}px)`;
      d.style.opacity=1-life/26;
      if(life<26) requestAnimationFrame(anim); else d.remove();
    })();
  }
}

/* =====================================================================
   海面動畫（棋盤底圖 + 標題頁）
===================================================================== */
/* =====================================================================
   海邊釣魚場景引擎
   - 清晨天空、海浪、浪花拍打礁岩（含音效）、偶爾魚躍出水
   - 釣點以「魚影 + 漣漪 + 浮標牌」自然融入海面
   - 岸上小人 = 玩家本人，甩竿動畫直接在場景中演出
===================================================================== */
const POOL_VIEW={owner:"",fishes:[]}; // 岸邊水窪（目前玩家漁獲）
const SHADOWS=[]; // 海裡隨機游動的魚影（數量對應各區魚牌）
function syncShadows(){
  const cv=document.getElementById("sea-canvas"); if(!cv||typeof G==="undefined") return;
  SHADOWS.length=0;
  for(let sp=0;sp<6;sp++){
    (G.spots[sp]||[]).forEach(()=>{
      const cx=cv.width*SPOT_POS[sp][0], cy=cv.height*SPOT_POS[sp][1];
      SHADOWS.push({cx,cy, x:cx+(Math.random()-.5)*150, y:cy+(Math.random()-.5)*56,
        a:Math.random()*6.28, spd:.35+Math.random()*.55, turn:rnd(50)});
    });
  }
}
let SPOT_POS=[[.13,.665],[.375,.695],[.615,.655],[.235,.475],[.50,.435],[.765,.41]]; // [x,y] 比例；越深越遠
const FISHERS=[]; // {x,gy,phase,t,spot,name,bobX,bobY}


function shoreScene(canvas,opts={}){
  const g=canvas.getContext("2d"); g.imageSmoothingEnabled=false;
  let t=0;
  const siteVis=()=> (opts.interactive&&typeof G!=="undefined"&&G.site)?G.site.vis:{wave:0,rock:1,cur:0};
  const drops=[];                       // 水花粒子
  let jump=null, nextJump=200+rnd(300); // 魚躍
  let crashT=0;                          // 大浪拍岸計時
  function paint(){
    const W=canvas.width,H=canvas.height;
    const horizon=H*.26, shore=H*.80;
    // --- 天空：太陽隨回合西移下沉（清晨 → 午後 → 黃昏將暗） ---
    const vis0=siteVis();
    let dayP = (opts.interactive&&typeof G!=="undefined"&&G.players&&G.players.length&&!G.over)
      ? Math.min(1,(G.round-1)/Math.max(1,CFG.rounds-1)) : .15;
    if(vis0.dusk) dayP=Math.min(1,dayP*.5+.5);   // 黃昏場地：從傍晚色開局
    const lerp=(a,b,k)=>Math.round(a+(b-a)*k);
    const lerpHex=(h1,h2,k)=>{const a=parseInt(h1.slice(1),16),b=parseInt(h2.slice(1),16);
      return "#"+((1<<24)+(lerp(a>>16,b>>16,k)<<16)+(lerp(a>>8&255,b>>8&255,k)<<8)+lerp(a&255,b&255,k)).toString(16).slice(1);};
    const SKY_AM=["#1c2f52","#2a4a74","#4a6d94","#c97e52","#e8a45f"];
    const SKY_PM=["#10142e","#232048","#4a2f55","#b1483e","#d97a3c"];   // 天快暗
    const sky=SKY_AM.map((c,i)=>lerpHex(c,SKY_PM[i],dayP));
    const sbh=horizon/sky.length;
    sky.forEach((c,i)=>{g.fillStyle=c; g.fillRect(0,i*sbh,W,sbh+2);});
    // 太陽：從東邊高處緩緩滑向西邊海平面，最後半沉入海
    const sunX=W*(.72-dayP*.5);
    const sunY=horizon-34+dayP*46+Math.sin(t/240)*2;
    const sunC=lerpHex("#ffdf8a","#ff8a4a",dayP);
    g.save();
    g.beginPath(); g.rect(0,0,W,horizon); g.clip();       // 沉入海平面下的部分被遮住
    g.fillStyle=sunC; g.fillRect(sunX-14,sunY-14,28,28); g.fillRect(sunX-10,sunY-18,20,36);
    g.fillStyle=lerpHex("#ffdf8a","#ff8a4a",dayP).replace("#","#"); g.globalAlpha=.5;
    g.fillRect(sunX-20,sunY-6,40,12); g.globalAlpha=1;
    g.restore();
    g.fillStyle="rgba(255,235,210,.28)";
    for(let i=0;i<4;i++){ const cx=((t*(0.2+i*.08)+i*190)%(W+120))-60, cy=18+i*22;
      g.fillRect(cx,cy,64+i*14,8); g.fillRect(cx+12,cy-6,36,6); }
    // --- 海面 ---
    const bands=["#0e3a63","#11497b","#155a95","#1b6bad","#2280c4","#2b93d6"]; // 遠深近淺
    const bh=(shore-horizon)/bands.length;
    bands.forEach((c,i)=>{g.fillStyle=c; g.fillRect(0,horizon+i*bh,W,bh+2);});
    g.fillStyle=dayP>.6?"rgba(255,140,80,.28)":"rgba(255,200,120,.22)";
    for(let i=0;i<7;i++){ const y=horizon+6+i*9; const w=30-i*3+Math.sin(t/30+i)*4; g.fillRect(sunX-w/2,y,w,3); }
    const vis=siteVis();
    g.fillStyle=vis.wave>=2?"rgba(255,255,255,.32)":"rgba(255,255,255,.20)";
    const nSpark=22+vis.wave*10;
    for(let i=0;i<nSpark;i++){
      const y=horizon+((i*37+(t*(.4+i%3*.3+vis.wave*.25)))% (shore-horizon-6));
      const x=(i*97+t*(1+i%4+vis.wave))%(W+80)-40;
      g.fillRect(x,y,10+(i%3)*6+vis.wave*4,3+(vis.wave>=2?1:0));
    }
    if(vis.wave>=2){ // 湧浪白沫帶
      g.fillStyle="rgba(255,255,255,.5)";
      for(let i=0;i<6;i++){ const y=horizon+14+i*((shore-horizon)/6);
        for(let x=(i*29+t*2)%36;x<W;x+=44) g.fillRect(x,y+Math.sin(x*.05+t*.08+i)*4,18,3); }
    }
    if(vis.cur){ // 急流線（水平流動）
      g.fillStyle="rgba(160,220,255,.35)";
      for(let i=0;i<vis.cur*5;i++){ const y=horizon+16+(i*31)%(shore-horizon-24);
        g.fillRect((t*(3+vis.cur)+i*120)%(W+140)-70,y,54,2); }
    }
    if(vis.dark){ g.fillStyle="rgba(4,12,26,.30)"; g.fillRect(0,horizon,W,shore-horizon); } // 黑水溝
    // 場地地標
    if(vis.cliff){ g.fillStyle="#57524a"; g.fillRect(0,0,W*.06,shore); g.fillStyle="#6b6558"; g.fillRect(W*.06-4,0,4,shore);
      g.fillStyle="#3f6b3a"; for(let i=0;i<5;i++) g.fillRect(W*.02+(i%2)*10, i*shore/5+12, 8,5); }
    if(vis.dome){ g.fillStyle="#66604f"; g.beginPath(); g.ellipse(W*.90,horizon+34,34,24,0,Math.PI,0); g.fill();
      g.fillStyle="#7d766a"; g.beginPath(); g.ellipse(W*.90,horizon+32,26,16,0,Math.PI,0); g.fill(); }
    if(vis.cave){ g.fillStyle="#3a352e"; g.fillRect(W*.86,horizon+18,52,26);
      g.fillStyle="#15120e"; g.beginPath(); g.ellipse(W*.90,horizon+38,14,11,0,Math.PI,0); g.fill(); }
    // --- 魚影：在海中隨機游動（數量對應各區魚牌，看不出魚種與區界） ---
    if(opts.interactive && typeof G!=="undefined" && G.spots){
      g.fillStyle="rgba(6,20,36,.75)";
      for(const sh of SHADOWS){
        sh.turn--; if(sh.turn<=0){ sh.a+=(Math.random()-.5)*1.3; sh.turn=26+rnd(70); }
        sh.x+=Math.cos(sh.a)*sh.spd; sh.y+=Math.sin(sh.a)*sh.spd*.45;
        // 游遠了就緩緩轉回自己海域（維持深淺線索但無固定圈）
        const dx=sh.x-sh.cx, dy=sh.y-sh.cy;
        if((dx*dx)/(120*120)+(dy*dy)/(48*48)>1) sh.a=Math.atan2(sh.cy-sh.y,sh.cx-sh.x)+(Math.random()-.5)*.7;
        sh.y=Math.max(horizon+12,Math.min(shore-14,sh.y));
        sh.x=Math.max(12,Math.min(W-12,sh.x));
        const dir=Math.cos(sh.a)>=0?1:-1, wig=Math.sin(t*.2+sh.cx)*1.2;
        g.beginPath(); g.ellipse(sh.x,sh.y+wig,7,3,Math.sin(sh.a)*.25,0,7); g.fill();
        g.beginPath(); g.moveTo(sh.x-dir*6,sh.y+wig); g.lineTo(sh.x-dir*11,sh.y+wig-3); g.lineTo(sh.x-dir*11,sh.y+wig+3); g.fill();
      }
    }
    // --- 魚躍出水面（偶發）：從有魚的點位跳出，讓玩家判斷魚在哪 ---
    if(!jump && t>nextJump){
      const fishySpots=opts.interactive&&typeof G!=="undefined"&&G.spots
        ? [0,1,2,3,4,5].filter(sp=>G.spots[sp]&&G.spots[sp].length>0) : [];
      if(fishySpots.length){
        const sp=fishySpots[rnd(fishySpots.length)];
        const jx=W*SPOT_POS[sp][0]+(Math.random()-.5)*60;
        const jy=H*SPOT_POS[sp][1]+(Math.random()-.5)*20;
        jump={t:0, x:jx, y0:Math.max(horizon+20,Math.min(shore-60,jy))};
      }else{
        jump={t:0, x:W*(.12+Math.random()*.7), y0:horizon+30+Math.random()*(shore-horizon-90)};
      }
      if(opts.sound&&SFX.jumpS) SFX.jumpS();
    }
    if(jump){
      jump.t++;
      const k=jump.t/46;
      if(k>=1){ for(let i=0;i<8;i++) drops.push({x:jump.x+20,y:jump.y0,vx:(Math.random()-.5)*3,vy:-1-Math.random()*2,l:0}); jump=null; nextJump=t+260+rnd(420); }
      else{
        const jx=jump.x+k*44, jy=jump.y0-Math.sin(k*Math.PI)*34;
        g.fillStyle="#0d2a44";
        g.save(); g.translate(jx,jy); g.rotate(-.9+k*1.8);
        g.beginPath(); g.ellipse(0,0,10,4,0,0,7); g.fill();
        g.beginPath(); g.moveTo(-9,0); g.lineTo(-15,-4); g.lineTo(-15,4); g.fill();
        g.restore();
        if(jump.t===1) for(let i=0;i<6;i++) drops.push({x:jump.x,y:jump.y0,vx:(Math.random()-.5)*3,vy:-1-Math.random()*2.5,l:0});
      }
    }
    // --- 岸邊：浪花拍打礁岩 ---
    crashT++;
    const surge=Math.sin(t/38)*4;                     // 潮線推移
    g.fillStyle="rgba(210,240,250,.5)";
    for(let x=0;x<W;x+=14){ const yo=Math.sin(t/18+x/26)*3+surge; g.fillRect(x,shore-5+yo,9,4); }
    if(crashT>Math.max(70,170-siteVis().wave*45)+(canvas.__crashJit||0)){  // 浪越大拍岸越頻繁
      crashT=0; canvas.__crashJit=rnd(120);
      if(opts.sound&&SFX.shore) SFX.shore();
      for(let i=0;i<26;i++) drops.push({x:Math.random()*W, y:shore-2, vx:(Math.random()-.5)*2.5, vy:-2.2-Math.random()*3.2, l:0});
    }
    // --- 前景礁岩：高低起伏的地形（相近色階疊出立體感） ---
    const rockH=x=>{ // 每個 x 的礁岩高度（確定性起伏）
      return Math.max(4, 12+9*Math.sin(x*.012+1.7)+6*Math.sin(x*.033+.6)+4*Math.sin(x*.074+3.1));
    };
    for(let x=0;x<W;x+=6){
      const hh=rockH(x);
      g.fillStyle="#4e4a44"; g.fillRect(x,shore-hh,6,H-(shore-hh));      // 岩體
      g.fillStyle="#5c574e"; g.fillRect(x,shore-hh+6,6,10);              // 中間層
      g.fillStyle="#6b6558"; g.fillRect(x,shore-hh,6,4);                 // 亮頂
      if(((x/6)|0)%7===0) { g.fillStyle="#867e6c"; g.fillRect(x+1,shore-hh,4,2); } // 高光
      if(((x/6)|0)%9===4) { g.fillStyle="#454138"; g.fillRect(x,shore-hh+16,6,8); } // 陰影凹處
    }
    // 較低窪的深色平台（第二層地形）
    for(let i=0;i<6;i++){ const x=(i*151)%W;
      g.fillStyle="#57524a"; g.fillRect(x,shore+18+(i%2)*10,70,10);
      g.fillStyle="#635d53"; g.fillRect(x+6,shore+18+(i%2)*10,22,3); }
    // 近水的礁石上長著海草（隨浪輕搖）
    for(let i=0;i<12;i++){
      const x=(i*61+17)%W, hh=rockH(x);
      if(hh<15) continue;                                                 // 只長在探出水線附近的高岩上
      const sway=Math.sin(t/16+i)*1.5;
      g.fillStyle="#3f6b3a";
      g.fillRect(x+sway,shore-hh-6,3,7); g.fillRect(x+4-sway,shore-hh-4,3,5);
      g.fillStyle="#5a8a4a";
      g.fillRect(x+2+sway,shore-hh-8,3,6); g.fillRect(x+6,shore-hh-3,2,4);
    }
    // 水線邊的海草叢（半泡在水裡）
    for(let i=0;i<8;i++){
      const x=(i*89+40)%W, sway=Math.sin(t/14+i*2)*2;
      g.fillStyle="#2f5c34"; g.fillRect(x+sway,shore-9,3,9);
      g.fillStyle="#4a7a42"; g.fillRect(x+3-sway,shore-12,3,12); g.fillRect(x+6+sway,shore-7,2,7);
    }
    if(siteVis().sand){ // 沙灘場地：岸緣一條沙色帶
      g.fillStyle="#c9b98a"; for(let x=0;x<W;x+=6){ const hh=rockH(x); g.fillRect(x,shore-hh-3,6,4); } }
    // 礁岩邊緣殘留的白沫
    g.fillStyle="rgba(220,245,252,.35)";
    for(let i=0;i<9;i++){ const x=(i*97)%W; if((t+i*30)%160<90) g.fillRect(x+2,shore-rockH(x)-2,26,3); }
    // --- 岸邊小水窪（漁獲養在這裡，有魚在跳） ---
    if(opts.interactive){
      const px0=W*.105, py0=shore+(H-shore)*.58, rx=W*.075, ry=(H-shore)*.24;
      // 岩緣
      g.fillStyle="#867e6c"; g.beginPath(); g.ellipse(px0,py0,rx+7,ry+5,0,0,7); g.fill();
      g.fillStyle="#66604f"; g.beginPath(); g.ellipse(px0,py0,rx+4,ry+3,0,0,7); g.fill();
      // 水
      g.fillStyle="#155a95"; g.beginPath(); g.ellipse(px0,py0,rx,ry,0,0,7); g.fill();
      g.fillStyle="#2b93d6"; g.beginPath(); g.ellipse(px0-rx*.18,py0-ry*.22,rx*.72,ry*.6,0,0,7); g.fill();
      g.fillStyle="rgba(255,255,255,.3)";
      g.fillRect(px0-rx*.5+((t*.7)%(rx)),py0-2,8,2);
      const n=POOL_VIEW.fishes.length;
      // 水窪裡的魚：輪流跳出水面
      for(let i=0;i<Math.min(n,12);i++){
        const fz=POOL_VIEW.fishes[i];
        const cyc=(t+i*53)%170, hop=cyc<34;
        const bx=px0-rx*.62+ (i%5)*(rx*.32), by=py0-3+((i/5)|0)*5;
        if(hop){
          const k=cyc/34;
          const hy=by-Math.sin(k*Math.PI)*16;
          g.save(); g.translate(bx,hy); g.rotate(-.8+k*1.6);
          g.fillStyle=fz.body; g.beginPath(); g.ellipse(0,0,6,2.6,0,0,7); g.fill();
          g.fillStyle=fz.belly; g.beginPath(); g.moveTo(-5,0); g.lineTo(-9,-3); g.lineTo(-9,3); g.fill();
          g.restore();
          if(cyc===0||cyc===33){ g.fillStyle="#cfeefb"; for(let d2=0;d2<3;d2++) g.fillRect(bx-4+rnd(9),by-2,2,2); }
        }else{
          // 水面下的背影
          g.fillStyle="rgba(10,30,50,.65)";
          g.beginPath(); g.ellipse(bx,by+2,5,2,0,0,7); g.fill();
        }
      }
      // 木牌：漁獲數
      g.fillStyle="#6a4a2a"; g.fillRect(px0+rx+8,py0-24,6,26);
      g.fillStyle="#8a5c2d"; g.fillRect(px0+rx-6,py0-40,52,20);
      g.fillStyle="#f2ede2"; g.font="bold 12px monospace"; g.textAlign="center";
      g.fillText(`全體×${n}`,px0+rx+20,py0-26); g.textAlign="left";
      if(n===0&&t%120<60){ g.fillStyle="rgba(242,237,226,.6)"; g.font="10px monospace"; g.fillText("（還是空的）",px0-28,py0+ry+14); }
    }
    // --- 岸上的釣客（玩家本人；甩竿動畫在此演出） ---
    if(opts.interactive && FISHERS.length){
      FISHERS.forEach((f,idx)=>{
        f.t++;
        let rodAng=.9+Math.sin((t+idx*30)/60)*.04, lean=1, walkF=0; // 待機：竿斜舉
        // 玩家自由走動（人類回合）
        if(walkCtl.active && walkCtl.idx===idx){
          const sp=2.4;
          if(walkCtl.keys.l) f.x-=sp; if(walkCtl.keys.r) f.x+=sp;
          if(walkCtl.keys.u) f.gy-=1.4; if(walkCtl.keys.d) f.gy+=1.4;
          f.x=Math.max(26,Math.min(canvas.width-26,f.x));
          f.gy=Math.max(shore+6,Math.min(canvas.height-8,f.gy));
          if(walkCtl.keys.l||walkCtl.keys.r||walkCtl.keys.u||walkCtl.keys.d){ f.wf=(f.wf||0)+1; walkF=f.wf; if(f.wf%14===1) SFX.step&&SFX.step(); }
          else f.wf=0;
        }
        if(f.phase==="walkto"){ // AI 走向下竿位置
          const dx=f.walkX-f.x;
          if(Math.abs(dx)>3){ f.x+=Math.sign(dx)*2.2; f.wf=(f.wf||0)+1; walkF=f.wf; }
          else { f.phase="windup"; f.t=0; f.wf=0; }
        }
        if(f.phase==="windup"){ rodAng=1.9; lean=-3; if(f.t>22){f.phase="swing"; f.t=0; SFX.cast&&SFX.cast();} }
        else if(f.phase==="swing"){ const k=f.t/9; rodAng=1.9-k*1.35; lean=5; if(f.t>9){f.phase="fly"; f.t=0;} }
        else if(f.phase==="fly"||f.phase==="wait"){ rodAng=.55; lean=3; }
        const active=(typeof G!=="undefined")&&G.players.length&&G.turnIdx===idx&&!G.over;
        const tip=drawPixFisher(g,f.x,f.gy,rodAng,lean,active,f.name,walkF,f.st);
        // 餌飛行與釣線（目標＝實際落點座標）
        if(f.phase==="fly"){
          const k=Math.min(1,f.t/26);
          f.bobX=tip.tipX+(f.tx-tip.tipX)*k;
          f.bobY=tip.tipY+(f.ty-tip.tipY)*k - Math.sin(k*Math.PI)*56;
          g.strokeStyle="rgba(240,240,240,.6)"; g.lineWidth=1.2;
          g.beginPath(); g.moveTo(tip.tipX,tip.tipY);
          g.quadraticCurveTo((tip.tipX+f.bobX)/2,Math.min(tip.tipY,f.bobY)-18,f.bobX,f.bobY); g.stroke();
          g.fillStyle="#f2ede2"; g.fillRect(f.bobX-2,f.bobY-2,5,5);
          if(k>=1){
            f.phase="wait"; f.t=0; SFX.splash&&SFX.splash();
            for(let i=0;i<10;i++) drops.push({x:f.tx,y:f.ty,vx:(Math.random()-.5)*3.5,vy:-1.5-Math.random()*2.6,l:0});
            if(f.__res){ f.__res(); f.__res=null; }
          }
        }else if(f.phase==="wait"){
          const ty2=f.ty+Math.sin(t/9)*1.5;
          g.strokeStyle="rgba(240,240,240,.5)"; g.lineWidth=1.2;
          g.beginPath(); g.moveTo(tip.tipX,tip.tipY);
          g.quadraticCurveTo((tip.tipX+f.tx)/2,(tip.tipY+ty2)/2+16,f.tx,ty2); g.stroke();
          g.fillStyle="#f2ede2"; g.fillRect(f.tx-2,ty2-2,5,5);
        }
      });
    }else if(opts.fishermen!==false){
      // 標題頁：純剪影待機
      [[.12,10],[.38,16],[.62,12],[.88,16]].forEach(([fx,dy],i)=>{
        drawPixFisher(g,W*fx,shore+dy,.9+Math.sin((t+i*30)/60)*.04,1,false,null);
      });
    }
    // --- 水花粒子 ---
    g.fillStyle="#cfeefb";
    for(let i=drops.length-1;i>=0;i--){ const d=drops[i]; d.l++; d.x+=d.vx; d.y+=d.vy; d.vy+=.26;
      if(d.l<24) g.fillRect(d.x,d.y,3,3); else drops.splice(i,1); }
    t++; if(!canvas.__stop) requestAnimationFrame(paint);
  }
  paint();
}
/* 場景內甩竿（座標版）：小人（可先走位）→ 後拉 → 揮竿 → 餌飛向落點 → 落水 resolve */
function boardCastTo(playerIdx,tx,ty,walkFirst){
  return new Promise(res=>{
    const f=FISHERS[playerIdx];
    if(!f){ res(); return; }
    document.getElementById("board-wrap").scrollIntoView({behavior:"smooth",block:"nearest"});
    f.tx=tx; f.ty=ty; f.__res=res; f.t=0;
    if(walkFirst){
      const Wc=$("#sea-canvas").width;
      // 50%：站在落點左右任一側（±40~180）；50%：整段岸邊均勻隨機 → 左右都會有人
      const nearTx = Math.random()<.5;
      const cand = nearTx ? tx+(Math.random()<.5?-1:1)*(40+rnd(140)) : 40+rnd(Wc-80);
      f.walkX=Math.max(40,Math.min(Wc-40,cand));
      f.phase="walkto";
    }
    else f.phase="windup";
    SFX.reel&&SFX.reel(3);
    setTimeout(()=>{ if(f.__res){f.__res(); f.__res=null;} },6000); // 保險
  });
}
function resetFisher(playerIdx){ const f=FISHERS[playerIdx]; if(f){ f.phase="idle"; f.t=0; } }
/* 落點 → 依最近的隱藏點位判定機率區 */
function spotFromLanding(tx,ty){
  const cv=$("#sea-canvas");
  let best=-1,bd=1e9;
  for(let sp=0;sp<6;sp++){
    if(isBanned(sp)) continue;                       // 禁放點不列入判定區
    const dx=tx-cv.width*SPOT_POS[sp][0], dy=(ty-cv.height*SPOT_POS[sp][1])*1.6;
    const d=dx*dx+dy*dy;
    if(d<bd){bd=d; best=sp;}
  }
  return best<0?0:best;
}
/* 行走控制 */
const walkCtl={active:false, idx:0, keys:{l:false,r:false,u:false,d:false}};
window.addEventListener("keydown",e=>{
  if(!walkCtl.active) return;
  if(["ArrowLeft","a","A"].includes(e.key)){walkCtl.keys.l=true; e.preventDefault();}
  if(["ArrowRight","d","D"].includes(e.key)){walkCtl.keys.r=true; e.preventDefault();}
  if(["ArrowUp","w","W"].includes(e.key)){walkCtl.keys.u=true; e.preventDefault();}
  if(["ArrowDown","s","S"].includes(e.key)){walkCtl.keys.d=true; e.preventDefault();}
});
window.addEventListener("keyup",e=>{
  if(["ArrowLeft","a","A"].includes(e.key)) walkCtl.keys.l=false;
  if(["ArrowRight","d","D"].includes(e.key)) walkCtl.keys.r=false;
  if(["ArrowUp","w","W"].includes(e.key)) walkCtl.keys.u=false;
  if(["ArrowDown","s","S"].includes(e.key)) walkCtl.keys.d=false;
});

/* =====================================================================
   設定畫面
===================================================================== */
function bindOptRow(id,key){
  $(id).addEventListener("click",e=>{
    const b=e.target.closest(".opt"); if(!b) return;
    SFX.init(); SFX.click();
    $(id).querySelectorAll(".opt").forEach(o=>o.classList.remove("sel"));
    b.classList.add("sel"); G[key]=b.dataset.v;
    if(key==="count") G.count=+b.dataset.v;
    if(key==="mode"||key==="count") renderNameInputs();
  });
}
function renderNameInputs(){
  const box=$("#name-inputs"); if(!box) return;
  const n=G.mode==="hotseat"?G.count:1;
  const prev=[...box.querySelectorAll(".name-input")].map(i=>i.value);
  box.innerHTML="";
  for(let i=0;i<n;i++){
    const row=document.createElement("div"); row.className="name-row";
    row.innerHTML=`<label>${G.mode==="hotseat"?`玩家 ${i+1}`:"你的名字"}</label>`;
    const inp=document.createElement("input");
    inp.className="name-input"; inp.maxLength=8;
    inp.placeholder=G.mode==="hotseat"?(i===0?"玩家 1":"留空＝電腦代打"):"例如：Si Maran";
    inp.value=prev[i]||"";
    row.appendChild(inp); box.appendChild(row);
  }
  $("#name-hint").textContent = G.mode==="hotseat"
    ? "輪流操作：有填名字的位置＝真人玩家；留空的位置會由電腦代打（最多 8 字）。"
    : "輸入你的名字，會顯示在岸上的小人腳下（最多 8 字）。";
}
function playerNames(){
  return [...document.querySelectorAll("#name-inputs .name-input")].map(i=>i.value.trim());
}
function renderSiteList(){
  const box=$("#site-list"); if(!box) return;
  box.innerHTML="";
  SITE_CARDS.forEach((sc,i)=>{
    const b=document.createElement("button");
    b.className="site-card"+(i===G.siteIdx?" sel":"");
    b.appendChild(siteThumb(sc));
    const body=document.createElement("div"); body.className="sc-body";
    body.innerHTML=`<div class="sc-name">📍 ${sc.name}</div><div class="sc-desc">${sc.desc}</div>`;
    b.appendChild(body);
    b.onclick=()=>{ SFX.init(); SFX.click(); G.siteIdx=i; renderSiteList(); };
    box.appendChild(b);
  });
}
function renderRoleList(){
  const box=$("#role-list"); box.innerHTML="";
  ROLES.forEach(r=>{
    const b=document.createElement("button");
    b.className="role-card"+(r.id===G.humanRole?" sel":"");
    b.innerHTML=`<div><div class="role-name">${r.emoji} ${r.name}</div><div class="role-goal">${r.desc}</div></div>`;
    b.prepend(avatarCanvas(r,4));
    b.onclick=()=>{ SFX.click(); G.humanRole=r.id; renderRoleList(); };
    box.appendChild(b);
  });
}

/* =====================================================================
   開場劇情動畫（可跳過）
===================================================================== */
function playIntro(){
  return new Promise(res=>{
    const ov=$("#ov-intro"), cv=$("#intro-canvas"), tb=$("#intro-textbox");
    const g=cv.getContext("2d"); g.imageSmoothingEnabled=false;
    const W=cv.width,H=cv.height;
    let idx=0,t=0,charN=0,typing=true,alive=true;
    const elderCv=avatarCanvas(ROLES[4],10);
    const roleCvs=ROLES.map(r=>avatarCanvas(r,7));
    const roleCvsById={}; ROLES.forEach((r,i)=>roleCvsById[r.id]=roleCvs[i]);
    const fishCvs=[speciesByName["Ilek"],speciesByName["Cilat"],speciesByName["Tapez"],speciesByName["Malan"]].map(sp=>fishCanvas(sp,6));
    ov.classList.add("show");

    function skySea(warm){
      const horizon=H*.34;
      const sky=warm?["#1c2f52","#2a4a74","#4a6d94","#c97e52","#e8a45f"]:["#152238","#1c2f52","#2a4a74","#3d5c84","#4a6d94"];
      const sbh=horizon/sky.length;
      sky.forEach((c,i)=>{g.fillStyle=c; g.fillRect(0,i*sbh,W,sbh+2);});
      const bands=["#0e3a63","#155a95","#1b6bad","#2280c4","#2b93d6"]; // 遠深近淺
      const bh=(H-horizon)/bands.length;
      bands.forEach((c,i)=>{g.fillStyle=c; g.fillRect(0,horizon+i*bh,W,bh+2);});
      g.fillStyle="rgba(255,255,255,.2)";
      for(let i=0;i<16;i++){
        const y=horizon+((i*31+t*(.5+i%3*.3))%(H-horizon-8));
        const x=(i*83+t*(1+i%3))%(W+60)-30;
        g.fillRect(x,y,10+(i%3)*5,3);
      }
      return horizon;
    }
    function drawScene(name){
      g.clearRect(0,0,W,H);
      if(name==="dawn"){
        const hz=skySea(true);
        const rise=Math.min(1,t/140);
        const sy=hz+16-rise*38;
        g.fillStyle="#ffdf8a"; g.fillRect(W*.62-16,sy-16,32,32); g.fillRect(W*.62-11,sy-21,22,42);
        g.fillStyle="rgba(255,200,120,.25)";
        for(let i=0;i<6;i++){const y=hz+8+i*10,w=34-i*4; g.fillRect(W*.62-w/2,y,w,3);}
      }
      else if(name==="elder"){
        skySea(true);
        g.fillStyle="#4e4a44"; g.fillRect(0,H*.56,W,H*.44);
        g.fillStyle="#66604f"; for(let i=0;i<6;i++) g.fillRect((i*103)%W,H*.56-(6+(i%3)*6),56,16);
        const bob=Math.sin(t/35)*2;
        g.drawImage(elderCv,W/2-elderCv.width/2,H*.56-elderCv.height+6+bob);
        // 說話氣泡點
        g.fillStyle="rgba(255,255,255,.85)";
        for(let i=0;i<3;i++){ if((t/20|0)%4>i) g.fillRect(W/2+elderCv.width/2+8+i*10,H*.24-i*8,5,5); }
      }
      else if(name==="family"){
        skySea(false);
        g.fillStyle="#4e4a44"; g.fillRect(0,H*.56,W,H*.44);
        const list=G.players.length?G.players.map(pl=>roleCvsById[pl.role.id]):roleCvs;
        const gap=W/(list.length+1);
        list.forEach((c,i)=>{
          const bob=Math.sin(t/30+i*1.3)*3;
          g.drawImage(c,gap*(i+1)-c.width/2,H*.56-c.height+4+bob);
        });
      }
      else if(name==="share"){
        skySea(false);
        g.fillStyle="#4e4a44"; g.fillRect(0,H*.56,W,H*.44);
        const a=G.players[0]?roleCvsById[G.players[0].role.id]:roleCvs[1];
        const b=G.players[1]?roleCvsById[G.players[1].role.id]:roleCvs[4];
        g.drawImage(a,W*.18-a.width/2,H*.56-a.height+4);
        g.drawImage(b,W*.82-b.width/2,H*.56-b.height+4);
        // 魚在兩人之間傳遞
        fishCvs.forEach((c,i)=>{
          const ph=(t/90+i*.25)%1;
          const x=W*.22+ph*(W*.56-c.width), y=H*.40+Math.sin(ph*Math.PI)*-30;
          g.globalAlpha=.95; g.drawImage(c,x,y); g.globalAlpha=1;
        });
      }
      else if(name==="depart"){
        const hz=skySea(true);
        g.fillStyle="#4e4a44"; g.fillRect(0,H*.56,W,H*.44);
        g.fillStyle="#66604f"; for(let i=0;i<6;i++) g.fillRect((i*103)%W,H*.56-(6+(i%3)*6),56,16);
        // 出發的釣客 = 實際玩家（人數與角色外觀一致）
        const n=G.players.length||4;
        for(let i=0;i<n;i++){
          const x=W*((i+1)/(n+1)), gy=H*.56+8;
          const r=G.players[i]?G.players[i].role:ROLES[i%5];
          const st={skin:r.skin,cloth:r.cloth,hair:r.id===4?"#e8e8e8":(r.id===1?"#c1272d":"#12100e"),
                    beard:r.id===4,baby:r.id===3,cane:r.id===4,u:r.id===0?3:4};
          drawPixFisher(g,x,gy,1.15+Math.sin(t/25+i)*.05,1,false,G.players[i]?G.players[i].name:null,0,st);
        }
        // 目標字樣
        g.fillStyle="rgba(245,197,66,.95)"; g.font="bold 22px 'Press Start 2P',monospace";
        g.fillText(`${CFG.rounds} ROUNDS / ${CFG.goal} FISH`, W/2-176, hz*.5+Math.sin(t/40)*3);
      }
    }
    function renderText(){
      const sc=INTRO_SCENES[idx];
      const full=sc.text;
      const shown=full.slice(0,charN).replace(/\n/g,"<br>");
      tb.innerHTML=(sc.speaker?`<span class="speaker">${sc.speaker}</span>`:"")+shown+(typing?"▌":"");
      $("#intro-next").style.visibility=typing?"hidden":"visible";
    }
    function loop(){
      if(!alive) return;
      drawScene(INTRO_SCENES[idx].scene);
      if(typing && t%2===0){
        charN++;
        if(charN%3===1) SFX.click&&0; // 保持安靜的打字
        if(charN>=INTRO_SCENES[idx].text.length){ typing=false; }
        renderText();
      }
      t++; requestAnimationFrame(loop);
    }
    function advance(){
      SFX.click();
      if(typing){ charN=INTRO_SCENES[idx].text.length; typing=false; renderText(); return; }
      idx++;
      if(idx>=INTRO_SCENES.length) return finish();
      charN=0; typing=true; t=0; SFX.flip();
      if(INTRO_SCENES[idx].scene==="depart") SFX.good();
      renderText();
    }
    function finish(){
      alive=false; ov.classList.remove("show");
      $("#intro-stage").onclick=null; $("#btn-intro-skip").onclick=null;
      SFX.splash(); res();
    }
    const stage=$("#intro-stage");
    stage.onclick=advance;
    $("#btn-intro-skip").onclick=e=>{ e.stopPropagation(); finish(); };
    charN=0; typing=true; renderText(); loop();
  });
}

/* =====================================================================
   開局
===================================================================== */
const AI_NAMES=["Si Manok","Si Vakong","Si Ngalolog","Si Kalaw"];
async function launchGame(){
  SFX.init(); SFX.splash();
  await playIntro();
  // 角色分配
  const site=SITE_CARDS[G.siteIdx];
  let pool=ROLES.map(r=>r.id).filter(id=>id!==G.humanRole);
  pool=shuffle(pool);
  const nm=playerNames();
  let aiIdx=0;
  const playerData=[];
  for(let i=0;i<G.count;i++){
    // 多人模式：有填名字＝真人；留空＝電腦代打（第 1 位固定真人）
    const human = G.mode==="hotseat" ? (i===0 || !!nm[i]) : i===0;
    const roleId = i===0?G.humanRole:pool[i-1];
    let name;
    if(G.mode==="hotseat") name = nm[i] || (i===0?"玩家 1":`🤖 ${AI_NAMES[aiIdx++]}`);
    else name = i===0 ? (nm[0]||"你") : AI_NAMES[aiIdx++];
    playerData.push({ name, human, role:ROLES[roleId] });
  }
  Object.assign(G, createGameState({ site, players: playerData }), {
    actionDeck: buildActionDeck(site),
    envDeck: buildEnvDeck(),
    activeBanned: new Set(),
    busy: false,
  });
  // 集體目標 = 所有角色最低需求加總
  CFG.goal = playerData.reduce((sum, p) => sum + (p.role.need || 0), 0);
  pickBannedSpots();
  refillSpots();
  // 岸上小人 = 每位玩家（沿著礁岩排開）
  FISHERS.length=0;
  const bc=$("#sea-canvas");
  for(let i=0;i<G.count;i++){
    const r=G.players[i].role;
    FISHERS.push({ x:bc.width*((i+1)/(G.count+1)), gy:bc.height*.80+(i%2?16:9),
      phase:"idle", t:0, spot:0, name:G.players[i].name,
      st:{ skin:r.skin, cloth:r.cloth,
           hair:r.id===4?"#e8e8e8":(r.id===1?"#c1272d":"#12100e"), // 阿公白髮／成年男子紅頭巾
           beard:r.id===4, baby:r.id===3, cane:r.id===4,
           u:r.id===0?3:4 } });                                     // 小孩體型較小
  }
  $("#log").innerHTML="";
  addLog(`🎣 釣魚去！今天的釣場：<b>📍 ${G.site.name}</b> — ${G.site.desc}（場上共 ${G.site.total} 張魚牌）${CFG.rounds} 回合內全體目標 ${CFG.goal} 條魚。`,"lg-sys");
  renderPlayers();
  showScreen("#screen-game");
  nextTurn();
}

/* =====================================================================
   回合流程
===================================================================== */
function setBanner(html,btns=[]){
  $("#turn-banner").innerHTML=html;
  const box=$("#action-btns"); box.innerHTML="";
  btns.forEach(b=>{
    const el=document.createElement("button");
    el.className="pixel-btn "+(b.cls||""); el.textContent=b.label; el.onclick=b.fn;
    box.appendChild(el);
  });
}

async function nextTurn(){
  if(G.over) return;
  renderPlayers();
  const p=G.players[G.turnIdx];
  SFX.turn();
  if(p.rest>0){
    setBanner(`😴 <span class="who">${p.name}</span> 休息中（處理釣組）`);
    await toast(`😴 ${p.name} 本回合休息`,1800);
    p.rest--;
    addLog(`${p.name} 休息一回合。`,"");
    return endTurn();
  }
  if(p.human){
    humanTurn(p);
  }else{
    setBanner(`🤖 <span class="who">${p.name}</span> 正在觀察海面、尋找下竿位置⋯`);
    await sleep(1400);
    const sp=aiPickSpot(p);
    const cv=$("#sea-canvas");
    const tx=cv.width*SPOT_POS[sp][0]+(Math.random()-.5)*30;
    const ty=cv.height*SPOT_POS[sp][1]+(Math.random()-.5)*16;
    await boardCastTo(p.idx,tx,ty,true);   // AI 也會走到岸邊位置再甩竿
    await sleep(400);
    await doFishing(p,spotFromLanding(tx,ty));
  }
}

/* ---------------- 人類回合：自由走動 → 直接點擊海面甩竿 ---------------- */
const ZONE_NAME=["近岸","近岸","中程","中程","外海","外海"];
function humanTurn(p){
  walkCtl.active=true; walkCtl.idx=p.idx;
  walkCtl.keys={l:false,r:false,u:false,d:false};
  setBanner(`🎣 <span class="who">${p.name}</span>：用 ◀▶（或方向鍵）走位，<b>直接點擊海面</b>就會朝那裡甩竿`,[]);
  const box=$("#action-btns"); box.innerHTML="";
  [["l","◀"],["r","▶"]].forEach(([k,label])=>{
    const b=document.createElement("button");
    b.className="pixel-btn blue dpad-btn";
    b.textContent=label;
    const on=e=>{e.preventDefault(); walkCtl.keys[k]=true;};
    const off=()=>{walkCtl.keys[k]=false;};
    b.addEventListener("pointerdown",on);
    b.addEventListener("pointerup",off); b.addEventListener("pointerleave",off); b.addEventListener("pointercancel",off);
    box.appendChild(b);
  });
  // 點擊海面 = 甩竿
  const cv=$("#sea-canvas");
  cv.style.cursor="crosshair";
  cv.onclick=e=>{
    if(G.busy) return;
    const r=cv.getBoundingClientRect();
    const x=(e.clientX-r.left)*cv.width/r.width;
    const y=(e.clientY-r.top)*cv.height/r.height;
    const horizon=cv.height*.26, shoreY=cv.height*.80;
    if(y<horizon+8||y>shoreY-6){ toast("請點擊海面的位置 🌊",900); return; }
    performCast(p,x,y);
  };
}
async function performCast(p,cx,cy){
  const cv=$("#sea-canvas");
  cv.onclick=null; cv.style.cursor="";
  walkCtl.active=false;
  G.busy=true;
  const horizon=cv.height*.26, shoreY=cv.height*.80;
  // 落點 = 點擊位置 + 少量誤差
  let tx=cx+(Math.random()-.5)*26;
  let ty=cy+(Math.random()-.5)*18;
  tx=Math.max(18,Math.min(cv.width-18,tx));
  ty=Math.max(horizon+12,Math.min(shoreY-10,ty));
  $("#action-btns").innerHTML="";
  await boardCastTo(p.idx,tx,ty,false);
  const sp=spotFromLanding(tx,ty);
  addLog(`${p.name} 朝海甩竿，釣線落在<b>${ZONE_NAME[sp]}</b>水域。`);
  await sleep(400);
  await doFishing(p,sp);
}

/* 纏線對象：依岸上實際位置，找離自己最近的玩家 */
function nearestPlayer(p){
  const me=FISHERS[p.idx];
  let best=null,bd=1e9;
  G.players.forEach(q=>{
    if(q===p) return;
    const f=FISHERS[q.idx];
    const d=me&&f ? Math.hypot(f.x-me.x,(f.gy-me.gy)*2) : Math.abs(q.idx-p.idx)*100;
    if(d<bd){bd=d; best=q;}
  });
  return best||G.players[(G.turnIdx+1)%G.players.length];
}

/* AI 選點：魚牌面朝下，AI 跟玩家一樣只能靠「深度」推測 —
   越深的點位越可能藏珍稀魚（成功率也越低）。缺目標魚時偏好冒險。 */
function aiPickSpot(p){
  let best=0,bestScore=-1;
  const needTarget=p.role.target&&!p.catch.some(c=>p.role.target.includes(c.name));
  const total=G.players.reduce((a,q)=>a+q.catch.length,0);
  const behind=total < (G.round-1)*1.5;           // 集體進度落後 → 全隊優先衝數量
  for(let s=0;s<6;s++){
    if(isBanned(s)||!G.spots[s].length) continue; // 只能看見牌數，看不見內容
    const d=Math.min(s+1,5);
    const pOk=G.site.rule==="gt" ? (6-d)/6 : (7-d)/6;   // 骰 vs 魚難度（依場地判定邏輯）
    let val=1+s*.25 + Math.min(1,G.spots[s].length*.2);   // 深度期望 + 魚多較不易撲空
    if(needTarget && !behind && G.round<=11) val+= s>=3 ? 1.5 : 0; // 前中期才去深水區賭目標魚
    if(behind || p.catch.length<p.role.need) val+= s<=2 ? 1.3 : 0; // 落後或缺數量 → 求穩
    if(p.catch.length>=p.role.need&&!needTarget) val*=.85;
    const score=pOk*val + Math.random()*.3;
    if(score>bestScore){bestScore=score; best=s;}
  }
  return best;
}

/* ---------------- 抽行動卡 → 判定 → 取魚 ---------------- */
/* 階段一：命運卡。回傳物件 {proceed, flags} — proceed=true 才進入拉竿階段 */
async function drawDestiny(p){
  if(!G.destinyDeck||!G.destinyDeck.length) G.destinyDeck=buildDestinyDeck(G.site);
  const c=G.destinyDeck.pop();
  addLog(`🔮 ${p.name} 的命運卡：「${c.title}」— ${c.content}`);
  await showCard("destiny",{animType:c.t,emoji:"🔮",title:c.title,desc:c.content,flavor:c.result},p.human);
  const flags={swallow:false,double:false,hooked:false};
  switch(c.kind){
    case "fail":
      SFX.bad(); await toast(`😮‍💨 ${c.title}⋯本回合沒有漁獲`);
      addLog(`${p.name} 運氣不佳（${c.title}），沒有漁獲。`,"lg-bad");
      return {proceed:false,flags};
    case "snag":{
      const roll=await rollDice(p,"擲骰 ≤3 魚鉤收不回來，需休息一回合",r=>r>3);
      if(roll<=3){ p.rest=1; addLog(`${p.name} 釣到地球（骰 ${roll}），下回合休息處理釣具。`,"lg-bad"); }
      else addLog(`${p.name} 順利收回魚鉤（骰 ${roll}），但本回合沒有漁獲。`,"");
      return {proceed:false,flags};
    }
    case "tangle":{
      const nxt=nearestPlayer(p);
      const roll=await rollDice(p,"擲骰 ≤3 釣具損壞，與身旁玩家一起休息",r=>r>3);
      if(roll<=3){ p.rest=1; nxt.rest=Math.max(nxt.rest,1); SFX.bad();
        addLog(`${p.name} 與<b>站在旁邊的 ${nxt.name}</b> 纏線（骰 ${roll}），兩人下回合休息。`,"lg-bad");
        await toast(`🪢 纏線！${p.name} 與 ${nxt.name} 一起休息`); }
      else addLog(`${p.name} 解開了纏線（骰 ${roll}），但本回合沒有漁獲。`,"");
      return {proceed:false,flags};
    }
    case "wind":{
      const roll=await rollDice(p,"風太大！擲骰 >2 魚餌才能順利入海",r=>r>2);
      if(roll>2){ addLog(`${p.name} 頂著大風把餌送進海裡（骰 ${roll}），進入拉竿階段！`,"lg-ok"); return {proceed:true,flags}; }
      addLog(`${p.name} 的餌被風吹走了（骰 ${roll}），沒有漁獲。`,"lg-bad");
      await toast("🌬️ 餌被風吹走了⋯"); return {proceed:false,flags};
    }
    case "eel":{
      const roll=await rollDice(p,"海鰻來了！擲骰 >2 保住漁獲",r=>r>2);
      if(roll<=2&&p.catch.length){
        const f=p.catch.splice(rnd(p.catch.length),1)[0]; G.fishSupply.push(f); G.fishSupply=shuffle(G.fishSupply);
        SFX.eel(); renderPlayers();
        addLog(`🐍 海鰻偷走了 ${p.name} 的 <b>${f.name}</b>（骰 ${roll}）！`,"lg-bad");
        await toast(`🐍 海鰻偷走了 ${f.name}！`);
      } else addLog(`${p.name} 趕跑了海鰻（骰 ${roll}），漁獲保住了。`,"lg-ok");
      return {proceed:false,flags};
    }
    case "bigwave":{
      const roll=await rollDice(p,"大浪來襲！擲骰 >2 抬腳躲過",r=>r>2);
      if(roll<=2){ p.rest=1; addLog(`💥 ${p.name} 被浪撲倒（骰 ${roll}），下回合休息。`,"lg-bad"); }
      else addLog(`${p.name} 抬腳躲過大浪（骰 ${roll}）！`,"lg-ok");
      return {proceed:false,flags};
    }
    case "go_swallow": flags.swallow=true; flags.hooked=true; return {proceed:true,flags};
    case "go_double":  flags.double=true;  flags.hooked=true; return {proceed:true,flags};
    default: flags.hooked=true; return {proceed:true,flags};   // go（魚已上鉤語境）
  }
}

async function doFishing(p,spot){
  G.busy=true;
  // ---- 階段一：命運卡 ----
  const destiny=await drawDestiny(p);
  if(!destiny.proceed){ return endTurn(); }
  // ---- 階段二：拉竿卡 ----
  // 單鈎命運時，跳過「雙鈎」行動卡，避免情境矛盾
  let card;
  do {
    if(!G.actionDeck.length) G.actionDeck=buildActionDeck(G.site);
    card=G.actionDeck.pop();
  } while(!destiny.flags.double && card==="double");
  // 語境切換：魚已上鉤（命運中魚/吞鉤/雙鉤）時使用收線階段的敘述，避免「餌才掉」等矛盾
  const info=(destiny.flags.hooked&&ACTION_INFO[card].hooked)?ACTION_INFO[card].hooked:ACTION_INFO[card];
  addLog(`${p.name} 在${ZONE_NAME[spot]}拉竿，抽到「${info.title}」。`);
  await showCard("action",info,p.human);
  switch(card){
    case "baitlost":
      SFX.bad(); await toast("🪱 魚餌掉了⋯本次行動結束");
      addLog(`${p.name} 的魚餌掉了，沒有漁獲。`,"lg-bad");
      break;
    case "snag":
      SFX.bad(); p.rest=1;
      await toast("🪨 釣到地球！下回合休息");
      addLog(`${p.name} 釣到底礁，設備損壞，下回合休息。`,"lg-bad");
      break;
    case "swallow":{
      let swSrc=spot;
      if(!G.spots[swSrc].length){
        let nb=[0,1,2,3,4,5].filter(s2=>!isBanned(s2)&&G.spots[s2].length);
        if(!nb.length && ensureBoardHasFish()){            // 場面抓乾 → 先從魚庫補魚
          nb=[0,1,2,3,4,5].filter(s2=>!isBanned(s2)&&G.spots[s2].length);
          addLog(`補充堆遞補：深處游來新的魚群。`,"lg-sys");
        }
        if(nb.length){
          const near=nb.filter(s2=>Math.abs(s2-spot)===1);
          swSrc=near.length?near[rnd(near.length)]:nb[rnd(nb.length)];
          if(swSrc!==spot) addLog(`啟動「鄰近遞補」：由鄰近水域補上一條！`,"lg-sys");
        }
      }
      if(G.spots[swSrc].length){
        const f=G.spots[swSrc].splice(rnd(G.spots[swSrc].length),1)[0];
        p.catch.push(f); p.rest=1;
        SFX.good(); splashFX();
        await showCatch(p,[f],"吞鉤穩拿！但下回合要休息");
        addLog(`${p.name} 吞鉤穩拿 <b>${f.name}</b>，下回合休息。`,"lg-ok");
      }else{
        await toast("點位沒有魚⋯"); addLog(`${p.name} 的點位沒有魚。`,"lg-bad");
      }
      break;
    }
    case "tangle":{
      const nxt=nearestPlayer(p);
      const roll=await rollDice(p,`纏線判定：擲出 ≥ 3 才能解開`,r=>r>=3);
      if(roll<3){
        p.rest=1; nxt.rest=Math.max(nxt.rest,1);
        SFX.bad();
        addLog(`${p.name} 與<b>站在旁邊的 ${nxt.name}</b> 魚線纏在一起（骰 ${roll}），兩人下回合一起休息。`,"lg-bad");
        await toast(`🪢 纏線失敗！${p.name} 與身旁的 ${nxt.name} 一起休息`);
      }else{
        addLog(`${p.name} 順利解開纏線（骰 ${roll}），但本次無漁獲。`,"");
        await toast("🪢 解開了！但這竿沒有漁獲");
      }
      break;
    }
    case "hit": case "double":{
      const take=card==="double"?2:1;
      const wantN=Math.min(2, take + (destiny.flags.double?1:0));   // 上限 2 條
      const got=[];
      for(let k=0;k<wantN;k++){
        let src=spot;
        if(!G.spots[src].length){
          let nb=[0,1,2,3,4,5].filter(s2=>!isBanned(s2)&&G.spots[s2].length);
          if(!nb.length && ensureBoardHasFish()){          // 場面抓乾 → 先從魚庫補魚
            nb=[0,1,2,3,4,5].filter(s2=>!isBanned(s2)&&G.spots[s2].length);
            addLog(`補充堆遞補：深處游來新的魚群。`,"lg-sys");
          }
          if(!nb.length){                                   // 連魚庫都空了才是真的沒魚
            if(k===0){ await toast("這片水域沒有魚⋯"); addLog(`${p.name} 的水域空空如也。`,"lg-bad"); }
            break;
          }
          // 優先找最近的點位，其次全域隨機
          const near=nb.filter(s2=>Math.abs(s2-spot)===1);
          src=near.length?near[rnd(near.length)]:nb[rnd(nb.length)];
          if(src!==spot) addLog(`啟動「鄰近遞補」：由鄰近水域補上一條！`,"lg-sys");
        }
        const f=G.spots[src].splice(rnd(G.spots[src].length),1)[0];
        if(fishAuto(f,G.site)){                                     // 難度 1 於 ≥ 場地：自動捕獲
          got.push(f); SFX.good();
          addLog(`${p.name} 拉起 <b>${f.name}</b>（難度 1）— <b>自動捕獲</b>，不需判定！`,"lg-ok");
          await toast(`🐟 ${f.name} 上鉤即獲！（自動捕獲）`,1400);
        }else{
          const roll=await rollDice(p,`${f.name} 上鉤了！難度 ${f.diff}：${fishNeedText(f,G.site)}`,r=>fishPass(r,f,G.site),{fight:true,fish:f});
          if(fishPass(roll,f,G.site)){ got.push(f); addLog(`${p.name} 骰出 ${roll}，成功捕獲 <b>${f.name}</b>（難度 ${f.diff}）！`,"lg-ok"); }
          else{
            G.spots[src].push(f); SFX.bad();                        // 掙脫的魚回到海裡
            addLog(`${p.name} 骰出 ${roll}，<b>${f.name}</b> 掙脫游走了（${fishNeedText(f,G.site)}）。`,"lg-bad");
            await toast(`🎲 ${roll} 點⋯${f.name} 掙脫了`);
          }
        }
        if(got.length>=wantN) break;
      }
      if(got.length){
        got.forEach(f=>p.catch.push(f));            // ★ 實際入袋：全體/個人/水窪同步反映
        renderPlayers();
        if(destiny.flags.swallow){ p.rest=1; addLog(`${p.name} 的魚吞鉤了，下回合休息處理。`,""); }
        (got.length>1?SFX.great:SFX.good)(); splashFX();
        await showCatch(p,got,got.length>1?"雙鉤中魚！豐收！":"成功拉竿！");
      }
      break;
    }
  }
  endTurn();
}

/* ---------------- 環境卡動畫 ---------------- */
let __envAnimStop=null;
function envAnim(type){
  const cv=$("#c-anim"), g=cv.getContext("2d"); g.imageSmoothingEnabled=false;
  const W=cv.width,H=cv.height;
  let t=0, alive=true;
  const drops=[];
  function sea(level){
    const wy=H*level;
    drawSeaBands(g,W,H,wy);
    g.fillStyle="rgba(255,255,255,.28)";
    for(let i=0;i<7;i++) g.fillRect((i*47+t*1.4)%(W+30)-15, wy+4+(i*17)%(H-wy-8), 9,2);
    return wy;
  }
  const fishShadow=(x,y,dir,c)=>drawFishShadow(g,x,y,dir,c);
  function sitter(x,gy,flip){
    const u=3,d=flip?-1:1;
    g.fillStyle="#12100e"; g.fillRect(x,gy-8*u,3*u,3*u);
    g.fillStyle="#c1272d"; g.fillRect(x,gy-8*u,3*u,u);
    g.fillStyle="#1a1512"; g.fillRect(x,gy-5*u,3*u,4*u);
    g.fillRect(x+d*2*u,gy-2*u,2*u,u); // 曲腿
  }
  function loop(){
    if(!alive) return;
    g.clearRect(0,0,W,H);
    if(type==="calm"){
      const wy=sea(.42);
      g.fillStyle="#ffdf8a"; g.fillRect(W*.7-9,wy-26,18,18); // 太陽
      g.fillStyle="rgba(255,223,138,.4)"; g.fillRect(W*.7-14,wy-4,28,4);
      if(t%40<20) fishShadow(W*.3+Math.sin(t/30)*10,wy+22,1);
    }
    else if(type==="eel"){
      // 場景：海（左）+ 岩岸（右）+ 岸上小水窪 —— 海鰻爬上岸偷水窪裡的漁獲！
      const wy=sea(.34);
      g.fillStyle="#4e4a44"; g.fillRect(W*.34,H*.60,W,H*.40);            // 岩岸
      g.fillStyle="#66604f"; g.fillRect(W*.34,H*.60-6,W*.3,10); g.fillRect(W*.7,H*.60-4,W*.3,8);
      // 小水窪
      const px0=W*.72, py0=H*.80;
      g.fillStyle="#867e6c"; g.beginPath(); g.ellipse(px0,py0,34,13,0,0,7); g.fill();
      g.fillStyle="#155a95"; g.beginPath(); g.ellipse(px0,py0,28,10,0,0,7); g.fill();
      g.fillStyle="#2b93d6"; g.beginPath(); g.ellipse(px0-5,py0-2,19,6,0,0,7); g.fill();
      // 水窪裡的漁獲（金魚跳動）
      const k=Math.min(1,t/78);
      if(k<1){ const hop=Math.abs(Math.sin(t*.15))*8;
        fishShadow(px0-4,py0-2-hop,1,"#f2c94c"); fishShadow(px0+10,py0,1,"rgba(6,20,36,.7)"); }
      else fishShadow(px0+10,py0,1,"rgba(6,20,36,.7)");
      // 海鰻：從海裡上岸 → 蛇行爬向水窪
      const sx0=W*.10, sy0=wy+14;
      const ex=sx0+(px0-30-sx0)*k, ey=sy0+(py0-sy0)*Math.pow(k,1.4);
      g.strokeStyle="#5a6b3a"; g.lineWidth=7; g.lineCap="round";
      g.beginPath();
      for(let i=0;i<=8;i++){ const bx2=ex-i*11, by2=ey+Math.sin(t*.3+i*.9)*(k<1?5:2);
        i?g.lineTo(bx2,by2):g.moveTo(bx2,by2); }
      g.stroke();
      g.fillStyle="#e8e8e8"; g.fillRect(ex+2,ey-5,3,3);                   // 眼
      if(k>=1){ // 叼著金魚倒退溜回海裡
        const k2=Math.min(1,(t-78)/64);
        const rx=px0-30-(px0-30-sx0)*k2, ry=py0-(py0-sy0)*Math.pow(k2,.7);
        fishShadow(rx+16,ry-4,1,"#f2c94c");
        g.strokeStyle="#5a6b3a"; g.lineWidth=7;
        g.beginPath();
        for(let i=0;i<=8;i++){ const bx2=rx-i*11, by2=ry+Math.sin(t*.35+i*.9)*4;
          i?g.lineTo(bx2,by2):g.moveTo(bx2,by2); }
        g.stroke();
        if(k2>0&&k2<0.15&&t%4===0){ g.fillStyle="#cfeefb"; for(let d2=0;d2<3;d2++) g.fillRect(px0-14+rnd(28),py0-6,3,3); }
      }
    }
    else if(type==="hightide"||type==="lowtide"){
      const from=type==="hightide"?.55:.3, to=type==="hightide"?.28:.55;
      const k=Math.min(1,t/80);
      const wy=sea(from+(to-from)*k);
      if(type==="lowtide"){ g.fillStyle="#66604f"; g.fillRect(W*.1,H-16,26,16); g.fillRect(W*.6,H-13,34,13); } // 退潮露礁
      // 魚群移動
      for(let i=0;i<4;i++) fishShadow((W*.2+i*40+t*1.6)%(W+30)-15, wy+18+(i%2)*16, 1);
      g.fillStyle="rgba(255,255,255,.5)";
      for(let x=0;x<W;x+=12) g.fillRect(x,wy-2+Math.sin(t/10+x/16)*2,8,3);
    }
    else if(type==="wave"){
      const wy=sea(.4);
      // 礁岩上的小人單腳站立
      g.fillStyle="#4e4a44"; g.fillRect(W*.62,H-22,W,22);
      const u=3, x=W*.74, gy=H-22;
      g.fillStyle="#12100e"; g.fillRect(x,gy-9*u,3*u,3*u);
      g.fillStyle="#c1272d"; g.fillRect(x,gy-9*u,3*u,u);
      g.fillStyle="#1a1512"; g.fillRect(x,gy-6*u,3*u,4*u);
      g.fillRect(x+u,gy-2*u,u,2*u); // 單腳！
      g.fillRect(x+2.4*u,gy-3*u,u,u); // 另一腳抬起
      // 大浪撲來
      const k=(t%90)/90;
      const wxr=k*W*1.1;
      g.fillStyle="rgba(220,244,252,.85)";
      g.beginPath(); g.moveTo(wxr-70,wy+30);
      g.quadraticCurveTo(wxr-20,wy-34,wxr,wy+8);
      g.quadraticCurveTo(wxr-30,wy+2,wxr-70,wy+30); g.fill();
      if(Math.abs(wxr-x)<24&&t%3===0) for(let i=0;i<4;i++) drops.push({x:x+rnd(20)-10,y:gy-20,vx:(Math.random()-.5)*3,vy:-2-Math.random()*2,l:0});
    }
    else if(type==="escape"){
      // 水窪裡的魚奮力跳出、逃回大海
      const wy=sea(.34);
      g.fillStyle="#4e4a44"; g.fillRect(W*.34,H*.60,W,H*.40);
      g.fillStyle="#66604f"; g.fillRect(W*.34,H*.60-6,W*.66,10);
      const px0=W*.70, py0=H*.80;
      g.fillStyle="#867e6c"; g.beginPath(); g.ellipse(px0,py0,34,13,0,0,7); g.fill();
      g.fillStyle="#155a95"; g.beginPath(); g.ellipse(px0,py0,28,10,0,0,7); g.fill();
      const k=(t%90)/90;
      const fx=px0-k*(px0-W*.12), fy=py0-Math.sin(k*Math.PI)*54+(k>.8?(k-.8)*40:0);
      g.save(); g.translate(fx,fy); g.rotate(-.6+k*1.2);
      g.fillStyle="#f2c94c"; g.beginPath(); g.ellipse(0,0,9,4,0,0,7); g.fill();
      g.fillStyle="#fbeec2"; g.beginPath(); g.moveTo(-8,0); g.lineTo(-13,-4); g.lineTo(-13,4); g.fill();
      g.restore();
      if(t%90===0||t%90===88) for(let i=0;i<5;i++) drops.push({x:fx,y:fy+4,vx:(Math.random()-.5)*3,vy:-1.5-Math.random()*2,l:0});
      fishShadow(px0+8,py0,1,"rgba(6,20,36,.7)"); // 還沒逃的
    }
    else if(type==="chat"){
      // 夕色天空 + 兩人坐著聊天
      g.fillStyle="#c97e52"; g.fillRect(0,0,W,H*.32);
      g.fillStyle="#e8a45f"; g.fillRect(0,H*.32,W,H*.18);
      const bands2=["#8a6a8f","#5c5480","#3a4468"]; const bh2=(H*.5)/3;
      bands2.forEach((c,i)=>{g.fillStyle=c; g.fillRect(0,H*.5+i*bh2,W,bh2+2);});
      g.fillStyle="rgba(255,220,170,.35)";
      for(let i=0;i<6;i++) g.fillRect((i*41+t)%(W+20)-10,H*.52+(i*13)%(H*.4),9,2);
      g.fillStyle="#4e4a44"; g.fillRect(0,H-24,W,24);
      sitter(W*.36,H-24+6,false); sitter(W*.55,H-24+6,true);
      g.fillStyle="rgba(255,255,255,.9)";
      for(let i=0;i<3;i++) if((t/16|0)%4>i) g.fillRect(W*.44+i*7,H-52-i*5,4,4);
    }
    tickDrops(g,drops);
    t++; requestAnimationFrame(loop);
  }
  loop();
  return ()=>{ alive=false; };
}

/* ---------------- 命運卡動畫：依每張卡的文字敘述繪製 ---------------- */
function destinyAnim(t){
  const cv=$("#c-anim"), g=cv.getContext("2d"); g.imageSmoothingEnabled=false;
  const W=cv.width,H=cv.height;
  let tt=0, alive=true; const drops=[];
  function base(rockRight=true){
    const wy=H*.40;
    drawSeaBands(g,W,H,wy);
    g.fillStyle="rgba(255,255,255,.25)";
    for(let i=0;i<6;i++) g.fillRect((i*43+tt*1.3)%(W+30)-15, wy+5+(i*15)%(H-wy-10), 9,2);
    if(rockRight) drawRockRight(g,W,H);
    return wy;
  }
  function angler(x,gy,rodAng,lean=1){
    const st=(typeof G!=="undefined"&&G.players.length&&FISHERS[G.turnIdx])?FISHERS[G.turnIdx].st:null;
    return drawPixFisher(g,x,gy,rodAng,lean,false,null,0,Object.assign({skin:"#d8a878",cloth:"#c1272d",hair:"#12100e",u:3},st||{},{u:3}));
  }
  function bob(x,y){ g.fillStyle="#f2ede2"; g.fillRect(x-2,y-2,5,5); }
  function excl(x,y,c="#f5c542"){ g.fillStyle=c; g.fillRect(x,y,4,10); g.fillRect(x,y+13,4,4); }
  const fishS=(x,y,dir,c)=>drawFishShadow(g,x,y,dir,c);
  function loop(){
    if(!alive) return;
    g.clearRect(0,0,W,H);
    const wy=base();
    const gx=W*.80, gy=H*.62;
    if(t==="surge"){ const tip=angler(gx,gy,.9); // 湧浪拍上岸淋濕
      const k=(tt%80)/80, wx=W*.2+k*(gx-W*.2);
      g.fillStyle="rgba(220,244,252,.85)";
      g.beginPath(); g.moveTo(wx-56,wy+26); g.quadraticCurveTo(wx-12,wy-30,wx,wy+8); g.quadraticCurveTo(wx-26,wy+4,wx-56,wy+26); g.fill();
      if(Math.abs(wx-gx)<26&&tt%3===0) for(let i=0;i<5;i++) drops.push({x:gx-8+rnd(20),y:gy-34,vx:(Math.random()-.5)*3,vy:-2-Math.random()*2,l:0});
    }
    else if(t==="baitoff"){ const tip=angler(gx,gy,1.5,-2); // 甩出去餌就掉
      const k=Math.min(1,(tt%90)/50);
      const bx=tip.tipX-(k*70), by=tip.tipY+k*k*66;
      g.fillStyle="#e88a7a"; g.fillRect(bx,by,5,5); // 掉落的餌
      g.strokeStyle="rgba(240,240,240,.6)"; g.lineWidth=1.2;
      g.beginPath(); g.moveTo(tip.tipX,tip.tipY); g.lineTo(tip.tipX-18,tip.tipY+26); g.stroke();
      if(k>=1&&tt%90<3) for(let i=0;i<4;i++) drops.push({x:bx,y:wy+40,vx:(Math.random()-.5)*2,vy:-1.5,l:0});
    }
    else if(t==="baiteat"){ const tip=angler(gx,gy,.85); // 餌被偷吃
      const bx=W*.34, by=wy+34;
      g.strokeStyle="rgba(240,240,240,.5)"; g.lineWidth=1.2;
      g.beginPath(); g.moveTo(tip.tipX,tip.tipY); g.quadraticCurveTo((tip.tipX+bx)/2,by-30,bx,by); g.stroke();
      const nib=Math.sin(tt*.3)*4;
      fishS(bx-14+nib,by+4,1);
      if(tt%20<10){ g.fillStyle="#e88a7a"; g.fillRect(bx-2,by-2,4,4); } // 餌一閃一閃被啃
    }
    else if(t==="gearbad"){ const tip=angler(gx,gy,.85); // 浮標配重錯誤
      const bx=W*.36, by=wy+10+Math.sin(tt*.4)*10; // 浮標亂沉亂浮
      g.strokeStyle="rgba(240,240,240,.5)"; g.lineWidth=1.2;
      g.beginPath(); g.moveTo(tip.tipX,tip.tipY); g.quadraticCurveTo((tip.tipX+bx)/2,by-24,bx,by); g.stroke();
      bob(bx,by);
      g.fillStyle="#f5c542"; g.font="bold 20px monospace"; g.fillText("?",bx-6,by-16);
    }
    else if(t==="snag"){ const tip=angler(gx,gy,.7,4); // 卡礁石
      g.fillStyle="#57524a"; g.beginPath(); g.ellipse(W*.34,H*.86,30,14,0,0,7); g.fill();
      g.fillStyle="#6b6558"; g.fillRect(W*.30,H*.80,20,4);
      g.strokeStyle="rgba(240,240,240,.8)"; g.lineWidth=1.5;
      const tug=Math.sin(tt*.25)*3;
      g.beginPath(); g.moveTo(tip.tipX+tug,tip.tipY); g.lineTo(W*.34,H*.84); g.stroke();
      excl(W*.34-2,H*.60,"#ff5d5d");
    }
    else if(t==="tangle"){ // 兩人線纏一起
      const t1=angler(W*.78,gy,.9), t2=angler(W*.92,gy+8,.75);
      g.strokeStyle="rgba(240,240,240,.7)"; g.lineWidth=1.4;
      const mx=W*.42, my=wy+26;
      g.beginPath(); g.moveTo(t1.tipX,t1.tipY);
      g.bezierCurveTo(mx+20,my-30,mx-20,my+30,mx,my); g.stroke();
      g.beginPath(); g.moveTo(t2.tipX,t2.tipY);
      g.bezierCurveTo(mx-24,my-26,mx+24,my+26,mx,my); g.stroke();
      g.strokeStyle="#f5c542"; g.lineWidth=2;
      g.beginPath(); g.arc(mx,my,8+Math.sin(tt*.2)*2,0,7); g.stroke(); // 纏結
    }
    else if(t==="wind"){ const tip=angler(gx,gy,1.2,2); // 大風
      g.strokeStyle="rgba(220,240,255,.55)"; g.lineWidth=2;
      for(let i=0;i<7;i++){ const y=14+i*20, x=(tt*6+i*70)%(W+80)-40;
        g.beginPath(); g.moveTo(x,y); g.quadraticCurveTo(x+22,y-5,x+44,y); g.stroke(); }
      const k=(tt%70)/70;
      const bx=tip.tipX-40-k*30, by=tip.tipY-10+Math.sin(tt*.3)*12; // 餌被吹得亂飄
      g.strokeStyle="rgba(240,240,240,.6)"; g.lineWidth=1.2;
      g.beginPath(); g.moveTo(tip.tipX,tip.tipY); g.quadraticCurveTo((tip.tipX+bx)/2,by-26,bx,by); g.stroke();
      bob(bx,by);
    }
    else if(t==="hooked"||t==="swallow"){ const tip=angler(gx,gy,.8,3); // 中魚：浮標下沉
      const bx=W*.36, dip=Math.max(0,Math.sin(tt*.15))*10;
      const by=wy+12+dip;
      g.strokeStyle="rgba(240,240,240,.7)"; g.lineWidth=1.4;
      g.beginPath(); g.moveTo(tip.tipX,tip.tipY); g.quadraticCurveTo((tip.tipX+bx)/2,by-24,bx,by); g.stroke();
      bob(bx,by);
      fishS(bx-4,by+16,1,t==="swallow"?"#2a4a68":"rgba(6,20,36,.85)");
      if(t==="swallow"){ g.fillStyle="#ff8a5d"; g.fillRect(bx-6,by+14,3,3); } // 吞得深
      if(dip>6) excl(bx+12,by-30);
    }
    else if(t==="double"){ const tip=angler(gx,gy,.8,3); // 雙鉤雙魚
      const bx=W*.36, by=wy+16+Math.sin(tt*.2)*4;
      g.strokeStyle="rgba(240,240,240,.7)"; g.lineWidth=1.4;
      g.beginPath(); g.moveTo(tip.tipX,tip.tipY); g.quadraticCurveTo((tip.tipX+bx)/2,by-24,bx,by); g.stroke();
      fishS(bx-6,by+12+Math.sin(tt*.3)*3,1);
      fishS(bx+14,by+22-Math.sin(tt*.3)*3,-1);
      excl(bx+2,by-26); excl(bx+14,by-22);
    }
    else if(t==="eel"){ const tip=angler(gx,gy,.9); // 海鰻窺伺漁獲
      g.fillStyle="#867e6c"; g.beginPath(); g.ellipse(W*.80,H*.88,26,10,0,0,7); g.fill();
      g.fillStyle="#155a95"; g.beginPath(); g.ellipse(W*.80,H*.88,20,7,0,0,7); g.fill();
      fishS(W*.80,H*.86,1,"#f2c94c");
      const k=Math.min(1,(tt%110)/70), ex=W*.2+k*(W*.52), ey=wy+20+k*(H*.62-wy);
      g.strokeStyle="#5a6b3a"; g.lineWidth=6; g.lineCap="round";
      g.beginPath();
      for(let i=0;i<=7;i++){ const sx=ex-i*10, sy=ey+Math.sin(tt*.3+i)*4; i?g.lineTo(sx,sy):g.moveTo(sx,sy); }
      g.stroke();
      g.fillStyle="#e8e8e8"; g.fillRect(ex+2,ey-4,3,3);
    }
    else if(t==="bigwave"){ // 大浪：抬腳！
      const u=3, x=gx, gy2=gy;
      g.fillStyle="#d8a878"; g.fillRect(x,gy2-13*u,3*u,3*u);
      g.fillStyle="#c1272d"; g.fillRect(x,gy2-13*u,3*u,u);
      g.fillStyle="#1a1512"; g.fillRect(x,gy2-10*u,3*u,6*u);
      g.fillStyle="#20232a"; g.fillRect(x+u,gy2-4*u,u,4*u); g.fillRect(x+2.4*u,gy2-6*u,u,u); // 單腳抬高
      const k=(tt%75)/75, wx=k*W*1.1;
      g.fillStyle="rgba(220,244,252,.85)";
      g.beginPath(); g.moveTo(wx-66,wy+30); g.quadraticCurveTo(wx-16,wy-34,wx,wy+8); g.quadraticCurveTo(wx-28,wy+2,wx-66,wy+30); g.fill();
    }
    else if(t==="seen1"||t==="seen2"){ const high=t==="seen2";
      const tip=angler(gx,high?gy-16:gy,.85);
      if(high){ g.fillStyle="#6b6558"; g.fillRect(W*.72,H*.52,W*.28,10); } // 站太高的岩台
      const bx=W*.36, by=wy+18;
      g.strokeStyle=high?"rgba(240,240,240,.5)":"rgba(240,240,240,.95)"; g.lineWidth=high?1.2:3; // 線太粗
      g.beginPath(); g.moveTo(tip.tipX,tip.tipY); g.quadraticCurveTo((tip.tipX+bx)/2,by-24,bx,by); g.stroke();
      const fx=bx-8+Math.sin(tt*.1)*4;
      fishS(fx,by+16,1);
      excl(fx+6,by-6,"#ff5d5d"); // 魚抓包了！
      if(tt%60>30){ // 掉頭游走
        fishS(fx-24,by+20,-1);
      }
    }
    tickDrops(g,drops);
    tt++; requestAnimationFrame(loop);
  }
  loop();
  return ()=>{ alive=false; };
}

/* ---------------- 卡片展示（翻牌動畫） ---------------- */
function showCard(kind,info,interactive){
  return new Promise(res=>{
    const ov=$("#ov-card"), fc=$("#flipcard");
    $("#cardback-icon").textContent = kind==="env"?"🌊":kind==="destiny"?"🔮":"🎣";
    $("#cardback-label").textContent = kind==="env"?"NATURE":kind==="destiny"?"DESTINY":"ACTION";
    $("#cardfront").classList.toggle("env",kind==="env");
    if(__envAnimStop){__envAnimStop(); __envAnimStop=null;}
    if(kind==="env"){
      $("#c-anim").style.display="block"; $("#c-emoji").style.display="none";
      __envAnimStop=envAnim(info.animType);
    }else if(kind==="destiny"){
      $("#c-anim").style.display="block"; $("#c-emoji").style.display="none";
      __envAnimStop=destinyAnim(info.animType);
    }else{
      $("#c-anim").style.display="none"; $("#c-emoji").style.display="block";
    }
    $("#c-emoji").textContent=info.emoji;
    $("#c-title").textContent=info.title;
    $("#c-desc").textContent=info.desc;
    $("#c-flavor").textContent=info.flavor;
    fc.classList.remove("flipped");
    const okBtn=$("#btn-card-ok"); okBtn.style.visibility="hidden";
    ov.classList.add("show");
    setTimeout(()=>{ SFX.flip(); fc.classList.add("flipped"); },500);
    let doneFlag=false;
    const done=()=>{ if(doneFlag) return; doneFlag=true; ov.onclick=null; ov.classList.remove("show");
      if(__envAnimStop){__envAnimStop(); __envAnimStop=null;} res(); };
    // 翻牌後才可點擊繼續（點按鈕或畫面任意處）
    setTimeout(()=>{
      okBtn.style.visibility="visible";
      okBtn.onclick=e=>{ e.stopPropagation(); SFX.click(); done(); };
      ov.onclick=()=>{ SFX.click(); done(); };
      if(!interactive) setTimeout(done,4200);   // 電腦回合：停留夠久，也可手動點掉
    },1300);
  });
}


/* =====================================================================
   與魚搏鬥動畫（骰子判定時的拉扯畫面）
===================================================================== */
function startFightScene(style){ return startFight($("#fight-canvas"), style, SFX); }

/* ---------------- 骰子 ---------------- */
const PIP_MAP={1:[4],2:[0,8],3:[0,4,8],4:[0,2,6,8],5:[0,2,4,6,8],6:[0,2,3,5,6,8]};
function paintDie(n){
  const box=$("#pips"); box.innerHTML="";
  for(let i=0;i<9;i++){ const d=document.createElement("div"); d.className="pip";
    if(PIP_MAP[n].includes(i)) d.style.visibility="visible"; box.appendChild(d); }
  $("#die").classList.toggle("red-pip",n===1||n===4);
}
function rollDice(p,needStr,passFn,opts={}){
  return new Promise(res=>{
    const ov=$("#ov-dice"); ov.classList.add("show");
    $("#dice-title").textContent = opts.fight ? `${p.name} 與魚搏鬥中！` : `${p.name} 的判定`;
    $("#dice-need").textContent=needStr;
    const fi=$("#dice-fish"); fi.innerHTML="";
    if(opts.fish){ fi.style.display="flex";
      fi.appendChild(fishCanvas(opts.fish,5));
      const b=document.createElement("b"); b.textContent=opts.fish.name+(TARGET_SET.has(opts.fish.name)?" ⭐":""); fi.appendChild(b);
    } else fi.style.display="none";
    $("#dice-result").textContent=""; $("#dice-result").className="";
    paintDie(1+rnd(6));
    const btn=$("#btn-roll");
    if(opts.fight) btn.textContent="💪 用力拉竿！"; else btn.textContent="🎲 擲骰子";
    const fight = opts.fight ? startFightScene(FISHERS[p.idx]&&FISHERS[p.idx].st) : null;   // 玩家角色本人上場拉扯
    const doRoll=async()=>{
      btn.style.visibility="hidden";
      if(fight) fight.boost();                        // 擲骰時拉扯加劇
      const die=$("#die");
      const n=1+rnd(6);
      // 真實拋擲：骰子從空中甩入 → 落地彈跳數次 → 滾動漸停 → 定格
      SFX.diceThrow();
      await new Promise(done=>{
        let x=-150-rnd(40), y=-190-rnd(40);           // 從左上方拋入
        let vx=6.5+Math.random()*3, vy=1.5, rot=-(420+rnd(320)), vr=24+rnd(12);
        let faceT=0, faceInt=2, frames=0;
        (function anim(){
          frames++;
          vy+=1.05; y+=vy; x+=vx; rot+=vr; vr*=.985;
          if(y>=0){                                    // 落地
            y=0;
            if(Math.abs(vy)>2.4){ vy=-vy*.45; vx*=.78; vr*=.62; SFX.knock(); } // 彈跳＋撞擊聲
            else { vy=0; vx*=.72; }
          }
          // 滾動中骰面快速變換，越滾越慢
          faceT++;
          if(faceT>=faceInt && Math.abs(vr)>2){
            paintDie(1+rnd(6)); faceT=0;
            faceInt=Math.min(16,faceInt+1);
            if(Math.abs(vr)>5) SFX.diceTick();         // 翻滾的喀喀聲
          }
          die.style.transform=`translate(${x}px,${y}px) rotate(${rot%360}deg)`;
          const stopped = y===0 && Math.abs(vr)<=1.4 && Math.abs(vx)<.6;
          if(stopped || frames>420){
            die.style.transition="transform .18s"; 
            die.style.transform="translate(0,0) rotate(0deg)";
            setTimeout(()=>{ die.style.transition=""; },200);
            paintDie(n); SFX.settle();                 // 定格＋落定聲
            return setTimeout(done,320);
          }
          requestAnimationFrame(anim);
        })();
      });
      const ok=passFn(n);
      if(fight) fight.result(ok);                     // 魚被拉起 / 掙脫游走
      const r=$("#dice-result");
      r.textContent=ok?`🎲 ${n} 點 — 成功拉起！`:`🎲 ${n} 點 — 魚掙脫了⋯`;
      if(!opts.fight) r.textContent=ok?`🎲 ${n} 點 — 成功！`:`🎲 ${n} 點 — 失敗⋯`;
      r.className=ok?"ok":"bad";
      await sleep(opts.fight?1900:1400);
      if(fight) fight.stop();
      ov.classList.remove("show");
      res(n);
    };
    if(p.human){ btn.style.visibility="visible"; btn.onclick=doRoll; }
    else{ btn.style.visibility="hidden"; setTimeout(doRoll,opts.fight?1400:700); }
  });
}

/* ---------------- 捕獲展示 ---------------- */
function showCatch(p,fishes,title){
  return new Promise(res=>{
    $("#catch-title").textContent=`${p.name}：${title}`;
    const box=$("#catch-fish-show"); box.innerHTML="";
    fishes.forEach(f=>{
      const d=document.createElement("div"); d.className="bigfish";
      d.innerHTML=`<div class="fname">${f.name}</div><div class="fcat">${f.category}${TARGET_SET.has(f.name)?" ・⭐ 目標魚":""}</div>`;
      d.prepend(fishCanvas(f,7));
      box.appendChild(d);
    });
    const ov=$("#ov-catch"); ov.classList.add("show");
    const btn=$("#btn-catch-ok");
    let doneFlag=false;
    const done=()=>{ if(doneFlag) return; doneFlag=true; ov.onclick=null; ov.classList.remove("show");
      if(__envAnimStop){__envAnimStop(); __envAnimStop=null;} res(); };
    if(p.human){ btn.style.display=""; btn.onclick=e=>{ e.stopPropagation(); SFX.click(); done(); }; }
    else{ btn.style.display="none"; ov.onclick=done; setTimeout(done,3200); }
  });
}

/* ---------------- 回合結束 / 環境卡 ---------------- */
async function endTurn(){
  G.busy=false;
  walkCtl.active=false;
  const cv0=$("#sea-canvas"); cv0.onclick=null; cv0.style.cursor="";
  resetFisher(G.turnIdx);   // 收竿回待機
  renderPlayers(); renderSpots();
  const next=advanceTurn(G);
  G.turnIdx=next.turnIdx;
  if(next.round>G.round){
    await roundEnd();
    if(G.over) return;
  }
  nextTurn();
}

async function roundEnd(){
  // 第 15 回合結束 → 直接結算，不抽環境卡
  if(G.round>=CFG.rounds){ return finishGame(); }
  setBanner(`🌊 回合 ${G.round} 結束，海象正在變化⋯`);
  await toast(`🌊 回合 ${G.round} 結束，海與天自有安排⋯`,1800);
  await sleep(400);
  if(!G.envDeck.length) G.envDeck=buildEnvDeck();
  const env=G.envDeck.pop(); const info=ENV_INFO[env];
  await showCard("env",info,false);
  addLog(`🌊 自然的反撲：「${info.title}」— ${info.desc}`,"lg-env");
  switch(env){
    case "calm": break;
    case "chat":
      SFX.wave();
      G.players.forEach(p=>{ p.rest=Math.max(p.rest,1); });
      await toast("💬 全員坐下來聊聊天，同步休息一回合");
      break;
    case "eel": case "escape":{
      if(env==="eel") SFX.eel(); else SFX.splash();
      const lost=[];
      for(const p of G.players){
        if(p.rest>0){ addLog(`${p.name} 正在休息，免疫對抗判定。`,""); continue; }
        if(!p.catch.length) continue;
        const roll=await rollDice(p, env==="eel"?"海鰻撲向水窪！擲骰 <3 損失 1 條漁獲":"魚兒奮力跳出！擲骰 <3 損失 1 條漁獲", r=>r>=3);
        if(roll<3){ const f=p.catch.splice(rnd(p.catch.length),1)[0]; G.fishSupply.push(f); lost.push(`${p.name} 的 ${f.name}`); }
      }
      G.fishSupply=shuffle(G.fishSupply); renderPlayers();
      const what=env==="eel"?"被海鰻偷走":"奮力逃回大海";
      if(lost.length){ addLog(`🐟 ${lost.join("、")} ${what}了！`,"lg-bad"); await toast(env==="eel"?"🐍 有漁獲被海鰻偷走了！":"🐟💨 有漁獲逃回大海了！"); }
      else await toast(env==="eel"?"🐍 大家都保住了漁獲":"🐟 水窪裡的魚都被看牢了");
      break;
    }
    case "hightide": case "lowtide":
      SFX.wave(); reshuffleBoard();
      await toast(env==="hightide"?"🌊 漲潮！魚群重新移動":"🏖️ 退潮！魚群重新移動");
      addLog("場上魚牌已重新洗牌置放。","lg-env");
      break;
    case "wave":{
      SFX.wave();
      for(const p of G.players){
        if(p.rest>0){ addLog(`${p.name} 正在休息，免疫大浪判定。`,""); continue; }
        const roll=await rollDice(p,"大浪判定：擲出 ≥ 3 才能站穩",r=>r>=3);
        if(roll<3){ p.rest=1; addLog(`💥 ${p.name} 被大浪沖倒（骰 ${roll}），下回合休息。`,"lg-bad"); }
        else addLog(`${p.name} 單腳站穩，躲過大浪（骰 ${roll}）。`,"lg-ok");
      }
      break;
    }
  }
  // 回合結束：重新隨機禁放點位，場上剩餘魚牌歸回補充堆，再重新補滿
  pickBannedSpots();
  G.spots.flat().forEach(f=>G.fishSupply.push(f));
  G.fishSupply=shuffle(G.fishSupply);
  G.spots=[[],[],[],[],[],[]];
  refillSpots(true);
  G.round++;
  renderPlayers();
  if(G.round===CFG.rounds-3) { addLog("🥁 海風變得急促——只剩 4 個回合了！","lg-sys"); await toast("🥁 節奏加快！只剩 4 個回合",1600); }
  if(G.round===CFG.rounds) { addLog("⏳ 最終回合！把握最後一竿！","lg-sys"); await toast("⏳ 最終回合！",1500); }
}

/* =====================================================================
   結算：分享階段 + 勝負
===================================================================== */
function checkPersonal(p){
  const okCnt=p.catch.length>=p.role.need;
  const okTgt=!p.role.target || p.catch.some(f=>p.role.target.includes(f.name));
  return okCnt&&okTgt;
}
/* 達悟分享精神：有餘者分魚給缺者（先補目標魚，再補數量） */
function sharePhase(){
  const notes=[]; const transfers=[];
  // 1. 目標魚轉讓：持有者已達成自身條件且該魚非自己必需
  for(const p of G.players){
    if(checkPersonal(p)||!p.role.target) continue;
    if(p.catch.some(f=>p.role.target.includes(f.name))) continue;
    for(const q of G.players){
      if(q===p) continue;
      const idx=q.catch.findIndex(f=>p.role.target.includes(f.name) && !(q.role.target&&q.role.target.includes(f.name)&&q.catch.filter(x=>q.role.target.includes(x.name)).length<=1));
      if(idx>=0 && q.catch.length-1>= (checkPersonal(q)?q.role.need:0)){
        const f=q.catch.splice(idx,1)[0]; p.catch.push(f);
        notes.push(`🤝 ${q.name} 把 <b>${f.name}</b> 分享給 ${p.name}（成全他的家庭任務）`);
        transfers.push({from:q,to:p,fish:f,why:"target"});
        break;
      }
    }
  }
  // 2. 數量補齊：多的分給少的
  let moved=true;
  while(moved){
    moved=false;
    const lack=G.players.find(p=>p.catch.length<p.role.need);
    const rich=G.players.filter(q=>q.catch.length>q.role.need)
      .sort((a,b)=>b.catch.length-b.role.need-(a.catch.length-a.role.need));
    if(lack&&rich.length){
      const q=rich[0];
      const idx=q.catch.findIndex(f=>!(q.role.target&&q.role.target.includes(f.name)&&q.catch.filter(x=>q.role.target.includes(x.name)).length<=1));
      if(idx>=0){ const f=q.catch.splice(idx,1)[0]; lack.catch.push(f);
        notes.push(`🤝 ${q.name} 分了一條 <b>${f.name}</b> 給 ${lack.name}`);
        transfers.push({from:q,to:lack,fish:f,why:"count"}); moved=true; }
    }
  }
  return {notes,transfers};
}

/* ---------------- 耆老分魚畫面 ---------------- */
function playShareScene(transfers){
  return new Promise(res=>{
    const ov=$("#ov-share"), cv=$("#share-canvas"), tb=$("#share-text");
    const g=cv.getContext("2d"); g.imageSmoothingEnabled=false;
    const W=cv.width,H=cv.height;
    ov.classList.add("show");
    const elderCv=avatarCanvas(ROLES[4],9);
    const pCvs=G.players.map(p=>avatarCanvas(p.role,5));
    const pX=G.players.map((_,i)=>W*((i+1)/(G.players.length+1)));
    const groundY=H*.86;
    let step=-1, t=0, alive=true, flying=null;
    function caption(html){ tb.innerHTML=html; }
    function drawBase(){
      // 黃昏海邊
      g.fillStyle="#c97e52"; g.fillRect(0,0,W,H*.3);
      g.fillStyle="#e8a45f"; g.fillRect(0,H*.3,W,H*.12);
      const bands=["#8a6a8f","#5c5480","#3a4468"]; const bh=(H*.44)/3;
      bands.forEach((c,i)=>{g.fillStyle=c; g.fillRect(0,H*.42+i*bh,W,bh+2);});
      g.fillStyle="rgba(255,220,170,.3)";
      for(let i=0;i<8;i++) g.fillRect((i*53+t)%(W+20)-10,H*.46+(i*17)%(H*.34),10,2);
      g.fillStyle="#4e4a44"; g.fillRect(0,groundY,W,H-groundY);
      g.fillStyle="#66604f"; for(let i=0;i<6;i++) g.fillRect((i*103)%W,groundY-6,50,12);
      // 耆老（中上，隨語氣點頭）
      const bob=Math.sin(t/30)*2;
      g.drawImage(elderCv, W/2-elderCv.width/2, H*.30-elderCv.height/2+bob);
      // 玩家們
      G.players.forEach((p,i)=>{
        g.drawImage(pCvs[i], pX[i]-pCvs[i].width/2, groundY-pCvs[i].height+4);
        g.fillStyle="rgba(242,237,226,.9)"; g.font="bold 11px monospace"; g.textAlign="center";
        g.fillText(p.name.slice(0,6), pX[i], groundY+14);
        g.textAlign="left";
      });
    }
    function loop(){
      if(!alive) return;
      drawBase();
      if(flying){
        flying.t++;
        const k=Math.min(1,flying.t/40);
        const x=flying.x0+(flying.x1-flying.x0)*k;
        const y=flying.y0+(flying.y1-flying.y0)*k - Math.sin(k*Math.PI)*60;
        g.drawImage(flying.cv, x-flying.cv.width/2, y-flying.cv.height/2);
        if(k>=1){
          SFX.good(); flying=null;
          $("#share-next").style.visibility="visible";
        }
      }
      t++; requestAnimationFrame(loop);
    }
    function advance(){
      SFX.click();
      if(flying) { flying.t=999; return; } // 快轉飛行
      step++;
      $("#share-next").style.visibility="hidden";
      if(step===0 && transfers.length===0){
        caption(`🧓 耆老看了看大家的魚簍：<br>「今天大家的漁獲都剛剛好，不需要重新分配。<br>這也是海的祝福。」`);
        setTimeout(()=>$("#share-next").style.visibility="visible",600);
        return;
      }
      if(step<transfers.length){
        const tr=transfers[step];
        const fi=G.players.indexOf(tr.from), ti=G.players.indexOf(tr.to);
        caption(`🧓 耆老拿起 <b style="color:var(--sun)">${tr.fish.name}</b>：<br>「${tr.from.name}，你的魚簍有餘。這條${tr.why==="target"?`正是 <b>${tr.to.role.name}</b> 家裡需要的魚`:"分給還不夠的人"}——<br>${tr.to.name}，拿去吧。」`);
        flying={cv:fishCanvas(tr.fish,5), t:0,
          x0:pX[fi], y0:groundY-40, x1:pX[ti], y1:groundY-40};
        SFX.flip();
        return;
      }
      if(step===Math.max(transfers.length,1)){
        caption(`🧓 「捕得多的分給捕得少的——<br>這就是海洋教我們的<b style="color:var(--sun)">分享</b>。」`);
        setTimeout(()=>$("#share-next").style.visibility="visible",600);
        return;
      }
      finish();
    }
    function finish(){ alive=false; ov.onclick=null; ov.classList.remove("show"); res(); }
    ov.onclick=advance;
    $("#btn-share-skip").onclick=e=>{ e.stopPropagation(); finish(); };
    loop(); advance();
  });
}

async function finishGame(){
  G.over=true;
  renderPlayers();
  await toast("🌅 第 15 回合結束，大家把漁獲帶到耆老面前⋯",2200);
  const {notes:shareNotes,transfers}=sharePhase();
  await playShareScene(transfers);   // 先看耆老分魚，最後才看數據
  const total=G.players.reduce((a,p)=>a+p.catch.length,0);
  const collectiveWin=total>=CFG.goal;
  const allPersonal=G.players.every(checkPersonal);
  const win=collectiveWin;
  (win?SFX.win:SFX.lose)();
  $("#end-title").textContent = win ? (allPersonal?"🏆 大豐收！完美勝利":"🎉 集體目標達成！") : "😔 這次的海不留情";
  $("#end-title").className="end-title "+(win?"win":"lose");
  $("#end-collective").innerHTML=`全體漁獲 <b style="color:var(--sun); font-size:20px;">${total}</b> / ${CFG.goal} 條 — ${collectiveWin?"<b style='color:var(--ok)'>集體目標達成 ✓</b>":"<b style='color:var(--bad)'>未達成 ✗</b>"}`;
  $("#end-share").innerHTML = shareNotes.length
    ? `<b style="color:var(--sun)">🧓 耆老主持分享：</b><br>`+shareNotes.join("<br>")
    : `🧓 耆老說：這次大家的魚簍都剛剛好，不需要重新分配。`;
  const box=$("#end-players"); box.innerHTML="";
  G.players.forEach(p=>{
    const ok=checkPersonal(p);
    const d=document.createElement("div"); d.className="result-row pixel-panel";
    const fishHTML=p.catch.map(f=>`<span style="color:${TARGET_SET.has(f.name)?"var(--sun)":"#9fb8d8"}">${f.name}</span>`).join("・")||"（無）";
    d.innerHTML=`<div><div class="rname">${p.name} — ${p.role.emoji} ${p.role.name}</div>
      <div class="rdetail">${p.role.desc}｜漁獲 ${p.catch.length} 條：${fishHTML}</div></div>
      <div class="rmark ${ok?"ok":"bad"}">${ok?"✓ 達成":"✗ 未達"}</div>`;
    d.prepend(avatarCanvas(p.role,3));
    box.appendChild(d);
  });
  showScreen("#screen-end");
}

/* =====================================================================
   綁定
===================================================================== */

/* =====================================================================
   Laravel 後台動態設定：開局前自 /api/game-config 載入；失敗則用內建預設值
===================================================================== */
function applyServerConfig(cfg){
  /* 純邏輯已抽至 config/serverConfig.js（refactor phase5），
     此處僅繫結遊戲端掛勾：CFG、SPOT_POS、魚種索引重建 */
  applyCfg(cfg,{
    cfgStore: CFG,
    setSpotPos: v=>{ SPOT_POS=v; },
    onFishChanged: rebuildSpeciesIndex,
  });
}
async function loadServerConfig(){
  try{
    const res=await fetch("/api/game-config",{headers:{Accept:"application/json"}});
    if(res.ok) applyServerConfig(await res.json());
  }catch(e){ console.warn("[遊戲設定] 無法連線後端，使用內建預設值"); }
  const rt=document.getElementById("ui-rounds-total"); if(rt) rt.textContent=CFG.rounds;
}

window.addEventListener("load",async()=>{
  await loadServerConfig();
  const tc=$("#title-sea");
  const fitTitle=()=>{ tc.width=innerWidth; tc.height=innerHeight; };
  fitTitle(); window.addEventListener("resize",fitTitle);
  shoreScene(tc,{fishermen:false});
  shoreScene($("#sea-canvas"),{interactive:true,sound:true});
  renderRoleList();
  renderSiteList();
  renderNameInputs();
  bindOptRow("#opt-mode","mode");
  bindOptRow("#opt-count","count");
  let setupStep=1;
  const STEP_TITLES={1:"STEP 1 / 3 — 玩家設定",2:"STEP 2 / 3 — 選擇釣場",3:"STEP 3 / 3 — 選擇角色"};
  function goStep(n){
    setupStep=Math.max(1,Math.min(3,n));
    document.querySelectorAll(".setup-step").forEach(el=>el.classList.remove("active"));
    $("#setup-step-"+setupStep).classList.add("active");
    $("#setup-progress").textContent=STEP_TITLES[setupStep];
    $("#btn-setup-back").style.visibility=setupStep===1?"hidden":"visible";
    $("#btn-setup-next").textContent=setupStep===3?"🎣 釣魚去！":"下一步 ▶";
    window.scrollTo(0,0);
  }
  $("#btn-start").onclick=()=>{ SFX.init(); SFX.splash(); goStep(1); showScreen("#screen-setup"); };
  $("#btn-setup-back").onclick=()=>{ SFX.click(); goStep(setupStep-1); };
  $("#btn-setup-next").onclick=()=>{ SFX.click(); if(setupStep<3) goStep(setupStep+1); else launchGame(); };
  $("#btn-again").onclick=()=>{ showScreen("#screen-setup"); document.querySelectorAll(".setup-step").forEach(el=>el.classList.remove("active")); $("#setup-step-1").classList.add("active"); $("#setup-progress").textContent="STEP 1 / 3 — 玩家設定"; $("#btn-setup-back").style.visibility="hidden"; $("#btn-setup-next").textContent="下一步 ▶"; };
  $("#btn-mute").onclick=e=>{ const m=SFX.toggle(); e.target.textContent=m?"🔇":"🔊"; };
  $("#btn-help").onclick=()=>$("#ov-help").classList.add("show");
  $("#btn-help-close").onclick=()=>$("#ov-help").classList.remove("show");
});
