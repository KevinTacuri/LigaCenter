<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\SoftDeletes;

class Sanction extends Model
{
    use SoftDeletes;

    protected $fillable = [
        'player_id',
        'origin_match_id',
        'sanction_type',
        'reason',
        'start_date',
        'end_date',
        'duration',
        'status',
    ];

    protected $casts = [
        'start_date' => 'date',
        'end_date' => 'date',
        'duration' => 'integer',
    ];

    public function player()
    {
        return $this->belongsTo(Player::class);
    }

    public function match()
    {
        return $this->belongsTo(GameMatch::class, 'origin_match_id');
    }
}