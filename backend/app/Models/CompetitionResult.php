<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;

class CompetitionResult extends Model
{
    use HasFactory;

    protected $fillable = [
        'competition_event_group_participant_id',
        'result_value',
        'result_unit',
        'position',
        'tiebreak_order',
        'status',
    ];

    protected $casts = [
        'result_value' => 'decimal:4',
        'position' => 'integer',
        'tiebreak_order' => 'integer',
    ];

    public function groupParticipant(): BelongsTo
    {
        return $this->belongsTo(
            CompetitionEventGroupParticipant::class,
            'competition_event_group_participant_id'
        );
    }

    public function attempts(): HasMany
    {
        return $this->hasMany(
            CompetitionResultAttempt::class
        )->orderBy('attempt_number');
    }
}