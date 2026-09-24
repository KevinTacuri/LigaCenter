<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;

class CompetitionEvent extends Model
{
    use HasFactory;

    protected $fillable = [
        'championship_discipline_id',
        'category_id',
        'name',
        'event_type',
        'participation_type',
        'date',
        'start_time',
        'venue_id',
        'status',
        'competition_format',
        'result_aggregation',
    ];

    protected $casts = [
        'date' => 'date',
        'start_time' => 'datetime:H:i',
    ];

    public function championshipDiscipline(): BelongsTo
    {
        return $this->belongsTo(
            ChampionshipDiscipline::class,
            'championship_discipline_id'
        );
    }

    public function category(): BelongsTo
    {
        return $this->belongsTo(Category::class);
    }

    public function venue(): BelongsTo
    {
        return $this->belongsTo(Venue::class);
    }

    public function participants(): HasMany
    {
        return $this->hasMany(
            CompetitionEventParticipant::class
        );
    }

    public function stages()
    {
        return $this->hasMany(
            CompetitionEventStage::class
        )->orderBy('stage_number');
    }
}