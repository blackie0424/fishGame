<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class Role extends Model
{
    protected $guarded = [];
    protected $casts = ['targets' => 'array', 'enabled' => 'boolean'];
}
