<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\SoftDeletes;

class Sanction extends Model
{
    use SoftDeletes;

    protected $appends = ['origin_match_id', 'duration'];

    protected $fillable = [
        'player_id',
        'match_id',
        'sanction_type',
        'reason',
        'start_date',
        'end_date',
        'matches_suspended',
        'status',
    ];

    protected $casts = [
        'start_date' => 'date',
        'end_date' => 'date',
        'matches_suspended' => 'integer',
    ];

    public function getOriginMatchIdAttribute()
    {
        return $this->match_id;
    }

    public function setOriginMatchIdAttribute($value)
    {
        $this->attributes['match_id'] = $value;
    }

    public function getDurationAttribute()
    {
        return $this->matches_suspended;
    }

    public function setDurationAttribute($value)
    {
        $this->attributes['matches_suspended'] = $value;
    }

    public function player()
    {
        return $this->belongsTo(Player::class);
    }

    public function match()
    {
        return $this->belongsTo(GameMatch::class, 'match_id');
    }
}