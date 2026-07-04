import { FISH_ART } from '../data/fishArt.js';

const DEFAULT_ART = {shape:'oval', body:'#7fb2c9', belly:'#d8e8ef', acc:'#4a7f97', pat:'plain'};

export function getDefaultArt() { return { ...DEFAULT_ART }; }

export function getFishArt(name) { return FISH_ART[name] || DEFAULT_ART; }

export function drawPixFisher(g,x,gy,rodAng,lean,active,name,walkFrame,st){
  st=st||{skin:"#d8a878",cloth:"#1a1512",hair:"#12100e",u:4};
  const u=st.u||4;
  g.fillStyle=st.skin;  g.fillRect(x-lean,gy-13*u,3*u,3*u);
  g.fillStyle=st.hair;  g.fillRect(x-lean,gy-13*u,3*u,u);
  if(st.beard){ g.fillStyle="#e8e8e8"; g.fillRect(x-lean,gy-10.6*u,3*u,.8*u); }
  g.fillStyle="#101010"; g.fillRect(x-lean+.4*u,gy-12*u,.7*u,.7*u);
  g.fillStyle=st.cloth; g.fillRect(x-lean*.6,gy-10*u,3.2*u,6*u);
  if(st.baby){ g.fillStyle="#f0c8a0"; g.fillRect(x-lean*.6-.8*u,gy-9*u,u,u);
               g.fillStyle="#1a1a1a"; g.fillRect(x-lean*.6-.8*u,gy-9.8*u,u,.8*u); }
  if(st.cane){ g.fillStyle="#6a4a2a"; g.fillRect(x+3.4*u,gy-6*u,.8*u,6*u); }
  const step=walkFrame?Math.sin(walkFrame*.5)*u:0;
  g.fillStyle="#20232a";
  g.fillRect(x+.2*u,gy-4*u+Math.max(0,-step)*.4,u,4*u-Math.abs(step)*.5);
  g.fillRect(x+2*u,gy-4*u+Math.max(0,step)*.4,u,4*u-Math.abs(step)*.5);
  const hx=x-lean*.8, hy=gy-8*u, rodLen=17*u;
  const tipX=hx-Math.cos(rodAng)*rodLen, tipY=hy-Math.sin(rodAng)*rodLen;
  if(!st.noRod){
    g.strokeStyle="#241c14"; g.lineWidth=3;
    g.beginPath(); g.moveTo(hx,hy);
    g.quadraticCurveTo((hx+tipX)/2,(hy+tipY)/2-4,tipX,tipY); g.stroke();
  }
  if(active){ g.fillStyle="#f5c542"; g.beginPath(); g.moveTo(x+1.5*u,gy-17*u); g.lineTo(x-.5*u,gy-20*u); g.lineTo(x+3.5*u,gy-20*u); g.fill(); }
  if(name){ g.fillStyle="rgba(242,237,226,.9)"; g.font="bold 10px monospace"; g.textAlign="center"; g.fillText(name.slice(0,6),x+1.5*u,gy+12); g.textAlign="left"; }
  return {tipX,tipY,hx,hy};
}

export function drawFish(canvas, species, scale) {
  const [name,, diff] = species;
  const A = getFishArt(name);
  const W = 18, H = 12, s = scale;
  canvas.width = W * s; canvas.height = H * s;
  const g = canvas.getContext('2d'); g.imageSmoothingEnabled = false;
  const px = (x, y, c) => { g.fillStyle = c; g.fillRect(x*s, y*s, s, s); };
  const cy0 = 5.5;
  const dims = A.shape === 'long' ? {rx:6.8, ry:2.3, x0:3, x1:17}
             : A.shape === 'deep' ? {rx:5.0, ry:4.3, x0:4, x1:15}
             :                      {rx:5.6, ry:3.3, x0:4, x1:16};
  const cx0 = (dims.x0 + dims.x1) / 2;
  const inBody = (x, y) => {
    const dx = (x-cx0)/dims.rx, dy = (y-cy0)/dims.ry;
    return x >= dims.x0 && x <= dims.x1 && dx*dx+dy*dy <= 1;
  };
  for (let y = 0; y < H; y++) for (let x = 0; x < W; x++)
    if (inBody(x, y)) px(x, y, y > cy0+dims.ry*.35 ? A.belly : A.body);
  const tc = A.tail || A.acc;
  for (let k = 0; k < 3; k++) {
    px(dims.x0-1-k, Math.round(cy0-1-k*.8), tc);
    px(dims.x0-1-k, Math.round(cy0+1+k*.8), tc);
  }
  px(dims.x0-1, Math.round(cy0), A.body);
  const topY = Math.ceil(cy0 - dims.ry);
  for (let x = Math.round(cx0-3); x <= Math.round(cx0+2); x++) px(x, topY-1, A.tail||A.acc);
  px(Math.round(cx0-1), Math.floor(cy0+dims.ry)+1, A.tail||A.acc);
  if (A.wings) {
    for (let k = 0; k < 5; k++) {
      px(Math.round(cx0-1-k), topY-1-Math.floor(k*.7), A.belly);
      px(Math.round(cx0-k),   topY-Math.floor(k*.7), A.acc);
    }
  }
  if (A.pat === 'bars') {
    for (const bx of [-3,-1,1,3]) {
      const x = Math.round(cx0+bx);
      for (let y = 0; y < H; y++) if (inBody(x, y)) px(x, y, A.acc);
    }
  } else if (A.pat === 'spots') {
    const seed = name.length * 7;
    for (let i = 0; i < 7; i++) {
      const x = dims.x0+1+((seed*(i+3))%(dims.x1-dims.x0-2));
      const y = 2+((seed*(i+5))%(Math.floor(dims.ry*2)));
      if (inBody(x, y)) px(x, y, A.acc);
    }
  } else if (A.pat === 'hline') {
    for (let x = dims.x0; x <= dims.x1-2; x++)
      if (inBody(x, Math.round(cy0-1))) px(x, Math.round(cy0-1), A.acc);
  }
  const ex = dims.x1 - 2;
  if (A.bigEye) { px(ex,4,'#fff'); px(ex-1,4,'#fff'); px(ex,5,'#fff'); px(ex-1,5,'#101010'); }
  else { px(ex,4,'#101010'); px(ex,3,'#fff'); }
  px(dims.x1, Math.round(cy0), A.acc);
  if (diff >= 5) {
    g.fillStyle = 'rgba(245,197,66,.9)';
    for (let x = dims.x0; x <= dims.x1; x++) g.fillRect(x*s, (topY-2)*s+1, s, 2);
  }
  canvas.title = name;
}

export function drawAvatar(canvas, role, scale) {
  const s2 = scale, W = 12, H = 14;
  canvas.width = W*s2; canvas.height = H*s2;
  const g = canvas.getContext('2d'); g.imageSmoothingEnabled = false;
  const px = (x, y, c) => { g.fillStyle = c; g.fillRect(x*s2, y*s2, s2, s2); };
  const id = role.id;
  if (id === 0) {
    for (let x = 3; x <= 8; x++) { px(x,3,'#1a1a1a'); } px(3,4,'#1a1a1a'); px(8,4,'#1a1a1a');
    for (let y = 4; y <= 6; y++) for (let x = 4; x <= 7; x++) px(x,y,role.skin);
    px(4,5,'#101010'); px(7,5,'#101010'); px(5,6,'#8a4a3a'); px(6,6,'#8a4a3a');
    for (let y = 7; y <= 9; y++) for (let x = 3; x <= 8; x++) px(x,y,role.cloth);
    px(3,10,'#2a3d55'); px(4,10,'#2a3d55'); px(7,10,'#2a3d55'); px(8,10,'#2a3d55');
    px(4,11,role.skin); px(4,12,role.skin); px(7,11,role.skin); px(7,12,role.skin);
    px(9,7,'#8a5c2d'); px(10,6,'#8a5c2d');
  } else if (id === 1) {
    for (let x = 3; x <= 8; x++) px(x,1,'#c1272d');
    for (let x = 3; x <= 8; x++) px(x,0,'#1a1a1a');
    for (let y = 2; y <= 5; y++) for (let x = 3; x <= 8; x++) px(x,y,role.skin);
    px(4,3,'#101010'); px(7,3,'#101010'); px(5,5,'#8a4a3a'); px(6,5,'#8a4a3a');
    for (let y = 6; y <= 10; y++) for (let x = 2; x <= 9; x++) px(x,y,role.cloth);
    px(1,6,role.skin); px(1,7,role.skin); px(10,6,role.skin); px(10,7,role.skin);
    for (let x = 2; x <= 9; x++) px(x,8,'#f2ede2');
    px(3,11,role.skin); px(3,12,role.skin); px(8,11,role.skin); px(8,12,role.skin);
    px(10,4,'#8a5c2d'); px(11,3,'#8a5c2d');
  } else if (id === 2) {
    for (let x = 3; x <= 8; x++) px(x,1,'#1a1a1a'); px(5,0,'#1a1a1a'); px(6,0,'#1a1a1a');
    for (let y = 2; y <= 5; y++) for (let x = 3; x <= 8; x++) px(x,y,role.skin);
    px(4,3,'#101010'); px(7,3,'#101010'); px(5,5,'#8a4a3a'); px(6,5,'#8a4a3a');
    for (let y = 6; y <= 10; y++) for (let x = 2; x <= 9; x++) px(x,y,role.cloth);
    px(4,6,'#f7f3e8'); px(6,7,'#f7f3e8'); px(8,6,'#f7f3e8');
    px(3,11,role.skin); px(3,12,role.skin); px(8,11,role.skin); px(8,12,role.skin);
    px(10,5,'#8a5c2d'); px(11,4,'#8a5c2d');
  } else if (id === 3) {
    for (let x = 3; x <= 8; x++) px(x,1,'#1a1a1a'); px(2,2,'#1a1a1a'); px(9,2,'#1a1a1a');
    for (let y = 2; y <= 5; y++) for (let x = 3; x <= 8; x++) px(x,y,role.skin);
    px(4,3,'#101010'); px(7,3,'#101010');
    px(4,5,'#3a2d24'); px(5,5,'#3a2d24'); px(6,5,'#3a2d24'); px(7,5,'#3a2d24');
    for (let y = 6; y <= 10; y++) for (let x = 2; x <= 9; x++) px(x,y,role.cloth);
    px(4,7,'#f0c8a0'); px(5,7,'#f0c8a0'); px(4,6,'#1a1a1a'); px(5,6,'#1a1a1a');
    px(3,8,'#e8dcc8'); px(4,8,'#e8dcc8'); px(5,8,'#e8dcc8'); px(6,8,'#e8dcc8');
    px(3,11,role.skin); px(3,12,role.skin); px(8,11,role.skin); px(8,12,role.skin);
    px(10,5,'#8a5c2d'); px(11,4,'#8a5c2d');
  } else {
    for (let x = 3; x <= 8; x++) px(x,1,'#e8e8e8'); px(2,2,'#e8e8e8'); px(9,2,'#e8e8e8');
    for (let y = 2; y <= 5; y++) for (let x = 3; x <= 8; x++) px(x,y,role.skin);
    px(4,3,'#101010'); px(7,3,'#101010');
    for (let x = 4; x <= 7; x++) { px(x,5,'#e8e8e8'); px(x,6,'#e8e8e8'); }
    for (let y = 7; y <= 10; y++) for (let x = 3; x <= 9; x++) px(x,y,role.cloth);
    px(3,11,role.skin); px(3,12,role.skin); px(8,11,role.skin); px(8,12,role.skin);
    for (let y = 7; y <= 11; y++) px(10,y,'#6a4a2a');
  }
}
