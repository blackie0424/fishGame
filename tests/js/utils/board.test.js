import { describe, it, expect } from 'vitest';
import { pickBannedSpots, siteCaps, boardHasFish, refillBoard } from '../../../resources/game/utils/board.js';

const mkSite = (over = {}) => ({ name: 't', rule: 'gte', banned: [], total: 10, ...over });
const mkFish = n => Array.from({ length: n }, (_, i) => ({ name: `f${i}`, diff: (i % 5) + 1 }));

describe('pickBannedSpots', () => {
  it('禁放數量取自場地設定，點位落在 0..5', () => {
    const banned = pickBannedSpots(mkSite({ banned: [1, 2, 6] }));
    expect(banned.size).toBe(3);
    [...banned].forEach(s => expect(s).toBeGreaterThanOrEqual(0));
    [...banned].forEach(s => expect(s).toBeLessThanOrEqual(5));
  });
  it('banned 為空陣列時無禁放', () => {
    expect(pickBannedSpots(mkSite()).size).toBe(0);
  });
  it('banned 缺值時不炸、無禁放', () => {
    expect(pickBannedSpots({ total: 5 }).size).toBe(0);
  });
});

describe('siteCaps', () => {
  it('容量總和 = 場地 total，禁放點位為 0', () => {
    const banned = new Set([1, 4]);
    const caps = siteCaps(mkSite({ total: 7 }), banned);
    expect(caps.reduce((a, b) => a + b, 0)).toBe(7);
    expect(caps[1]).toBe(0);
    expect(caps[4]).toBe(0);
  });
  it('total 缺值/0/負數/NaN → 全 0 且不會無限迴圈', () => {
    for (const bad of [undefined, null, 0, -3, NaN, 'x']) {
      const caps = siteCaps(mkSite({ total: bad }), new Set());
      expect(caps).toEqual([0, 0, 0, 0, 0, 0]);
    }
  });
  it('全部禁放 → 全 0（不會 modulo 空陣列）', () => {
    const caps = siteCaps(mkSite({ total: 5 }), new Set([0, 1, 2, 3, 4, 5]));
    expect(caps).toEqual([0, 0, 0, 0, 0, 0]);
  });
});

describe('refillBoard', () => {
  it('補滿至容量並自魚庫扣除；禁放點位清空', () => {
    const spots = [[], [], [], [], [], []];
    spots[1].push({ name: 'stale', diff: 1 }); // 禁放點殘留的魚應被清空
    const fishSupply = mkFish(52);
    const activeBanned = new Set([1]);
    const spotCap = siteCaps(mkSite({ total: 10 }), activeBanned);
    refillBoard({ spots, fishSupply, spotCap, activeBanned, randomFishRatio: 0.35 });
    expect(spots.flat().length).toBe(10);
    expect(spots[1].length).toBe(0);
    expect(fishSupply.length).toBe(42);
  });
  it('魚庫不足時盡量補、不炸', () => {
    const spots = [[], [], [], [], [], []];
    const fishSupply = mkFish(3);
    const activeBanned = new Set();
    const spotCap = siteCaps(mkSite({ total: 10 }), activeBanned);
    refillBoard({ spots, fishSupply, spotCap, activeBanned, randomFishRatio: 0.35 });
    expect(spots.flat().length).toBe(3);
    expect(fishSupply.length).toBe(0);
  });
});

describe('boardHasFish', () => {
  it('僅計入未禁放點位', () => {
    const spots = [[], [{ name: 'x' }], [], [], [], []];
    expect(boardHasFish(spots, new Set())).toBe(true);
    expect(boardHasFish(spots, new Set([1]))).toBe(false);
  });
  it('全空 → false', () => {
    expect(boardHasFish([[], [], [], [], [], []], new Set())).toBe(false);
  });
});

/* ============ 魚種出現機率權重（2026-07-05 難度調整） ============ */
import { fishWeight } from '../../../resources/game/utils/board.js';

describe('fishWeight', () => {
  it('中性參數（bias=1, weight=1）→ 所有魚權重為 1', () => {
    for (const diff of [1, 2, 3, 4, 5]) {
      expect(fishWeight({ name: 'x', diff })).toBe(1);
    }
  });
  it('lowFishBias=2 → 每低一級難度權重加倍（diff1 = diff5 的 16 倍）', () => {
    const opt = { lowFishBias: 2 };
    expect(fishWeight({ name: 'x', diff: 1 }, opt)).toBe(16);
    expect(fishWeight({ name: 'x', diff: 4 }, opt)).toBe(2);
    expect(fishWeight({ name: 'x', diff: 5 }, opt)).toBe(1);
  });
  it('目標魚額外乘 targetFishWeight', () => {
    const opt = { lowFishBias: 2, targetFishWeight: 0.5, targetSet: new Set(['Ilek']) };
    expect(fishWeight({ name: 'Ilek', diff: 5 }, opt)).toBe(0.5);
    expect(fishWeight({ name: 'Arawa', diff: 5 }, opt)).toBe(1);
  });
});

describe('refillBoard 權重抽選', () => {
  const fill = extra => {
    const spots = [[], [], [], [], [], []];
    const activeBanned = new Set();
    const spotCap = siteCaps(mkSite({ total: 10 }), activeBanned);
    refillBoard({ spots, fishSupply: extra.fishSupply, spotCap, activeBanned,
                  randomFishRatio: extra.randomFishRatio ?? 1, ...extra });
    return spots.flat();
  };
  it('targetFishWeight=0 → 非目標魚充足時，場上不出現目標魚', () => {
    const targetSet = new Set(['Ilek']);
    const fishSupply = [
      ...Array.from({ length: 20 }, (_, i) => ({ name: `n${i}`, diff: (i % 5) + 1 })),
      ...Array.from({ length: 20 }, () => ({ name: 'Ilek', diff: 5 })),
    ];
    const placed = fill({ fishSupply, targetFishWeight: 0, targetSet });
    expect(placed.length).toBe(10);
    expect(placed.some(f => f.name === 'Ilek')).toBe(false);
  });
  it('魚庫只剩目標魚且權重 0 → 均勻 fallback，仍能補滿不卡死', () => {
    const targetSet = new Set(['Ilek']);
    const fishSupply = Array.from({ length: 12 }, () => ({ name: 'Ilek', diff: 5 }));
    const placed = fill({ fishSupply, targetFishWeight: 0, targetSet });
    expect(placed.length).toBe(10);
  });
  it('lowFishBias 極大 → 低難度魚優先佔滿場面', () => {
    const fishSupply = [
      ...Array.from({ length: 10 }, (_, i) => ({ name: `lo${i}`, diff: 1 })),
      ...Array.from({ length: 30 }, (_, i) => ({ name: `hi${i}`, diff: 5 })),
    ];
    const placed = fill({ fishSupply, lowFishBias: 1e9 });
    expect(placed.filter(f => f.diff === 1).length).toBe(10);
  });
  it('不傳權重參數 → 與既有行為相容（能正常補滿）', () => {
    const placed = fill({ fishSupply: mkFish(52), randomFishRatio: 0.35 });
    expect(placed.length).toBe(10);
  });
});
