<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class StatisticType extends Model
{
    protected $fillable = [
        'name',
        'slug',
        'display_name',
    ];

    public function disciplineStatistics()
    {
        return $this->hasMany(DisciplineStatistic::class);
    }
}