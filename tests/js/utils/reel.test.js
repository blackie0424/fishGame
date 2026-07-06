import { describe, it, expect } from 'vitest';
import { REEL_WINDOWS, GT_WINDOW_SCALE, reelWindowMs, aiReelSuccess, nibblePlan, reelNeedText } from '../../../resources/game/utils/reel.js';

const gte = { rule: 'gte' };
const gt = { rule: 'gt' };
const fish = d => ({ name: 'x', diff: d });

describe('reelWindowMs — 難度對應時限（數字越小越容易 → 時限越長）', () => {
  it('難度 1~5 時限嚴格遞減', () => {
    const w = [1, 2, 3, 4, 5].map(d => reelWindowMs(fish(d), gte));
    for (let i = 1; i < w.length; i++) expect(w[i]).toBeLessThan(w[i - 1]);
  });
  it('gt 場地時限 ×0.75', () => {
    expect(reelWindowMs(fish(3), gt)).toBe(Math.round(REEL_WINDOWS[3] * GT_WINDOW_SCALE));
  });
  it('難度越界/缺值 → 夾限到 1~5，不會 NaN', () => {
    expect(reelWindowMs(fish(9), gte)).toBe(REEL_WINDOWS[5]);
    expect(reelWindowMs(fish(0), gte)).toBe(REEL_WINDOWS[1]);
    expect(Number.isFinite(reelWindowMs(fish(undefined), gte))).toBe(true);
  });
});

describe('aiReelSuccess — AI 沿用原骰子機率（勝率校準不變）', () => {
  it('gte 場地：難度 d 成功率 = (7-d)/6（虛擬骰逐一驗證）', () => {
    for (const d of [2, 3, 4, 5]) {
      let ok = 0;
      for (let face = 0; face < 6; face++) ok += aiReelSuccess(fish(d), gte, () => face / 6) ? 1 : 0;
      expect(ok).toBe(7 - d);
    }
  });
  it('gt 場地：難度 d 成功率 = (6-d)/6', () => {
    for (const d of [1, 3, 5]) {
      let ok = 0;
      for (let face = 0; face < 6; face++) ok += aiReelSuccess(fish(d), gt, () => face / 6) ? 1 : 0;
      expect(ok).toBe(6 - d);
    }
  });
});

describe('nibblePlan — 假咬腳本', () => {
  it('假咬次數隨難度上升；真咬一定在最後一次假咬之後', () => {
    for (const d of [1, 2, 3, 4, 5]) {
      for (let k = 0; k < 20; k++) {
        const p = nibblePlan(fish(d));
        const maxN = d <= 2 ? 2 : d <= 4 ? 3 : 4;
        const minN = d <= 2 ? 1 : d <= 4 ? 2 : 3;
        expect(p.nibbles.length).toBeGreaterThanOrEqual(minN);
        expect(p.nibbles.length).toBeLessThanOrEqual(maxN);
        expect(p.biteAt).toBeGreaterThan(p.nibbles[p.nibbles.length - 1]);
        for (let i = 1; i < p.nibbles.length; i++) expect(p.nibbles[i]).toBeGreaterThan(p.nibbles[i - 1]);
      }
    }
  });
  it('總長受控（節奏）：真咬時間點落在 0.9~7 秒內', () => {
    for (let k = 0; k < 50; k++) {
      const p = nibblePlan(fish(5));
      expect(p.biteAt).toBeGreaterThan(900);
      expect(p.biteAt).toBeLessThan(7000);
    }
  });
});

describe('reelNeedText', () => {
  it('包含秒數提示', () => {
    expect(reelNeedText(fish(5), gt)).toMatch(/0\.24 秒/);
  });
});
