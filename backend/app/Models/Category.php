<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\HasMany;

class Category extends Model
{
    protected $fillable = [
        'name',
        'age_range',
        'championship_id',
        'discipline_id',
        'description',
        'gender_type',
        'age_min',
        'age_max',
    ];

    public function teams(): HasMany
    {
        return $this->hasMany(Team::class);
    }

    public function championship()
    {
        return $this->belongsTo(Championship::class);
    }

    public function discipline()
    {
        return $this->belongsTo(Discipline::class);
    }

    public function matches()
    {
        return $this->hasMany(GameMatch::class);
    }

    public function standings()
    {
        return $this->hasMany(Standing::class);
    }
}