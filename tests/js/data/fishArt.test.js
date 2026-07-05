import { describe, it, expect } from 'vitest';
import { FISH_ART } from '../../../resources/game/data/fishArt.js';
import { FISH_SPECIES } from '../../../resources/game/data/fish.js';

const VALID_SHAPES = new Set(['oval', 'long', 'deep']);
const VALID_PATS   = new Set(['plain', 'spots', 'bars', 'hline']);
const HEX_RE       = /^#[0-9a-fA-F]{6}$/;

describe('FISH_ART', () => {
  it('20 種魚都有對應的像素藝術設定', () => {
    FISH_SPECIES.forEach(f => {
      expect(FISH_ART).toHaveProperty(f.name);
    });
  });

  it('每筆記錄的 shape 都是合法值', () => {
    Object.entries(FISH_ART).forEach(([name, a]) => {
      expect(VALID_SHAPES.has(a.shape), `${name}.shape="${a.shape}" 無效`).toBe(true);
    });
  });

  it('每筆記錄的 pat 都是合法值', () => {
    Object.entries(FISH_ART).forEach(([name, a]) => {
      expect(VALID_PATS.has(a.pat), `${name}.pat="${a.pat}" 無效`).toBe(true);
    });
  });

  it('body、belly、acc 都是合法十六進位色碼', () => {
    Object.entries(FISH_ART).forEach(([name, a]) => {
      expect(HEX_RE.test(a.body),  `${name}.body 不是十六進位`).toBe(true);
      expect(HEX_RE.test(a.belly), `${name}.belly 不是十六進位`).toBe(true);
      expect(HEX_RE.test(a.acc),   `${name}.acc 不是十六進位`).toBe(true);
    });
  });

  it('選填的 tail 若存在，也是合法十六進位色碼', () => {
    Object.entries(FISH_ART).filter(([, a]) => a.tail).forEach(([name, a]) => {
      expect(HEX_RE.test(a.tail), `${name}.tail 不是十六進位`).toBe(true);
    });
  });

  it('選填的 bigEye 若存在，必須是 true', () => {
    Object.entries(FISH_ART).filter(([, a]) => a.bigEye !== undefined).forEach(([name, a]) => {
      expect(a.bigEye, `${name}.bigEye 應為 true`).toBe(true);
    });
  });

  it('選填的 wings 若存在，必須是 true', () => {
    Object.entries(FISH_ART).filter(([, a]) => a.wings !== undefined).forEach(([name, a]) => {
      expect(a.wings, `${name}.wings 應為 true`).toBe(true);
    });
  });
});
