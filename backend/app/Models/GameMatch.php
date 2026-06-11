<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\SoftDeletes;

class GameMatch extends Model
{
    use SoftDeletes;

    protected $table = 'matches';

    protected $appends = [
        'local_team_id',
        'visitor_team_id',
    ];

    protected $fillable = [
        'venue_id',
        'discipline_id',
        'category_id',
        'home_team_id',
        'away_team_id',
        'match_date',
        'match_time',
        'round',
        'status',
        'championship_id',
    ];

    protected $casts = [
        'match_date' => 'date',
        'match_time' => 'string',
    ];

    // Accesores y mutadores para compatibilidad con código que use local_team_id y visitor_team_id
    public function getLocalTeamIdAttribute()
    {
        return $this->attributes['home_team_id'] ?? null;
    }

    public function setLocalTeamIdAttribute($value)
    {
        $this->attributes['home_team_id'] = $value;
    }

    public function getVisitorTeamIdAttribute()
    {
        return $this->attributes['away_team_id'] ?? null;
    }

    public function setVisitorTeamIdAttribute($value)
    {
        $this->attributes['away_team_id'] = $value;
    }

    public function venue()
    {
        return $this->belongsTo(Venue::class);
    }

    public function discipline()
    {
        return $this->belongsTo(Discipline::class);
    }

    public function category()
    {
        return $this->belongsTo(Category::class);
    }

    public function localTeam()
    {
        return $this->belongsTo(Team::class, 'home_team_id');
    }

    public function visitorTeam()
    {
        return $this->belongsTo(Team::class, 'away_team_id');
    }

    public function report()
    {
        return $this->hasOne(MatchReport::class, 'match_id');
    }

    public function incidences()
    {
        return $this->hasMany(MatchIncidence::class);
    }

    public function championship()
    {
        return $this->belongsTo(Championship::class);
    }
}