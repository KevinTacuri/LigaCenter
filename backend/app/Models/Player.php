<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\SoftDeletes;

class Player extends Model
{
    use SoftDeletes;

    protected $fillable = [
        'document_number',
        'names',
        'last_names',
        'birth_date',
        'gender',
        'photo',
        'total_goals',
        'total_yellow_cards',
        'total_red_cards',
        'total_matches_played',
    ];

    protected $casts = [
        'birth_date' => 'date',
        'total_goals' => 'integer',
        'total_yellow_cards' => 'integer',
        'total_red_cards' => 'integer',
        'total_matches_played' => 'integer',
    ];

    public function teams()
    {
        return $this->belongsToMany(Team::class, 'team_players')
            ->withPivot('jersey_number', 'status')
            ->withTimestamps();
    }

    public function team()
    {
        return $this->belongsToMany(Team::class, 'team_players')
            ->withPivot('jersey_number', 'status')
            ->withTimestamps()
            ->one();
    }

    public function statistics()
    {
        return $this->hasMany(PlayerStatistic::class);
    }

    public function sanctions()
    {
        return $this->hasMany(Sanction::class);
    }

    public function incidences()
    {
        return $this->hasMany(MatchIncidence::class);
    }

    public function getFullNameAttribute()
    {
        return $this->names . ' ' . $this->last_names;
    }
}