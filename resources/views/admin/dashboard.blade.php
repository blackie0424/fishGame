@extends('layouts.admin')
@section('content')
<h2>資料總覽</h2>
<table>
  <tr><th>項目</th><th>筆數</th></tr>
  @foreach($stats as $key => $s)
    <tr><td><a href="{{ route('admin.index',$key) }}">{{ $s['label'] }}</a></td><td>{{ $s['count'] }}</td></tr>
  @endforeach
</table>
<p style="color:#9fb8d8;font-size:14px;line-height:1.8;margin-top:16px;">
後台任何儲存／刪除都會自動清除遊戲設定快取，玩家重新整理遊戲頁即取得最新內容。<br>
命運卡與拉竿卡的三欄張數即為<b>各難度分級的牌組配比</b>（目前為勝率校準後的數值：低 ≥90%／中 75-85%／高 60-70%），調整前建議先記錄原值。
</p>
@endsection
