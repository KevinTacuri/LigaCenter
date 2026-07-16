<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class Standing extends Model
{
    public $timestamps = false;

    protected $fillable = [
        'team_id',
        'category_id',
        'championship_id',
        'matches_played',
        'points',
        'wins',
        'draws',
        'losses',
        'goals_for',
        'goals_against',
        'goal_difference',
        'wins_total',
        'losses_total',
        'sets_for',
        'sets_against',
        'sets_ratio',
        'points_for',
        'points_against',
        'points_ratio',
        'win_percentage',
        'games_behind',
        'streak',
        'last_updated',
    ];

    protected $casts = [
        'last_updated' => 'datetime',
        'sets_ratio' => 'float',
        'points_ratio' => 'float',
        'win_percentage' => 'float',
        'games_behind' => 'float',
    ];

    public function team()
    {
        return $this->belongsTo(Team::class);
    }

    public function category()
    {
        return $this->belongsTo(Category::class);
    }

    public function championship()
    {
        return $this->belongsTo(Championship::class);
    }

    public function getDisciplineIdAttribute()
    {
        return $this->category?->championshipDiscipline?->discipline_id;
    }

    public function getDisciplineAttribute()
    {
        return $this->category?->championshipDiscipline?->discipline;
    }
}