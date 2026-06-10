<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class MatchReport extends Model
{
    protected $fillable = [
        'match_id',
        'local_score',
        'visitor_score',
        'referee_signature',
        'delegate_signature',
        'official_pdf_url',
        'observations',
        'is_locked',
    ];

    protected $casts = [
        'is_locked' => 'boolean',
    ];

    public function match()
    {
        return $this->belongsTo(GameMatch::class, 'match_id');
    }
}