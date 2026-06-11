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
    ];

    protected $casts = [
        'is_locked' => 'boolean',
    ];

    // Accesores y mutadores para compatibilidad con local_score y visitor_score
    public function getLocalScoreAttribute()
    {
        return $this->attributes['home_score'] ?? null;
    }

    public function setLocalScoreAttribute($value)
    {
        $this->attributes['home_score'] = $value;
    }

    public function getVisitorScoreAttribute()
    {
        return $this->attributes['away_score'] ?? null;
    }

    public function setVisitorScoreAttribute($value)
    {
        $this->attributes['away_score'] = $value;
    }

    public function match()
    {
        return $this->belongsTo(GameMatch::class, 'match_id');
    }
}