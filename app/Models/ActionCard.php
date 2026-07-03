<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class ActionCard extends Model
{
    protected $guarded = [];
    protected $casts = ['hooked' => 'array', 'enabled' => 'boolean'];
}
