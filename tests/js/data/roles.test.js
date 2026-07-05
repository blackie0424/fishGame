import { describe, it, expect } from 'vitest';
import { ROLES } from '../../../resources/game/data/roles.js';
import { TARGET_SET } from '../../../resources/game/data/fish.js';

describe('ROLES', () => {
  it('共 5 種角色', () => {
    expect(ROLES.length).toBe(5);
  });

  it('id 從 0 到 4 不重複', () => {
    const ids = ROLES.map(r => r.id);
    expect(ids).toEqual([0, 1, 2, 3, 4]);
  });

  it('每個角色都有 name、emoji、need、desc、skin、cloth', () => {
    ROLES.forEach(r => {
      expect(r.name).toBeTypeOf('string');
      expect(r.emoji).toBeTypeOf('string');
      expect(r.need).toBeGreaterThan(0);
      expect(r.desc).toBeTypeOf('string');
      expect(r.skin).toMatch(/^#[0-9a-f]{6}$/i);
      expect(r.cloth).toMatch(/^#[0-9a-f]{6}$/i);
    });
  });

  it('有 target 的角色，目標魚都在 TARGET_SET 中', () => {
    ROLES.filter(r => r.target).forEach(r => {
      r.target.forEach(name => expect(TARGET_SET.has(name)).toBe(true));
    });
  });

  it('need 最少 3 條，最多 6 條', () => {
    ROLES.forEach(r => {
      expect(r.need).toBeGreaterThanOrEqual(3);
      expect(r.need).toBeLessThanOrEqual(6);
    });
  });
});
