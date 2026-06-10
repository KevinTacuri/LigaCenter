<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\SoftDeletes;

class Player extends Model
{
    use SoftDeletes;

    protected $fillable = [
        'team_id',
        'full_name',
        'dni',
        'college_id',
        'age',
        'is_eligible',
        'total_goals',
        'total_yellow_cards',
        'total_red_cards',
        'total_matches_played',
    ];

    protected $casts = [
        'is_eligible' => 'boolean',
        'age' => 'integer',
        'total_goals' => 'integer',
        'total_yellow_cards' => 'integer',
        'total_red_cards' => 'integer',
        'total_matches_played' => 'integer',
    ];

    public function team()
    {
        return $this->belongsTo(Team::class);
    }

    public function statistics()
    {
        return $this->hasMany(PlayerStatistic::class);
    }

    public function getTotalGoalsAttribute($value)
    {
        return $value ?? 0;
    }

    public function getTotalYellowCardsAttribute($value)
    {
        return $value ?? 0;
    }

    public function getTotalRedCardsAttribute($value)
    {
        return $value ?? 0;
    }

    public function getTotalMatchesPlayedAttribute($value)
    {
        return $value ?? 0;
    }
}