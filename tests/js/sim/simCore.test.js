import { describe, it, expect } from 'vitest';
import { playOne, simulate } from '../../../resources/game/sim/simCore.js';
import { SITE_CARDS } from '../../../resources/game/data/sites.js';

/* simCore：可參數化的整場模擬核心（後台勝率試算頁與 CLI 共用） */
describe('simCore 參數化', () => {
  const weights = { randomFishRatio: 0.35, lowFishBias: 1.7, targetFishWeight: 0.35 };

  it('playOne 接受權重參數並回傳單場結果', () => {
    const r = playOne(SITE_CARDS[0], 4, 15, weights);
    expect(r.players.length).toBe(4);
    expect(typeof r.collectiveWin).toBe('boolean');
  });

  it('simulate 回傳 場地×人數 的彙總列，且尊重 rounds 參數', async () => {
    const res = await simulate({ games: 3, rounds: 5, playerCounts: [3, 4], weights });
    expect(res.length).toBe(SITE_CARDS.length * 2);
    expect(res[0]).toHaveProperty('collective');
    expect(res[0]).toHaveProperty('allPersonal');
    expect(res[0]).toHaveProperty('tier');
  });

  it('simulate 支援 onProgress 回呼', async () => {
    let calls = 0;
    await simulate({ games: 1, rounds: 3, playerCounts: [4], weights, onProgress: () => calls++ });
    expect(calls).toBeGreaterThan(0);
  });

  it('rounds 較少 → 平均漁獲較少（統計 150 場）', () => {
    const avg = rounds => {
      let t = 0;
      for (let i = 0; i < 150; i++) t += playOne(SITE_CARDS[0], 4, rounds, weights).total;
      return t / 150;
    };
    expect(avg(6)).toBeLessThan(avg(15));
  });
});
