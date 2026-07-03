<!doctype html>
<html lang="zh-TW">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<title>蘭嶼釣魚趣 後台</title>
<style>
:root{--bg:#0b1626;--edge:#223a5c;--sun:#f5c542;--red:#c1272d;--fg:#f2ede2;}
*{box-sizing:border-box;}
body{margin:0;background:#07203d;color:var(--fg);font-family:"Microsoft JhengHei","Noto Sans TC",sans-serif;}
a{color:var(--sun);text-decoration:none;}
header{display:flex;align-items:center;gap:16px;padding:12px 18px;background:#141210;border-bottom:3px solid var(--edge);}
header h1{font-size:18px;margin:0;letter-spacing:2px;}
nav{display:flex;flex-wrap:wrap;gap:8px;padding:10px 18px;background:var(--bg);border-bottom:3px solid var(--edge);}
nav a{padding:6px 12px;border:2px solid var(--edge);font-size:14px;font-weight:700;}
nav a.on{border-color:var(--sun);color:var(--sun);}
main{max-width:1080px;margin:0 auto;padding:18px;}
table{width:100%;border-collapse:collapse;font-size:14px;}
th,td{border:2px solid var(--edge);padding:8px 10px;text-align:left;vertical-align:top;}
th{background:var(--bg);color:var(--sun);}
tr:nth-child(even) td{background:rgba(11,22,38,.5);}
.btn{display:inline-block;padding:8px 14px;background:var(--sun);color:#141210;font-weight:900;border:none;cursor:pointer;font-size:14px;}
.btn.red{background:var(--red);color:#fff;}
.btn.sm{padding:4px 10px;font-size:12.5px;}
input[type=text],input[type=number],textarea,select{width:100%;background:var(--bg);border:2px solid var(--edge);color:#fff;padding:9px 10px;font-size:15px;font-family:inherit;}
textarea{min-height:90px;font-family:ui-monospace,monospace;}
label{display:block;font-weight:800;margin:14px 0 6px;color:#cfe3f2;}
.ok{background:#14532d;border:2px solid #4cd17e;padding:10px 14px;margin-bottom:14px;}
.err{background:#5c1212;border:2px solid #ff5d5d;padding:10px 14px;margin-bottom:14px;}
.badge{display:inline-block;padding:1px 8px;border:2px solid var(--edge);font-size:12px;}
.badge.on{border-color:#4cd17e;color:#4cd17e;}
.badge.off{border-color:#ff5d5d;color:#ff5d5d;}
code{color:#8fd3e8;word-break:break-all;}
</style>
</head>
<body>
<header>
  <h1>🌊 蘭嶼釣魚趣 · 後台管理</h1>
  <div style="margin-left:auto;display:flex;gap:12px;align-items:center;">
    <a href="{{ route('game') }}" target="_blank">▶ 開啟遊戲</a>
    <form method="post" action="{{ route('admin.logout') }}">@csrf<button class="btn sm red">登出</button></form>
  </div>
</header>
<nav>
  <a href="{{ route('admin.dashboard') }}" class="{{ request()->routeIs('admin.dashboard')?'on':'' }}">總覽</a>
  @foreach(\App\Http\Controllers\Admin\AdminController::registry() as $key => $cfg)
    <a href="{{ route('admin.index',$key) }}" class="{{ request()->route('entity')===$key?'on':'' }}">{{ $cfg['label'] }}</a>
  @endforeach
</nav>
<main>
  @if(session('ok'))<div class="ok">{{ session('ok') }}</div>@endif
  @if($errors->any())<div class="err">{{ implode('、',$errors->all()) }}</div>@endif
  @yield('content')
</main>
</body>
</html>
