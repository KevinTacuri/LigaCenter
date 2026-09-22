<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class Championship extends Model
{
    protected $fillable = [
        'user_id',
        'name',
        'description',
        'type',
        'status',
        'settings',
        'start_date',
        'end_date',
        'is_public',
        'rules_pdf',
    ];

    protected $casts = [
        'settings' => 'array',
        'start_date' => 'date',
        'end_date' => 'date',
        'is_public' => 'boolean',
    ];

    public function owner()
    {
        return $this->belongsTo(User::class, 'user_id');
    }

    public function users()
    {
        return $this->belongsToMany(User::class, 'championship_users')
            ->withPivot('role', 'championship_team_id')
            ->withTimestamps();
    }

    public function categories()
    {
        return $this->hasMany(Category::class);
    }

    public function teams()
    {
        return $this->hasManyThrough(
            ChampionshipTeam::class,
            ChampionshipDiscipline::class,
            'championship_id',           // Clave foránea en ChampionshipDiscipline
            'championship_discipline_id',// Clave foránea en ChampionshipTeam
            'id',                        // Clave local en Championship
            'id'                         // Clave local en ChampionshipDiscipline
        );
    }

    public function players()
    {
        // through relationship to get all players in the championship through teams
        return $this->hasManyThrough(
            ChampionshipPlayer::class,
            ChampionshipTeam::class,
            'championship_discipline_id', // Foreign key on ChampionshipTeam table
            'championship_team_id', // Foreign key on ChampionshipPlayer table
            'id', // Local key on Championship table
            'id' // Local key on ChampionshipTeam table
        );
    }

    public function championshipTeams()
    {
        return $this->hasManyThrough(
            ChampionshipTeam::class,
            ChampionshipDiscipline::class,
            'championship_id',
            'championship_discipline_id',
            'id',
            'id'
        );
    }

    public function venues()
    {
        return $this->hasMany(Venue::class);
    }

    public function matches()
    {
        return $this->hasMany(GameMatch::class);
    }

    public function standings()
    {
        return $this->hasMany(Standing::class);
    }

    public function championshipDisciplines()
    {
        return $this->hasMany(ChampionshipDiscipline::class);
    }

    public function disciplines()
    {
        return $this->belongsToMany(Discipline::class, 'championship_disciplines')
            ->withTimestamps();
    }
}