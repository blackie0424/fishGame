import { describe, it, expect, vi } from 'vitest';
import { applyServerConfig } from '../../../resources/game/config/serverConfig.js';
import { FISH_SPECIES } from '../../../resources/game/data/fish.js';
import { SITE_CARDS } from '../../../resources/game/data/sites.js';
import { buildFishSupply } from '../../../resources/game/utils/deck.js';

/* 「水域沒有魚」回歸測試（歷史：commit 70f1108）
   後台設定套用後，FISH_SPECIES 必須是物件格式且 count>0，
   否則 buildFishSupply 產出空魚庫 → 每一竿都顯示「水域沒有魚」。 */

const apiFish = (over = {}) => ({
  name: 'Lagarow', category: 'Rahet', difficulty: 1, card_count: 4,
  art: { shape: 'long' }, ...over,
});

describe('applyServerConfig — fish（魚庫回歸測試）', () => {
  it('物件格式正確映射，buildFishSupply 依 card_count 產出非空魚庫', () => {
    const ok = applyServerConfig({ fish: [apiFish(), apiFish({ name: 'Ilek', card_count: 1, difficulty: 5 })] });
    expect(ok).toBe(true);
    expect(FISH_SPECIES[0]).toMatchObject({ name: 'Lagarow', count: 4, diff: 1 });
    const supply = buildFishSupply();
    expect(supply.length).toBe(5);                       // 4 + 1
    expect(supply[0]).toHaveProperty('name');            // 物件、不是陣列
    expect(Array.isArray(supply[0])).toBe(false);
  });

  it('card_count 缺值/0/字串垃圾 → fallback 1，魚庫絕不歸零', () => {
    applyServerConfig({ fish: [apiFish({ card_count: undefined }), apiFish({ name: 'B', card_count: 0 }), apiFish({ name: 'C', card_count: 'junk' })] });
    expect(buildFishSupply().length).toBe(3);            // 1+1+1
    FISH_SPECIES.forEach(f => expect(f.count).toBeGreaterThan(0));
  });

  it('onFishChanged 掛勾在魚種異動後被呼叫', () => {
    const hook = vi.fn();
    applyServerConfig({ fish: [apiFish()] }, { onFishChanged: hook });
    expect(hook).toHaveBeenCalledOnce();
  });

  it('cfg.fish 為空陣列 → 保留原資料不動', () => {
    const before = FISH_SPECIES.length;
    applyServerConfig({ fish: [] });
    expect(FISH_SPECIES.length).toBe(before);
  });
});

describe('applyServerConfig — sites（容量防呆）', () => {
  it('board_total 正常映射為 total', () => {
    applyServerConfig({ sites: [{ name: 'S', rule: 'gte', banned: [], board_total: 7, description: '', vis: null }] });
    expect(SITE_CARDS[0].total).toBe(7);
  });
  it('board_total 缺值 → fallback 7，容量不會全 0', () => {
    applyServerConfig({ sites: [{ name: 'S', rule: 'gte', banned: [] }] });
    expect(SITE_CARDS[0].total).toBeGreaterThan(0);
  });
});

describe('applyServerConfig — settings 與錯誤處理', () => {
  it('settings 寫入 cfgStore；spot_positions 觸發 setSpotPos', () => {
    const store = { rounds: 15, goal: 21, randomFishRatio: .35 };
    const setPos = vi.fn();
    applyServerConfig({ settings: { rounds: '12', random_fish_ratio: '0.5', spot_positions: [1, 2, 3, 4, 5, 6] } },
      { cfgStore: store, setSpotPos: setPos });
    expect(store.rounds).toBe(12);
    expect(store.randomFishRatio).toBe(0.5);
    expect(setPos).toHaveBeenCalledWith([1, 2, 3, 4, 5, 6]);
  });
  it('cfg 為 null → 回傳 false、不拋例外（退回內建預設值）', () => {
    expect(applyServerConfig(null)).toBe(false);
  });
});
