/**
 * 常數定義模組
 */

// 撲克牌花色符號
export const SUIT_SYMBOLS = {
  Spades: "♠",
  Hearts: "♥",
  Diamonds: "♦",
  Clubs: "♣",
};

// 撲克牌排序權重 (A 最小)
export const RANK_WEIGHTS = {
  A: 1,
  2: 2,
  3: 3,
  4: 4,
  5: 5,
  6: 6,
  7: 7,
  8: 8,
  9: 9,
  10: 10,
  J: 11,
  Q: 12,
  K: 13,
};

// 花色權重 (用於同點數排序)
export const SUIT_WEIGHTS = {
  Spades: 4,
  Hearts: 3,
  Diamonds: 2,
  Clubs: 1,
};

// 紅色花色
export const RED_SUITS = ["Hearts", "Diamonds"];

// GAS API 基底路徑
export const API_BASE_URL =
  "https://script.google.com/macros/s/AKfycbzLSFTXH1UsOXyoVFau2I6yUQjKgMJAUsbAz26ousY2gvlyDhv40DKNempJtE3Sl_tR/exec";

// Sheet 名稱
export const SHEET_NAMES = {
  FISH_CARDS: "魚牌(撲克牌版本)",
  DESTINY_CARDS: "命運卡牌",
};

// API 路徑 (向後相容)
export const API_PATHS = {
  FISH_CARDS: `${API_BASE_URL}?sheet=${encodeURIComponent(SHEET_NAMES.FISH_CARDS)}`,
  DESTINY_CARDS: `${API_BASE_URL}?sheet=${encodeURIComponent(SHEET_NAMES.DESTINY_CARDS)}`,
};
