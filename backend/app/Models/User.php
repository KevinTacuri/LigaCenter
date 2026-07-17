<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Foundation\Auth\User as Authenticatable;
use Illuminate\Notifications\Notifiable;
use Laravel\Sanctum\HasApiTokens;
use Spatie\Permission\Traits\HasRoles;
use Illuminate\Database\Eloquent\SoftDeletes;

class User extends Authenticatable
{
    use HasApiTokens, HasFactory, Notifiable, HasRoles, SoftDeletes;

    protected $fillable = [
        'name',
        'email',
        'dni',
        'phone',
        'password',
        'is_active',
    ];

    protected $hidden = [
        'password',
        'remember_token',
    ];

    protected function casts(): array
    {
        return [
            'email_verified_at' => 'datetime',
            'password' => 'hashed',
            'is_active' => 'boolean',
        ];
    }

    /**
     * Campeonatos que el usuario ha CREADO (como owner/organizador)
     * Relación: users.id → championships.user_id
     */
    public function championships()
    {
        return $this->hasMany(Championship::class, 'user_id');
    }

    /**
     * Asignaciones del usuario en campeonatos (tabla pivote championship_users)
     * Relación: users.id → championship_users.user_id
     */
    public function championshipUsers()
    {
        return $this->hasMany(ChampionshipUser::class);
    }

    /**
     * Campeonatos donde el usuario está ASIGNADO (a través de tabla pivote)
     * Relación: users.id → championship_users.user_id → championship_users.championship_id → championships.id
     */
    public function assignedChampionships()
    {
        return $this->belongsToMany(Championship::class, 'championship_users')
            ->withPivot('role', 'team_id')
            ->withTimestamps();
    }

    /**
     * Equipos donde el usuario es representante
     * Relación: users.id → teams.representative
     */
    public function teams()
    {
        return $this->hasMany(Team::class, 'representative');
    }
}