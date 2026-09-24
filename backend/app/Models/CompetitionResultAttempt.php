<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class CompetitionResultAttempt extends Model
{
    use HasFactory;

    protected $fillable = [
        'competition_result_id',
        'competition_event_participant_member_id',
        'attempt_number',
        'value',
    ];

    protected $casts = [
        'attempt_number' => 'integer',
        'value' => 'decimal:4',
    ];

    public function result(): BelongsTo
    {
        return $this->belongsTo(
            CompetitionResult::class,
            'competition_result_id'
        );
    }

    public function member(): BelongsTo
    {
        return $this->belongsTo(
            CompetitionEventParticipantMember::class,
            'competition_event_participant_member_id'
        );
    }
}