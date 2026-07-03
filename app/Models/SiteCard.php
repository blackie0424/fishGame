<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class SiteCard extends Model
{
    protected $guarded = [];
    protected $casts = ['banned' => 'array', 'vis' => 'array', 'enabled' => 'boolean'];
}
