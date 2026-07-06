/* =====================================================================
   收放節奏難度校準（無頭模擬）
   用「一般玩家」機器人跑 N 場，對照原骰子制的成功率，
   確保新機制的難度曲線「依照原先設計」（diff 越小越容易）。
   用法：node scripts/sim-tension.mjs [N]
===================================================================== */
import { runBotFight } from '../resources/game/minigame/tension.js';

const N = +(process.argv[2] || 1500);
const oldOdds = (d, rule) => rule === 'gt' ? (6 - d) / 6 : (7 - d) / 6;

console.log(`每格 ${N} 場（一般玩家機器人：反應 300ms、13% 手滑）\n`);
for (const rule of ['gte', 'gt']) {
  console.log(`── ${rule === 'gt' ? 'gt 場地（黑水溝級，判定 >）' : '一般場地（判定 ≥）'} ──`);
  for (let d = 1; d <= 5; d++) {
    if (d === 1 && rule !== 'gt') { console.log('diff 1  自動捕獲（fishAuto，不進小遊戲）'); continue; }
    let land = 0, snap = 0, spit = 0;
    for (let i = 0; i < N; i++) {
      const r = runBotFight({ diff: d }, { rule });
      if (r === 'landed') land++; else if (r === 'snap') snap++; else spit++;
    }
    const rate = land / N, old = oldOdds(d, rule);
    console.log(`diff ${d}  成功 ${(rate * 100).toFixed(1).padStart(5)}%（原骰子 ${(old * 100).toFixed(1)}%，差 ${((rate - old) * 100).toFixed(1)}）  斷線 ${(snap * 100 / N).toFixed(0)}% 吐鉤 ${(spit * 100 / N).toFixed(0)}%`);
  }
  console.log('');
}
