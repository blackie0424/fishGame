import { drawSeaBands } from './scene.js';
import { drawPixFisher } from './sprites.js';
import { rnd } from '../utils/deck.js';

export function startFight(canvas, style, sfx = {}) {
  style = style || { skin:"#d8a878", cloth:"#c1272d", hair:"#12100e", u:4 };
  const fu = (style.u || 4) + 1;
  canvas.style.display = "block";
  const g = canvas.getContext("2d"); g.imageSmoothingEnabled = false;
  const W = canvas.width, H = canvas.height, waterY = H * 0.42, rockX = W * 0.74;
  const st = { mode:"tug", t:0, alive:true, intensity:1, winT:0 };
  function loop() {
    if (!st.alive) return;
    drawSeaBands(g, W, H, waterY);
    g.fillStyle = "#4e4a44"; g.fillRect(rockX-14, waterY+20, W, H);
    g.fillStyle = "#66604f"; g.fillRect(rockX-24, waterY+14, W, 12);
    const tug = Math.sin(st.t * 0.24) * st.intensity;
    const lean = 4 + tug * 4;
    const f = drawPixFisher(g, rockX+22, waterY+34+8, 0.55, lean, false, null, 0,
      Object.assign({}, style, { u:fu, noRod:true }));
    let fx = W * 0.22 - tug * 14, fy = waterY + 16;
    if (st.mode === "win") { const k = Math.min(1, (st.t-st.winT)/26); fx = W*0.22+(rockX-40-W*0.22)*k; fy = waterY+16-Math.sin(k*Math.PI)*74; }
    if (st.mode === "lose") { const k = Math.min(1, (st.t-st.winT)/34); fx = W*0.22-k*W*0.34; fy = waterY+14+Math.sin(st.t*0.3)*2; }
    const bend = st.mode === "tug" ? 26+tug*14 : (st.mode === "win" ? 8 : 2);
    const tipX = f.hx - 96, tipY = f.hy - 30 + bend;
    g.strokeStyle = "#241c14"; g.lineWidth = 5;
    g.beginPath(); g.moveTo(f.hx, f.hy);
    g.quadraticCurveTo(f.hx-52, f.hy-46+bend*0.4, tipX, tipY); g.stroke();
    g.strokeStyle = "rgba(240,240,240,.75)"; g.lineWidth = 1.5;
    g.beginPath(); g.moveTo(tipX, tipY);
    if (st.mode === "lose") { const sway = Math.sin(st.t*0.15)*8;
      g.quadraticCurveTo(tipX-6+sway, tipY+26, tipX-2+sway, tipY+44); }
    else g.lineTo(fx+6, fy);
    g.stroke();
    if (st.mode === "lose" && st.t-st.winT === 1) {
      g.fillStyle = "#cfeefb"; for (let i=0; i<5; i++) g.fillRect(fx+rnd(16)-8, waterY+4+rnd(8), 3, 3);
    }
    g.fillStyle = st.mode === "win" ? "#f2c94c" : "#0d2438";
    const flap = Math.sin(st.t * 0.5) * 3;
    g.beginPath(); g.ellipse(fx, fy, 14, 7, tug*0.15, 0, 7); g.fill();
    g.beginPath(); g.moveTo(fx-13, fy); g.lineTo(fx-22, fy-6+flap); g.lineTo(fx-22, fy+6+flap); g.fill();
    g.globalAlpha = 1;
    if (st.mode === "tug" && st.t % 5 < 2) {
      g.fillStyle = "#cfeefb";
      for (let i=0; i<4; i++) g.fillRect(fx-10+rnd(24), waterY+6-rnd(10), 3, 3);
    }
    if (st.mode === "win" && st.t-st.winT < 10) { g.fillStyle = "#fff3c2"; for (let i=0; i<6; i++) g.fillRect(fx-14+rnd(28), fy-12+rnd(24), 3, 3); }
    if (st.mode === "tug") { if (st.t%14 === 0) sfx.reel && sfx.reel(2); if (st.t%37 === 0) sfx.creak && sfx.creak(); }
    st.t++; requestAnimationFrame(loop);
  }
  loop();
  return {
    boost()      { st.intensity = 1.9; },
    result(ok)   { st.mode = ok ? "win" : "lose"; st.winT = st.t; st.intensity = 0; },
    stop()       { st.alive = false; canvas.style.display = "none"; },
  };
}
