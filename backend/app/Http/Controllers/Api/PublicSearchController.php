<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Championship;
use App\Models\Team;
use App\Models\Player;
use App\Models\GameMatch;
use App\Traits\ApiResponse;
use Illuminate\Http\Request;
use OpenApi\Attributes as OA;

#[OA\Tag(
    name: "Public Search",
    description: "Búsqueda global de información pública"
)]
class PublicSearchController extends Controller
{
    use ApiResponse;

    #[OA\Get(
        path: "/api/public/search",
        operationId: "searchPublicContent",
        summary: "Buscar contenido público",
        description: "Busca coincidencias en campeonatos públicos, equipos, jugadores y partidos.",
        tags: ["Public Search"],
        parameters: [
            new OA\Parameter(name: "q", description: "Texto a buscar", in: "query", required: true, schema: new OA\Schema(type: "string", minLength: 2, maxLength: 100), example: "Liga"),
            new OA\Parameter(name: "type", description: "Tipo de contenido", in: "query", required: false, schema: new OA\Schema(type: "string", default: "all", enum: ["all", "championships", "teams", "players", "matches"])),
            new OA\Parameter(name: "limit", description: "Cantidad máxima de resultados por tipo", in: "query", required: false, schema: new OA\Schema(type: "integer", default: 20, minimum: 1, maximum: 50))
        ],
        responses: [
            new OA\Response(response: 200, description: "Resultados de búsqueda obtenidos exitosamente"),
            new OA\Response(response: 422, description: "Error de validación")
        ]
    )]
    public function search(Request $request)
    {
        $request->validate([
            'q' => 'required|string|min:2|max:100',
            'type' => 'nullable|in:all,championships,teams,players,matches',
            'limit' => 'nullable|integer|min:1|max:50',
        ]);

        $query = $request->get('q');
        $type = $request->get('type', 'all');
        $limit = $request->get('limit', 20);

        $results = [];

        // Búsqueda por texto en campeonatos
        if ($type === 'all' || $type === 'championships') {
            $results['championships'] = Championship::where('is_public', true)
                ->where(function($q) use ($query) {
                    $q->where('name', 'LIKE', "%{$query}%")
                      ->orWhere('description', 'LIKE', "%{$query}%");
                })
                ->limit($limit)
                ->get(['id', 'name', 'description', 'type', 'status']);
        }

        // Búsqueda por texto en equipos
        if ($type === 'all' || $type === 'teams') {
            $results['teams'] = Team::whereHas('championship', function($q) {
                    $q->where('is_public', true);
                })
                ->where(function($q) use ($query) {
                    $q->where('name', 'LIKE', "%{$query}%")
                      ->orWhere('description', 'LIKE', "%{$query}%")
                      ->orWhere('representative', 'LIKE', "%{$query}%");
                })
                ->with(['championship:id,name'])
                ->limit($limit)
                ->get(['id', 'name', 'logo', 'description', 'championship_id']);
        }

        // Búsqueda por texto en jugadores
        if ($type === 'all' || $type === 'players') {
            $results['players'] = Player::where(function($q) use ($query) {
                    $q->where('names', 'LIKE', "%{$query}%")
                      ->orWhere('last_names', 'LIKE', "%{$query}%")
                      ->orWhere('document_number', 'LIKE', "%{$query}%");
                })
                ->with(['teams:id,name'])
                ->limit($limit)
                ->get(['id', 'names', 'last_names', 'document_number', 'birth_date']);
        }

        // Búsqueda por texto en partidos
        if ($type === 'all' || $type === 'matches') {
            $results['matches'] = GameMatch::whereHas('championship', function($q) {
                    $q->where('is_public', true);
                })
                ->where(function($q) use ($query) {
                    $q->whereHas('localTeam', function($subQ) use ($query) {
                        $subQ->where('name', 'LIKE', "%{$query}%");
                    })->orWhereHas('visitorTeam', function($subQ) use ($query) {
                        $subQ->where('name', 'LIKE', "%{$query}%");
                    });
                })
                ->with(['localTeam:id,name', 'visitorTeam:id,name', 'championship:id,name'])
                ->limit($limit)
                ->get(['id', 'home_team_id', 'away_team_id', 'match_date', 'match_time', 'status', 'home_score', 'away_score', 'championship_id']);
        }

        return $this->successResponse($results, 'Resultados de búsqueda obtenidos exitosamente');
    }
}