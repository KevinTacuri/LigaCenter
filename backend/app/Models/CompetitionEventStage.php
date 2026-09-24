<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class CompetitionEventStage extends Model
{
    protected $fillable = [
        'competition_event_id',
        'name',
        'stage_type',
        'stage_number',
        'qualifiers_count',
        'qualification_method',
        'status',
    ];

    public function event()
    {
        return $this->belongsTo(
            CompetitionEvent::class,
            'competition_event_id'
        );
    }

    public function groups()
    {
        return $this->hasMany(
            CompetitionEventGroup::class
        )->orderBy('group_number');
    }
}