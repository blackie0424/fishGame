@extends('layouts.admin')
@section('content')
<div style="max-width:380px;margin:60px auto;">
  <h2 style="letter-spacing:2px;">後台登入</h2>
  <form method="post" action="{{ route('admin.login.post') }}">
    @csrf
    <label>管理密碼（.env 的 ADMIN_PASSWORD）</label>
    <input type="text" name="password" autofocus>
    <div style="margin-top:16px;"><button class="btn">登入</button></div>
  </form>
</div>
@endsection
