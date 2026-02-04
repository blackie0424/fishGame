/**
 * 資料載入模組
 */

import { API_PATHS } from "./constants.js";

/**
 * 載入 JSON 資料
 * @param {string} url - JSON 檔案路徑
 * @returns {Promise<Array>} 資料陣列
 */
export async function loadJSON(url) {
  try {
    const response = await fetch(url);
    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }
    return await response.json();
  } catch (error) {
    console.error(`無法載入資料: ${url}`, error);
    throw error;
  }
}

/**
 * 載入魚卡資料
 * @returns {Promise<Array>} 魚卡資料陣列
 */
export async function loadFishCards() {
  return loadJSON(API_PATHS.FISH_CARDS);
}

/**
 * 載入命運卡資料
 * @returns {Promise<Array>} 命運卡資料陣列
 */
export async function loadDestinyCards() {
  return loadJSON(API_PATHS.DESTINY_CARDS);
}
