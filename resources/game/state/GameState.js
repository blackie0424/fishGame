import { buildFishSupply } from '../utils/deck.js';

export function createGameState({ site, players }) {
  return {
    site,
    round: 1,
    turnIdx: 0,
    over: false,
    fishSupply: buildFishSupply(),
    actionDeck: [],
    envDeck: [],
    destinyDeck: [],
    spots: [[], [], [], [], [], []],
    players: players.map((p, idx) => ({
      idx,
      name: p.name,
      role: p.role,
      human: p.human,
      catch: [],
      rest: 0,
    })),
  };
}

export function refillSpots(state, supply, site) {
  const spots = state.spots.map(sp => [...sp]);
  const remaining = [...supply];
  const banned = new Set(site.banned.map(b => b - 1));
  const caps = spots.map((_, i) => (banned.has(i) ? 0 : i < 4 ? 3 : 2));
  const current = spots.reduce((s, sp) => s + sp.length, 0);
  let needed = site.total - current;

  for (let i = 0; i < 6 && needed > 0 && remaining.length > 0; i++) {
    while (spots[i].length < caps[i] && needed > 0 && remaining.length > 0) {
      spots[i].push(remaining.shift());
      needed--;
    }
  }

  return { ...state, spots };
}

export function applyFishCaught(state, playerIdx, fish) {
  const players = state.players.map((p, i) =>
    i === playerIdx ? { ...p, catch: [...p.catch, fish] } : p
  );
  return { ...state, players };
}

export function applyFishEscape(state, spotIdx, fish) {
  const spots = state.spots.map((sp, i) =>
    i === spotIdx ? [...sp, fish] : [...sp]
  );
  return { ...state, spots };
}

export function applyPlayerRest(state, playerIdx, rounds) {
  const players = state.players.map((p, i) =>
    i === playerIdx ? { ...p, rest: Math.max(p.rest, rounds) } : p
  );
  return { ...state, players };
}

export function advanceTurn(state) {
  const nextIdx = (state.turnIdx + 1) % state.players.length;
  const roundComplete = nextIdx === 0;
  return {
    ...state,
    turnIdx: nextIdx,
    round: roundComplete ? state.round + 1 : state.round,
  };
}
