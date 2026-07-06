@extends('layouts.admin')

@section('content')
<h2 style="margin-top:0;">📊 勝率試算</h2>
<p style="color:#8fa3bd;font-size:13.5px;line-height:1.8;">
  在瀏覽器內以無頭模擬（每格數百局）估算參數調整對<b>每個場地集體勝率</b>的影響。
  資料來源與遊戲相同（後台現值），試算<b>不會</b>改動任何設定——確認滿意後再到「遊戲設定」正式儲存。<br>
  <span id="sim-src">載入設定中⋯</span>　<span id="sim-current"></span>
</p>

<div style="display:grid;grid-template-columns:repeat(auto-fit,minmax(180px,1fr));gap:14px;margin:14px 0;">
  <div><label for="sim-rounds">回合數（rounds）</label>
    <input type="number" id="sim-rounds" min="4" max="30" step="1"></div>
  <div><label for="sim-bias">低難度魚偏好（low_fish_bias，1=不偏好）</label>
    <input type="number" id="sim-bias" min="0.5" max="5" step="0.1"></div>
  <div><label for="sim-tgtw">目標魚權重（target_fish_weight，1=不減量）</label>
    <input type="number" id="sim-tgtw" min="0" max="1" step="0.05"></div>
  <div><label for="sim-random">完全隨機補魚比例（random_fish_ratio）</label>
    <input type="number" id="sim-random" min="0" max="1" step="0.05"></div>
  <div><label>模擬人數</label>
    <span style="display:flex;gap:14px;padding-top:8px;">
      <label style="margin:0;font-weight:400;"><input type="checkbox" id="sim-p3"> 3 人</label>
      <label style="margin:0;font-weight:400;"><input type="checkbox" id="sim-p4" checked> 4 人</label>
      <label style="margin:0;font-weight:400;"><input type="checkbox" id="sim-p5"> 5 人</label>
    </span></div>
  <div><label for="sim-games">每格模擬局數（多=準但慢）</label>
    <select id="sim-games">
      <option value="200">200（快速）</option>
      <option value="500" selected>500（建議）</option>
      <option value="1000">1000（精細）</option>
    </select></div>
</div>

<button class="btn" id="sim-run">▶ 開始試算</button>
<span id="sim-progress" style="margin-left:12px;color:#cfe3f2;font-size:13.5px;"></span>

<div id="sim-result" style="margin-top:16px;"></div>

<p style="color:#8fa3bd;font-size:12.5px;margin-top:14px;">
  說明：角色為隨機分配、全員採 AI 策略，結果為統計估計（每格 500 局約 ±2%）。
  「個人全達成」= 所有玩家同時完成家庭任務的比率。集體目標 = 參與角色最低需求加總
  （settings 的 collective_goal 已不再使用）。魚牌張數、場地魚量（board_total）等改動
  請先在對應後台頁儲存後重新整理本頁，即會納入試算基準。
</p>
@endsection

@push('scripts')
@vite('resources/game/simUI.js')
@endpush
