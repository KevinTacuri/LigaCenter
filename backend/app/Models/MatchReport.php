<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class MatchReport extends Model
{
    protected $appends = [
        'local_score',
        'visitor_score',
    ];

    protected $fillable = [
        'match_id',
        'home_score',
        'away_score',
        'referee_signature',
        'delegate_signature',
        'official_pdf_url',
        'observations',
        'is_locked',
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
    ];

    protected $casts = [
        'is_locked' => 'boolean',
    ];

    public function getLocalScoreAttribute()
    {
        if ($this->sport_type === 'voley') {
            $sets = [
                $this->set1_home > $this->set1_away ? 1 : 0,
                $this->set2_home > $this->set2_away ? 1 : 0,
                $this->set3_home > $this->set3_away ? 1 : 0,
                $this->set4_home > $this->set4_away ? 1 : 0,
                $this->set5_home > $this->set5_away ? 1 : 0,
            ];
            return array_sum($sets);
        }
        return $this->attributes['home_score'] ?? 0;
    }

    public function setLocalScoreAttribute($value)
    {
        $this->attributes['home_score'] = $value;
    }

    public function getVisitorScoreAttribute()
    {
        if ($this->sport_type === 'voley') {
            $sets = [
                $this->set1_away > $this->set1_home ? 1 : 0,
                $this->set2_away > $this->set2_home ? 1 : 0,
                $this->set3_away > $this->set3_home ? 1 : 0,
                $this->set4_away > $this->set4_home ? 1 : 0,
                $this->set5_away > $this->set5_home ? 1 : 0,
            ];
            return array_sum($sets);
        }
        return $this->attributes['away_score'] ?? 0;
    }

    public function setVisitorScoreAttribute($value)
    {
        $this->attributes['away_score'] = $value;
    }

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

    public function match()
    {
        return $this->belongsTo(GameMatch::class, 'match_id');
    }
}