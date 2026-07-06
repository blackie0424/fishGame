import { describe, it, expect } from 'vitest';
import { playOne } from '../../../scripts/simGame.mjs';
import { SITE_CARDS } from '../../../resources/game/data/sites.js';

/* 整場模擬器煙霧測試：保證勝率校準工具本身不壞掉 */
describe('simGame 無頭模擬器', () => {
  it('單場模擬回傳合理結構（3/4/5 人）', () => {
    for (const n of [3, 4, 5]) {
      const r = playOne(SITE_CARDS[0], n, 15);
      expect(r.players.length).toBe(n);
      expect(r.goal).toBeGreaterThan(0);
      expect(r.total).toBeGreaterThanOrEqual(0);
      expect(typeof r.collectiveWin).toBe('boolean');
      expect(typeof r.allPersonal).toBe('boolean');
    }
  });

  it('漁獲總數永不超過魚牌總量 54（含海鰻/逃脫歸還）', () => {
    for (let i = 0; i < 20; i++) {
      const r = playOne(SITE_CARDS[10], 5, 15);
      expect(r.total).toBeLessThanOrEqual(54);
    }
  });

  it('回合數越少漁獲越少（方向性檢查，統計 200 場）', () => {
    const avg = rounds => {
      let t = 0;
      for (let i = 0; i < 200; i++) t += playOne(SITE_CARDS[0], 4, rounds).total;
      return t / 200;
    };
    expect(avg(8)).toBeLessThan(avg(15));
  });
});
