/* =====================================================================
   收放節奏拉竿（手竿）— 純邏輯模組
   參考：水狼陽介〈這是一篇正宗的「釣魚文」〉拉竿機制 4「收放節奏」：
   「魚掙扎時放鬆釣線，魚平靜時收緊釣線」。掙扎中硬拉 → 緊繃度到頂斷線；
   釣線鬆弛太久 → 魚吐鉤游走。魚的「體力」與「掙扎節奏」依魚種設計。

   手竿（無捲線器）：玩家只有兩個操作——
   1. 收／放線（按住＝收線收緊、放開＝放線鬆弛）
   2. 移動站位（魚往左右暴衝時，跟著移動可大幅降低釣線負擔）

   難度依原設計：魚牌（撲克牌版本）difficulty 1~5，數字越小越容易。
   - diff 1 於 ≥ 場地維持「自動捕獲」（fishAuto，不進小遊戲）
   - gt 場地（黑水溝級）：前兆更短、掙扎更猛、魚更耐拉
   AI 不玩小遊戲：沿用原骰子機率（utils/reel.js aiReelSuccess），勝率校準不變。
===================================================================== */

const clampDiff = d => { const n = +d; return Math.max(1, Math.min(5, Number.isFinite(n) ? n : 3)); };

/** 各難度手感參數（單位：毫秒 / 每毫秒變化量，0~100 量表）
 *  stamina  魚的體力（收線消耗，歸零＝起魚）
 *  calmMs   平靜期長度基準（收線的安全窗）
 *  teleMs   掙扎前兆長度（給玩家的反應時間，越難越短）
 *  strugMs  掙扎期長度基準
 *  riseStrug 掙扎中仍收線 → 緊繃度每毫秒上升
 *  drainCalm 平靜中收線 → 魚體力每毫秒消耗
 *  runProb  掙扎時往左右暴衝的機率（需要移動站位跟上）
 */
export const TENSION_PARAMS = {
  1: { stamina: 65,  calmMs: 3200, teleMs: 900,  strugMs: 500,  riseStrug: .075, drainCalm: .065, runProb: 0, feint: 1.0 },
  2: { stamina: 75,  calmMs: 2900, teleMs: 780,  strugMs: 600,  riseStrug: .080, drainCalm: .058, runProb: 0, feint: 1.0 },
  3: { stamina: 85,  calmMs: 2600, teleMs: 660,  strugMs: 720,  riseStrug: .086, drainCalm: .052, runProb: 0, feint: 1.0 },
  4: { stamina: 95,  calmMs: 2300, teleMs: 550,  strugMs: 860,  riseStrug: .092, drainCalm: .046, runProb: 0, feint: 1.0 },
  5: { stamina: 105, calmMs: 2000, teleMs: 440,  strugMs: 1000, riseStrug: .098, drainCalm: .040, runProb: 0, feint: 1.0 },
};

/** 共同參數 */
export const TENSION_COMMON = {
  tensionStart: 28,
  riseCalm: .004,       // 平靜中持續收線負擔（放寬）
  fallCalm: .072,       // 平靜中放線 → 緊繃度快速下降
  fallStrug: .032,      // 掙扎中放線 → 緊繃度下降（放寬）
  drainStrug: .006,     // 掙扎本身消耗魚體力（加快收斂）
  slackTh: 5,           // 緊繃度低於此值視為「線太鬆」
  slackGraceMs: 4000,   // 線太鬆累計超過此時間 → 魚吐鉤（放寬）
  strugFloor: 18,       // 掙扎中放線時緊繃下限（降低，更容易放鬆）
  runAligned: 1,        // 無移動機制，暴衝負擔固定（無方向加成）
  runOpposed: 1,        // 無移動機制
  maxMs: 35000,         // 安全上限
};

/** gt 場地（判定邏輯「>」）的加成 */
export const GT_SCALE = { teleMs: .72, riseStrug: 1.12, strugMs: 1.12, stamina: 1.08 };

/** 此魚在此場地的實際參數 */
export function tensionParams(fish, site) {
  const base = TENSION_PARAMS[clampDiff(fish && fish.diff)];
  const p = { ...TENSION_COMMON, ...base };
  if (site && site.rule === 'gt') {
    p.teleMs = Math.round(p.teleMs * GT_SCALE.teleMs);
    p.riseStrug *= GT_SCALE.riseStrug;
    p.strugMs = Math.round(p.strugMs * GT_SCALE.strugMs);
    p.stamina = Math.round(p.stamina * GT_SCALE.stamina);
  }
  return p;
}

/** 建立一場收放拉鋸戰。rng 可注入以利測試。
 *  tick(dt, { pull, stance })：
 *    pull   true=收線、false=放線
 *    stance -1/0/1 玩家站位（跟上 runDir 可省力）
 *  回傳狀態快照：
 *    mode: 'calm'|'tele'|'struggle'   runDir: -1|0|1
 *    tension: 0~100   stamina: 剩餘體力   staminaMax
 *    done: null|'landed'|'snap'|'spit'   t: 經過毫秒
 */
export function createTensionFight(fish, site, rng = Math.random) {
  const P = tensionParams(fish, site);
  const jit = base => base * (0.75 + rng() * 0.5);
  const st = {
    t: 0, mode: 'calm', modeT: 0, modeDur: jit(P.calmMs),
    runDir: 0, tension: P.tensionStart, stamina: P.stamina, staminaMax: P.stamina,
    slackT: 0, done: null, params: P,
  };
  function nextMode() {
    if (st.mode === 'calm') { st.mode = 'tele'; st.modeDur = P.teleMs; }
    else if (st.mode === 'tele') {
      st.mode = 'struggle'; st.modeDur = jit(P.strugMs);
      st.runDir = rng() < P.runProb ? (rng() < .5 ? -1 : 1) : 0;
    } else { st.mode = 'calm'; st.modeDur = jit(P.calmMs); st.runDir = 0; }
    st.modeT = 0;
  }
  function step(dt, pull, stance) {
    st.modeT += dt;
    if (st.modeT >= st.modeDur) nextMode();
    const struggling = st.mode === 'struggle';
    const af = !struggling || st.runDir === 0 ? 1
             : stance === st.runDir ? P.runAligned
             : stance === -st.runDir ? P.runOpposed : 1;
    // 緊繃度
    if (struggling) {
      st.tension += (pull ? P.riseStrug * af : -P.fallStrug) * dt;
      if (!pull && st.tension < P.strugFloor)                      // 魚的拉力把線拉直（快速趨近下限）
        st.tension = Math.min(P.strugFloor, st.tension + .12 * dt);
    }
    else st.tension += (pull ? P.riseCalm : -P.fallCalm) * dt;
    st.tension = Math.max(0, Math.min(100, st.tension));
    // 魚體力
    if (pull && !struggling) st.stamina -= P.drainCalm * dt;
    if (struggling)          st.stamina -= P.drainStrug * dt;
    // 判定
    if (st.tension >= 100) { st.done = 'snap'; return; }         // 斷線
    if (st.stamina <= 0)   { st.done = 'landed'; return; }       // 魚力竭 → 起魚
    if (st.mode === 'calm' && st.tension <= P.slackTh) {           // 只有平靜期的鬆線才算怠惰
      st.slackT += dt; if (st.slackT >= P.slackGraceMs) { st.done = 'spit'; return; }
    } else st.slackT = Math.max(0, st.slackT - dt * 2);
    if (st.t >= P.maxMs) st.done = 'spit';                       // 拉鋸過久 → 魚脫鉤
  }
  return {
    st,
    tick(dt, input = {}) {
      if (st.done) return st;
      let left = Math.max(0, dt);
      while (left > 0 && !st.done) {                              // 大 dt 切片，行為與幀率無關
        const s = Math.min(25, left); left -= s;
        st.t += s; step(s, !!input.pull, input.stance | 0);
      }
      return st;
    },
  };
}

/** 「一般玩家」機器人：給 AI 演出與難度校準用。
 *  延遲感知模型——人看到畫面變化後需要 reactMs 才做出反應：
 *  - 感知到的魚狀態 = 實際狀態延遲 reactMs（前兆越短，越容易「握進掙扎期」）
 *  - 每次掙扎有 missProb 機率整段沒放線（手滑）；前兆越短失手率越高
 *  - 暴衝時有 stanceProb 機率在 stanceMs 後跟上站位
 */
export function createBotPolicy(opts = {}, rng = Math.random) {
  const o = { reactMs: 290, missBase: .13, stanceProb: .75, stanceMs: 420, relaxAt: 62, ...opts };
  let pendMode = 'calm', pendAt = 0, seen = 'calm';
  let missThis = false, stance = 0, stanceAt = -1, wantStance = 0, runSeen = 0;
  return function decide(st) {
    if (st.mode !== pendMode) { pendMode = st.mode; pendAt = st.t; }         // 畫面上的變化
    if (st.t - pendAt >= o.reactMs && seen !== pendMode) {                   // 反應完成，更新認知
      seen = pendMode;
      if (seen === 'struggle') {
        const tele = st.params.teleMs;                                       // 前兆越短越容易失手
        missThis = rng() < Math.min(.5, o.missBase * (st.params.feint || 1) * Math.pow(370 / Math.max(tele, 120), 1.35));
        runSeen = st.runDir; wantStance = runSeen; stanceAt = st.t + o.stanceMs;
        if (rng() >= o.stanceProb) stanceAt = -1;                            // 這次沒跟上站位
      }
      if (seen === 'calm') { wantStance = 0; stanceAt = st.t + o.stanceMs; }
    }
    if (stanceAt >= 0 && st.t >= stanceAt) { stance = wantStance; stanceAt = -1; }
    let pull;
    if (seen === 'struggle') pull = missThis;                                // 認知到掙扎 → 放線（除非手滑）
    else if (seen === 'tele') pull = false;                                  // 認知到前兆 → 預先鬆手
    else pull = st.tension < o.relaxAt;                                      // 認知平靜 → 收線，太緊換氣
    return { pull, stance };
  };
}

/** 跑一場機器人拉鋸戰（測試/校準用），回傳 'landed'|'snap'|'spit' */
export function runBotFight(fish, site, rng = Math.random, botOpts = {}) {
  const fight = createTensionFight(fish, site, rng);
  const bot = createBotPolicy(botOpts, rng);
  while (!fight.st.done) fight.tick(50, bot(fight.st));
  return fight.st.done;
}

/** 拉竿提示文字（HUD 副標） */
export function tensionNeedText(fish, site) {
  const d = clampDiff(fish && fish.diff);
  const gt = site && site.rule === 'gt';
  return `掙扎💢放線、平靜😌按住收線 難度 ${'★'.repeat(d)}${gt ? '（黑水溝級）' : ''}`;
}
