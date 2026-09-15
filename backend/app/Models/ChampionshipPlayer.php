<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class ChampionshipPlayer extends Model
{
    protected $fillable = [
        'championship_team_id',
        'player_id',
        'jersey_number',
        'position',
        'is_captain'
    ];

    protected $casts = [
        'is_captain' => 'boolean',
    ];

    public function championshipTeam(): BelongsTo
    {
        return $this->belongsTo(ChampionshipTeam::class);
    }

    public function player(): BelongsTo
    {
        return $this->belongsTo(Player::class);
    }
}