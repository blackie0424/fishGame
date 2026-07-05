import { FISH_SPECIES } from '../data/fish.js';
import { ACTION_MIX, DESTINY_CARDS, DESTINY_MIX, ENV_COUNTS } from '../data/cards.js';
import { siteTier } from './rules.js';

export function rnd(n) {
  return Math.floor(Math.random() * n);
}

export function shuffle(arr) {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = rnd(i + 1);
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

export function buildFishSupply() {
  const deck = [];
  FISH_SPECIES.forEach(f => {
    for (let i = 0; i < f.count; i++) deck.push({ ...f });
  });
  return shuffle(deck);
}

export function buildActionDeck(site) {
  const mix = ACTION_MIX[siteTier(site)];
  const cards = [];
  Object.entries(mix).forEach(([type, n]) => {
    for (let i = 0; i < n; i++) cards.push(type);
  });
  return shuffle(cards);
}

export function buildDestinyDeck(site) {
  const mix = DESTINY_MIX[siteTier(site)];
  const deck = [];
  DESTINY_CARDS.forEach(c => {
    const n = mix[c.t] != null ? mix[c.t] : c.n;
    for (let i = 0; i < n; i++) deck.push(c);
  });
  return shuffle(deck);
}

export function buildEnvDeck() {
  const cards = [];
  Object.entries(ENV_COUNTS).forEach(([type, n]) => {
    for (let i = 0; i < n; i++) cards.push(type);
  });
  return shuffle(cards);
}
