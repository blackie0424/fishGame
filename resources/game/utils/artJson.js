/* 後台魚種 art JSON → 像素預覽參數（純函式，供 adminFishPreview.js 使用） */
const HEX = /^#[0-9a-fA-F]{6}$/;

export function parseArtJson(text) {
  let raw;
  try { raw = JSON.parse(text); } catch { return null; }
  if (!raw || typeof raw !== 'object' || Array.isArray(raw)) return null;
  if (!HEX.test(raw.body || '') || !HEX.test(raw.belly || '') || !HEX.test(raw.acc || '')) return null;
  return Object.assign({ shape: 'oval', pat: 'plain' }, raw);
}
