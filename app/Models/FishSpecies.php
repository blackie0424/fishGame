<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class FishSpecies extends Model
{
    protected $table = 'fish_species';
    protected $guarded = [];
    protected $casts = ['art' => 'array', 'enabled' => 'boolean'];
}
