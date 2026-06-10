<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\SoftDeletes;

class GameMatch extends Model
{
    use SoftDeletes;

    protected $table = 'matches';

    protected $fillable = [
        'venue_id',
        'discipline_id',
        'category_id',
        'local_team_id',
        'visitor_team_id',
        'match_date',
        'match_time',
        'round',
        'status',
        'championship_id',
    ];

    protected $casts = [
        'match_date' => 'date',
        'match_time' => 'string',
    ];

    public function venue()
    {
        return $this->belongsTo(Venue::class);
    }

    public function discipline()
    {
        return $this->belongsTo(Discipline::class);
    }

    public function category()
    {
        return $this->belongsTo(Category::class);
    }

    public function localTeam()
    {
        return $this->belongsTo(Team::class, 'local_team_id');
    }

    public function visitorTeam()
    {
        return $this->belongsTo(Team::class, 'visitor_team_id');
    }

    public function report()
    {
        return $this->hasOne(MatchReport::class);
    }

    public function incidences()
    {
        return $this->hasMany(MatchIncidence::class);
    }

    public function championship()
    {
        return $this->belongsTo(Championship::class);
    }
}