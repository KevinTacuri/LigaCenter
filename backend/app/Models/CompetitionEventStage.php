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
        'rounds_count',
        'result_aggregation',
        'qualifiers_per_group',
        'podium_places',
    ];

    protected function casts(): array
    {
        return [
            'stage_number' => 'integer',
            'rounds_count' => 'integer',
            'qualifiers_count' => 'integer',
            'qualifiers_per_group' => 'integer',
            'podium_places' => 'integer',
        ];
    }

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