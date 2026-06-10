<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class ChampionshipUser extends Model
{
    protected $table = 'championship_users';

    protected $fillable = [
        'championship_id',
        'user_id',
        'role',
        'team_id',
    ];

    public function championship()
    {
        return $this->belongsTo(Championship::class);
    }

    public function user()
    {
        return $this->belongsTo(User::class);
    }

    public function team()
    {
        return $this->belongsTo(Team::class);
    }
}