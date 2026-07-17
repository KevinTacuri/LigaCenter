<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\BelongsToMany;
use Illuminate\Database\Eloquent\SoftDeletes;
use Illuminate\Support\Str;

class Team extends Model
{
    use SoftDeletes;

    protected $fillable = [
        'representative',
        'category_id',
        'name',
        'registration_status',
        'championship_id',
        'logo',
        'description',
    ];

    // Accessor: transforma el valor crudo de 'logo' en una URL lista para usar,
    // sin importar si se guardó como ruta local (storage) o como URL externa.
    public function getLogoAttribute($value)
    {
        if (!$value) {
            return null;
        }

        // Si ya es una URL completa (http/https), se devuelve tal cual.
        if (Str::startsWith($value, ['http://', 'https://'])) {
            return $value;
        }

        // Si es una ruta relativa (subida por archivo), se arma la URL pública.
        return asset('storage/' . $value);
    }

    // Devuelve el valor CRUDO de logo (sin transformar), útil para borrar el archivo viejo.
    public function getLogoRawAttribute()
    {
        return $this->attributes['logo'] ?? null;
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
        return $this->hasOne(Standing::class, 'team_id')
            ->where('category_id', $this->category_id)
            ->where('championship_id', $this->championship_id);
    }

    public function championshipUser()
    {
        return $this->hasOne(ChampionshipUser::class, 'team_id')
            ->where('role', 'team_delegate');
    }

    public function getChampionshipAttribute()
    {
        return $this->category?->championshipDiscipline?->championship;
    }
}