@extends('layouts.admin')
@section('content')
<h2>{{ $row->exists ? '編輯' : '新增' }}：{{ $cfg['label'] }}</h2>
<form method="post" action="{{ route('admin.save',[$entity,$row->id]) }}" style="max-width:680px;">
  @csrf
  @foreach($cfg['fields'] as $name => $f)
    <label>{{ $f['label'] }}</label>
    @php($val = old($name, $row->exists ? $row->$name : null))
    @if($f['type']==='bool')
      <select name="{{ $name }}">
        <option value="1" @selected($val ?? true)>啟用</option>
        <option value="0" @selected(!($val ?? true))>停用</option>
      </select>
    @elseif($f['type']==='select')
      <select name="{{ $name }}">
        @foreach($f['options'] as $k => $label)
          <option value="{{ $k }}" @selected($val===$k)>{{ $label }}（{{ $k }}）</option>
        @endforeach
      </select>
    @elseif($f['type']==='json')
      <textarea name="{{ $name }}">{{ is_string($val)?$val:(is_null($val)?'':json_encode($val, JSON_UNESCAPED_UNICODE|JSON_PRETTY_PRINT)) }}</textarea>
    @elseif($f['type']==='number')
      <input type="number" step="any" name="{{ $name }}" value="{{ $val }}">
    @else
      <input type="text" name="{{ $name }}" value="{{ $val }}">
    @endif
  @endforeach
  <div style="margin-top:20px;display:flex;gap:12px;">
    <button class="btn">儲存</button>
    <a class="btn red" href="{{ route('admin.index',$entity) }}">取消</a>
  </div>
</form>
@endsection
