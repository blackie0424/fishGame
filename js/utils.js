/**
 * 通用工具函式模組
 */

/**
 * 從陣列中隨機取得一個元素
 * @param {Array} array - 來源陣列
 * @returns {*} 隨機選取的元素
 */
export function getRandomItem(array) {
  if (!array || array.length === 0) return null;
  return array[Math.floor(Math.random() * array.length)];
}

/**
 * 產生指定範圍的隨機整數
 * @param {number} min - 最小值 (包含)
 * @param {number} max - 最大值 (包含)
 * @returns {number} 隨機整數
 */
export function getRandomInt(min, max) {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

/**
 * 觸發元素的動畫重播
 * @param {HTMLElement} element - 目標元素
 * @param {string} animationClass - 動畫 CSS class 名稱
 */
export function triggerAnimation(element, animationClass) {
  element.classList.remove(animationClass);
  void element.offsetWidth; // 強制重繪
  element.classList.add(animationClass);
}

/**
 * 產生重複字串
 * @param {string} str - 要重複的字串
 * @param {number} count - 重複次數
 * @returns {string} 重複後的字串
 */
export function repeatString(str, count) {
  return str.repeat(count);
}

/**
 * 顯示錯誤訊息
 * @param {string} message - 錯誤訊息
 * @param {HTMLElement} container - 顯示容器 (預設 document.body)
 */
export function showError(message, container = document.body) {
  const errorEl = document.createElement("p");
  errorEl.className = "error-message";
  errorEl.textContent = message;
  container.appendChild(errorEl);
}
