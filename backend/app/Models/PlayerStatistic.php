<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class PlayerStatistic extends Model
{
    protected $table = 'player_statistics';

    protected $fillable = [
        'player_id',
        'team_id',
        'discipline_id',
        'category_id',
        'championship_id',
        'discipline_statistic_id',
        'value',    
        #'goals',
        #'yellow_cards',
        #'red_cards',
        #'matches_played',
    ];

    protected $casts = [
        'value' => 'integer',
    ];

    public function player()
    {
        return $this->belongsTo(Player::class);
    }

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

    public function championship()
    {
        return $this->belongsTo(Championship::class);
    }

    public function disciplineStatistic()
    {
        return $this->belongsTo(DisciplineStatistic::class, 'discipline_statistic_id');
    }
}