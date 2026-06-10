<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class Championship extends Model
{
    protected $fillable = [
        'user_id',
        'name',
        'description',
        'type',
        'status',
        'settings',
        'start_date',
        'end_date',
        'is_public',
    ];

    protected $casts = [
        'settings' => 'array',
        'start_date' => 'date',
        'end_date' => 'date',
        'is_public' => 'boolean',
    ];

    public function owner()
    {
        return $this->belongsTo(User::class, 'user_id');
    }

    public function users()
    {
        return $this->belongsToMany(User::class, 'championship_users')
            ->withPivot('role', 'team_id')
            ->withTimestamps();
    }

    public function categories()
    {
        return $this->hasMany(Category::class);
    }

    public function teams()
    {
        return $this->hasMany(Team::class);
    }

    public function venues()
    {
        return $this->hasMany(Venue::class);
    }

    public function matches()
    {
        return $this->hasMany(GameMatch::class);
    }

    public function standings()
    {
        return $this->hasMany(Standing::class);
    }
}