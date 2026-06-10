<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class Standing extends Model
{
    public $timestamps = false;

    protected $fillable = [
        'team_id',
        'discipline_id',
        'category_id',

        'matches_played',
        'matches_won',
        'matches_drawn',
        'matches_lost',

        'goals_for',
        'goals_against',
        'goal_difference',

        'total_points',
        'last_updated',
    ];

    protected $casts = [
        'last_updated' => 'datetime',
    ];

    public function team()
    {
        return $this->belongsTo(Team::class);
    }

    public function discipline()
    {
        return $this->belongsTo(Discipline::class);
    }

    public function category()
    {
        return $this->belongsTo(Category::class);
    }
}