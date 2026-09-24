<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class CompetitionEventGroup extends Model
{
    protected $fillable = [
        'competition_event_stage_id',
        'name',
        'group_type',
        'group_number',
        'date',
        'start_time',
        'venue_id',
        'status',
    ];

    protected $casts = [
        'date' => 'date',
    ];

    public function stage()
    {
        return $this->belongsTo(
            CompetitionEventStage::class,
            'competition_event_stage_id'
        );
    }

    public function venue()
    {
        return $this->belongsTo(Venue::class);
    }

    public function participants()
    {
        return $this->hasMany(
            CompetitionEventGroupParticipant::class
        );
    }
}