<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasOne;

class CompetitionEventParticipant extends Model
{
    use HasFactory;

    protected $fillable = [
        'competition_event_id',
        'championship_player_id',
        'championship_team_id',
        'lane',
        'start_order',
        'status',
    ];

    public function event(): BelongsTo
    {
        return $this->belongsTo(
            CompetitionEvent::class,
            'competition_event_id'
        );
    }

    public function championshipPlayer(): BelongsTo
    {
        return $this->belongsTo(
            ChampionshipPlayer::class,
            'championship_player_id'
        );
    }

    public function championshipTeam(): BelongsTo
    {
        return $this->belongsTo(
            ChampionshipTeam::class,
            'championship_team_id'
        );
    }

    public function result(): HasOne
    {
        return $this->hasOne(
            CompetitionResult::class
        );
    }
}