import { describe, it, expect } from 'vitest';
import * as rules from '../../../resources/game/utils/rules.js';
import { siteTier, fishPass, fishNeedText } from '../../../resources/game/utils/rules.js';
import { SITE_CARDS } from '../../../resources/game/data/sites.js';

const siteGte10 = SITE_CARDS.find(s => s.rule === 'gte' && s.total >= 10); // low
const siteGte7  = SITE_CARDS.find(s => s.rule === 'gte' && s.total < 10);  // mid
const siteGt    = SITE_CARDS.find(s => s.rule === 'gt');                    // high

describe('siteTier', () => {
  it('gte + total>=10 → low', () => {
    expect(siteTier(siteGte10)).toBe('low');
  });

  it('gte + total<10 → mid', () => {
    expect(siteTier(siteGte7)).toBe('mid');
  });

  it('gt → high', () => {
    expect(siteTier(siteGt)).toBe('high');
  });
});

describe('fishPass', () => {
  const fishDiff3 = { diff: 3 };

  it('gte 場地：roll === diff → 捕獲', () => {
    expect(fishPass(3, fishDiff3, siteGte10)).toBe(true);
  });

  it('gte 場地：roll < diff → 失敗', () => {
    expect(fishPass(2, fishDiff3, siteGte10)).toBe(false);
  });

  it('gt 場地：roll === diff → 失敗（需嚴格大於）', () => {
    expect(fishPass(3, fishDiff3, siteGt)).toBe(false);
  });

  it('gt 場地：roll > diff → 捕獲', () => {
    expect(fishPass(4, fishDiff3, siteGt)).toBe(true);
  });
});

describe('自動捕獲已取消（2026-07-06 Wu 決策）', () => {
  it('rules.js 不再提供 fishAuto——所有魚一律進收放拉鋸', () => {
    expect(rules.fishAuto).toBeUndefined();
  });
});

describe('fishNeedText', () => {
  const f = { diff: 4 };

  it('gte 場地 → 骰出 ≥ 4', () => {
    expect(fishNeedText(f, siteGte10)).toBe('骰出 ≥ 4');
  });

  it('gt 場地 → 骰出 > 4', () => {
    expect(fishNeedText(f, siteGt)).toBe('骰出 > 4');
  });
});
