<!doctype html>
<html lang="zh-TW">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1.0, user-scalable=no">
<meta name="csrf-token" content="{{ csrf_token() }}">
<title>蘭嶼釣魚趣 — 達悟族捕魚桌遊</title>
<link rel="preconnect" href="https://fonts.googleapis.com">
<link href="https://fonts.googleapis.com/css2?family=Press+Start+2P&display=swap" rel="stylesheet">
<link rel="stylesheet" href="{{ asset('game/game.css') }}">
</head>
<body>


<!-- ================= 標題 ================= -->
<div class="screen active" id="screen-title">
  <canvas id="title-sea"></canvas>
  <div class="title-block" style="position:relative; z-index:1; display:flex; flex-direction:column; align-items:center;">
    <div class="pxfont" style="color:var(--sun); font-size:12px; letter-spacing:2px; text-shadow:0 2px 0 #000;">TAO FISHING GAME</div>
    <h1 class="game-logo">蘭嶼釣魚趣</h1>
    <div class="tao-stripe"></div>
    <p class="game-sub" style="text-shadow:0 2px 0 rgba(0,0,0,.6);">達悟族的海洋・協作與分享的捕魚之旅</p>
    <div style="height:26px"></div>
    <button class="pixel-btn red" id="btn-start" style="font-size:18px; padding:16px 34px;">🎣 開始遊戲</button>
    <p class="hint" style="margin-top:16px; color:#cfe3f2; text-shadow:0 2px 0 rgba(0,0,0,.7);">15 回合內，全體漁獲達 21 條，並完成各自的家庭任務</p>
  </div>
</div>

<!-- ================= 設定 ================= -->
<div class="screen" id="screen-setup">
  <h2 style="font-size:26px; font-weight:900; letter-spacing:3px; text-align:center; margin-top:8px;">出海準備</h2>
  <div class="tao-stripe" style="margin:14px auto;"></div>
  <div id="setup-progress" class="pxfont" style="text-align:center; color:var(--sun); font-size:11px; letter-spacing:2px;">STEP 1 / 3</div>

  <!-- 步驟 1：模式・人數・名稱 -->
  <div class="setup-step active" id="setup-step-1">
    <div class="setup-h">① 遊戲模式</div>
    <div class="opt-row" id="opt-mode">
      <button class="opt sel" data-v="ai">🤖 我 vs 電腦</button>
      <button class="opt" data-v="hotseat">👥 多人同樂（留空由電腦代打）</button>
    </div>
    <div class="setup-h">② 玩家人數（含你）</div>
    <div class="opt-row" id="opt-count">
      <button class="opt" data-v="3">3 人</button>
      <button class="opt sel" data-v="4">4 人</button>
      <button class="opt" data-v="5">5 人</button>
    </div>
    <div class="setup-h">③ 玩家名稱</div>
    <div id="name-inputs"></div>
    <p class="hint" id="name-hint">輸入你的名字，會顯示在岸上的小人腳下。</p>
  </div>

  <!-- 步驟 2：選擇釣場 -->
  <div class="setup-step" id="setup-step-2">
    <div class="setup-h">選擇釣魚場地</div>
    <p class="hint" style="margin-top:0;">蘭嶼沿岸 15 個釣場，看圖與描述自行判斷海象——平靜的港灣好上手，湧浪與急流之處藏著更大的回報。</p>
    <div id="site-list"></div>
  </div>

  <!-- 步驟 3：選擇角色 -->
  <div class="setup-step" id="setup-step-3">
    <div class="setup-h">選擇你的角色</div>
    <div id="role-list"></div>
    <p class="hint">其他玩家角色將自動分配。魚牌面朝下放置，釣起來才會揭曉；但深水區較容易藏著 ilek、cilat、acyod、tapez 等目標魚。</p>
  </div>

  <div id="setup-nav" style="display:flex; justify-content:center; gap:14px; margin-top:26px;">
    <button class="pixel-btn blue" id="btn-setup-back" style="visibility:hidden;">◀ 上一步</button>
    <button class="pixel-btn red" id="btn-setup-next" style="font-size:18px;">下一步 ▶</button>
  </div>
</div>

<!-- ================= 遊戲 ================= -->
<div class="screen" id="screen-game">
  <div class="topbar">
    <div class="round-chip pxfont">R<span id="ui-round">1</span>/<span id="ui-rounds-total">15</span></div>
    <div class="goalwrap">
      <div class="goalbar"><i id="ui-goalfill"></i><span id="ui-goaltext">全體漁獲 0 / 21</span></div>
    </div>
    <button class="iconbtn" id="btn-mute" title="音效開關">🔊</button>
    <button class="iconbtn" id="btn-help" title="規則">📖</button>
  </div>

  <div id="board-wrap">
    <canvas id="sea-canvas" width="720" height="480"></canvas>
  </div>

  <div id="players-row"></div>

  <div class="pixel-panel" id="pool-panel">
    <div class="pool-h">🧺 部落漁獲 <span id="pool-count" class="pxfont"></span></div>
    <div id="pool-fish"></div>
  </div>

  <div class="pixel-panel" id="log"></div>

  <div id="action-panel">
    <div id="turn-banner">—</div>
    <div id="action-btns"></div>
  </div>
</div>

<!-- ================= 結算 ================= -->
<div class="screen" id="screen-end">
  <div class="pxfont" style="color:var(--sun); font-size:11px;">GAME RESULT</div>
  <h2 class="end-title" id="end-title">結算</h2>
  <div class="tao-stripe" style="margin:12px auto;"></div>
  <div class="pixel-panel" style="padding:12px; font-size:14px;" id="end-collective"></div>
  <div id="end-share" class="hint" style="text-align:left; margin-top:10px;"></div>
  <div id="end-players"></div>
  <div style="margin-top:26px;">
    <button class="pixel-btn red" id="btn-again" style="font-size:16px;">🔁 再玩一次</button>
  </div>
</div>

<!-- ================= 覆蓋層 ================= -->
<div class="overlay" id="ov-card">
  <div class="flipcard" id="flipcard">
    <div class="inner">
      <div class="cardface cardback"><div class="bk" id="cardback-icon">🎣</div><div class="pxfont" style="color:#fff; font-size:10px;" id="cardback-label">ACTION</div></div>
      <div class="cardface cardfront" id="cardfront">
        <canvas id="c-anim" width="230" height="120" style="display:none; border:3px solid var(--tao-black); image-rendering:pixelated; box-shadow:0 4px 0 rgba(0,0,0,.4);"></canvas>
        <div class="card-emoji" id="c-emoji"></div>
        <div class="card-title" id="c-title"></div>
        <div class="card-desc" id="c-desc"></div>
        <div class="card-flavor" id="c-flavor"></div>
      </div>
    </div>
  </div>
  <button class="pixel-btn" id="btn-card-ok">繼續</button>
</div>

<div class="overlay" id="ov-dice">
  <div id="dice-box">
    <div style="font-size:16px; font-weight:900;" id="dice-title">拉竿判定！</div>
    <div id="dice-need"></div>
    <div id="dice-fish" style="display:none; align-items:center; gap:8px; background:rgba(11,22,38,.85); border:3px solid var(--panel-edge); padding:6px 12px; font-size:16px; font-weight:900; color:var(--sun);"></div>
    <canvas id="fight-canvas" width="400" height="180"></canvas>
    <div class="die" id="die"><div class="pips" id="pips"></div></div>
    <div id="dice-result"></div>
    <button class="pixel-btn red" id="btn-roll">🎲 擲骰子</button>
  </div>
</div>

<div class="overlay" id="ov-catch">
  <div style="font-size:20px; font-weight:900; color:var(--sun); margin-bottom:14px;" id="catch-title">上鉤了！</div>
  <div id="catch-fish-show"></div>
  <button class="pixel-btn" id="btn-catch-ok">收進魚簍 🧺</button>
</div>

<div class="overlay" id="ov-help">
  <div class="pixel-panel" style="max-width:520px; max-height:80vh; overflow-y:auto; padding:20px; text-align:left; font-size:15px; line-height:1.95;">
    <div style="font-size:18px; font-weight:900; color:var(--sun);">📖 規則速查</div>
    <p>・輪到你時，用 <b>◀▶ 或方向鍵</b>在礁岩上自由走動，<b>直接點擊海面</b>就會朝那個位置甩竿（落點有些微誤差）。</p>
    <p>・釣線落在越<b>遠（外海）</b>的水域，越可能藏著珍稀魚，但拉竿判定也越難；近岸容易上魚、多是常見魚。你不會知道確切點位，憑手感與魚影判斷吧。</p>
    <p>・流程：<b>走位 → 點海面甩竿 → 命運卡 → 拉竿卡 → 依魚的捕獲條件判定 → 取魚</b>。</p>
    <p>・海面上只看得到<b>魚影</b>（影子數量 = 剩餘魚牌數），釣起來之前不知道是什麼魚！但耆老佈陣有規律 — <b>越深的點位（4–6 號）越容易藏著 ilek、cilat、acyod、tapez 等珍稀魚</b>，淺點位多是常見魚。</p>
    <p>・每個釣場有自己的<b>判定方式與魚群分佈</b>：平靜的港灣判定寬鬆、魚也多；湧浪急流之處判定嚴苛、部分水域甚至沒有魚，但珍稀魚更集中。從場地的畫面與描述判斷海象吧。</p>
    <p>・上鉤後依<b>魚的難度</b>判定，比較方式看場地：平穩海域需骰 <b>≥ 難度</b>（難度 1 自動捕獲）、險惡海域需骰 <b>&gt; 難度</b>。魚越珍稀（難度 5 如 ilek/cilat）越難拉起。</p>
    <p>・<b>雙鉤中魚</b>：可拉 2 條、每條各自判定；水域不足時啟動「鄰近遞補」。</p>
    <p>・<b>吞鉤</b>：穩拿 1 條但下回合休息。<b>釣到地球</b>：失敗且下回合休息。<b>纏線</b>：與岸上離你最近的玩家纏線，擲骰未達 3 兩人一起休息。</p>
    <p>・每回合結束，<b>大自然自行變化</b>：可能風平浪靜、海鰻上岸偷魚、漲退潮讓魚群移動、大浪逼你單腳站穩、水窪的魚奮力逃脫⋯⋯（最終回合除外）。</p>
    <p>・終局：全體漁獲 ≥ <b>21</b> 條為集體勝利；結算時依達悟分享精神<b>互相分魚</b>，幫助更多族人完成任務。</p>
    <div style="text-align:center; margin-top:12px;"><button class="pixel-btn small" id="btn-help-close">關閉</button></div>
  </div>
</div>

<div class="overlay" id="ov-intro">
  <div id="intro-stage">
    <canvas id="intro-canvas" width="560" height="330"></canvas>
    <div id="intro-textbox"></div>
    <div id="intro-next">▼ 點擊繼續</div>
    <button class="pixel-btn small blue" id="btn-intro-skip">跳過 ≫</button>
  </div>
</div>

<div class="overlay" id="ov-share">
  <div style="font-size:18px; font-weight:900; color:var(--sun); letter-spacing:3px; margin-bottom:10px;">🧓 耆老分魚</div>
  <canvas id="share-canvas" width="560" height="300" style="width:min(560px,94vw); height:auto; border:var(--px) solid var(--tao-black); box-shadow:0 8px 0 rgba(0,0,0,.5); image-rendering:pixelated;"></canvas>
  <div class="pixel-panel" id="share-text" style="width:min(560px,94vw); margin-top:12px; padding:14px 16px; min-height:86px; text-align:left; font-size:14.5px; line-height:1.9;"></div>
  <div id="share-next" style="color:var(--sea-foam); font-size:12px; margin-top:8px; animation:blink 1.2s steps(2) infinite;">▼ 點擊畫面繼續</div>
  <div style="margin-top:12px;"><button class="pixel-btn small blue" id="btn-share-skip">跳過 ≫</button></div>
</div>

<div class="overlay" id="ov-toast" style="background:rgba(3,10,20,.6);">
  <div class="pixel-panel" style="padding:22px 28px; font-size:18px; font-weight:900;" id="toast-text"></div>
</div>

<script type="module" src="{{ asset('game/game.js') }}"></script>
</body>
</html>
