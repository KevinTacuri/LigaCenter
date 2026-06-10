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
        'tournament_id',
        'goals',
        'yellow_cards',
        'red_cards',
        'matches_played',
    ];

    protected $casts = [
        'goals' => 'integer',
        'yellow_cards' => 'integer',
        'red_cards' => 'integer',
        'matches_played' => 'integer',
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

    public function tournament()
    {
        return $this->belongsTo(Tournament::class);
    }
}