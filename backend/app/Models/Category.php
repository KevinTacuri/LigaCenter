<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\HasMany;

class Category extends Model
{

    protected $fillable = [
        'name',
        'age_range',
    ];

    public function teams(): HasMany
    {
        return $this->hasMany(Team::class);
    }
}