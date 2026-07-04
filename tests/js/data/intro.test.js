import { describe, it, expect } from 'vitest';
import { INTRO_SCENES } from '../../../public/game/data/intro.js';

const VALID_SCENES = new Set(['dawn','elder','family','share','depart']);

describe('INTRO_SCENES', () => {
  it('共 5 幕', () => {
    expect(INTRO_SCENES).toHaveLength(5);
  });

  it('每幕都有 text 與 scene 欄位', () => {
    INTRO_SCENES.forEach(sc => {
      expect(typeof sc.text).toBe('string');
      expect(sc.text.length).toBeGreaterThan(0);
      expect(typeof sc.scene).toBe('string');
    });
  });

  it('scene 值都在合法範圍內', () => {
    INTRO_SCENES.forEach(sc => {
      expect(VALID_SCENES.has(sc.scene), `scene="${sc.scene}" 無效`).toBe(true);
    });
  });

  it('依序為 dawn→elder→family→share→depart', () => {
    const order = INTRO_SCENES.map(sc => sc.scene);
    expect(order).toEqual(['dawn','elder','family','share','depart']);
  });

  it('speaker 若存在必須是字串', () => {
    INTRO_SCENES.forEach(sc => {
      if (sc.speaker !== undefined) expect(typeof sc.speaker).toBe('string');
    });
  });
});
