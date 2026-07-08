/* =====================================================================
   後台魚種 art 欄位即時像素預覽
   讓「手動修正像素圖參數」看得到效果：textarea 內容一變，立即以遊戲
   實際使用的 drawFish 渲染。與遊戲端零分岔——同一顆渲染器。
===================================================================== */
import { drawFish } from './renderer/sprites.js';
import { parseArtJson } from './utils/artJson.js';
import { FISH_ART } from './data/fishArt.js';

const PREVIEW_KEY = '__adminPreview';

const ta = document.getElementById('fish-art-textarea');
if (ta) {
  const wrap = document.createElement('div');
  wrap.style.cssText = 'margin:8px 0;display:flex;align-items:center;gap:12px;';
  wrap.innerHTML = '<canvas style="image-rendering:pixelated;background:#0e3a63;border:2px solid #223a5c;"></canvas>'
                 + '<span style="font-size:0.9em;color:#666;max-width:340px;"></span>';
  ta.insertAdjacentElement('afterend', wrap);
  const cv = wrap.querySelector('canvas'), msg = wrap.querySelector('span');

  const render = () => {
    const art = parseArtJson(ta.value);
    if (!art) {
      cv.style.display = 'none';
      msg.textContent = '⚠ art JSON 不完整或格式錯誤（至少需要 body / belly / acc 三個 #色碼），無法預覽';
      return;
    }
    cv.style.display = '';
    FISH_ART[PREVIEW_KEY] = art;
    drawFish(cv, { name: PREVIEW_KEY, diff: 1 }, 8);
    msg.textContent = art.note || '';
  };

  ta.addEventListener('input', render);
  render();
}
