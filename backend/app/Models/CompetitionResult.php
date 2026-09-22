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
        'competition_event_participant_id',
        'result_value',
        'result_unit',
        'position',
        'status',
    ];

    protected $casts = [
        'result_value' => 'decimal:4',
        'position' => 'integer',
    ];

    public function participant(): BelongsTo
    {
        return $this->belongsTo(
            CompetitionEventParticipant::class,
            'competition_event_participant_id'
        );
    }

    public function attempts(): HasMany
    {
        return $this->hasMany(
            CompetitionResultAttempt::class
        );
    }
}