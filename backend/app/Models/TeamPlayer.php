<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class TeamPlayer extends Model
{
    protected $table = 'team_players';

    protected $fillable = [
        'team_id',
        'player_id',
        'jersey_number',
        'status',
    ];

    public function team()
    {
        return $this->belongsTo(Team::class);
    }

    public function player()
    {
        return $this->belongsTo(Player::class);
    }
}