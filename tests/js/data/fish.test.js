import { describe, it, expect } from 'vitest';
import { FISH_SPECIES, TARGET_SET } from '../../../public/game/data/fish.js';

describe('FISH_SPECIES', () => {
  it('共 52 張魚牌', () => {
    const total = FISH_SPECIES.reduce((sum, f) => sum + f.count, 0);
    expect(total).toBe(52);
  });

  it('共 20 種魚', () => {
    expect(FISH_SPECIES.length).toBe(20);
  });

  it('難度分布正確（1×17、2×19、3×5、4×5、5×6 — 依來源 xlsx）', () => {
    const byDiff = {};
    FISH_SPECIES.forEach(f => { byDiff[f.diff] = (byDiff[f.diff] || 0) + f.count; });
    expect(byDiff[1]).toBe(17);
    expect(byDiff[2]).toBe(19);
    expect(byDiff[3]).toBe(5);
    expect(byDiff[4]).toBe(5);
    expect(byDiff[5]).toBe(6);
  });

  it('每條魚都有 name、count、diff、category、colors', () => {
    FISH_SPECIES.forEach(f => {
      expect(f.name).toBeTypeOf('string');
      expect(f.count).toBeGreaterThan(0);
      expect(f.diff).toBeGreaterThanOrEqual(1);
      expect(f.diff).toBeLessThanOrEqual(5);
      expect(f.category).toMatch(/^(Rahet|Oyod)$/);
      expect(f.colors).toHaveLength(3);
    });
  });

  it('名稱不重複', () => {
    const names = FISH_SPECIES.map(f => f.name);
    expect(new Set(names).size).toBe(names.length);
  });
});

describe('TARGET_SET', () => {
  it('包含 4 種稀有目標魚', () => {
    expect(TARGET_SET.size).toBe(4);
  });

  it('目標魚都存在於 FISH_SPECIES', () => {
    const names = new Set(FISH_SPECIES.map(f => f.name));
    TARGET_SET.forEach(n => expect(names.has(n)).toBe(true));
  });

  it('目標魚都是難度 4 或 5', () => {
    TARGET_SET.forEach(name => {
      const f = FISH_SPECIES.find(f => f.name === name);
      expect(f.diff).toBeGreaterThanOrEqual(4);
    });
  });
});
