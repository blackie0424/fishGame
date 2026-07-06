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
          <button type="button" id="fish-selftest-btn" style="margin-top:8px;">測試 AI 連線</button>
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

  // 測試 AI 連線：不需圖片，直接驗證「主機 → Gemini」的金鑰與模型
  document.getElementById('fish-selftest-btn').addEventListener('click', function () {
    const status = document.getElementById('fish-analyze-status');
    const st = document.getElementById('fish-selftest-btn');
    st.disabled = true;
    status.textContent = '測試 AI 連線中…';
    status.style.color = '#666';
    const fd = new FormData();
    fd.append('_token', '{{ csrf_token() }}');
    fetch('{{ route('admin.fish.selftest') }}', {
      method: 'POST', headers: { Accept: 'application/json' }, body: fd,
    })
      .then(function (res) { return res.json(); })
      .then(function (data) {
        if (data.ok) { status.textContent = '✓ AI 連線正常（回覆：' + data.reply + '）'; status.style.color = '#060'; }
        else { status.textContent = data.error || data.message || '測試失敗'; status.style.color = '#c00'; }
      })
      .catch(function (err) {
        status.textContent = '測試失敗：' + (err && err.message ? err.message : '連線中斷');
        status.style.color = '#c00';
      })
      .finally(function () { st.disabled = false; });
  });

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

    // 一律經 canvas 重新編碼成新 Blob：
    // 1) 縮圖避免超過 PHP 上傳限制；2) 避開 iOS「相簿檔案上傳中途失效 → Load failed」的怪癖
    function compressImage(file) {
      return new Promise(function (resolve, reject) {
        const img = new Image();
        img.onload = function () {
          const MAX = 1024;
          const scale = Math.min(1, MAX / Math.max(img.width, img.height));
          const cv = document.createElement('canvas');
          cv.width = Math.round(img.width * scale);
          cv.height = Math.round(img.height * scale);
          cv.getContext('2d').drawImage(img, 0, 0, cv.width, cv.height);
          cv.toBlob(function (b) {
            if (b) resolve(b);
            else reject(new Error('圖片轉檔失敗，請改用 jpg/png 檔重試'));
          }, 'image/jpeg', 0.85);
          URL.revokeObjectURL(img.src);
        };
        img.onerror = function () { reject(new Error('無法讀取這張圖片（格式不支援或檔案已失效），請重新選擇')); };
        img.src = URL.createObjectURL(file);
      });
    }

    btn.disabled = true;
    status.textContent = '檢查登入狀態…';
    status.style.color = '#666';

    // 先輕量確認 session 未過期，避免大檔上傳到一半被斷線（Safari 只會顯示 Load failed）
    fetch('{{ route('admin.ping') }}', { headers: { Accept: 'application/json' } })
      .then(function (res) {
        if (res.status === 401) throw new Error('後台登入已逾時，請重新整理頁面並重新登入');
        if (!res.ok) throw new Error('伺服器暫時無回應（HTTP ' + res.status + '）');
        status.textContent = '壓縮圖片中…';
        return compressImage(fileInput.files[0]);
      })
      .then(function (blob) {
        const formData = new FormData();
        formData.append('image', blob, 'fish.jpg');
        formData.append('description', descInput.value);
        formData.append('_token', '{{ csrf_token() }}');
        status.textContent = '分析中…（約 5–15 秒）';
        return fetch('{{ route('admin.fish.analyze') }}', {
          method: 'POST',
          headers: { Accept: 'application/json' },
          body: formData,
        });
      })
      .then(function (res) {
        return res.text().then(function (t) {
          try { return JSON.parse(t); }
          catch (e) {
            // 非 JSON（登入逾時被轉址、代理錯誤頁、防火牆頁…）→ 顯示真實狀態
            throw new Error('HTTP ' + res.status +
              (res.redirected ? '，被轉址到 ' + res.url : '') +
              '：' + t.replace(/<[^>]*>/g, ' ').trim().slice(0, 120));
          }
        });
      })
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
      .catch(function (err) {
        var msg = err && err.message ? err.message : '連線中斷，請重試。';
        if (msg === 'Load failed' || msg === 'Failed to fetch') {
          msg = '連線在上傳途中被中斷（常見原因：登入逾時或網路不穩）。請重新整理頁面、重新登入後再試一次。';
        }
        status.textContent = '請求失敗：' + msg;
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
