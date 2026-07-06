import { describe, it, expect } from 'vitest';
import { sharePhase, checkPersonal } from '../../../resources/game/utils/share.js';

/* 耆老分魚 v2（Wu 2026-07-06 決策）：
   1. 漁獲視為整體：只要任何人的漁獲中有目標魚，就分給需要的角色（不再要求
      持有者先滿足自己的數量需求），耆老只說明「誰釣到的、誰需要」。
   2. 目標魚分完才處理數量：全部魚（各自保留必要目標魚）進公共池，
      釣最多魚的先拿——先依序補到各自需求，剩餘依序輪流分。 */

const P = (name, need, target, fish) => ({
  idx: 0, role: { name, need, target }, rest: 0,
  catch: fish.map(n => ({ name: n, diff: 1 })),
});

describe('sharePhase 目標魚全域配對', () => {
  it('持有者未達自身數量需求也要轉讓目標魚（舊制會擋、新制不擋）', () => {
    const holder = P('小孩', 3, null, ['Ilek']);           // 只有 1 條、未達 need=3
    const needer = P('結婚的男人', 6, ['Ilek'], ['Cirow', 'Cirow', 'Cirow', 'Cirow', 'Cirow', 'Cirow']);
    const { transfers } = sharePhase([holder, needer]);
    const t = transfers.find(x => x.why === 'target');
    expect(t).toBeTruthy();
    expect(t.fish.name).toBe('Ilek');
    expect(needer.catch.some(f => f.name === 'Ilek')).toBe(true);
  });

  it('持有者自己也需要同種目標魚且僅一條 → 不轉讓', () => {
    const holder = P('結婚的男人', 6, ['Ilek'], ['Ilek']);
    const needer = P('有小孩的爸爸', 6, ['Ilek'], []);
    sharePhase([holder, needer]);
    expect(holder.catch.some(f => f.name === 'Ilek')).toBe(true);
    expect(needer.catch.some(f => f.name === 'Ilek')).toBe(false);
  });

  it('兩條 Ilek、兩個需要的角色 → 各得一條', () => {
    const holder = P('小孩', 3, null, ['Ilek', 'Ilek']);
    const a = P('結婚的男人', 6, ['Ilek'], []);
    const b = P('有小孩的爸爸', 6, ['Ilek'], []);
    sharePhase([holder, a, b]);
    expect(a.catch.filter(f => f.name === 'Ilek').length).toBe(1);
    expect(b.catch.filter(f => f.name === 'Ilek').length).toBe(1);
  });
});

describe('sharePhase 數量重分配（釣最多的先拿）', () => {
  it('先補齊各自需求，剩餘由釣最多者優先輪流拿', () => {
    const a = P('結婚的男人', 6, ['Ilek'], ['Ilek', 'x', 'x', 'x', 'x', 'x', 'x', 'x']); // 8 條（最多）
    const b = P('成年男子', 5, ['Cilat'], ['Cilat', 'x', 'x']);                          // 3 條
    const c = P('小孩', 3, null, []);                                                    // 0 條
    sharePhase([a, b, c]);
    // 總 11 條：a 補到 6、b 到 5、c 到 3 共 14 > 11 → 依序 a6, b5(3+2), c0? 不——
    // 順序 a→b→c：a 先拿滿 6，b 拿滿 5，剩 0 條給 c
    expect(a.catch.length).toBe(6);
    expect(b.catch.length).toBe(5);
    expect(c.catch.length).toBe(0);
    // 目標魚保留在需要者手上
    expect(a.catch.some(f => f.name === 'Ilek')).toBe(true);
    expect(b.catch.some(f => f.name === 'Cilat')).toBe(true);
  });

  it('魚够多時：需求全補齊，剩餘給釣最多者（可拿到較多的魚）', () => {
    const a = P('小孩', 3, null, ['x', 'x', 'x', 'x', 'x', 'x', 'x', 'x']); // 8
    const b = P('小孩', 3, null, ['x', 'x']);                                // 2
    sharePhase([a, b]);
    expect(a.catch.length + b.catch.length).toBe(10);
    expect(b.catch.length).toBeGreaterThanOrEqual(3);   // 需求補齊
    expect(a.catch.length).toBeGreaterThan(b.catch.length); // 釣最多的最後拿最多
  });

  it('總量不足時不會憑空生魚、不會卡死', () => {
    const a = P('小孩', 3, null, ['x']);
    const b = P('小孩', 3, null, []);
    sharePhase([a, b]);
    expect(a.catch.length + b.catch.length).toBe(1);
  });
});

describe('checkPersonal', () => {
  it('數量與目標魚都滿足才算達成', () => {
    expect(checkPersonal(P('成年男子', 2, ['Cilat'], ['Cilat', 'x']))).toBe(true);
    expect(checkPersonal(P('成年男子', 2, ['Cilat'], ['x', 'x']))).toBe(false);
    expect(checkPersonal(P('小孩', 2, null, ['x', 'x']))).toBe(true);
  });
});
