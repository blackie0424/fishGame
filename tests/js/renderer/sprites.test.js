import { describe, it, expect } from 'vitest';
import { getDefaultArt, getFishArt } from '../../../public/game/renderer/sprites.js';
import { FISH_ART } from '../../../public/game/data/fishArt.js';
import { FISH_SPECIES } from '../../../public/game/data/fish.js';

describe('getFishArt', () => {
  it('已知魚種回傳 FISH_ART 中的設定', () => {
    const art = getFishArt('Lagarow');
    expect(art).toBe(FISH_ART['Lagarow']);
  });

  it('未知魚種回傳預設值', () => {
    const art = getFishArt('UnknownFish');
    expect(art.shape).toBe('oval');
    expect(art.pat).toBe('plain');
  });
});

describe('getDefaultArt', () => {
  it('回傳預設像素藝術參數', () => {
    const d = getDefaultArt();
    expect(d.shape).toBe('oval');
    expect(d.body).toMatch(/^#[0-9a-fA-F]{6}$/);
    expect(d.belly).toMatch(/^#[0-9a-fA-F]{6}$/);
    expect(d.acc).toMatch(/^#[0-9a-fA-F]{6}$/);
    expect(d.pat).toBe('plain');
  });
});
