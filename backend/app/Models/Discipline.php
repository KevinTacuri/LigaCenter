<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\HasMany;
use Illuminate\Database\Eloquent\SoftDeletes;

class Discipline extends Model
{
    use SoftDeletes;

    protected $fillable = [
        'name',
        'specific_rules',
    ];

    public function teams(): HasMany
    {
        return $this->hasMany(Team::class);
    }
}