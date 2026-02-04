/**
 * 遊戲主頁面控制器
 *
 * 模組結構：
 * - Loading 控制
 * - 牌卡區控制 (魚牌、命運牌)
 * - 骰子區控制
 * - 收集區控制
 * - 角色區控制 (拖曳功能)
 * - 說明書區控制
 * - Modal 控制
 */

import { loadAllGameData } from "./data-loader.js";
import {
  renderFishCardContent,
  renderFateCardContent,
} from "./card-renderer.js";
import { getRandomItem, triggerAnimation } from "./utils.js";
import { DiceController } from "./dice.js";

// ===== 遊戲狀態 =====
let fishDeck = [];
let fateDeck = [];
let collectedFishes = [];
let currentFish = null;
let currentViewIndex = -1;

// ===== DOM 元素快取 =====
const elements = {
  // Loading
  loadingOverlay: null,
  loadingProgressBar: null,
  loadingStatusText: null,

  // 牌卡區
  fishDeck: null,
  fateDeck: null,

  // 骰子區
  dice: null,
  diceClickLayer: null,

  // Modal
  modalOverlay: null,
  modalCardContainer: null,
  cardContent: null,
  cardElement: null,
  collectBtn: null,
  deleteBtn: null,

  // 收集區
  collectionSection: null,

  // 說明書區
  helpButton: null,
  helpModalOverlay: null,
  helpCloseBtn: null,
  helpTabs: null,
};

/**
 * 初始化 DOM 元素快取
 */
function initElements() {
  elements.loadingOverlay = document.getElementById("loading-overlay");
  elements.loadingProgressBar = document.getElementById("loading-progress-bar");
  elements.loadingStatusText = document.getElementById("loading-status-text");

  elements.fishDeck = document.getElementById("fish-deck");
  elements.fateDeck = document.getElementById("fate-deck");

  elements.dice = document.getElementById("dice");
  elements.diceClickLayer = document.getElementById("dice-click-layer");

  elements.modalOverlay = document.getElementById("modal-overlay");
  elements.modalCardContainer = document.getElementById("modal-card-container");
  elements.cardContent = document.getElementById("card-content");
  elements.cardElement = document.getElementById("card-element");
  elements.collectBtn = document.getElementById("collect-btn");
  elements.deleteBtn = document.getElementById("delete-btn");

  elements.collectionSection = document.getElementById("collection-section");

  elements.helpButton = document.getElementById("help-button");
  elements.helpModalOverlay = document.getElementById("help-modal-overlay");
  elements.helpCloseBtn = document.getElementById("help-close-btn");
  elements.helpTabs = document.querySelectorAll(".help-tab");
}

// ===== Loading 控制 =====
function updateLoadingProgress(progress, status) {
  if (elements.loadingProgressBar) {
    elements.loadingProgressBar.style.width = progress + "%";
  }
  if (elements.loadingStatusText) {
    elements.loadingStatusText.textContent = status;
  }
}

function hideLoadingOverlay() {
  if (elements.loadingOverlay) {
    elements.loadingOverlay.classList.add("hidden");
  }
}

// ===== 牌卡區控制 =====
function drawFishCard() {
  if (fishDeck.length === 0) return;

  const fish = getRandomItem(fishDeck);
  currentFish = fish;
  currentViewIndex = -1;

  elements.cardContent.className = "card-face card-front";
  elements.cardContent.innerHTML = renderFishCardContent(fish);

  elements.collectBtn.classList.add("visible");
  elements.deleteBtn.classList.remove("visible");

  showModal();
}

function drawFateCard() {
  if (fateDeck.length === 0) return;

  const card = getRandomItem(fateDeck);
  currentFish = null;
  currentViewIndex = -1;

  elements.cardContent.className = "card-face card-front fate-card";
  elements.cardContent.innerHTML = renderFateCardContent(card);

  elements.collectBtn.classList.remove("visible");
  elements.deleteBtn.classList.remove("visible");

  showModal();
}

// ===== Modal 控制 =====
function showModal() {
  elements.modalOverlay.classList.add("active");
  elements.modalCardContainer.classList.remove("pop-in");
  elements.modalCardContainer.classList.remove("collecting");

  void elements.modalCardContainer.offsetWidth;
  elements.modalCardContainer.classList.add("pop-in");
  triggerAnimation(elements.cardElement, "drawing");
}

function handleModalClick(e) {
  const diceSection = document.querySelector(".dice-section");

  if (
    e.target === elements.collectBtn ||
    elements.collectBtn.contains(e.target) ||
    e.target === elements.deleteBtn ||
    elements.deleteBtn.contains(e.target) ||
    (diceSection && diceSection.contains(e.target))
  ) {
    return;
  }
  closeModal();
}

function closeModal() {
  elements.modalOverlay.classList.remove("active");
  elements.collectBtn.classList.remove("visible");
  elements.deleteBtn.classList.remove("visible");
  currentFish = null;
  currentViewIndex = -1;
}

// ===== 收集區控制 =====
function collectCurrentFish(e) {
  e.stopPropagation();

  if (!currentFish) return;

  const newIndex = collectedFishes.length;
  collectedFishes.push({ ...currentFish });

  elements.modalCardContainer.classList.add("collecting");

  setTimeout(() => {
    addCardToCollection(currentFish, newIndex);
    closeModal();
    elements.modalCardContainer.classList.remove("collecting");
  }, 1000);
}

function addCardToCollection(fish, index) {
  const cardThumb = document.createElement("div");
  cardThumb.className = "collected-card bounce-in";
  cardThumb.title = `${fish.name} - ${fish.capture_condition}`;
  cardThumb.dataset.index = index;

  const img = document.createElement("img");
  img.src = `../images/${fish.image}`;
  img.alt = fish.name;
  img.className = "collected-card-img";

  const nameLabel = document.createElement("div");
  nameLabel.className = "collected-card-name";
  nameLabel.textContent = fish.name;

  cardThumb.appendChild(img);
  cardThumb.appendChild(nameLabel);

  cardThumb.addEventListener("click", () => {
    viewCollectedCard(parseInt(cardThumb.dataset.index));
  });

  elements.collectionSection.appendChild(cardThumb);
  elements.collectionSection.classList.add("has-cards");

  setTimeout(() => {
    cardThumb.classList.remove("bounce-in");
  }, 400);
}

function viewCollectedCard(index) {
  const fish = collectedFishes[index];
  if (!fish) return;

  currentFish = fish;
  currentViewIndex = index;

  elements.cardContent.className = "card-face card-front";
  elements.cardContent.innerHTML = renderFishCardContent(fish);

  elements.collectBtn.classList.remove("visible");
  elements.deleteBtn.classList.add("visible");

  showModal();
}

function deleteCurrentFish(e) {
  e.stopPropagation();

  if (currentViewIndex < 0 || currentViewIndex >= collectedFishes.length)
    return;

  collectedFishes.splice(currentViewIndex, 1);
  renderCollectionSection();
  closeModal();
}

function renderCollectionSection() {
  const title = elements.collectionSection.querySelector(
    ".collection-section-title",
  );
  elements.collectionSection.innerHTML = "";
  elements.collectionSection.appendChild(title);

  collectedFishes.forEach((fish, index) => {
    addCardToCollection(fish, index);
  });

  if (collectedFishes.length === 0) {
    elements.collectionSection.classList.remove("has-cards");
  }
}

// ===== 角色區控制 (拖曳功能) =====
function initPlayerDrag() {
  const players = document.querySelectorAll(".fishman-container");

  players.forEach((player) => {
    let isDragging = false;
    let startX, startY, initialX, initialY;

    player.addEventListener("mousedown", startDrag);
    document.addEventListener("mousemove", drag);
    document.addEventListener("mouseup", endDrag);

    player.addEventListener("touchstart", startDrag, { passive: false });
    document.addEventListener("touchmove", drag, { passive: false });
    document.addEventListener("touchend", endDrag);

    function startDrag(e) {
      if (e.target.closest(".fishman-container") !== player) return;

      isDragging = true;
      player.classList.add("dragging");

      const rect = player.getBoundingClientRect();
      const clientX =
        e.type === "touchstart" ? e.touches[0].clientX : e.clientX;
      const clientY =
        e.type === "touchstart" ? e.touches[0].clientY : e.clientY;

      startX = clientX;
      startY = clientY;
      initialX = rect.left;
      initialY = rect.top;

      player.style.right = "auto";
      player.style.bottom = "auto";
      player.style.left = initialX + "px";
      player.style.top = initialY + "px";
      player.style.position = "fixed";

      if (e.type === "touchstart") {
        e.preventDefault();
      }
    }

    function drag(e) {
      if (!isDragging) return;

      const clientX = e.type === "touchmove" ? e.touches[0].clientX : e.clientX;
      const clientY = e.type === "touchmove" ? e.touches[0].clientY : e.clientY;

      const deltaX = clientX - startX;
      const deltaY = clientY - startY;

      const newX = initialX + deltaX;
      const newY = initialY + deltaY;

      const container = document.querySelector(".game-container");
      const containerRect = container.getBoundingClientRect();
      const playerRect = player.getBoundingClientRect();

      const boundedX = Math.max(
        0,
        Math.min(newX, containerRect.width - playerRect.width),
      );
      const boundedY = Math.max(
        0,
        Math.min(newY, containerRect.height - playerRect.height),
      );

      player.style.left = boundedX + "px";
      player.style.top = boundedY + "px";

      if (e.type === "touchmove") {
        e.preventDefault();
      }
    }

    function endDrag() {
      if (!isDragging) return;
      isDragging = false;
      player.classList.remove("dragging");
    }
  });
}

// ===== 說明書區控制 =====
function initManualSection() {
  elements.helpButton.addEventListener("click", () => {
    elements.helpModalOverlay.classList.add("active");
  });

  elements.helpModalOverlay.addEventListener("click", (e) => {
    if (e.target === elements.helpModalOverlay) {
      elements.helpModalOverlay.classList.remove("active");
    }
  });

  elements.helpCloseBtn.addEventListener("click", () => {
    elements.helpModalOverlay.classList.remove("active");
  });

  elements.helpTabs.forEach((tab) => {
    tab.addEventListener("click", () => {
      elements.helpTabs.forEach((t) => t.classList.remove("active"));
      document
        .querySelectorAll(".help-tab-content")
        .forEach((c) => c.classList.remove("active"));

      tab.classList.add("active");
      const tabId = tab.getAttribute("data-tab");
      document.getElementById(`tab-${tabId}`).classList.add("active");
    });
  });
}

// ===== 骰子區控制 =====
function initDiceSection() {
  const diceController = new DiceController(elements.dice, null, null);

  elements.diceClickLayer.addEventListener("click", () => {
    diceController.roll();
  });
}

// ===== 遊戲初始化 =====
async function init() {
  try {
    initElements();

    const gameData = await loadAllGameData((progress, status) => {
      updateLoadingProgress(progress, status);
    });

    fishDeck = gameData.fishCards;
    fateDeck = gameData.destinyCards;

    updateLoadingProgress(85, "正在初始化遊戲元件");

    // 初始化各區域
    initPlayerDrag();

    updateLoadingProgress(90, "正在設定事件監聽");

    // 牌卡區事件
    elements.fishDeck.addEventListener("click", drawFishCard);
    elements.fateDeck.addEventListener("click", drawFateCard);

    // Modal 事件
    elements.modalOverlay.addEventListener("click", handleModalClick);
    elements.collectBtn.addEventListener("click", collectCurrentFish);
    elements.deleteBtn.addEventListener("click", deleteCurrentFish);

    // 骰子區
    initDiceSection();

    // 說明書區
    initManualSection();

    updateLoadingProgress(100, "載入完成！");
    setTimeout(() => {
      hideLoadingOverlay();
    }, 300);

    console.log("遊戲初始化完成！");
  } catch (err) {
    console.error("初始化失敗:", err);
  }
}

// 啟動遊戲
init();
