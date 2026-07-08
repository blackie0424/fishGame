import { describe, it, expect } from 'vitest';
import { poolFishMeta, taskParts, playerChipMeta } from '../../../resources/game/utils/hud.js';
import { ROLES } from '../../../resources/game/data/roles.js';
import { TARGET_SET } from '../../../resources/game/data/fish.js';

const mkPlayer = (over = {}) => ({
  name: '達卡安', role: ROLES[0], catch: [], rest: 0, human: false, ...over,
});

describe('poolFishMeta（部落漁獲橫列的單一魚項）', () => {
  it('回傳魚種名稱與「誰釣獲」的提示文字', () => {
    const m = poolFishMeta({ name: 'Ilek' }, '達卡安', TARGET_SET);
    expect(m.name).toBe('Ilek');
    expect(m.label).toBe('Ilek（達卡安 釣獲）');
  });

  it('目標魚標記 isTarget', () => {
    expect(poolFishMeta({ name: 'Ilek' }, 'A', TARGET_SET).isTarget).toBe(true);
    expect(poolFishMeta({ name: 'Kolitan' }, 'A', TARGET_SET).isTarget).toBe(false);
  });

  it('釣獲者縮寫取名字第一個字', () => {
    expect(poolFishMeta({ name: 'Ilek' }, '達卡安', TARGET_SET).initial).toBe('達');
  });
});

describe('taskParts（個人任務進度的結構化資料）', () => {
  it('無目標魚角色：只有數量進度', () => {
    const p = mkPlayer({ role: ROLES[0], catch: [{ name: 'Kolitan' }] });
    const t = taskParts(p);
    expect(t.count).toBe(1);
    expect(t.need).toBe(3);
    expect(t.countDone).toBe(false);
    expect(t.target).toBeNull();
    expect(t.allDone).toBe(false);
  });

  it('數量達標 countDone 為 true', () => {
    const p = mkPlayer({ role: ROLES[0], catch: [{ name: 'a' }, { name: 'b' }, { name: 'c' }] });
    const t = taskParts(p);
    expect(t.countDone).toBe(true);
    expect(t.allDone).toBe(true);
  });

  it('有目標魚角色：回報目標魚名單與是否已釣獲', () => {
    const p = mkPlayer({ role: ROLES[4], catch: [{ name: 'Tapez' }] });
    const t = taskParts(p);
    expect(t.target.names).toEqual(['Tapez', 'Acyod']);
    expect(t.target.has).toBe(true);
  });

  it('目標魚未釣獲時 allDone 為 false（即使數量達標）', () => {
    const p = mkPlayer({
      role: ROLES[1],
      catch: [{ name: 'a' }, { name: 'b' }, { name: 'c' }, { name: 'd' }, { name: 'e' }],
    });
    const t = taskParts(p);
    expect(t.countDone).toBe(true);
    expect(t.target.has).toBe(false);
    expect(t.allDone).toBe(false);
  });
});

describe('playerChipMeta（緊湊玩家籤的顯示資料）', () => {
  it('基本欄位：名字、角色、漁獲數', () => {
    const p = mkPlayer({ catch: [{ name: 'a' }, { name: 'b' }] });
    const m = playerChipMeta(p, { isTurn: false, over: false, mode: 'ai' });
    expect(m.name).toBe('達卡安');
    expect(m.roleLabel).toBe('🧒 小孩');
    expect(m.catchCount).toBe(2);
  });

  it('ai 模式下人類玩家標記「你」，hotseat 標記「真人」', () => {
    const p = mkPlayer({ human: true });
    expect(playerChipMeta(p, { isTurn: false, over: false, mode: 'ai' }).you).toBe('你');
    expect(playerChipMeta(p, { isTurn: false, over: false, mode: 'hotseat' }).you).toBe('真人');
  });

  it('電腦玩家沒有 you 標記', () => {
    const m = playerChipMeta(mkPlayer(), { isTurn: false, over: false, mode: 'ai' });
    expect(m.you).toBeNull();
  });

  it('休息中 rest 為 true', () => {
    const m = playerChipMeta(mkPlayer({ rest: 1 }), { isTurn: false, over: false, mode: 'ai' });
    expect(m.rest).toBe(true);
  });

  it('輪到該玩家且遊戲未結束時 isTurn 為 true；結束後為 false', () => {
    expect(playerChipMeta(mkPlayer(), { isTurn: true, over: false, mode: 'ai' }).isTurn).toBe(true);
    expect(playerChipMeta(mkPlayer(), { isTurn: true, over: true, mode: 'ai' }).isTurn).toBe(false);
  });

  it('任務摘要文字：未達標顯示進度，全達成顯示 ✓', () => {
    const done = mkPlayer({ role: ROLES[0], catch: [{ name: 'a' }, { name: 'b' }, { name: 'c' }] });
    expect(playerChipMeta(done, { isTurn: false, over: false, mode: 'ai' }).taskSummary).toBe('任務✓');
    const p = mkPlayer({ role: ROLES[1], catch: [{ name: 'Cilat' }] });
    expect(playerChipMeta(p, { isTurn: false, over: false, mode: 'ai' }).taskSummary).toBe('1/5・cilat✓');
  });
});

describe('logTarget（紀錄分流：左側海況、右側行動）', () => {
  it('環境與系統訊息 → env（左側）', async () => {
    const { logTarget } = await import('../../../resources/game/utils/hud.js');
    expect(logTarget('lg-env')).toBe('env');
    expect(logTarget('lg-sys')).toBe('env');
  });

  it('玩家行動與結果 → action（右側）', async () => {
    const { logTarget } = await import('../../../resources/game/utils/hud.js');
    expect(logTarget('')).toBe('action');
    expect(logTarget('lg-ok')).toBe('action');
    expect(logTarget('lg-bad')).toBe('action');
    expect(logTarget(undefined)).toBe('action');
  });
});
