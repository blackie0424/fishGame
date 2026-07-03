@extends('layouts.admin')
@section('content')
<div style="display:flex;align-items:center;gap:14px;margin-bottom:12px;">
  <h2 style="margin:0;">{{ $cfg['label'] }}</h2>
  <a class="btn sm" href="{{ route('admin.create',$entity) }}">＋ 新增</a>
</div>
<table>
  <tr>
    @foreach($cfg['fields'] as $name => $f)<th>{{ $f['label'] }}</th>@endforeach
    <th style="width:130px;">操作</th>
  </tr>
  @foreach($rows as $row)
  <tr>
    @foreach($cfg['fields'] as $name => $f)
      <td>
        @if($f['type']==='bool')
          <span class="badge {{ $row->$name?'on':'off' }}">{{ $row->$name?'啟用':'停用' }}</span>
        @elseif($f['type']==='json')
          <code>{{ is_null($row->$name)?'—':json_encode($row->$name, JSON_UNESCAPED_UNICODE) }}</code>
        @elseif($f['type']==='color')
          <span style="display:inline-block;width:16px;height:16px;background:{{ $row->$name }};border:2px solid #000;vertical-align:middle;"></span> {{ $row->$name }}
        @else
          {{ $row->$name }}
        @endif
      </td>
    @endforeach
    <td>
      <a class="btn sm" href="{{ route('admin.edit',[$entity,$row->id]) }}">編輯</a>
      <form method="post" action="{{ route('admin.delete',[$entity,$row->id]) }}" style="display:inline" onsubmit="return confirm('確定刪除？');">
        @csrf<button class="btn sm red">刪除</button>
      </form>
    </td>
  </tr>
  @endforeach
</table>
@endsection
