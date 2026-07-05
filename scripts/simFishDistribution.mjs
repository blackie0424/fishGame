/* 魚種出現機率模擬：對每個場地做 N 次「開局補魚」，統計場上魚的組成。
   用途：量化 lowFishBias / targetFishWeight 調整前後的差異（AGENTS.md 除錯 SOP #5）。
   執行：node scripts/simFishDistribution.mjs [lowFishBias] [targetFishWeight] [N]        */
import { buildFishSupply } from '../resources/game/utils/deck.js';
import { pickBannedSpots, siteCaps, refillBoard } from '../resources/game/utils/board.js';
import { TARGET_SET } from '../resources/game/data/fish.js';
import { SITE_CARDS } from '../resources/game/data/sites.js';
import { siteTier } from '../resources/game/utils/rules.js';

const lowFishBias = +(process.argv[2] ?? 1);
const targetFishWeight = +(process.argv[3] ?? 1);
const N = +(process.argv[4] ?? 20000);
const randomFishRatio = 0.35;

const tiers = { low: [], mid: [], high: [] };
SITE_CARDS.forEach(s => tiers[siteTier(s)].push(s));

console.log(`lowFishBias=${lowFishBias} targetFishWeight=${targetFishWeight} N=${N}/site\n`);
console.log('tier  | diff1 | diff2 | diff3 | diff4 | diff5 | 目標魚占比 | P(場上有目標魚)');
console.log('------|-------|-------|-------|-------|-------|-----------|----------------');

const speciesStat = {};
for (const [tier, sites] of Object.entries(tiers)) {
  const diffCnt = [0, 0, 0, 0, 0, 0];
  let placed = 0, targetCnt = 0, boardsWithTarget = 0, boards = 0;
  for (const site of sites) {
    for (let k = 0; k < N / sites.length; k++) {
      const spots = [[], [], [], [], [], []];
      const fishSupply = buildFishSupply();
      const activeBanned = pickBannedSpots(site);
      const spotCap = siteCaps(site, activeBanned);
      refillBoard({ spots, fishSupply, spotCap, activeBanned, randomFishRatio,
                    lowFishBias, targetFishWeight, targetSet: TARGET_SET });
      const board = spots.flat();
      boards++;
      let hasTarget = false;
      for (const f of board) {
        placed++; diffCnt[f.diff]++;
        speciesStat[tier] ??= {};
        speciesStat[tier][f.name] = (speciesStat[tier][f.name] ?? 0) + 1;
        if (TARGET_SET.has(f.name)) { targetCnt++; hasTarget = true; }
      }
      if (hasTarget) boardsWithTarget++;
    }
  }
  const pc = n => (100 * n / placed).toFixed(1).padStart(5) + '%';
  console.log(`${tier.padEnd(5)} |${pc(diffCnt[1])} |${pc(diffCnt[2])} |${pc(diffCnt[3])} |${pc(diffCnt[4])} |${pc(diffCnt[5])} |    ${(100 * targetCnt / placed).toFixed(1).padStart(5)}% |          ${(100 * boardsWithTarget / boards).toFixed(1)}%`);
}

console.log('\n各層級目標魚單種出現率（場上平均張數 / 100 面板）:');
for (const [tier, stat] of Object.entries(speciesStat)) {
  const boards = N;
  const t = [...TARGET_SET].map(n => `${n}: ${(100 * (stat[n] ?? 0) / boards).toFixed(1)}`).join('  ');
  console.log(`  ${tier.padEnd(5)} ${t}`);
}
