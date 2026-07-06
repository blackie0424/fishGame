/* 後台「勝率試算」頁 — 在瀏覽器內跑整場模擬（simCore），
   資料經 applyServerConfig 套用 /api/game-config，與正式遊戲同一條路徑。 */
import { simulate } from './sim/simCore.js';
import { applyServerConfig } from './config/serverConfig.js';

const CFG = { rounds: 15, goal: 21, randomFishRatio: .35, bgmSpeedRound: 10,
              lowFishBias: 1.7, targetFishWeight: .35 };
const $ = s => document.querySelector(s);

let baseline = null;        // 現行設定的模擬結果快取
let baselineKey = '';

function currentWeights() {
  return { randomFishRatio: CFG.randomFishRatio, lowFishBias: CFG.lowFishBias, targetFishWeight: CFG.targetFishWeight };
}
function formParams() {
  const playerCounts = [3, 4, 5].filter(n => $(`#sim-p${n}`).checked);
  return {
    games: +$('#sim-games').value,
    rounds: +$('#sim-rounds').value,
    playerCounts: playerCounts.length ? playerCounts : [4],
    weights: {
      randomFishRatio: +$('#sim-random').value,
      lowFishBias: +$('#sim-bias').value,
      targetFishWeight: +$('#sim-tgtw').value,
    },
  };
}

function setProgress(txt) { $('#sim-progress').textContent = txt; }

function renderTable(base, prop) {
  const fmt = v => v.toFixed(1) + '%';
  const delta = d => {
    const s = (d > 0 ? '+' : '') + d.toFixed(1);
    const color = Math.abs(d) < 2 ? '#8fa3bd' : d < 0 ? '#ff8d5d' : '#4cd17e';
    return `<b style="color:${color}">${s}</b>`;
  };
  const rows = prop.map((r, i) => {
    const b = base[i];
    return `<tr>
      <td>${r.site}</td><td>${{ low: '低階', mid: '中階', high: '高階' }[r.tier]}</td><td>${r.n} 人</td>
      <td>${fmt(b.collective)}</td>
      <td><b>${fmt(r.collective)}</b></td>
      <td>${delta(r.collective - b.collective)}</td>
      <td>${fmt(r.allPersonal)}</td>
      <td>${r.avgCatch.toFixed(1)} / ${r.avgGoal.toFixed(1)}</td>
    </tr>`;
  }).join('');
  $('#sim-result').innerHTML = `<table>
    <tr><th>場地</th><th>層級</th><th>人數</th><th>現行勝率</th><th>試算勝率</th><th>差異</th><th>個人全達成</th><th>平均漁獲/目標</th></tr>
    ${rows}</table>`;
}

async function run() {
  const btn = $('#sim-run');
  btn.disabled = true;
  try {
    const p = formParams();
    const bKey = JSON.stringify({ g: p.games, pc: p.playerCounts,
      w: currentWeights(), r: CFG.rounds });
    if (!baseline || baselineKey !== bKey) {
      setProgress('計算現行設定基準線⋯');
      baseline = await simulate({ games: p.games, rounds: CFG.rounds, playerCounts: p.playerCounts,
        weights: currentWeights(),
        onProgress: (d, t) => setProgress(`基準線 ${d}/${t}`) });
      baselineKey = bKey;
    }
    const proposed = await simulate({ games: p.games, rounds: p.rounds, playerCounts: p.playerCounts,
      weights: p.weights,
      onProgress: (d, t) => setProgress(`試算中 ${d}/${t}`) });
    renderTable(baseline, proposed);
    setProgress(`完成：每格 ${p.games} 局。試算值僅為估計（±2~3%），確認後請至「遊戲設定」正式儲存。`);
  } catch (e) {
    setProgress('試算失敗：' + e.message);
  } finally {
    btn.disabled = false;
  }
}

async function init() {
  try {
    const res = await fetch('/api/game-config', { headers: { Accept: 'application/json' } });
    const ok = applyServerConfig(await res.json(), { cfgStore: CFG });
    $('#sim-src').textContent = ok ? '✓ 已載入線上後台設定（與遊戲同資料）' : '⚠ 後台設定載入失敗，使用內建預設值';
  } catch {
    $('#sim-src').textContent = '⚠ 後台設定載入失敗，使用內建預設值';
  }
  // 表單預設 = 現行設定
  $('#sim-rounds').value = CFG.rounds;
  $('#sim-random').value = CFG.randomFishRatio;
  $('#sim-bias').value = CFG.lowFishBias;
  $('#sim-tgtw').value = CFG.targetFishWeight;
  $('#sim-current').textContent =
    `現行：回合 ${CFG.rounds}、完全隨機比例 ${CFG.randomFishRatio}、低難度偏好 ${CFG.lowFishBias}、目標魚權重 ${CFG.targetFishWeight}`;
  $('#sim-run').onclick = run;
}
init();
