/**
 * 資料載入模組
 * 支援並行載入、快取機制和全域變數儲存
 */

import { API_BASE_URL, SHEET_NAMES, API_PATHS } from "./constants.js";

// 全域資料快取
const dataCache = {
  fishCards: null,
  destinyCards: null,
  imageCache: new Map(), // 圖片快取
  isLoaded: false,
};

// 同時掛載到 window 供全域存取
window.gameData = dataCache;

/**
 * 預載入單張圖片
 * @param {string} src - 圖片完整路徑
 * @returns {Promise<HTMLImageElement>} 載入完成的圖片元素
 */
function preloadImage(src) {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.onload = () => resolve(img);
    img.onerror = () => reject(new Error(`圖片載入失敗: ${src}`));
    img.src = src;
  });
}

/**
 * 從魚卡資料中預載入所有不重複的圖片
 * @param {Array} fishCards - 魚卡資料陣列
 * @param {string} basePath - 圖片基礎路徑
 * @param {Function} onProgress - 進度回調函式 (loaded, total)
 * @returns {Promise<Map<string, HTMLImageElement>>} 圖片快取 Map
 */
async function preloadFishImages(
  fishCards,
  basePath = "../images/",
  onProgress = null,
) {
  // 取得不重複的圖片路徑
  const uniqueImages = [...new Set(fishCards.map((fish) => fish.image))];
  const imageCache = new Map();

  let loaded = 0;
  const total = uniqueImages.length;

  // 並行載入所有圖片
  const loadPromises = uniqueImages.map(async (imagePath) => {
    try {
      const fullPath = `${basePath}${imagePath}`;
      const img = await preloadImage(fullPath);
      imageCache.set(imagePath, img);
      loaded++;
      onProgress?.(loaded, total);
    } catch (error) {
      console.warn(`圖片預載入失敗: ${imagePath}`, error);
      loaded++;
      onProgress?.(loaded, total);
    }
  });

  await Promise.all(loadPromises);

  console.log(`圖片預載入完成: ${imageCache.size}/${total} 張`);
  return imageCache;
}

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
 * 載入魚卡資料（帶快取）
 * @returns {Promise<Array>} 魚卡資料陣列
 */
export async function loadFishCards() {
  if (dataCache.fishCards) {
    return dataCache.fishCards;
  }
  const data = await loadJSON(API_PATHS.FISH_CARDS);
  dataCache.fishCards = data;
  return data;
}

/**
 * 載入命運卡資料（帶快取）
 * @returns {Promise<Array>} 命運卡資料陣列
 */
export async function loadDestinyCards() {
  if (dataCache.destinyCards) {
    return dataCache.destinyCards;
  }
  const data = await loadJSON(API_PATHS.DESTINY_CARDS);
  dataCache.destinyCards = data;
  return data;
}

/**
 * 並行載入所有遊戲資料
 * 使用 Promise.all 同時載入所有資料，提高效率
 * @param {Function} onProgress - 進度回調函式 (progress: number, status: string)
 * @returns {Promise<{fishCards: Array, destinyCards: Array}>} 所有遊戲資料
 */
export async function loadAllGameData(onProgress = null) {
  // 如果已載入，直接回傳快取
  if (dataCache.isLoaded) {
    onProgress?.(100, "資料已從快取載入");
    return {
      fishCards: dataCache.fishCards,
      destinyCards: dataCache.destinyCards,
    };
  }

  onProgress?.(10, "正在連線至伺服器");

  try {
    // 建立並行 fetch 請求
    const fishPromise = fetch(API_PATHS.FISH_CARDS).then((res) => {
      if (!res.ok) throw new Error(`魚卡載入失敗: ${res.status}`);
      onProgress?.(30, "正在解析魚卡資料");
      return res.json();
    });

    const destinyPromise = fetch(API_PATHS.DESTINY_CARDS).then((res) => {
      if (!res.ok) throw new Error(`命運卡載入失敗: ${res.status}`);
      onProgress?.(50, "正在解析命運卡資料");
      return res.json();
    });

    onProgress?.(20, "正在載入遊戲資料");

    // 並行等待所有資料
    const [fishCards, destinyCards] = await Promise.all([
      fishPromise,
      destinyPromise,
    ]);

    onProgress?.(60, "資料載入完成，開始預載入圖片");

    // 儲存到快取
    dataCache.fishCards = fishCards;
    dataCache.destinyCards = destinyCards;

    // 預載入魚卡圖片
    const imageCache = await preloadFishImages(
      fishCards,
      "../images/",
      (loaded, total) => {
        const imageProgress = 60 + Math.floor((loaded / total) * 35);
        onProgress?.(imageProgress, `正在載入圖片 ${loaded}/${total}`);
      },
    );

    // 儲存圖片快取
    dataCache.imageCache = imageCache;
    dataCache.isLoaded = true;

    // 同時更新全域變數供其他模組使用
    window.allFish = fishCards;
    window.allDestiny = destinyCards;

    onProgress?.(100, "所有資源載入完成");

    console.log("遊戲資料載入完成:", {
      魚卡數量: fishCards.length,
      命運卡數量: destinyCards.length,
      圖片數量: imageCache.size,
    });

    return { fishCards, destinyCards, imageCache };
  } catch (error) {
    console.error("遊戲資料載入失敗:", error);
    throw error;
  }
}

/**
 * 取得快取的魚卡資料（同步）
 * @returns {Array|null} 魚卡資料陣列或 null
 */
export function getCachedFishCards() {
  return dataCache.fishCards;
}

/**
 * 取得快取的命運卡資料（同步）
 * @returns {Array|null} 命運卡資料陣列或 null
 */
export function getCachedDestinyCards() {
  return dataCache.destinyCards;
}

/**
 * 清除快取（用於重新載入）
 */
export function clearCache() {
  dataCache.fishCards = null;
  dataCache.destinyCards = null;
  dataCache.imageCache.clear();
  dataCache.isLoaded = false;
  window.allFish = null;
  window.allDestiny = null;
}

/**
 * 取得快取的圖片（同步）
 * @param {string} imagePath - 圖片路徑（對應 JSON 中的 image 欄位）
 * @returns {HTMLImageElement|null} 圖片元素或 null
 */
export function getCachedImage(imagePath) {
  return dataCache.imageCache.get(imagePath) || null;
}

/**
 * 取得所有快取的圖片
 * @returns {Map<string, HTMLImageElement>} 圖片快取 Map
 */
export function getAllCachedImages() {
  return dataCache.imageCache;
}
