import { describe, it, expect } from 'vitest';
import {
  TENSION_PARAMS, tensionParams, createTensionFight, createBotPolicy, runBotFight, tensionNeedText,
} from '../../../resources/game/minigame/tension.js';

/** 決定性 rng（可預測序列） */
const seqRng = (seq = [.5]) => { let i = 0; return () => seq[i++ % seq.length]; };
/** 線性同餘 rng（可播種） */
const lcg = (seed = 42) => () => (seed = (seed * 1664525 + 1013904223) >>> 0) / 2 ** 32;

const fish = d => ({ name: 'test', diff: d });
const GTE = { rule: 'gte' }, GT = { rule: 'gt' };

describe('tensionParams', () => {
  it('難度越高：體力越多、前兆越短、掙扎越猛（依 xlsx difficulty 設計）', () => {
    for (let d = 2; d <= 5; d++) {
      expect(TENSION_PARAMS[d].teleMs).toBeLessThan(TENSION_PARAMS[d - 1].teleMs);
      expect(TENSION_PARAMS[d].riseStrug).toBeGreaterThan(TENSION_PARAMS[d - 1].riseStrug);
      expect(TENSION_PARAMS[d].calmMs).toBeLessThan(TENSION_PARAMS[d - 1].calmMs);
    }
  });
  it('gt 場地（黑水溝級）前兆更短、掙扎更猛、魚更耐拉', () => {
    const a = tensionParams(fish(3), GTE), b = tensionParams(fish(3), GT);
    expect(b.teleMs).toBeLessThan(a.teleMs);
    expect(b.riseStrug).toBeGreaterThan(a.riseStrug);
    expect(b.stamina).toBeGreaterThan(a.stamina);
  });
  it('diff 缺值/越界 → 收斂到 1~5', () => {
    expect(tensionParams(fish(99), GTE).stamina).toBe(tensionParams(fish(5), GTE).stamina);
    expect(tensionParams({}, GTE).stamina).toBe(tensionParams(fish(3), GTE).stamina);
  });
});

describe('createTensionFight — 核心收放規則', () => {
  it('平靜時收線 → 魚體力下降；放線 → 緊繃度下降', () => {
    const f = createTensionFight(fish(3), GTE, seqRng([.5]));
    const s0 = f.st.stamina, t0 = f.st.tension;
    f.tick(400, { pull: true, stance: 0 });
    expect(f.st.stamina).toBeLessThan(s0);
    const t1 = f.st.tension;
    f.tick(400, { pull: false, stance: 0 });
    expect(f.st.tension).toBeLessThan(t1);
    expect(t1).toBeGreaterThan(t0 - 1);   // 平靜收線緊繃度只微幅變化
  });
  it('掙扎中持續收線 → 緊繃度到頂斷線（snap）', () => {
    const f = createTensionFight(fish(4), GTE, seqRng([.5, .9, .5])); // runProb 判定不觸發暴衝
    while (f.st.mode !== 'struggle' && !f.st.done) f.tick(25, { pull: false, stance: 0 });
    while (f.st.mode === 'struggle' && !f.st.done) f.tick(25, { pull: true, stance: 0 });
    expect(f.st.done).toBe('snap');
  });
  it('永遠放線 → 線太鬆，魚吐鉤（spit）', () => {
    const f = createTensionFight(fish(2), GTE, seqRng([.5]));
    while (!f.st.done) f.tick(50, { pull: false, stance: 0 });
    expect(f.st.done).toBe('spit');
  });
  it('完美節奏（掙扎/前兆放線、平靜收線）→ 一定起魚（landed）', () => {
    for (let d = 1; d <= 5; d++) for (const site of [GTE, GT]) {
      const f = createTensionFight(fish(d), site, lcg(d * 7 + (site.rule === 'gt' ? 3 : 0)));
      while (!f.st.done) f.tick(25, { pull: f.st.mode === 'calm' && f.st.tension < 88 });
      expect(f.st.done).toBe('landed');
    }
  });
  it('移動機制已取消（2026-07-06）：不再產生暴衝方向，站位輸入不影響結果', () => {
    const f = createTensionFight(fish(5), GTE, lcg(99));
    let struggles = 0;
    while (!f.st.done && struggles < 4) {
      const was = f.st.mode;
      f.tick(25, { pull: f.st.mode === 'calm' && f.st.tension < 80 });
      if (was !== 'struggle' && f.st.mode === 'struggle') struggles++;
      expect(f.st.runDir).toBe(0);
    }
    const run = stance => {
      const g = createTensionFight(fish(4), GT, lcg(777));
      while (!g.st.done) g.tick(50, { pull: g.st.mode === 'calm' && g.st.tension < 70, stance });
      return `${g.st.done}@${g.st.t}`;
    };
    expect(run(1)).toBe(run(0));
    expect(run(-1)).toBe(run(0));
  });
  it('rng 注入後結果可重現（決定性）', () => {
    const run = () => { const f = createTensionFight(fish(3), GT, lcg(123));
      const bot = createBotPolicy({}, lcg(456));
      while (!f.st.done) f.tick(50, bot(f.st));
      return `${f.st.done}@${f.st.t}`; };
    expect(run()).toBe(run());
  });
});

describe('難度曲線（機器人成功率）', () => {
  it('依原設計：difficulty 越小越容易；gt 場地更難', () => {
    const rate = (d, site, seed) => { let ok = 0; const rng = lcg(seed);
      for (let i = 0; i < 220; i++) ok += runBotFight(fish(d), site, rng) === 'landed' ? 1 : 0;
      return ok / 220; };
    const gte = [0, 0, rate(2, GTE, 1), rate(3, GTE, 2), rate(4, GTE, 3), rate(5, GTE, 4)];
    expect(gte[2]).toBeGreaterThan(gte[3]);
    expect(gte[3]).toBeGreaterThan(gte[4]);
    expect(gte[4]).toBeGreaterThan(gte[5]);
    expect(rate(3, GT, 5)).toBeLessThan(gte[3]);
    expect(rate(5, GT, 6)).toBeLessThan(gte[5] + .05);
  });
});

describe('tensionNeedText', () => {
  it('顯示難度星數與 gt 場地提示', () => {
    expect(tensionNeedText(fish(4), GTE)).toContain('★★★★');
    expect(tensionNeedText(fish(2), GT)).toContain('黑水溝級');
  });
});
