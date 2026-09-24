<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class CompetitionEventParticipantMember extends Model
{
    protected $fillable = [
        'competition_event_participant_id',
        'championship_player_id',
    ];

    public function participant()
    {
        return $this->belongsTo(
            CompetitionEventParticipant::class,
            'competition_event_participant_id'
        );
    }

    public function championshipPlayer()
    {
        return $this->belongsTo(
            ChampionshipPlayer::class
        );
    }

    public function attempts()
    {
        return $this->hasMany(
            CompetitionResultAttempt::class,
            'competition_event_participant_member_id'
        );
    }
}