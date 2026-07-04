import { describe, it, expect, vi, beforeEach } from 'vitest';
import { startFight } from '../../../public/game/renderer/fight.js';

vi.stubGlobal('requestAnimationFrame', () => {});

function mockCtx() {
  return {
    imageSmoothingEnabled: false,
    fillStyle: '', strokeStyle: '', lineWidth: 0, globalAlpha: 1,
    fillRect: vi.fn(), beginPath: vi.fn(), ellipse: vi.fn(), fill: vi.fn(),
    moveTo: vi.fn(), lineTo: vi.fn(), stroke: vi.fn(),
    quadraticCurveTo: vi.fn(),
  };
}

function mockCanvas() {
  const ctx = mockCtx();
  return {
    style: { display: '' },
    width: 400, height: 300,
    getContext: () => ctx,
  };
}

const mockSfx = { reel: vi.fn(), creak: vi.fn() };

describe('startFight', () => {
  it('是函式', () => {
    expect(typeof startFight).toBe('function');
  });

  it('回傳含 boost/result/stop 的控制物件', () => {
    const ctrl = startFight(mockCanvas(), null, mockSfx);
    expect(typeof ctrl.boost).toBe('function');
    expect(typeof ctrl.result).toBe('function');
    expect(typeof ctrl.stop).toBe('function');
    ctrl.stop();
  });

  it('stop() 隱藏 canvas', () => {
    const canvas = mockCanvas();
    const ctrl = startFight(canvas, null, mockSfx);
    ctrl.stop();
    expect(canvas.style.display).toBe('none');
  });

  it('result(true) 設定勝利模式，result(false) 設定失敗模式', () => {
    const canvas = mockCanvas();
    const ctrl = startFight(canvas, null, mockSfx);

    ctrl.result(true);
    // 呼叫不拋錯即可（mode 是內部狀態）
    ctrl.stop();

    const canvas2 = mockCanvas();
    const ctrl2 = startFight(canvas2, null, mockSfx);
    ctrl2.result(false);
    ctrl2.stop();
  });

  it('boost() 呼叫不拋錯', () => {
    const canvas = mockCanvas();
    const ctrl = startFight(canvas, null, mockSfx);
    expect(() => ctrl.boost()).not.toThrow();
    ctrl.stop();
  });

  it('不傳 sfx 也不拋錯', () => {
    const canvas = mockCanvas();
    expect(() => {
      const ctrl = startFight(canvas, null);
      ctrl.stop();
    }).not.toThrow();
  });
});
