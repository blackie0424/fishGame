/**
 * 骰子模組
 */

import { getRandomInt } from "./utils.js";

/**
 * 骰子控制器類別
 */
export class DiceController {
  constructor(diceElement, resultElement, rollButton) {
    this.dice = diceElement;
    this.resultText = resultElement;
    this.rollBtn = rollButton;

    // 當前旋轉角度
    this.currentRotX = -30;
    this.currentRotY = -30;

    // 是否正在滾動中
    this.isRolling = false;

    // 綁定的事件處理器（用於移除監聽）
    this._onTransitionEnd = null;

    this.init();
  }

  /**
   * 初始化
   */
  init() {
    if (this.rollBtn) {
      this.rollBtn.addEventListener("click", () => this.roll());
    }
  }

  /**
   * 擲骰子
   * @returns {number} 骰子結果 (1-6)
   */
  roll() {
    // 如果正在滾動中，忽略此次點擊
    if (this.isRolling) {
      return null;
    }

    this.isRolling = true;

    // 產生 1 到 6 的隨機數
    const result = getRandomInt(1, 6);

    // 鎖定按鈕
    if (this.rollBtn) {
      this.rollBtn.disabled = true;
    }

    if (this.resultText) {
      this.resultText.textContent = "骰子滾動中...";
    }

    // 計算目標旋轉角度
    let targetRotX = 0;
    let targetRotY = 0;

    switch (result) {
      case 1:
        targetRotX = 0;
        targetRotY = 0;
        break;
      case 6:
        targetRotX = 0;
        targetRotY = 180;
        break;
      case 2:
        targetRotX = 0;
        targetRotY = -90;
        break;
      case 5:
        targetRotX = 0;
        targetRotY = 90;
        break;
      case 4:
        targetRotX = -90;
        targetRotY = 0;
        break;
      case 3:
        targetRotX = 90;
        targetRotY = 0;
        break;
    }

    // 增加額外旋轉圈數 (3-5 圈)
    const extraSpinsX = getRandomInt(3, 5) * 360;
    const extraSpinsY = getRandomInt(3, 5) * 360;

    // 計算新的旋轉角度，但正規化以避免數值過大
    let newRotX = targetRotX + extraSpinsX;
    let newRotY = targetRotY + extraSpinsY;

    // 確保旋轉方向一致（總是順時針）
    // 正規化當前角度到 0-360 範圍
    const normalizedCurrentX = ((this.currentRotX % 360) + 360) % 360;
    const normalizedCurrentY = ((this.currentRotY % 360) + 360) % 360;

    // 計算最終旋轉角度
    this.currentRotX = newRotX;
    this.currentRotY = newRotY;

    // 應用 CSS 變換
    if (this.dice) {
      // 移除之前的事件監聽器（如果存在）
      if (this._onTransitionEnd) {
        this.dice.removeEventListener("transitionend", this._onTransitionEnd);
      }

      // 強制重繪以確保動畫開始
      this.dice.offsetHeight;

      this.dice.style.transform = `rotateX(${this.currentRotX}deg) rotateY(${this.currentRotY}deg)`;

      // 建立新的事件處理器
      this._onTransitionEnd = (event) => {
        // 只處理 transform 屬性的事件，避免重複觸發
        if (event.propertyName !== "transform") {
          return;
        }

        // 移除監聽器
        this.dice.removeEventListener("transitionend", this._onTransitionEnd);
        this._onTransitionEnd = null;

        // 解鎖滾動狀態
        this.isRolling = false;

        if (this.rollBtn) {
          this.rollBtn.disabled = false;
        }
        if (this.resultText) {
          this.resultText.textContent = `結果是: ${result} 點!`;
        }

        // 動畫結束後正規化角度，避免累積過大
        // 使用 requestAnimationFrame 確保在下一幀處理
        requestAnimationFrame(() => {
          // 暫時移除 transition 以避免額外動畫
          this.dice.style.transition = "none";
          this.currentRotX = targetRotX;
          this.currentRotY = targetRotY;
          this.dice.style.transform = `rotateX(${targetRotX}deg) rotateY(${targetRotY}deg)`;

          // 強制重繪
          this.dice.offsetHeight;

          // 恢復 transition
          this.dice.style.transition = "";
        });
      };

      // 綁定新的監聽器
      this.dice.addEventListener("transitionend", this._onTransitionEnd);
    }

    return result;
  }
}
