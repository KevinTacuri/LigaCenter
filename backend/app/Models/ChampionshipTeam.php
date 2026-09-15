<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;


// This model is a pivot table between championship_disciplines and teams
// Represent the participation of a team in a championship discipline
class ChampionshipTeam extends Model
{
    protected $fillable = [
        'championship_discipline_id',
        'team_id',
        'category_id',
        'representative',
        'registration_status',
    ];

    public function category(): BelongsTo
    {
        return $this->belongsTo(Category::class);
    }

    public function championshipDiscipline(): BelongsTo
    {
        return $this->belongsTo(ChampionshipDiscipline::class);
    }

    public function championship()
    {
        return $this->hasOneThrough(
            Championship::class,
            ChampionshipDiscipline::class,
            'id', // Foreign key on ChampionshipDiscipline table
            'id', // Foreign key on Championship table
            'championship_discipline_id', // Local key on ChampionshipTeam table
            'championship_id' // Local key on ChampionshipDiscipline table
        );
    }

    // Relationship to the team that is participating in the championship discipline
    public function team(): BelongsTo
    {
        return $this->belongsTo(Team::class);
    }

    // players that belong to this team during the championship
    public function players(): HasMany
    {
        return $this->hasMany(ChampionshipPlayer::class);
    }

    // Delegate user related to the team through the team relationship
    public function championshipUser()
    {
        return $this->hasOne(ChampionshipUser::class, 'championship_team_id')
            ->where('role', 'team_delegate');
    }

    // GameMatches away and home that belong to this team during the championship
    public function homeMatches()
    {
        return $this->hasMany(GameMatch::class, 'home_team_id');
    }

    public function awayMatches()
    {
        return $this->hasMany(GameMatch::class, 'away_team_id');
    }

}