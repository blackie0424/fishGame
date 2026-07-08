/* =====================================================================
   HUD 顯示資料（純函式，供 game.js 渲染部落漁獲橫列與緊湊玩家籤）
===================================================================== */

/** 部落漁獲橫列的單一魚項顯示資料 */
export function poolFishMeta(fish, catcherName, targetSet) {
  return {
    name: fish.name,
    label: `${fish.name}（${catcherName} 釣獲）`,
    isTarget: targetSet.has(fish.name),
    initial: catcherName.slice(0, 1),
  };
}

/** 個人任務進度的結構化資料 */
export function taskParts(p) {
  const count = p.catch.length;
  const countDone = count >= p.role.need;
  const target = p.role.target
    ? { names: p.role.target, has: p.catch.some(f => p.role.target.includes(f.name)) }
    : null;
  return {
    count, need: p.role.need, countDone, target,
    allDone: countDone && (!target || target.has),
  };
}

/** 紀錄分流：環境/系統訊息進左側海況欄，其餘（玩家行動與結果）進右側行動欄 */
export function logTarget(cls) {
  return cls === 'lg-env' || cls === 'lg-sys' ? 'env' : 'action';
}

/** 緊湊玩家籤的顯示資料 */
export function playerChipMeta(p, { isTurn, over, mode }) {
  const t = taskParts(p);
  const taskSummary = t.allDone
    ? '任務✓'
    : `${t.count}/${t.need}` +
      (t.target ? `・${t.target.names.join('/').toLowerCase()}${t.target.has ? '✓' : '✗'}` : '');
  return {
    name: p.name,
    roleLabel: `${p.role.emoji} ${p.role.name}`,
    catchCount: p.catch.length,
    you: p.human ? (mode === 'ai' ? '你' : '真人') : null,
    rest: p.rest > 0,
    isTurn: isTurn && !over,
    taskSummary,
    task: t,
  };
}
