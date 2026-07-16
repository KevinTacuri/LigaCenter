<?php

namespace App\Http\Controllers\Public;

use App\Models\Championship;
use App\Models\GameMatch;
use App\Models\Team;
use App\Models\Player;
use Illuminate\Http\Request;
use App\Http\Resources\Public\PublicChampionshipResource;
use App\Http\Resources\Public\PublicMatchResource;
use App\Http\Resources\Public\PublicTeamResource;
use App\Http\Resources\Public\PublicPlayerResource;

class PublicSearchController extends PublicController
{
    public function search(Request $request)
    {
        $query = $request->get('q', '');

        if (strlen($query) < 2) {
            return $this->errorResponse('El término de búsqueda debe tener al menos 2 caracteres', 400);
        }

        $results = [];

        // Buscar campeonatos
        $championships = Championship::where('is_public', true)
            ->where('name', 'LIKE', "%{$query}%")
            ->with(['disciplines'])
            ->limit(5)
            ->get();

        if ($championships->isNotEmpty()) {
            $results['championships'] = PublicChampionshipResource::collection($championships);
        }

        // Buscar partidos
        $matches = GameMatch::whereHas('championship', function ($q) {
                $q->where('is_public', true);
            })
            ->where(function ($q) use ($query) {
                $q->whereHas('localTeam', function ($t) use ($query) {
                    $t->where('name', 'LIKE', "%{$query}%");
                })->orWhereHas('visitorTeam', function ($t) use ($query) {
                    $t->where('name', 'LIKE', "%{$query}%");
                });
            })
            ->with(['localTeam', 'visitorTeam', 'championship'])
            ->limit(5)
            ->get();

        if ($matches->isNotEmpty()) {
            $results['matches'] = PublicMatchResource::collection($matches);
        }

        // Buscar equipos
        $teams = Team::whereHas('championship', function ($q) {
                $q->where('is_public', true);
            })
            ->where('name', 'LIKE', "%{$query}%")
            ->with(['championship'])
            ->limit(5)
            ->get();

        if ($teams->isNotEmpty()) {
            $results['teams'] = PublicTeamResource::collection($teams);
        }

        // Buscar jugadores (sin DNI)
        $players = Player::whereHas('teams.championship', function ($q) {
                $q->where('is_public', true);
            })
            ->where(function ($q) use ($query) {
                $q->where('names', 'LIKE', "%{$query}%")
                    ->orWhere('last_names', 'LIKE', "%{$query}%");
            })
            ->with(['teams'])
            ->limit(5)
            ->get();

        if ($players->isNotEmpty()) {
            $results['players'] = PublicPlayerResource::collection($players);
        }

        return $this->successResponse($results, 'Resultados de búsqueda obtenidos exitosamente');
    }
}