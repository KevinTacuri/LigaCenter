<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class Standing extends Model
{
    public $timestamps = false;

    protected $fillable = [
        'team_id',
        'category_id',
        'championship_id',
        'matches_played',
        'wins',
        'draws',
        'losses',
        'goals_for',
        'goals_against',
        'goal_difference',
        'points',
        'last_updated',
    ];

    protected $casts = [
        'last_updated' => 'datetime',
    ];

    public function team()
    {
        return $this->belongsTo(Team::class);
    }

    public function category()
    {
        return $this->belongsTo(Category::class);
    }

    public function championship()
    {
        return $this->belongsTo(Championship::class);
    }

    // Accesor para obtener la disciplina a través de la categoría
    public function getDisciplineAttribute()
    {
        return $this->category?->championshipDiscipline?->discipline;
    }

    // Accesor para obtener el ID de la disciplina
    public function getDisciplineIdAttribute()
    {
        return $this->category?->championshipDiscipline?->discipline_id;
    }
}