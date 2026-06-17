<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\HasMany;
use Illuminate\Database\Eloquent\SoftDeletes;

class Category extends Model
{
    use SoftDeletes;

    protected $fillable = [
        'name',
        'format',
        'format_settings',
        'championship_id',
        'discipline_id',
        'description',
        'gender_type',
        'age_min',
        'age_max',
    ];

    protected $casts = [
        'format_settings' => 'array',
        'age_min' => 'integer',
        'age_max' => 'integer',
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

    public function groups()
    {
        return $this->hasMany(Group::class);
    }
}