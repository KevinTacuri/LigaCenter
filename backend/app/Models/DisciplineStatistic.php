<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class DisciplineStatistic extends Model
{
    # Describe cada una de los campos
    # discipline_id: ID de la disciplina a la que pertenecen estas estadísticas
    # statistic_type_id: ID del tipo de estadística
    # order: Orden en el que se muestran las estadísticas en el ranking (número entero, menor es más prioritario) 
    protected $fillable = [
        'discipline_id',
        'statistic_type_id',
        'order'
    ];


    public function statisticType()
    {
        return $this->belongsTo(StatisticType::class);
    }

    public function discipline()
    {
        return $this->belongsTo(Discipline::class);
    }

    public function playerStatistics()
    {
        return $this->hasMany(PlayerStatistic::class);
    }
}
