<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\SoftDeletes;

class MatchIncidence extends Model
{
    use SoftDeletes;

    protected $fillable = [
        'match_id',
        'championship_player_id',
        'championship_team_id',
        'type',
        'incidence_type',
        'minute',
        'second',
        'description',
        'created_by_user_id',
    ];

    protected $appends = ['incidence_type'];

    public function getIncidenceTypeAttribute()
    {
        return $this->attributes['type'] ?? null;
    }

    public function setIncidenceTypeAttribute($value)
    {
        $this->attributes['type'] = $value;
    }

    public function match()
    {
        return $this->belongsTo(GameMatch::class, 'match_id');
    }

    public function player()
    {
        return $this->belongsTo(ChampionshipPlayer::class, 'championship_player_id');
    }

    public function team()
    {
        return $this->belongsTo(ChampionshipTeam::class, 'championship_team_id');
    }

    public function createdBy()
    {
        return $this->belongsTo(User::class, 'created_by_user_id');
    }
}