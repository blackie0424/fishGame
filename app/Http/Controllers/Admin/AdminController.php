<?php

namespace App\Http\Controllers\Admin;

use App\Admin\EntityRegistry;
use App\Http\Controllers\Controller;
use App\Http\Controllers\GameConfigController;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Cache;

class AdminController extends Controller
{
    public function dashboard()
    {
        $stats = collect(EntityRegistry::all())->map(
            fn ($cfg, $key) => ['label' => $cfg['label'], 'count' => $cfg['model']::count()]
        );

        return view('admin.dashboard', compact('stats'));
    }

    public function index(string $entity)
    {
        $cfg = EntityRegistry::get($entity);
        $rows = $cfg['model']::orderBy($cfg['model'] === \App\Models\GameSetting::class ? 'id' : 'sort')->get();

        return view('admin.index', ['entity' => $entity, 'cfg' => $cfg, 'rows' => $rows]);
    }

    public function edit(string $entity, int $id = 0)
    {
        $cfg = EntityRegistry::get($entity);
        $row = $id ? $cfg['model']::findOrFail($id) : new $cfg['model']();

        return view('admin.edit', ['entity' => $entity, 'cfg' => $cfg, 'row' => $row]);
    }

    public function save(Request $request, string $entity, int $id = 0)
    {
        $cfg = EntityRegistry::get($entity);
        $rules = collect($cfg['fields'])
            ->filter(fn ($f) => isset($f['rules']))
            ->map(fn ($f) => $f['rules'])->all();
        $data = $request->validate($rules);

        foreach ($cfg['fields'] as $name => $f) {
            if ($f['type'] === 'bool') {
                $data[$name] = $request->boolean($name);
            } elseif ($f['type'] === 'json' && array_key_exists($name, $data)) {
                $data[$name] = $data[$name] === null || $data[$name] === '' ? null : json_decode($data[$name], true);
            }
        }

        $row = $id ? $cfg['model']::findOrFail($id) : new $cfg['model']();
        $row->fill($data)->save();

        Cache::forget(GameConfigController::CACHE_KEY);

        return redirect()->route('admin.index', $entity)->with('ok', '已儲存，遊戲端重新整理即生效。');
    }

    public function destroy(string $entity, int $id)
    {
        $cfg = EntityRegistry::get($entity);
        $cfg['model']::findOrFail($id)->delete();
        Cache::forget(GameConfigController::CACHE_KEY);

        return redirect()->route('admin.index', $entity)->with('ok', '已刪除。');
    }
}
