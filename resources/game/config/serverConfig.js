/* =====================================================================
   Laravel 後台動態設定套用 — 自 game.js 抽出（refactor phase5）
   直接就地改寫共享資料模組（FISH_SPECIES 等為模組單例，全專案同參考）。
   歷史教訓（70f1108）：此處若把物件塞成陣列，buildFishSupply 讀不到
   f.count → 魚庫永遠為空 → 每一竿都「水域沒有魚」。對應回歸測試：
   tests/js/config/serverConfig.test.js
===================================================================== */
import { FISH_SPECIES, TARGET_SET } from '../data/fish.js';
import { SITE_CARDS } from '../data/sites.js';
import { ROLES } from '../data/roles.js';
import { ACTION_MIX, ACTION_INFO, DESTINY_CARDS, DESTINY_MIX, ENV_COUNTS, ENV_INFO } from '../data/cards.js';
import { FISH_ART } from '../data/fishArt.js';

/**
 * 將 /api/game-config 的設定套用到共享資料模組。
 * @param {object} cfg  API 回傳的設定物件
 * @param {object} hooks 遊戲端掛勾：
 *   - cfgStore：CFG 物件（rounds/goal/randomFishRatio/bgmSpeedRound 就地更新）
 *   - setSpotPos(positions)：覆寫落點座標
 *   - onFishChanged()：魚種異動後重建索引
 * @returns {boolean} 是否成功套用
 */
export function applyServerConfig(cfg, hooks = {}) {
  try {
    if (cfg.fish && cfg.fish.length) {
      FISH_SPECIES.length = 0;
      FISH_SPECIES.push(...cfg.fish.map(f => ({
        name: f.name,
        // 防呆：card_count 缺值/0/非數字 → fallback 1，魚庫絕不因資料異常而歸零
        count: (+f.card_count > 0 ? +f.card_count : 1),
        diff: f.difficulty,
        category: f.category,
        colors: ["#7fb2c9", "#d8e8ef", "#4a7f97"],
      })));
      Object.keys(FISH_ART).forEach(k => delete FISH_ART[k]);
      cfg.fish.forEach(f => { FISH_ART[f.name] = Object.assign({ shape: "oval", pat: "plain" }, f.art || {}); });
      if (hooks.onFishChanged) hooks.onFishChanged();
    }
    if (cfg.roles && cfg.roles.length) {
      ROLES.length = 0;
      ROLES.push(...cfg.roles.map((r, i) => ({
        id: i, name: r.name, emoji: r.emoji || "🧑", need: r.need,
        target: r.targets && r.targets.length ? r.targets : null,
        desc: r.description, skin: r.skin, cloth: r.cloth,
      })));
      TARGET_SET.clear();
      [].concat(...cfg.roles.map(r => r.targets || [])).forEach(t => TARGET_SET.add(t));
    }
    if (cfg.sites && cfg.sites.length) {
      SITE_CARDS.length = 0;
      SITE_CARDS.push(...cfg.sites.map(sc => ({
        name: sc.name, rule: sc.rule, banned: sc.banned || [],
        // 防呆：board_total 缺值 → fallback 7（中階預設），避免容量全 0 → 場上永遠沒魚
        total: (+sc.board_total > 0 ? +sc.board_total : 7),
        desc: sc.description, vis: sc.vis || { wave: 0, rock: 1, cur: 0 },
      })));
    }
    if (cfg.destiny && cfg.destiny.length) {
      DESTINY_CARDS.length = 0;
      DESTINY_CARDS.push(...cfg.destiny.map(d => ({ t: d.key, n: 0, title: d.title, content: d.content, result: d.result, kind: d.kind })));
      DESTINY_MIX.low = {}; DESTINY_MIX.mid = {}; DESTINY_MIX.high = {};
      cfg.destiny.forEach(d => { DESTINY_MIX.low[d.key] = d.count_low; DESTINY_MIX.mid[d.key] = d.count_mid; DESTINY_MIX.high[d.key] = d.count_high; });
    }
    if (cfg.actions && cfg.actions.length) {
      Object.keys(ACTION_INFO).forEach(k => delete ACTION_INFO[k]);
      ACTION_MIX.low = {}; ACTION_MIX.mid = {}; ACTION_MIX.high = {};
      cfg.actions.forEach(a => {
        ACTION_INFO[a.key] = {
          emoji: a.emoji || "", title: a.title, desc: a.description, flavor: a.flavor,
          hooked: a.hooked ? { emoji: a.hooked.emoji || "", title: a.hooked.title, desc: a.hooked.desc, flavor: a.hooked.flavor } : null,
        };
        ACTION_MIX.low[a.key] = a.count_low; ACTION_MIX.mid[a.key] = a.count_mid; ACTION_MIX.high[a.key] = a.count_high;
      });
    }
    if (cfg.envs && cfg.envs.length) {
      Object.keys(ENV_INFO).forEach(k => delete ENV_INFO[k]);
      Object.keys(ENV_COUNTS).forEach(k => delete ENV_COUNTS[k]);
      cfg.envs.forEach(e => {
        ENV_INFO[e.key] = { animType: e.key, emoji: e.emoji || "", title: e.title, desc: e.description, flavor: e.flavor };
        ENV_COUNTS[e.key] = e.card_count;
      });
    }
    const st = cfg.settings || {};
    const CFG = hooks.cfgStore || {};
    if (st.rounds) CFG.rounds = +st.rounds;
    if (st.collective_goal) CFG.goal = +st.collective_goal;
    if (st.random_fish_ratio != null) CFG.randomFishRatio = +st.random_fish_ratio;
    if (st.bgm_speedup_round) CFG.bgmSpeedRound = +st.bgm_speedup_round;
    if (st.spot_positions && st.spot_positions.length === 6 && hooks.setSpotPos) hooks.setSpotPos(st.spot_positions);
    console.info("[遊戲設定] 已套用 Laravel 後台設定");
    return true;
  } catch (err) {
    console.warn("[遊戲設定] 套用失敗，使用內建預設值", err);
    return false;
  }
}
