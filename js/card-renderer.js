/**
 * 卡片渲染模組
 */

import {
  SUIT_SYMBOLS,
  RED_SUITS,
  RANK_WEIGHTS,
  SUIT_WEIGHTS,
} from "./constants.js";
import { repeatString } from "./utils.js";

/**
 * 判斷花色是否為紅色
 * @param {string} suit - 花色名稱
 * @returns {boolean}
 */
export function isRedSuit(suit) {
  return RED_SUITS.includes(suit);
}

/**
 * 取得花色符號
 * @param {string} suit - 花色名稱
 * @returns {string} 花色符號
 */
export function getSuitSymbol(suit) {
  return SUIT_SYMBOLS[suit] || "";
}

/**
 * 產生魚卡 HTML 內容
 * @param {Object} fish - 魚卡資料
 * @returns {string} HTML 字串
 */
export function renderFishCardContent(fish) {
  const symbol = getSuitSymbol(fish.poker_data.suit);
  const colorClass = isRedSuit(fish.poker_data.suit)
    ? "suit-red"
    : "suit-black";
  const stars = repeatString("★", fish.difficulty);

  return `
        <div class="element poker-info anchor-center ${colorClass}">${symbol}${fish.poker_data.rank}</div>
        <div class="element category">${fish.category}</div>
        <div class="element stars">${stars}</div>
        <div class="element fish-illustration anchor-center">
            <img src="../images/${fish.image}" alt="${fish.name}">
        </div>
        <div class="element fish-name anchor-center">${fish.name}</div>
        <div class="element condition anchor-center">${fish.capture_condition}</div>
    `;
}

/**
 * 產生可翻轉魚卡完整 HTML
 * @param {Object} fish - 魚卡資料
 * @returns {string} HTML 字串
 */
export function renderFlippableFishCard(fish) {
  return `
        <div class="scene">
            <div class="card-wrapper">
                <div class="card" onclick="this.classList.toggle('is-flipped')">
                    <div class="card-face card-front">
                        ${renderFishCardContent(fish)}
                    </div>
                    <div class="card-face card-back"></div>
                </div>
            </div>
        </div>
    `;
}

/**
 * 產生命運卡 HTML 內容
 * @param {Object} data - 命運卡資料
 * @returns {string} HTML 字串
 */
export function renderFateCardContent(data) {
  return `
        <div class="fate-title">${data.title}</div>
        <div class="fate-content">${data.content}</div>
        <div class="fate-result">結果：<br>${data.result}</div>
    `;
}

/**
 * 產生可翻轉命運卡完整 HTML
 * @param {Object} data - 命運卡資料
 * @returns {string} HTML 字串
 */
export function renderFlippableFateCard(data) {
  return `
        <div class="scene">
            <div class="card-wrapper">
                <div class="card" onclick="this.classList.toggle('is-flipped')">
                    <div class="card-face card-front fate-card">
                        ${renderFateCardContent(data)}
                    </div>
                    <div class="card-face card-back"></div>
                </div>
            </div>
        </div>
    `;
}

/**
 * 排序魚卡 (由小到大)
 * @param {Array} cards - 魚卡陣列
 * @returns {Array} 排序後的陣列
 */
export function sortFishCards(cards) {
  return [...cards].sort((a, b) => {
    const rankA = RANK_WEIGHTS[a.poker_data.rank];
    const rankB = RANK_WEIGHTS[b.poker_data.rank];

    if (rankA !== rankB) {
      return rankA - rankB;
    }
    return SUIT_WEIGHTS[b.poker_data.suit] - SUIT_WEIGHTS[a.poker_data.suit];
  });
}
