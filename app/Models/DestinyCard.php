<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class DestinyCard extends Model
{
    protected $guarded = [];
    protected $casts = ['enabled' => 'boolean'];
}
