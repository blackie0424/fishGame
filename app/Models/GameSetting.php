<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class GameSetting extends Model
{
    protected $guarded = [];
    protected $casts = ['value' => 'array'];

    public static function val(string $key, $default = null)
    {
        return static::where('key', $key)->value('value') ?? $default;
    }
}
