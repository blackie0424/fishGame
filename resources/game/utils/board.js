/* =====================================================================
   盤面（水域點位）純邏輯 — 自 game.js 抽出（refactor phase5）
   不碰 DOM、不碰全域 G；由 game.js 以薄包裝繫結遊戲狀態。
===================================================================== */
import { shuffle, rnd } from './deck.js';

/** 每回合隨機決定禁放點位：數量取自場地設定，具體點位重新抽 */
export function pickBannedSpots(site) {
  const count = (site && Array.isArray(site.banned)) ? site.banned.length : 0;
  const all = shuffle([0, 1, 2, 3, 4, 5]);
  return new Set(all.slice(0, count));
}

/** 依場地固定總張數，分配各點位容量（淺點位優先多放）
 *  防呆：total 非正數（含 undefined/null/NaN）一律視為 0，避免無限迴圈 */
export function siteCaps(site, activeBanned) {
  const caps = [0, 0, 0, 0, 0, 0];
  const allowed = [0, 1, 2, 3, 4, 5].filter(sp => !activeBanned.has(sp));
  if (!allowed.length) return caps;
  let left = Number.isFinite(+site.total) && +site.total > 0 ? Math.floor(+site.total) : 0;
  let i = 0;
  while (left > 0) { caps[allowed[i % allowed.length]]++; left--; i++; }
  return caps;
}

/** 場上（未禁放點位）是否還有魚 */
export function boardHasFish(spots, activeBanned) {
  return [0, 1, 2, 3, 4, 5].some(s => !activeBanned.has(s) && spots[s].length);
}

/** 依難度分桶補魚：點位 s 優先抽 difficulty≈s 的魚。
 *  就地修改 spots 與 fishSupply（與原 game.js 行為一致）。 */
export function refillBoard({ spots, fishSupply, spotCap, activeBanned, randomFishRatio }) {
  for (let s = 0; s < 6; s++) {
    if (activeBanned.has(s)) { spots[s].length = 0; continue; }
    const want = Math.min(s + 1, 5);
    while (spots[s].length < spotCap[s] && fishSupply.length) {
      let bi;
      if (Math.random() < randomFishRatio) {            // 完全隨機比例（後台可調）
        bi = rnd(fishSupply.length);
      } else {                                          // 其餘：偏好接近深度的魚，自候選中隨機挑
        const cands = [];
        for (let i = 0; i < fishSupply.length; i++) {
          cands.push([i, Math.abs(fishSupply[i].diff - want)]);
        }
        cands.sort((a, b) => a[1] - b[1]);
        const pool = cands.slice(0, Math.min(6, cands.length));
        bi = pool[rnd(pool.length)][0];
      }
      spots[s].push(fishSupply.splice(bi, 1)[0]);
    }
  }
}
