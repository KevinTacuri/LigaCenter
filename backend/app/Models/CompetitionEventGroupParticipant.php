<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class CompetitionEventGroupParticipant extends Model
{
    protected $fillable = [
        'competition_event_group_id',
        'competition_event_participant_id',
        'lane',
        'start_order',
        'status',
    ];

    public function group()
    {
        return $this->belongsTo(
            CompetitionEventGroup::class,
            'competition_event_group_id'
        );
    }

    public function participant()
    {
        return $this->belongsTo(
            CompetitionEventParticipant::class,
            'competition_event_participant_id'
        );
    }

    public function result()
    {
        return $this->hasOne(
            CompetitionResult::class,
            'competition_event_group_participant_id'
        );
    }
}