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

/* AI 選點分佈（2026-07-06 修正）：舊版 argmax+微噪音使深水區永遠不會被選，
   電腦玩家全擠在淺水。新版改加權隨機，拋竿位置須有合理分佈。 */
describe('aiPickSpot 深淺分佈', () => {
  async function pickMany(times, patch = {}) {
    const { aiPickSpot } = await import('../../../resources/game/sim/simCore.js');
    const counts = [0, 0, 0, 0, 0, 0];
    for (let i = 0; i < times; i++) {
      const G = {
        round: 3,
        site: { rule: 'gte', total: 12 },
        activeBanned: new Set(),
        spots: [[{}, {}], [{}, {}], [{}, {}], [{}, {}], [{}, {}], [{}, {}]],
        players: [
          { idx: 0, catch: [], role: { need: 6, target: null } },
          { idx: 1, catch: [{}, {}, {}, {}], role: { need: 3, target: null } },
        ],
        ...patch.G,
      };
      const p = patch.p ?? G.players[0];
      counts[aiPickSpot(G, p)]++;
    }
    return counts;
  }

  it('低於個人需求時（常態）深水區 3-5 也要有合理出現率（≥20%）', async () => {
    const c = await pickMany(1500);
    const deep = c[3] + c[4] + c[5];
    expect(deep / 1500).toBeGreaterThan(0.20);
    expect(deep / 1500).toBeLessThan(0.75);      // 也不能反過來全衝深水
  });

  it('缺目標魚時深水區占比明顯提高（>40%）', async () => {
    const c = await pickMany(1500, {
      p: { idx: 0, catch: [], role: { need: 5, target: ['Ilek'] } },
    });
    const deep = c[3] + c[4] + c[5];
    expect(deep / 1500).toBeGreaterThan(0.40);
  });

  it('禁放與空點位永遠不會被選', async () => {
    const c = await pickMany(300, {
      G: { activeBanned: new Set([0, 3]), spots: [[{}], [], [{}], [{}], [{}], [{}]] },
    });
    expect(c[0]).toBe(0);   // 禁放
    expect(c[1]).toBe(0);   // 空點位
    expect(c[3]).toBe(0);   // 禁放
  });
});
