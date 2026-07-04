import { describe, it, expect } from 'vitest';
import { shuffle, rnd, buildFishSupply, buildActionDeck, buildDestinyDeck, buildEnvDeck } from '../../../public/game/utils/deck.js';
import { FISH_SPECIES } from '../../../public/game/data/fish.js';
import { SITE_CARDS } from '../../../public/game/data/sites.js';
import { ENV_COUNTS } from '../../../public/game/data/cards.js';

const lowSite  = SITE_CARDS.find(s => s.rule === 'gte' && s.total >= 10);
const midSite  = SITE_CARDS.find(s => s.rule === 'gte' && s.total < 10);
const highSite = SITE_CARDS.find(s => s.rule === 'gt');

describe('shuffle', () => {
  it('回傳相同元素，數量不變', () => {
    const arr = [1, 2, 3, 4, 5];
    const result = shuffle([...arr]);
    expect(result.sort()).toEqual(arr.sort());
  });

  it('不修改原陣列', () => {
    const arr = [1, 2, 3];
    const copy = [...arr];
    shuffle(arr);
    expect(arr).toEqual(copy);
  });
});

describe('rnd', () => {
  it('回傳 0 到 n-1 的整數', () => {
    for (let i = 0; i < 100; i++) {
      const v = rnd(6);
      expect(v).toBeGreaterThanOrEqual(0);
      expect(v).toBeLessThan(6);
      expect(Number.isInteger(v)).toBe(true);
    }
  });
});

describe('buildFishSupply', () => {
  it('共 52 張魚牌', () => {
    const deck = buildFishSupply();
    expect(deck.length).toBe(52);
  });

  it('每張牌都有 name、diff、category', () => {
    buildFishSupply().forEach(f => {
      expect(f.name).toBeTypeOf('string');
      expect(f.diff).toBeGreaterThanOrEqual(1);
      expect(f.category).toMatch(/^(Rahet|Oyod)$/);
    });
  });

  it('兩次建立結果不同（有洗牌）', () => {
    const a = buildFishSupply().map(f => f.name).join(',');
    const b = buildFishSupply().map(f => f.name).join(',');
    // 極小機率相同，但統計上應不同
    let diff = false;
    for (let i = 0; i < 5; i++) {
      if (buildFishSupply().map(f => f.name).join(',') !== a) { diff = true; break; }
    }
    expect(diff).toBe(true);
  });
});

describe('buildActionDeck', () => {
  it('low 場地共 24 張行動卡', () => {
    expect(buildActionDeck(lowSite).length).toBe(24);
  });

  it('mid 場地共 24 張行動卡', () => {
    expect(buildActionDeck(midSite).length).toBe(24);
  });

  it('high 場地共 24 張行動卡', () => {
    expect(buildActionDeck(highSite).length).toBe(24);
  });

  it('只包含合法的行動卡種類', () => {
    const VALID = new Set(['hit', 'double', 'tangle', 'swallow', 'baitlost', 'snag']);
    buildActionDeck(lowSite).forEach(c => expect(VALID.has(c)).toBe(true));
  });
});

describe('buildDestinyDeck', () => {
  it('低難度場地共 30 張命運卡', () => {
    expect(buildDestinyDeck(lowSite).length).toBe(30);
  });

  it('高難度場地共 30 張命運卡', () => {
    expect(buildDestinyDeck(highSite).length).toBe(30);
  });

  it('每張卡都有 kind 屬性', () => {
    buildDestinyDeck(lowSite).forEach(c => expect(c.kind).toBeTypeOf('string'));
  });
});

describe('buildEnvDeck', () => {
  it('環境牌總張數正確', () => {
    const total = Object.values(ENV_COUNTS).reduce((s, n) => s + n, 0);
    expect(buildEnvDeck().length).toBe(total);
  });

  it('只包含合法的環境卡種類', () => {
    const VALID = new Set(Object.keys(ENV_COUNTS));
    buildEnvDeck().forEach(c => expect(VALID.has(c)).toBe(true));
  });
});
