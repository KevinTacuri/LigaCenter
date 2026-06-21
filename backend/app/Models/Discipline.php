<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\HasMany;

class Discipline extends Model
{
    protected $fillable = [
        'name',
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

    # define the one-to-many relationship with ChampionshipDiscipline
    public function championshipDisciplines() 
    {
        return $this->hasMany(ChampionshipDiscipline::class);
    }

    # define the many-to-many relationship with Championship through the pivot table
    public function championships()
    {
        return $this->belongsToMany(
            Championship::class,
            'championship_disciplines'
        );
    }
}