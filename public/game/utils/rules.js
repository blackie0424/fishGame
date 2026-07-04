export function siteTier(site) {
  if (site.rule === 'gt') return 'high';
  return site.total >= 10 ? 'low' : 'mid';
}

export function fishPass(roll, fish, site) {
  return site.rule === 'gt' ? roll > fish.diff : roll >= fish.diff;
}

export function fishAuto(fish, site) {
  return site.rule !== 'gt' && fish.diff <= 1;
}

export function fishNeedText(fish, site) {
  return `${site.rule === 'gt' ? '骰出 >' : '骰出 ≥'} ${fish.diff}`;
}
