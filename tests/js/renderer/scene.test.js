import { describe, it, expect, vi } from 'vitest';
import { drawSeaBands, drawFishShadow, drawRockRight, tickDrops } from '../../../public/game/renderer/scene.js';

function mockCtx() {
  return {
    fillStyle: '',
    fillRect: vi.fn(),
    beginPath: vi.fn(),
    ellipse: vi.fn(),
    fill: vi.fn(),
    moveTo: vi.fn(),
    lineTo: vi.fn(),
  };
}

describe('drawSeaBands', () => {
  it('是函式', () => { expect(typeof drawSeaBands).toBe('function'); });
  it('呼叫 fillRect 繪製海水', () => {
    const g = mockCtx();
    drawSeaBands(g, 400, 300, 120);
    expect(g.fillRect).toHaveBeenCalled();
  });
  it('第一個 fillRect 從 (0,0) 覆蓋至水面', () => {
    const g = mockCtx();
    drawSeaBands(g, 400, 300, 120);
    const firstCall = g.fillRect.mock.calls[0];
    expect(firstCall[0]).toBe(0);
    expect(firstCall[1]).toBe(0);
    expect(firstCall[2]).toBe(400);
    expect(firstCall[3]).toBe(120);
  });
});

describe('drawFishShadow', () => {
  it('是函式', () => { expect(typeof drawFishShadow).toBe('function'); });
  it('繪製橢圓與尾巴', () => {
    const g = mockCtx();
    drawFishShadow(g, 100, 50, 1);
    expect(g.ellipse).toHaveBeenCalledOnce();
    expect(g.fill).toHaveBeenCalledTimes(2);
  });
  it('預設顏色包含 rgba', () => {
    const g = mockCtx();
    drawFishShadow(g, 100, 50, 1);
    expect(g.fillStyle).toMatch(/rgba/);
  });
  it('接受自訂顏色', () => {
    const g = mockCtx();
    drawFishShadow(g, 100, 50, 1, '#f2c94c');
    expect(g.fillStyle).toBe('#f2c94c');
  });
});

describe('drawRockRight', () => {
  it('是函式', () => { expect(typeof drawRockRight).toBe('function'); });
  it('繪製兩層礁岩', () => {
    const g = mockCtx();
    drawRockRight(g, 400, 300);
    expect(g.fillRect).toHaveBeenCalledTimes(2);
  });
});

describe('tickDrops', () => {
  it('是函式', () => { expect(typeof tickDrops).toBe('function'); });
  it('移除壽命耗盡的粒子（l >= 20）', () => {
    const g = mockCtx();
    const drops = [{ x: 10, y: 10, vx: 0, vy: 0, l: 19 }];
    tickDrops(g, drops);
    expect(drops).toHaveLength(0);
  });
  it('更新粒子位置與速度', () => {
    const g = mockCtx();
    const drops = [{ x: 10, y: 20, vx: 2, vy: -1, l: 0 }];
    tickDrops(g, drops);
    expect(drops[0].x).toBe(12);
    expect(drops[0].y).toBe(19);
    expect(drops[0].vy).toBeCloseTo(-0.75);
    expect(drops[0].l).toBe(1);
  });
  it('存活粒子呼叫 fillRect', () => {
    const g = mockCtx();
    const drops = [{ x: 5, y: 5, vx: 0, vy: 0, l: 0 }];
    tickDrops(g, drops);
    expect(g.fillRect).toHaveBeenCalledOnce();
  });
});
