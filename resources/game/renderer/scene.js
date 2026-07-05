export function drawSeaBands(g, W, H, wy) {
  g.fillStyle = "#3f6f9e"; g.fillRect(0, 0, W, wy);
  const bands = ["#11497b","#1b6bad","#2b93d6"];
  const bh = (H - wy) / bands.length;
  bands.forEach((c, i) => { g.fillStyle = c; g.fillRect(0, wy + i * bh, W, bh + 2); });
}

export function drawFishShadow(g, x, y, dir, c = "rgba(6,20,36,.85)") {
  g.fillStyle = c;
  g.beginPath(); g.ellipse(x, y, 9, 4, 0, 0, 7); g.fill();
  g.beginPath(); g.moveTo(x - dir * 8, y); g.lineTo(x - dir * 13, y - 4); g.lineTo(x - dir * 13, y + 4); g.fill();
}

export function drawRockRight(g, W, H) {
  g.fillStyle = "#4e4a44"; g.fillRect(W * 0.66, H * 0.62, W, H);
  g.fillStyle = "#6b6558"; g.fillRect(W * 0.66, H * 0.62, W * 0.34, 4);
}

export function tickDrops(g, drops) {
  g.fillStyle = "#cfeefb";
  for (let i = drops.length - 1; i >= 0; i--) {
    const d = drops[i]; d.l++; d.x += d.vx; d.y += d.vy; d.vy += 0.25;
    if (d.l < 20) g.fillRect(d.x, d.y, 3, 3); else drops.splice(i, 1);
  }
}
