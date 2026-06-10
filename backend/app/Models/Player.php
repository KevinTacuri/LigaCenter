<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\SoftDeletes;

class Player extends Model
{
    use SoftDeletes;

    protected $fillable = [
        'team_id',
        'full_name',
        'dni',
        'college_id',
        'age',
        'is_eligible',
    ];

    protected $casts = [
        'is_eligible' => 'boolean',
        'age' => 'integer',
    ];

    public function team(): BelongsTo
    {
        return $this->belongsTo(Team::class);
    }
}