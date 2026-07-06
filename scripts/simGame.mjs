/* 整場遊戲無頭模擬器 — 忠實移植 game.js 的回合流程（2026-07-06 規則改造版）。
   用途：勝率校準（AGENTS.md SOP #5）。與 game.js 的差異僅在：無 UI/動畫、
   全員使用 aiPickSpot 策略、纏線對象以座位距離近似。

   執行：node scripts/simGame.mjs [games=2000] [rounds=15] [players=3,4,5]
   輸出：每場地 × 人數的集體勝率／個人全達成率／平均漁獲。                       */
import { FISH_SPECIES, TARGET_SET } from '../resources/game/data/fish.js';
import { SITE_CARDS } from '../resources/game/data/sites.js';
import { ROLES } from '../resources/game/data/roles.js';
import { ACTION_MIX, DESTINY_CARDS, DESTINY_MIX, ENV_COUNTS } from '../resources/game/data/cards.js';
import { shuffle, rnd, buildFishSupply, buildActionDeck, buildDestinyDeck, buildEnvDeck } from '../resources/game/utils/deck.js';
import { siteTier, fishPass, fishAuto } from '../resources/game/utils/rules.js';
import { pickBannedSpots, siteCaps, boardHasFish, refillBoard } from '../resources/game/utils/board.js';

const GAMES = +(process.argv[2] ?? 2000);
const ROUNDS = +(process.argv[3] ?? 15);
const PLAYER_COUNTS = (process.argv[4] ?? '3,4,5').split(',').map(Number);

const CFGW = { randomFishRatio: 0.35,
  lowFishBias: +(process.env.LOW_BIAS ?? 1.7),
  targetFishWeight: +(process.env.TGT_W ?? 0.35) };
const GOAL_OVERRIDE = process.env.GOAL ? +process.env.GOAL : null;
const roll = () => 1 + rnd(6);

function newGame(site, nPlayers) {
  const roles = shuffle(ROLES).slice(0, nPlayers);
  return {
    site, round: 1, over: false,
    goal: GOAL_OVERRIDE ?? roles.reduce((s, r) => s + r.need, 0),
    fishSupply: buildFishSupply(),
    destinyDeck: buildDestinyDeck(site),
    actionDeck: buildActionDeck(site),
    envDeck: buildEnvDeck(),
    spots: [[], [], [], [], [], []],
    spotCap: [0, 0, 0, 0, 0, 0],
    activeBanned: new Set(),
    players: roles.map((role, idx) => ({ idx, role, catch: [], rest: 0 })),
  };
}

function refillSpots(G) {
  G.spotCap = siteCaps(G.site, G.activeBanned);
  refillBoard({ spots: G.spots, fishSupply: G.fishSupply, spotCap: G.spotCap,
                activeBanned: G.activeBanned, randomFishRatio: CFGW.randomFishRatio,
                lowFishBias: CFGW.lowFishBias, targetFishWeight: CFGW.targetFishWeight,
                targetSet: TARGET_SET });
}
function ensureBoardHasFish(G) {
  if (boardHasFish(G.spots, G.activeBanned)) return true;
  if (G.fishSupply.length) { refillSpots(G); return boardHasFish(G.spots, G.activeBanned); }
  return false;
}
const isBanned = (G, s) => G.activeBanned.has(s);
const nearestPlayer = (G, p) =>
  G.players.filter(q => q !== p).sort((a, b) => Math.abs(a.idx - p.idx) - Math.abs(b.idx - p.idx))[0];

/* === game.js aiPickSpot 忠實移植 === */
function aiPickSpot(G, p) {
  let best = 0, bestScore = -1;
  const needTarget = p.role.target && !p.catch.some(c => p.role.target.includes(c.name));
  const total = G.players.reduce((a, q) => a + q.catch.length, 0);
  const behind = total < (G.round - 1) * 1.5;
  for (let s = 0; s < 6; s++) {
    if (isBanned(G, s) || !G.spots[s].length) continue;
    const d = Math.min(s + 1, 5);
    const pOk = G.site.rule === 'gt' ? (6 - d) / 6 : (7 - d) / 6;
    let val = 1 + s * .25 + Math.min(1, G.spots[s].length * .2);
    if (needTarget && !behind && G.round <= 11) val += s >= 3 ? 1.5 : 0;
    if (behind || p.catch.length < p.role.need) val += s <= 2 ? 1.3 : 0;
    if (p.catch.length >= p.role.need && !needTarget) val *= .85;
    const score = pOk * val + Math.random() * .3;
    if (score > bestScore) { bestScore = score; best = s; }
  }
  return best;
}

/* === drawDestiny 移植（無 UI） === */
function drawDestiny(G, p) {
  if (!G.destinyDeck.length) G.destinyDeck = buildDestinyDeck(G.site);
  const c = G.destinyDeck.pop();
  const flags = { swallow: false, double: false, hooked: false };
  switch (c.kind) {
    case 'fail': return { proceed: false, flags };
    case 'snag': { if (roll() <= 3) p.rest = 1; return { proceed: false, flags }; }
    case 'tangle': {
      if (roll() <= 3) { p.rest = 1; const n = nearestPlayer(G, p); n.rest = Math.max(n.rest, 1); }
      return { proceed: false, flags };
    }
    case 'wind': {
      if (roll() > 2) { flags.hooked = true; return { proceed: true, flags }; }
      return { proceed: false, flags };
    }
    case 'eel': {
      if (roll() <= 2 && p.catch.length) {
        G.fishSupply.push(p.catch.splice(rnd(p.catch.length), 1)[0]);
        G.fishSupply = shuffle(G.fishSupply);
      }
      return { proceed: false, flags };
    }
    case 'bigwave': { if (roll() <= 2) p.rest = 1; return { proceed: false, flags }; }
    case 'go_swallow': flags.swallow = true; flags.hooked = true; return { proceed: true, flags };
    case 'go_double': flags.double = true; flags.hooked = true; return { proceed: true, flags };
    default: flags.hooked = true; return { proceed: true, flags };
  }
}

/* === doFishing 移植（無 UI） === */
function doFishing(G, p, spot) {
  const destiny = drawDestiny(G, p);
  if (!destiny.proceed) return;
  if (!G.actionDeck.length) G.actionDeck = buildActionDeck(G.site);
  const card = G.actionDeck.pop();
  switch (card) {
    case 'baitlost': return;
    case 'snag': p.rest = 1; return;
    case 'swallow': {
      let swSrc = spot;
      if (!G.spots[swSrc].length) {
        let nb = [0, 1, 2, 3, 4, 5].filter(s2 => !isBanned(G, s2) && G.spots[s2].length);
        if (!nb.length && ensureBoardHasFish(G))
          nb = [0, 1, 2, 3, 4, 5].filter(s2 => !isBanned(G, s2) && G.spots[s2].length);
        if (nb.length) {
          const near = nb.filter(s2 => Math.abs(s2 - spot) === 1);
          swSrc = near.length ? near[rnd(near.length)] : nb[rnd(nb.length)];
        }
      }
      if (G.spots[swSrc].length) {
        p.catch.push(G.spots[swSrc].splice(rnd(G.spots[swSrc].length), 1)[0]);
        p.rest = 1;
      }
      return;
    }
    case 'tangle': {
      if (roll() < 3) { p.rest = 1; const n = nearestPlayer(G, p); n.rest = Math.max(n.rest, 1); }
      return;
    }
    case 'hit': case 'double': {
      const take = card === 'double' ? 2 : 1;
      const wantN = Math.min(2, take + (destiny.flags.double ? 1 : 0));
      const got = [];
      for (let k = 0; k < wantN; k++) {
        let src = spot;
        if (!G.spots[src].length) {
          let nb = [0, 1, 2, 3, 4, 5].filter(s2 => !isBanned(G, s2) && G.spots[s2].length);
          if (!nb.length && ensureBoardHasFish(G))
            nb = [0, 1, 2, 3, 4, 5].filter(s2 => !isBanned(G, s2) && G.spots[s2].length);
          if (!nb.length) break;
          const near = nb.filter(s2 => Math.abs(s2 - spot) === 1);
          src = near.length ? near[rnd(near.length)] : nb[rnd(nb.length)];
        }
        const f = G.spots[src].splice(rnd(G.spots[src].length), 1)[0];
        if (fishAuto(f, G.site)) got.push(f);
        else {
          const r = roll();
          if (fishPass(r, f, G.site)) got.push(f);
          else G.spots[src].push(f);
        }
        if (got.length >= wantN) break;
      }
      if (got.length) {
        got.forEach(f => p.catch.push(f));
        if (destiny.flags.swallow) p.rest = 1;
      }
      return;
    }
  }
}

/* === roundEnd 環境卡移植 === */
function roundEnd(G, rounds) {
  if (G.round >= rounds) { G.over = true; return; }
  if (!G.envDeck.length) G.envDeck = buildEnvDeck();
  const env = G.envDeck.pop();
  switch (env) {
    case 'calm': break;
    case 'chat': G.players.forEach(p => { p.rest = Math.max(p.rest, 1); }); break;
    case 'eel': case 'escape':
      for (const p of G.players) {
        if (p.rest > 0 || !p.catch.length) continue;
        if (roll() < 3) G.fishSupply.push(p.catch.splice(rnd(p.catch.length), 1)[0]);
      }
      G.fishSupply = shuffle(G.fishSupply);
      break;
    case 'hightide': case 'lowtide': {
      let all = shuffle(G.spots.flat());
      G.spots = [[], [], [], [], [], []];
      let i = 0, placed = true;
      while (i < all.length && placed) {
        placed = false;
        for (let s = 0; s < 6 && i < all.length; s++) {
          if (isBanned(G, s)) continue;
          if (G.spots[s].length < G.spotCap[s]) { G.spots[s].push(all[i++]); placed = true; }
        }
      }
      while (i < all.length) G.fishSupply.push(all[i++]);
      break;
    }
    case 'wave':
      for (const p of G.players) { if (p.rest === 0 && roll() < 3) p.rest = 1; }
      break;
  }
  G.activeBanned = pickBannedSpots(G.site);
  G.spots.flat().forEach(f => G.fishSupply.push(f));
  G.fishSupply = shuffle(G.fishSupply);
  G.spots = [[], [], [], [], [], []];
  refillSpots(G);
  G.round++;
}

/* === sharePhase 移植 === */
function sharePhase(G) {
  const checkPersonal = p => p.catch.length >= p.role.need &&
    (!p.role.target || p.catch.some(f => p.role.target.includes(f.name)));
  for (const p of G.players) {
    if (checkPersonal(p) || !p.role.target) continue;
    if (p.catch.some(f => p.role.target.includes(f.name))) continue;
    for (const q of G.players) {
      if (q === p) continue;
      const idx = q.catch.findIndex(f => p.role.target.includes(f.name) &&
        !(q.role.target && q.role.target.includes(f.name) && q.catch.filter(x => q.role.target.includes(x.name)).length <= 1));
      if (idx >= 0 && q.catch.length - 1 >= (checkPersonal(q) ? q.role.need : 0)) {
        p.catch.push(q.catch.splice(idx, 1)[0]);
        break;
      }
    }
  }
  let moved = true;
  while (moved) {
    moved = false;
    const lack = G.players.find(p => p.catch.length < p.role.need);
    const rich = G.players.filter(q => q.catch.length > q.role.need)
      .sort((a, b) => b.catch.length - b.role.need - (a.catch.length - a.role.need));
    if (lack && rich.length) {
      const q = rich[0];
      const idx = q.catch.findIndex(f => !(q.role.target && q.role.target.includes(f.name) && q.catch.filter(x => q.role.target.includes(x.name)).length <= 1));
      if (idx >= 0) { lack.catch.push(q.catch.splice(idx, 1)[0]); moved = true; }
    }
  }
  return checkPersonal;
}

export function playOne(site, nPlayers, rounds) {
  const G = newGame(site, nPlayers);
  G.activeBanned = pickBannedSpots(site);
  refillSpots(G);
  while (!G.over) {
    for (const p of G.players) {
      if (p.rest > 0) { p.rest--; continue; }
      doFishing(G, p, aiPickSpot(G, p));
    }
    roundEnd(G, rounds);
  }
  const checkPersonal = sharePhase(G);
  const total = G.players.reduce((a, p) => a + p.catch.length, 0);
  return {
    collectiveWin: total >= G.goal,
    allPersonal: G.players.every(checkPersonal),
    total, goal: G.goal,
    players: G.players.map(p => ({ role: p.role.name, need: p.role.need, target: p.role.target,
      got: p.catch.length, hasTarget: !p.role.target || p.catch.some(f => p.role.target.includes(f.name)),
      ok: checkPersonal(p) })),
  };
}

export function simulate({ games = GAMES, rounds = ROUNDS, playerCounts = PLAYER_COUNTS } = {}) {
  const results = [];
  for (const site of SITE_CARDS) {
    for (const n of playerCounts) {
      let cw = 0, ap = 0, tt = 0, tg = 0;
      for (let g = 0; g < games; g++) {
        const r = playOne(site, n, rounds);
        cw += r.collectiveWin; ap += r.allPersonal; tt += r.total; tg += r.goal;
      }
      results.push({ site: site.name, tier: siteTier(site), n,
        collective: 100 * cw / games, allPersonal: 100 * ap / games,
        avgCatch: tt / games, avgGoal: tg / games });
    }
  }
  return results;
}

const isMain = process.argv[1] && import.meta.url.endsWith(process.argv[1].split('/').pop());
if (isMain) {
  console.log(`games/cell=${GAMES} rounds=${ROUNDS} players=${PLAYER_COUNTS.join('/')} weights=${CFGW.lowFishBias}/${CFGW.targetFishWeight}\n`);
  const res = simulate({});
  const byN = {};
  for (const r of res) { (byN[r.n] ??= []).push(r); }
  for (const [n, rows] of Object.entries(byN)) {
    console.log(`===== ${n} 人局 =====`);
    console.log('場地             層級 | 集體勝率 | 個人全達成 | 平均漁獲/目標');
    for (const r of rows)
      console.log(`${r.site.padEnd(8, '　')} ${r.tier.padEnd(4)} |   ${r.collective.toFixed(1).padStart(5)}% |     ${r.allPersonal.toFixed(1).padStart(5)}% | ${r.avgCatch.toFixed(1)}/${r.avgGoal.toFixed(1)}`);
    console.log();
  }
}
