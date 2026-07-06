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
      @if($entity==='fish' && $name==='art')
        <div style="border:1px solid #ccc;border-radius:6px;padding:12px;margin-bottom:8px;background:#f9f9f9;">
          <strong>AI 分析魚類照片</strong>
          <div style="margin-top:8px;">
            <label style="font-weight:normal;">上傳魚類圖片（jpg/png，最大 5MB）</label>
            <input type="file" id="fish-image-input" accept="image/*" style="display:block;margin-top:4px;">
          </div>
          <div style="margin-top:8px;">
            <label style="font-weight:normal;">補充說明（選填）</label>
            <textarea id="fish-image-desc" rows="2" maxlength="500" placeholder="如：背鰭明顯、有橫紋、尾鰭偏黃…" style="display:block;width:100%;margin-top:4px;"></textarea>
          </div>
          <button type="button" id="fish-analyze-btn" style="margin-top:8px;">AI 分析照片</button>
          <span id="fish-analyze-status" style="margin-left:8px;color:#666;font-size:0.9em;"></span>
        </div>
      @endif
      <textarea name="{{ $name }}" id="{{ $entity==='fish'&&$name==='art' ? 'fish-art-textarea' : '' }}">{{ is_string($val)?$val:(is_null($val)?'':json_encode($val, JSON_UNESCAPED_UNICODE|JSON_PRETTY_PRINT)) }}</textarea>
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
@push('scripts')
<script>
document.addEventListener('DOMContentLoaded', function () {
  const btn = document.getElementById('fish-analyze-btn');
  if (!btn) return;

  btn.addEventListener('click', function () {
    const fileInput = document.getElementById('fish-image-input');
    const descInput = document.getElementById('fish-image-desc');
    const status    = document.getElementById('fish-analyze-status');
    const textarea  = document.getElementById('fish-art-textarea');

    if (!fileInput.files[0]) {
      status.textContent = '請先選擇圖片。';
      status.style.color = '#c00';
      return;
    }

    // 瀏覽器端先縮圖（手機照片動輒 3-8MB，會超過 PHP 上傳限制導致「無法上傳」）
    function compressImage(file) {
      return new Promise(function (resolve) {
        if (file.size < 300 * 1024) return resolve(file);
        const img = new Image();
        img.onload = function () {
          const MAX = 1024;
          const scale = Math.min(1, MAX / Math.max(img.width, img.height));
          const cv = document.createElement('canvas');
          cv.width = Math.round(img.width * scale);
          cv.height = Math.round(img.height * scale);
          cv.getContext('2d').drawImage(img, 0, 0, cv.width, cv.height);
          cv.toBlob(function (b) { resolve(b || file); }, 'image/jpeg', 0.85);
          URL.revokeObjectURL(img.src);
        };
        img.onerror = function () { resolve(file); };
        img.src = URL.createObjectURL(file);
      });
    }

    btn.disabled = true;
    status.textContent = '壓縮圖片中…';
    status.style.color = '#666';

    compressImage(fileInput.files[0]).then(function (blob) {
      const formData = new FormData();
      formData.append('image', blob, 'fish.jpg');
      formData.append('description', descInput.value);
      formData.append('_token', '{{ csrf_token() }}');
      status.textContent = '分析中…';
      return fetch('{{ route('admin.fish.analyze') }}', {
        method: 'POST',
        headers: { Accept: 'application/json' },
        body: formData,
      });
    })
      .then(function (res) { return res.json(); })
      .then(function (data) {
        if (data.art) {
          textarea.value = JSON.stringify(data.art, null, 2);
          status.textContent = '分析完成，請確認並調整後儲存。';
          status.style.color = '#060';
        } else {
          status.textContent = data.error || data.message || '分析失敗，請重試。';
          status.style.color = '#c00';
        }
      })
      .catch(function () {
        status.textContent = '網路錯誤，請重試。';
        status.style.color = '#c00';
      })
      .finally(function () {
        btn.disabled = false;
      });
  });
});
</script>
@endpush
@endsection
