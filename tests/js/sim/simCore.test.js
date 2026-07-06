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

/* 風太大二段式（2026-07-06）：擲骰成功後再抽一張命運卡，第二張不會是風太大 */
describe('drawDestiny 風太大二段式', () => {
  it('風太大成功 → 由第二張命運卡決定結果；全 go 牌堆下通過率 ≈ 2/3', async () => {
    const { drawDestiny } = await import('../../../resources/game/sim/simCore.js');
    let proceed = 0, hooked = 0;
    const N = 600;
    for (let i = 0; i < N; i++) {
      const G = { site: { rule: 'gte', total: 10 }, players: [], destinyDeck: [
        { kind: 'go' }, { kind: 'wind' },          // pop 先抽到 wind，成功後抽到 go
      ] };
      const p = { idx: 0, rest: 0, catch: [] };
      G.players = [p, { idx: 1, rest: 0, catch: [] }];
      const r = drawDestiny(G, p);
      if (r.proceed) { proceed++; if (r.flags.hooked) hooked++; }
    }
    expect(proceed / N).toBeGreaterThan(0.55);   // 理論 2/3，統計容差
    expect(proceed / N).toBeLessThan(0.78);
    expect(hooked).toBe(proceed);                // 通過必為第二張 go 給的 hooked
  });

  it('第二張抽到風太大會跳過重抽', async () => {
    const { drawDestiny } = await import('../../../resources/game/sim/simCore.js');
    for (let i = 0; i < 200; i++) {
      const G = { site: { rule: 'gte', total: 10 }, players: [], destinyDeck: [
        { kind: 'fail' }, { kind: 'wind' }, { kind: 'wind' },   // wind→(成功)→skip wind→fail
      ] };
      const p = { idx: 0, rest: 0, catch: [] };
      G.players = [p, { idx: 1, rest: 0, catch: [] }];
      const r = drawDestiny(G, p);
      expect(r.proceed).toBe(false);   // 無論風太大成敗，結局都是 fail 或風吹走
    }
  });
});
