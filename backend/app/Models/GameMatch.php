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
        'phase',
        'group_id',
        'status',
        'championship_id',
        'home_score',
        'away_score',
        'current_elapsed_time',
        'current_period',
        'timer_status',
        'timer_started_at',
        'parent_home_match_id',
        'parent_away_match_id',
        'placeholder_text_home',
        'placeholder_text_away',
        'extra_time_minutes',
        'has_extra_time',
        'max_extra_time',
        'score_data',
    ];

    protected $casts = [
        'match_date' => 'date',
        'match_time' => 'string',
        'home_score' => 'integer',
        'away_score' => 'integer',
        'current_elapsed_time' => 'integer',
        'current_period' => 'integer',
        'timer_started_at' => 'datetime',
        'score_data' => 'array',
    ];

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
        return $this->belongsTo(ChampionshipTeam::class, 'home_team_id');
    }

    public function visitorTeam()
    {
        return $this->belongsTo(ChampionshipTeam::class, 'away_team_id');
    }

    public function report()
    {
        return $this->hasOne(MatchReport::class, 'match_id');
    }

    public function incidences()
    {
        return $this->hasMany(MatchIncidence::class, 'match_id');
    }

    public function championship()
    {
        return $this->belongsTo(Championship::class);
    }

    public function group()
    {
        return $this->belongsTo(Group::class);
    }

    public function toJson($options = 0)
    {
        $data = $this->toArray();
        $data['current_elapsed_time'] = $this->current_elapsed_time;
        $data['current_period'] = $this->current_period;
        $data['timer_status'] = $this->timer_status;
        $data['timer_started_at'] = $this->timer_started_at;
        
        return json_encode($data, $options);
    }
}