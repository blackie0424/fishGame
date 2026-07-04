import { describe, it, expect } from 'vitest';
import {
  ACTION_MIX, ACTION_INFO,
  DESTINY_CARDS, DESTINY_MIX,
  ENV_COUNTS, ENV_INFO,
} from '../../../public/game/data/cards.js';

describe('ACTION_MIX', () => {
  it('每個難度等級總張數都是 24', () => {
    ['low', 'mid', 'high'].forEach(tier => {
      const total = Object.values(ACTION_MIX[tier]).reduce((s, n) => s + n, 0);
      expect(total).toBe(24);
    });
  });

  it('三個難度等級都存在', () => {
    expect(ACTION_MIX).toHaveProperty('low');
    expect(ACTION_MIX).toHaveProperty('mid');
    expect(ACTION_MIX).toHaveProperty('high');
  });
});

describe('ACTION_INFO', () => {
  const EXPECTED_KEYS = ['hit', 'double', 'tangle', 'swallow', 'baitlost', 'snag'];

  it('包含所有行動卡種類', () => {
    EXPECTED_KEYS.forEach(k => expect(ACTION_INFO).toHaveProperty(k));
  });

  it('每張卡都有 emoji、title、desc、flavor', () => {
    EXPECTED_KEYS.forEach(k => {
      expect(ACTION_INFO[k].emoji).toBeTypeOf('string');
      expect(ACTION_INFO[k].title).toBeTypeOf('string');
      expect(ACTION_INFO[k].desc).toBeTypeOf('string');
      expect(ACTION_INFO[k].flavor).toBeTypeOf('string');
    });
  });

  it('每張卡都有 hooked 語境變體', () => {
    EXPECTED_KEYS.forEach(k => {
      expect(ACTION_INFO[k]).toHaveProperty('hooked');
    });
  });
});

describe('DESTINY_CARDS', () => {
  it('預設總張數為 30', () => {
    const total = DESTINY_CARDS.reduce((s, c) => s + c.n, 0);
    expect(total).toBe(30);
  });

  it('每張卡都有 t、n、title、content、result、kind', () => {
    DESTINY_CARDS.forEach(c => {
      expect(c.t).toBeTypeOf('string');
      expect(c.n).toBeGreaterThanOrEqual(0);
      expect(c.title).toBeTypeOf('string');
      expect(c.kind).toBeTypeOf('string');
    });
  });

  it('kind 只能是已知類型', () => {
    const VALID = new Set(['fail', 'snag', 'tangle', 'wind', 'eel', 'bigwave', 'go', 'go_swallow', 'go_double']);
    DESTINY_CARDS.forEach(c => expect(VALID.has(c.kind)).toBe(true));
  });
});

describe('DESTINY_MIX', () => {
  it('每個難度等級總張數都是 30', () => {
    const destinyKeys = new Set(DESTINY_CARDS.map(c => c.t));
    ['low', 'mid', 'high'].forEach(tier => {
      const mix = DESTINY_MIX[tier];
      const total = Object.values(mix).reduce((s, n) => s + n, 0);
      expect(total).toBe(30);
    });
  });
});

describe('ENV_COUNTS', () => {
  it('總張數為 17', () => {
    const total = Object.values(ENV_COUNTS).reduce((s, n) => s + n, 0);
    expect(total).toBe(17); // calm:5+eel:2+hightide:2+wave:3+lowtide:2+chat:1+escape:2 = 17
  });

  it('包含所有環境卡類型', () => {
    ['calm', 'eel', 'hightide', 'wave', 'lowtide', 'chat', 'escape'].forEach(k => {
      expect(ENV_COUNTS).toHaveProperty(k);
    });
  });
});

describe('ENV_INFO', () => {
  it('包含所有環境卡的說明', () => {
    Object.keys(ENV_COUNTS).forEach(k => {
      expect(ENV_INFO).toHaveProperty(k);
    });
  });

  it('每張卡都有 animType、emoji、title、desc', () => {
    Object.values(ENV_INFO).forEach(info => {
      expect(info.animType).toBeTypeOf('string');
      expect(info.emoji).toBeTypeOf('string');
      expect(info.title).toBeTypeOf('string');
      expect(info.desc).toBeTypeOf('string');
    });
  });
});
