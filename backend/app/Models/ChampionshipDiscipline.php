<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;

class ChampionshipDiscipline extends Model
{
    protected $fillable = [
        'championship_id',
        'discipline_id',
        'specific_rules',
        'match_duration_minutes',
        'match_duration_settings',
    ];

    protected $casts = [
        'match_duration_settings' => 'array',
    ];

    public function championship(): BelongsTo
    {
        return $this->belongsTo(Championship::class);
    }

    public function discipline(): BelongsTo
    {
        return $this->belongsTo(Discipline::class);
    }

    public function categories(): HasMany
    {
        return $this->hasMany(Category::class);
    }
}