/* =====================================================================
   一擊即中拉竿（動物森友會式）— 純邏輯模組
   參考：水狼陽介〈這是一篇正宗的「釣魚文」〉拉竿機制 1「一擊即中」：
   等真咬瞬間單擊拉竿，時機正確即釣起；點在假咬會嚇跑魚。

   難度依原設計：魚牌 difficulty 1~5，數字越小越容易。
   - diff 2~5：真咬後的拉竿時限遞減（見 REEL_WINDOWS）
   - gt 場地（黑水溝級）：時限 ×0.75
   AI 不玩小遊戲：aiReelSuccess 與放寬後的玩家成功率一致。
===================================================================== */

/** 收線放寬（2026-07-06 Wu 決策）：拉竿成功率一律 ≥95%——
 *  釣起來是「儀式」不是「篩子」，難度由找魚/目標魚稀有度/回合數承擔。
 *  自動捕獲同時取消：所有魚（含 diff1）一律進收放拉鋸。 */
export const REEL_SUCCESS_PROB = 0.95;

/** 各難度的真咬反應時限（毫秒），數字越小越容易 → 時限越長 */
export const REEL_WINDOWS = { 1: 1000, 2: 820, 3: 620, 4: 460, 5: 320 };

/** gt 場地時限倍率 */
export const GT_WINDOW_SCALE = 0.75;

const clampDiff = d => { const n = +d; return Math.max(1, Math.min(5, Number.isFinite(n) ? n : 3)); };

/** 此魚在此場地的真咬時限（毫秒） */
export function reelWindowMs(fish, site) {
  const base = REEL_WINDOWS[clampDiff(fish.diff)];
  return site && site.rule === 'gt' ? Math.round(base * GT_WINDOW_SCALE) : base;
}

/** AI 拉竿成敗：與放寬後的玩家一致（全難度/場地 REEL_SUCCESS_PROB） */
export function aiReelSuccess(fish, site, rand = Math.random) {
  return rand() < REEL_SUCCESS_PROB;
}

/** 假咬與真咬的時間腳本。回傳 { nibbles:[t1,t2..], biteAt }（相對開始的毫秒）
 *  難度越高假咬越多、越會磨玩家耐心；總長控制在 ~2.2–6.5 秒內維持節奏 */
export function nibblePlan(fish, rand = Math.random) {
  const d = clampDiff(fish.diff);
  const n = d <= 2 ? 1 + Math.floor(rand() * 2)      // 1~2 次
        : d <= 4 ? 2 + Math.floor(rand() * 2)        // 2~3 次
        :          3 + Math.floor(rand() * 2);       // 3~4 次
  const nibbles = [];
  let t = 600 + Math.floor(rand() * 400);
  for (let i = 0; i < n; i++) { nibbles.push(t); t += 550 + Math.floor(rand() * 650); }
  const biteAt = t + 350 + Math.floor(rand() * 800);
  return { nibbles, biteAt };
}

/** 拉竿提示文字 */
export function reelNeedText(fish, site) {
  const s = (reelWindowMs(fish, site) / 1000).toFixed(2);
  return `假咬別上當，真咬（❗）瞬間拉竿！時限 ${s} 秒`;
}
