import { describe, it, expect, beforeEach } from 'vitest';
import { createGameState, refillSpots, applyFishCaught, applyFishEscape, applyPlayerRest, advanceTurn } from '../../../public/game/state/GameState.js';
import { SITE_CARDS } from '../../../public/game/data/sites.js';
import { FISH_SPECIES } from '../../../public/game/data/fish.js';
import { ROLES } from '../../../public/game/data/roles.js';

const lowSite  = SITE_CARDS.find(s => s.rule === 'gte' && s.total >= 10);
const highSite = SITE_CARDS.find(s => s.rule === 'gt');

const makeFish = (name = 'Lagarow', diff = 1) => ({
  name, diff, count: 1, category: 'Rahet', colors: ['#000', '#fff', '#aaa'],
});

function makeState(overrides = {}) {
  return createGameState({
    site: lowSite,
    players: [
      { name: 'Alice', role: ROLES[0], human: true },
      { name: 'Bob',   role: ROLES[1], human: false },
    ],
    ...overrides,
  });
}

describe('createGameState', () => {
  it('建立初始狀態：有 players、spots、round、turnIdx', () => {
    const s = makeState();
    expect(s.players).toHaveLength(2);
    expect(s.spots).toHaveLength(6);
    expect(s.round).toBe(1);
    expect(s.turnIdx).toBe(0);
    expect(s.over).toBe(false);
  });

  it('每個玩家初始 catch 為空陣列、rest 為 0', () => {
    makeState().players.forEach(p => {
      expect(p.catch).toEqual([]);
      expect(p.rest).toBe(0);
    });
  });

  it('spots 共 6 個', () => {
    expect(makeState().spots).toHaveLength(6);
  });
});

describe('refillSpots', () => {
  it('填補後 spots 魚的總數 ≤ site.total', () => {
    const state = makeState();
    const supply = FISH_SPECIES.flatMap(f => Array.from({ length: f.count }, () => ({ ...f })));
    const next = refillSpots(state, supply, lowSite);
    const total = next.spots.reduce((s, sp) => s + sp.length, 0);
    expect(total).toBeLessThanOrEqual(lowSite.total);
  });

  it('禁用點位不放魚', () => {
    const site = SITE_CARDS.find(s => s.banned.length > 0);
    const state = createGameState({ site, players: [{ name: 'A', role: ROLES[0], human: true }] });
    const supply = FISH_SPECIES.flatMap(f => Array.from({ length: f.count }, () => ({ ...f })));
    const next = refillSpots(state, supply, site);
    site.banned.forEach(b => {
      expect(next.spots[b - 1]).toEqual([]);
    });
  });

  it('回傳新狀態，不修改原狀態', () => {
    const state = makeState();
    const supply = FISH_SPECIES.flatMap(f => Array.from({ length: f.count }, () => ({ ...f })));
    const next = refillSpots(state, supply, lowSite);
    expect(next).not.toBe(state);
    expect(state.spots.every(sp => sp.length === 0)).toBe(true);
  });
});

describe('applyFishCaught', () => {
  it('魚加入玩家 catch', () => {
    const state = makeState();
    const fish = makeFish();
    const next = applyFishCaught(state, 0, fish);
    expect(next.players[0].catch).toHaveLength(1);
    expect(next.players[0].catch[0].name).toBe('Lagarow');
  });

  it('不修改原狀態', () => {
    const state = makeState();
    applyFishCaught(state, 0, makeFish());
    expect(state.players[0].catch).toHaveLength(0);
  });

  it('其他玩家的 catch 不受影響', () => {
    const state = makeState();
    const next = applyFishCaught(state, 0, makeFish());
    expect(next.players[1].catch).toHaveLength(0);
  });
});

describe('applyFishEscape', () => {
  it('魚回到 spot', () => {
    const fish = makeFish();
    const state = makeState();
    state.spots[2].push(fish);
    const next = applyFishEscape(state, 2, fish);
    expect(next.spots[2]).toContain(fish);
  });

  it('不修改原狀態', () => {
    const fish = makeFish();
    const state = makeState();
    const originalLength = state.spots[0].length;
    applyFishEscape(state, 0, fish);
    expect(state.spots[0].length).toBe(originalLength);
  });
});

describe('applyPlayerRest', () => {
  it('設定玩家 rest 回合數', () => {
    const state = makeState();
    const next = applyPlayerRest(state, 1, 1);
    expect(next.players[1].rest).toBe(1);
  });

  it('不修改原狀態', () => {
    const state = makeState();
    applyPlayerRest(state, 0, 1);
    expect(state.players[0].rest).toBe(0);
  });
});

describe('advanceTurn', () => {
  it('輪到下一位玩家', () => {
    const state = makeState();
    const next = advanceTurn(state);
    expect(next.turnIdx).toBe(1);
  });

  it('最後一位後回到第一位', () => {
    const state = { ...makeState(), turnIdx: 1 };
    const next = advanceTurn(state);
    expect(next.turnIdx).toBe(0);
  });

  it('所有人都輪完後 round +1', () => {
    const state = { ...makeState(), turnIdx: 1 };
    const next = advanceTurn(state);
    expect(next.round).toBe(2);
  });

  it('非最後一位時 round 不變', () => {
    const state = makeState();
    const next = advanceTurn(state);
    expect(next.round).toBe(1);
  });
});
