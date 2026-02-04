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

    // 更新旋轉角度
    this.currentRotX += targetRotX - (this.currentRotX % 360) + extraSpinsX;
    this.currentRotY += targetRotY - (this.currentRotY % 360) + extraSpinsY;

    // 應用 CSS 變換
    if (this.dice) {
      this.dice.style.transform = `rotateX(${this.currentRotX}deg) rotateY(${this.currentRotY}deg)`;

      // 監聽動畫結束
      this.dice.addEventListener(
        "transitionend",
        () => {
          if (this.rollBtn) {
            this.rollBtn.disabled = false;
          }
          if (this.resultText) {
            this.resultText.textContent = `結果是: ${result} 點!`;
          }
        },
        { once: true },
      );
    }

    return result;
  }
}
