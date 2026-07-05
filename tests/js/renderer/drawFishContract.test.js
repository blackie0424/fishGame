import { describe, it, expect } from 'vitest';
import { readFileSync } from 'node:fs';
import { drawFish } from '../../../resources/game/renderer/sprites.js';
import { buildFishSupply } from '../../../resources/game/utils/deck.js';

// 回歸測試（2026-07-05 遊戲卡死事故）：
// phase1 前的魚物件是 {name, diff, cat, sp}，sp 指向舊 tuple；
// phase1 後 buildFishSupply 產出魚種物件複本 {name, count, diff, category, colors}，
// 魚本身即可直接餵給 drawFish。game.js 若殘留 f.sp / f.cat 舊格式存取，
// 會在 renderPool 等處以 undefined 呼叫 drawFish 而整場卡死。

function stubCanvas() {
  const g = new Proxy(
    {},
    {
      get: (t, k) => (k in t ? t[k] : () => {}),
      set: (t, k, v) => ((t[k] = v), true),
    },
  );
  return { width: 0, height: 0, getContext: () => g };
}

describe('魚物件與 drawFish 的資料契約', () => {
  it('魚庫的每一條魚都能直接餵給 drawFish（不需 .sp 間接層）', () => {
    for (const fish of buildFishSupply()) {
      expect(() => drawFish(stubCanvas(), fish, 2)).not.toThrow();
    }
  });

  it('drawFish 收到 undefined 會丟 TypeError（卡死事故的錯誤型態）', () => {
    expect(() => drawFish(stubCanvas(), undefined, 2)).toThrow(TypeError);
  });
});

describe('game.js 不得殘留 phase1 前的舊魚格式', () => {
  const src = readFileSync(
    new URL('../../../resources/game/game.js', import.meta.url),
    'utf8',
  );

  it('不再以 f.sp 間接取魚種（魚物件本身就是魚種複本）', () => {
    expect(src.match(/fishCanvas\([^)]*\.sp\b/g)).toBeNull();
  });

  it('不再讀取舊欄位 .cat（新欄位為 .category）', () => {
    expect(src.match(/\.cat\b/g)).toBeNull();
  });
});
