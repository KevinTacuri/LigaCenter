<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\SoftDeletes;

class Venue extends Model
{
    use SoftDeletes;

    protected $fillable = [
        'name',
        'venue_type',
        'location',
        'capacity',
        'is_available',
        'championship_id',
    ];

    protected $casts = [
        'is_available' => 'boolean',
        'capacity' => 'integer',
    ];

    public function matches()
    {
        return $this->hasMany(GameMatch::class, 'venue_id');
    }

    public function championship()
    {
        return $this->belongsTo(Championship::class);
    }
}