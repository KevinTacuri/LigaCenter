<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class Group extends Model
{
    protected $fillable = [
        'championship_id',
        'category_id',
        'name',
        'position',
    ];

    public function championship()
    {
        return $this->belongsTo(Championship::class);
    }

    public function category()
    {
        return $this->belongsTo(Category::class);
    }

    public function teams()
    {
        return $this->belongsToMany(Team::class, 'group_teams')
            ->withPivot('points', 'goals_for', 'goals_against', 'matches_played', 'wins', 'draws', 'losses')
            ->withTimestamps();
    }

    public function matches()
    {
        return $this->hasMany(GameMatch::class);
    }
}