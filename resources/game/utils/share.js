/* =====================================================================
   耆老分魚 v2 — 純邏輯（game.js 與 simCore 共用）
   Wu 2026-07-06 決策：
   1. 漁獲視為整體：任何人的漁獲中有目標魚，就分給需要的角色；
      耆老只說明「誰釣到的、剛好誰需要」。
   2. 目標魚分完才處理數量：各自保留必要目標魚後全數進公共池，
      「釣最多魚的先拿」——依漁獲量排序補到各自需求，剩餘歸還原釣獲者，
      讓漁獲最多者最終拿到較多的魚。
   就地修改 players[].catch；回傳 transfers 供耆老場景敘事。
===================================================================== */

export function checkPersonal(p) {
  const okCnt = p.catch.length >= p.role.need;
  const okTgt = !p.role.target || p.catch.some(f => p.role.target.includes(f.name));
  return okCnt && okTgt;
}

export function sharePhase(players) {
  const transfers = [];

  /* --- 階段一：目標魚全域配對 --- */
  for (const p of players) {
    if (!p.role.target) continue;
    if (p.catch.some(f => p.role.target.includes(f.name))) continue;
    for (const q of players) {
      if (q === p) continue;
      // q 自己也需要同種魚且只剩一條時保留，其餘一律轉讓
      const idx = q.catch.findIndex(f => p.role.target.includes(f.name) &&
        !(q.role.target && q.role.target.includes(f.name) &&
          q.catch.filter(x => q.role.target.includes(x.name)).length <= 1));
      if (idx >= 0) {
        const f = q.catch.splice(idx, 1)[0];
        p.catch.push(f);
        transfers.push({ from: q, to: p, fish: f, why: 'target' });
        break;
      }
    }
  }

  /* --- 階段二：數量重分配（釣最多的先拿） --- */
  const snapshot = new Map(players.map(p => [p, p.catch.length]));
  const order = [...players].sort((a, b) => snapshot.get(b) - snapshot.get(a));
  // 各自保留一條必要目標魚，其餘進公共池（記錄原主，優先拿回自己的以減少搬動）
  const pool = [];
  for (const p of players) {
    const keep = [];
    if (p.role.target) {
      const idx = p.catch.findIndex(f => p.role.target.includes(f.name));
      if (idx >= 0) keep.push(p.catch.splice(idx, 1)[0]);
    }
    for (const f of p.catch) pool.push({ f, from: p });
    p.catch = keep;
  }
  const takeOne = p => {
    let i = pool.findIndex(x => x.from === p);      // 優先拿回自己釣的
    if (i < 0) i = 0;
    const { f, from } = pool.splice(i, 1)[0];
    p.catch.push(f);
    if (from !== p) transfers.push({ from, to: p, fish: f, why: 'count' });
  };
  for (const p of order) {                          // 先依序補到需求
    while (p.catch.length < p.role.need && pool.length) takeOne(p);
  }
  while (pool.length) {                             // 剩餘歸還原釣獲者 → 釣最多者自然留最多
    const { f, from } = pool.shift();
    from.catch.push(f);
  }

  return { transfers };
}
