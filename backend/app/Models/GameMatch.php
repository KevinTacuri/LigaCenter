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
        'discipline',
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
        'elapsed_time',
        'clock_status',
        'current_period',
        'clock_last_updated',
        'sport_type',
        'set1_home', 'set1_away',
        'set2_home', 'set2_away',
        'set3_home', 'set3_away',
        'set4_home', 'set4_away',
        'set5_home', 'set5_away',
        'quarter1_home', 'quarter1_away',
        'quarter2_home', 'quarter2_away',
        'quarter3_home', 'quarter3_away',
        'quarter4_home', 'quarter4_away',
        'overtime_home', 'overtime_away',
        'current_period_score_home',
        'current_period_score_away',
        'is_period_finished',
    ];

    protected $casts = [
        'match_date' => 'date',
        'match_time' => 'string',
        'home_score' => 'integer',
        'away_score' => 'integer',
        'elapsed_time' => 'integer',
        'current_period' => 'integer',
        'clock_last_updated' => 'datetime',
        'is_period_finished' => 'boolean',
    ];

    // Getters para cada set/cuarto
    public function getSetsAttribute(): array
    {
        return [
            'set1' => ['home' => $this->set1_home, 'away' => $this->set1_away],
            'set2' => ['home' => $this->set2_home, 'away' => $this->set2_away],
            'set3' => ['home' => $this->set3_home, 'away' => $this->set3_away],
            'set4' => ['home' => $this->set4_home, 'away' => $this->set4_away],
            'set5' => ['home' => $this->set5_home, 'away' => $this->set5_away],
        ];
    }

    public function getQuartersAttribute(): array
    {
        return [
            'quarter1' => ['home' => $this->quarter1_home, 'away' => $this->quarter1_away],
            'quarter2' => ['home' => $this->quarter2_home, 'away' => $this->quarter2_away],
            'quarter3' => ['home' => $this->quarter3_home, 'away' => $this->quarter3_away],
            'quarter4' => ['home' => $this->quarter4_home, 'away' => $this->quarter4_away],
            'overtime' => ['home' => $this->overtime_home, 'away' => $this->overtime_away],
        ];
    }

    public function getTotalHomeScoreAttribute(): int
    {
        if ($this->sport_type === 'voley') {
            return collect($this->sets)->filter(fn($s) => $s['home'] > $s['away'])->count();
        }
        return $this->home_score ?? 0;
    }

    public function getTotalAwayScoreAttribute(): int
    {
        if ($this->sport_type === 'voley') {
            return collect($this->sets)->filter(fn($s) => $s['away'] > $s['home'])->count();
        }
        return $this->away_score ?? 0;
    }

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

    public function getDisciplineAttribute()
    {
        if ($this->relationLoaded('discipline') && $this->discipline) {
            return $this->discipline;
        }
        return $this->category?->championshipDiscipline?->discipline;
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
}