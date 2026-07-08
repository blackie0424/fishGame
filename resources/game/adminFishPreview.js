/* =====================================================================
   後台魚種 art 欄位：像素圖 × 原始去背圖 並排對照
   讓「手動修正像素圖參數」看得到效果：textarea 內容一變，立即以遊戲
   實際使用的 drawFish 渲染，旁邊並排原始去背照片供管理員識別差異。
   與遊戲端零分岔——同一顆渲染器。流程說明見 docs/fish-pixel-art.md。
===================================================================== */
import { drawFish } from './renderer/sprites.js';
import { parseArtJson, removebgPhotoUrl } from './utils/artJson.js';
import { FISH_ART } from './data/fishArt.js';

const PREVIEW_KEY = '__adminPreview';

const ta = document.getElementById('fish-art-textarea');
if (ta) {
  const wrap = document.createElement('div');
  wrap.style.cssText = 'margin:8px 0;display:flex;align-items:flex-end;gap:18px;flex-wrap:wrap;';
  wrap.innerHTML =
    '<figure style="margin:0;text-align:center;">'
    + '<canvas style="image-rendering:pixelated;background:#0e3a63;border:2px solid #223a5c;"></canvas>'
    + '<figcaption style="font-size:0.85em;color:#666;">像素圖（遊戲實際渲染）</figcaption></figure>'
    + '<figure style="margin:0;text-align:center;">'
    + '<img style="max-height:96px;max-width:220px;background:#0e3a63;border:2px solid #223a5c;padding:4px;" alt="原始去背圖">'
    + '<figcaption style="font-size:0.85em;color:#666;">原始去背圖</figcaption></figure>'
    + '<span style="font-size:0.9em;color:#666;max-width:300px;"></span>';
  ta.insertAdjacentElement('afterend', wrap);
  const cv = wrap.querySelector('canvas'), img = wrap.querySelector('img'),
        msg = wrap.querySelector('span'), photoFig = img.parentElement;

  // 原始去背圖：魚名欄位（新增時可再輸入）→ removebg 慣例路徑；找不到就整塊收起
  const nameInput = document.querySelector('input[name="name"]');
  img.onerror = () => { photoFig.style.display = 'none'; };
  const loadPhoto = () => {
    const url = removebgPhotoUrl(nameInput && nameInput.value, parseArtJson(ta.value));
    if (!url) { photoFig.style.display = 'none'; return; }
    photoFig.style.display = '';
    if (img.src !== location.origin + url) img.src = url;
  };

  const render = () => {
    const art = parseArtJson(ta.value);
    if (!art) {
      cv.style.display = 'none';
      msg.textContent = '⚠ art JSON 不完整或格式錯誤（至少需要 body / belly / acc 三個 #色碼），無法預覽';
    } else {
      cv.style.display = '';
      FISH_ART[PREVIEW_KEY] = art;
      drawFish(cv, { name: PREVIEW_KEY, diff: 1 }, 8);
      msg.textContent = art.note || '';
    }
    loadPhoto();
  };

  ta.addEventListener('input', render);
  if (nameInput) nameInput.addEventListener('input', loadPhoto);
  render();
}
