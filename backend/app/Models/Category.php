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
        'championship_discipline_id',
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

    public function championshipDiscipline()
    {
        return $this->belongsTo(ChampionshipDiscipline::class);
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