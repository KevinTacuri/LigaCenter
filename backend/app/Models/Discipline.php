<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\HasMany;

class Discipline extends Model
{
    protected $fillable = [
        'name',
        'specific_rules',
    ];

    public function teams()
    {
        return $this->hasManyThrough(Team::class, Category::class);
    }

    public function categories(): HasMany
    {
        return $this->hasMany(Category::class);
    }

    public function statistics(): HasMany
    {
        return $this->hasMany(DisciplineStatistic::class)
            ->with('statisticType')
            ->orderBy('order');
    }
}