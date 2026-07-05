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

/** 補魚抽選權重（難度調整用，後台可調）：
 *  - lowFishBias^(5 - diff)：難度越低權重越高（bias=1 中性）
 *  - 目標魚（targetSet 內）再乘 targetFishWeight（=1 中性） */
export function fishWeight(fish, { lowFishBias = 1, targetFishWeight = 1, targetSet = null } = {}) {
  let w = Math.pow(lowFishBias, 5 - fish.diff);
  if (targetSet && targetSet.has(fish.name)) w *= targetFishWeight;
  return w;
}

/** 依權重自候選池挑一個 index；權重總和非正（全 0/NaN）→ 均勻 fallback，保證不卡死 */
function weightedPick(weights) {
  let sum = 0;
  for (const w of weights) sum += w;
  if (!(sum > 0)) return rnd(weights.length);
  let r = Math.random() * sum;
  for (let i = 0; i < weights.length; i++) { r -= weights[i]; if (r < 0) return i; }
  return weights.length - 1;
}

/** 依難度分桶補魚：點位 s 優先抽 difficulty≈s 的魚。
 *  就地修改 spots 與 fishSupply（與原 game.js 行為一致）。
 *  權重參數（lowFishBias/targetFishWeight/targetSet）預設中性 = 舊行為。 */
export function refillBoard({ spots, fishSupply, spotCap, activeBanned, randomFishRatio,
                              lowFishBias = 1, targetFishWeight = 1, targetSet = null }) {
  const wOpt = { lowFishBias, targetFishWeight, targetSet };
  for (let s = 0; s < 6; s++) {
    if (activeBanned.has(s)) { spots[s].length = 0; continue; }
    const want = Math.min(s + 1, 5);
    while (spots[s].length < spotCap[s] && fishSupply.length) {
      let bi;
      if (Math.random() < randomFishRatio) {            // 完全隨機比例（後台可調）：不看深度，但仍吃魚種權重
        bi = weightedPick(fishSupply.map(f => fishWeight(f, wOpt)));
      } else {                                          // 其餘：偏好接近深度的魚，候選池內依權重抽
        const cands = [];
        for (let i = 0; i < fishSupply.length; i++) {
          cands.push([i, Math.abs(fishSupply[i].diff - want)]);
        }
        cands.sort((a, b) => a[1] - b[1]);
        const pool = cands.slice(0, Math.min(6, cands.length));
        bi = pool[weightedPick(pool.map(([i]) => fishWeight(fishSupply[i], wOpt)))][0];
      }
      spots[s].push(fishSupply.splice(bi, 1)[0]);
    }
  }
}
