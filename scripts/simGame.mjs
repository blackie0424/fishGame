/* 整場遊戲無頭模擬 CLI — 核心邏輯在 resources/game/sim/simCore.js（與後台勝率試算頁共用）。
   執行：node scripts/simGame.mjs [games=2000] [rounds=15] [players=3,4,5]
   環境變數：LOW_BIAS / TGT_W / GOAL 可覆寫權重與集體目標。                     */
import { playOne as corePlayOne, simulate as coreSimulate } from '../resources/game/sim/simCore.js';

const WEIGHTS = { randomFishRatio: 0.35,
  lowFishBias: +(process.env.LOW_BIAS ?? 1.7),
  targetFishWeight: +(process.env.TGT_W ?? 0.35) };
const GOAL_OVERRIDE = process.env.GOAL ? +process.env.GOAL : null;

export const playOne = (site, n, rounds, weights = WEIGHTS, goal = GOAL_OVERRIDE) =>
  corePlayOne(site, n, rounds, weights, goal);
export const simulate = (opts = {}) =>
  coreSimulate({ weights: WEIGHTS, goalOverride: GOAL_OVERRIDE, ...opts });

const isMain = process.argv[1] && import.meta.url.endsWith(process.argv[1].split('/').pop());
if (isMain) {
  const GAMES = +(process.argv[2] ?? 2000);
  const ROUNDS = +(process.argv[3] ?? 15);
  const PLAYER_COUNTS = (process.argv[4] ?? '3,4,5').split(',').map(Number);
  console.log(`games/cell=${GAMES} rounds=${ROUNDS} players=${PLAYER_COUNTS.join('/')} weights=${WEIGHTS.lowFishBias}/${WEIGHTS.targetFishWeight}\n`);
  const res = await simulate({ games: GAMES, rounds: ROUNDS, playerCounts: PLAYER_COUNTS });
  const byN = {};
  for (const r of res) { (byN[r.n] ??= []).push(r); }
  for (const [n, rows] of Object.entries(byN)) {
    console.log(`===== ${n} 人局 =====`);
    console.log('場地             層級 | 集體勝率 | 個人全達成 | 平均漁獲/目標');
    for (const r of rows)
      console.log(`${r.site.padEnd(8, '　')} ${r.tier.padEnd(4)} |   ${r.collective.toFixed(1).padStart(5)}% |     ${r.allPersonal.toFixed(1).padStart(5)}% | ${r.avgCatch.toFixed(1)}/${r.avgGoal.toFixed(1)}`);
    console.log();
  }
}
