<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class GroupTeam extends Model
{
    protected $table = 'group_teams';

    protected $fillable = [
        'group_id',
        'championship_team_id',
        'points',
        'goals_for',
        'goals_against',
        'matches_played',
        'wins',
        'draws',
        'losses',
    ];

    protected $casts = [
        'points' => 'integer',
        'goals_for' => 'integer',
        'goals_against' => 'integer',
        'matches_played' => 'integer',
        'wins' => 'integer',
        'draws' => 'integer',
        'losses' => 'integer',
    ];

    public function group()
    {
        return $this->belongsTo(Group::class);
    }

    public function team()
    {
        return $this->belongsTo(ChampionshipTeam::class);
    }
}