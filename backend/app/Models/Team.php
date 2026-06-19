<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;
use Illuminate\Database\Eloquent\Relations\BelongsToMany;
use Illuminate\Database\Eloquent\SoftDeletes;

class Team extends Model
{
    use SoftDeletes;

    protected $fillable = [
        'representative',
        'discipline_id',
        'category_id',
        'name',
        'registration_status',
        'championship_id',
        'logo',
        'description',
    ];

    public function discipline(): BelongsTo
    {
        return $this->belongsTo(Discipline::class);
    }

    public function category(): BelongsTo
    {
        return $this->belongsTo(Category::class);
    }

    public function players(): BelongsToMany
    {
        return $this->belongsToMany(Player::class, 'team_players')
            ->withPivot('jersey_number', 'status')
            ->withTimestamps();
    }

    public function championship()
    {
        return $this->belongsTo(Championship::class);
    }

    public function homeMatches()
    {
        return $this->hasMany(GameMatch::class, 'home_team_id');
    }

    public function awayMatches()
    {
        return $this->hasMany(GameMatch::class, 'away_team_id');
    }

    public function standing()
    {
        return $this->hasOne(Standing::class);
    }
}