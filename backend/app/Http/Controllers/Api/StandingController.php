<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use Illuminate\Http\Request;
use App\Models\Standing;
use App\Models\ChampionshipTeam;
use App\Traits\ApiResponse;
use OpenApi\Attributes as OA;
use App\Http\Resources\ChampionshipTeamResource;

class StandingController extends Controller
{
    use ApiResponse;

    #[OA\Get(
        path: '/api/standings',
        operationId: 'getStandings',
        summary: 'Tabla de posiciones',
        tags: ['Standings']
    )]
    #[OA\Parameter(
        name: 'championship_id',
        description: 'ID del campeonato (opcional)',
        in: 'query',
        required: false,
        schema: new OA\Schema(type: 'integer')
    )]
    #[OA\Parameter(
        name: 'discipline_id',
        description: 'ID de la disciplina (opcional)',
        in: 'query',
        required: false,
        schema: new OA\Schema(type: 'integer')
    )]
    #[OA\Parameter(
        name: 'category_id',
        description: 'ID de la categoría (opcional)',
        in: 'query',
        required: false,
        schema: new OA\Schema(type: 'integer')
    )]
    #[OA\Response(
        response: 200,
        description: 'Tabla de posiciones obtenida exitosamente'
    )]
    #[OA\Security(name: 'sanctum')]
    public function index(Request $request)
    {
        $query = Standing::with(['championshipTeam', 'championshipTeam.championshipDiscipline.discipline']);

        if ($request->has('championship_id')) {
            $query->where('championship_id', $request->championship_id);
        }

        if ($request->has('category_id')) {
            $query->where('category_id', $request->category_id);
        }

        if ($request->has('discipline_id')) {
            $query->whereHas('category.championshipDiscipline', function ($q) use ($request) {
                $q->where('discipline_id', $request->discipline_id);
            });
        }

        $standings = $query
            ->orderByDesc('points')
            ->orderByDesc('goal_difference')
            ->orderByDesc('goals_for')
            ->get();

        return $this->successResponse(
            $standings,
            'Tabla de posiciones obtenida exitosamente'
        );
    }

    #[OA\Get(
        path: '/api/standings/complete',
        operationId: 'getCompleteStandings',
        summary: 'Tabla de posiciones completa con todos los equipos de la categoria',
        tags: ['Standings']
    )]

    public function getCompleteStandings(Request $request)
    {
        $championshipId = $request->input('championship_id');
        $categoryId = $request->input('category_id');
        $disciplineId = $request->input('discipline_id');

        if (!$championshipId || !$categoryId) {
            return $this->errorResponse('Se requiere championship_id y category_id', 400);
        }

        // Verificar si hay partidos generados para esta categoría
        $hasMatches = \App\Models\GameMatch::where('championship_id', $championshipId)
            ->where('category_id', $categoryId)
            ->exists();

        // Si no hay partidos, devolver array vacío
        if (!$hasMatches) {
            return $this->successResponse(
                [],
                'No hay fixture generado para esta categoría'
            );
        }

        // Obtener IDs de equipos que tienen partidos en esta categoría
        $teamIdsWithMatches = \App\Models\GameMatch::where('championship_id', $championshipId)
            ->where('category_id', $categoryId)
            ->where(function ($query) {
                $query->whereNotNull('home_team_id')
                    ->orWhereNotNull('away_team_id');
            })
            ->pluck('home_team_id')
            ->merge(
                \App\Models\GameMatch::where('championship_id', $championshipId)
                    ->where('category_id', $categoryId)
                    ->whereNotNull('away_team_id')
                    ->pluck('away_team_id')
            )
            ->unique()
            ->filter()
            ->values()
            ->toArray();

        // Si no hay equipos con partidos, devolver array vacío
        if (empty($teamIdsWithMatches)) {
            return $this->successResponse(
                [],
                'No hay equipos con partidos en esta categoría'
            );
        }

        // Recalcular dinámicamente posiciones si hay partidos finalizados
        $this->recalcularPosicionesSiEsNecesario($championshipId, $categoryId);

        $teams = ChampionshipTeam::where('championship_teams.category_id', $categoryId)
            ->whereHas('championship', function ($query) use ($championshipId) {
                $query->where('championships.id', $championshipId);
            })
            ->whereIn('championship_teams.id', $teamIdsWithMatches) // SOLO EQUIPOS CON PARTIDOS
            ->leftJoin('group_teams', 'championship_teams.id', '=', 'group_teams.championship_team_id')
            ->leftJoin('groups', 'group_teams.group_id', '=', 'groups.id')
            ->select('championship_teams.*', 'groups.name as group_name')
            ->get();

        $standings = Standing::where('championship_id', $championshipId)
            ->where('category_id', $categoryId)
            ->get()
            ->keyBy('team_id');

        $result = [];
        foreach ($teams as $team) {
            $groupName = $team->group_name ?? 'Tabla General';
            unset($team->group_name);

            if ($standings->has($team->id)) {
                $standing = $standings->get($team->id);
                $standing->team = $team;
                $standing->group_name = $groupName;
                $result[] = $standing;
            } else {
                $result[] = (object) [
                    'id' => null,
                    'team_id' => $team->id,
                    'team' => new ChampionshipTeamResource($team),
                    'category_id' => $categoryId,
                    'championship_id' => $championshipId,
                    'matches_played' => 0,
                    'points' => 0,
                    'wins' => 0,
                    'draws' => 0,
                    'losses' => 0,
                    'goals_for' => 0,
                    'goals_against' => 0,
                    'goal_difference' => 0,
                    'wins_total' => 0,
                    'losses_total' => 0,
                    'sets_for' => 0,
                    'sets_against' => 0,
                    'sets_ratio' => 0,
                    'points_for' => 0,
                    'points_against' => 0,
                    'points_ratio' => 0,
                    'win_percentage' => 0,
                    'games_behind' => 0,
                    'streak' => null,
                    'last_updated' => null,
                    'group_name' => $groupName,
                ];
            }
        }

        usort($result, function ($a, $b) {
            if ($a->group_name != $b->group_name) {
                return strcmp($a->group_name, $b->group_name);
            }
            if ($a->points != $b->points) {
                return $b->points - $a->points;
            }
            if ($a->goal_difference != $b->goal_difference) {
                return $b->goal_difference - $a->goal_difference;
            }
            return $b->goals_for - $a->goals_for;
        });

        return $this->successResponse(
            $result,
            'Tabla de posiciones completa obtenida exitosamente'
        );
    }

    #[OA\Get(
        path: '/api/standings/{id}',
        operationId: 'getStanding',
        summary: 'Obtener posición por ID',
        tags: ['Standings']
    )]
    #[OA\Response(
        response: 200,
        description: 'Registro obtenido exitosamente'
    )]
    #[OA\Response(
        response: 404,
        description: 'Registro no encontrado'
    )]
    #[OA\Security(name: 'sanctum')]
    public function show($id)
    {
        $standing = Standing::with([
            'team',
            'category.championshipDiscipline.discipline'
        ])->find($id);

        if (!$standing) {
            return $this->errorResponse(
                'Registro no encontrado',
                404
            );
        }

        return $this->successResponse(
            $standing,
            'Registro obtenido exitosamente'
        );
    }

    #[OA\Get(
        path: '/api/standings/team/{teamId}',
        operationId: 'getStandingByTeam',
        summary: 'Obtener posición por equipo',
        tags: ['Standings']
    )]
    #[OA\Parameter(
        name: 'championship_id',
        description: 'ID del campeonato (opcional)',
        in: 'query',
        required: false,
        schema: new OA\Schema(type: 'integer')
    )]
    #[OA\Parameter(
        name: 'category_id',
        description: 'ID de la categoría (opcional)',
        in: 'query',
        required: false,
        schema: new OA\Schema(type: 'integer')
    )]
    #[OA\Response(
        response: 200,
        description: 'Registro obtenido exitosamente'
    )]
    #[OA\Response(
        response: 404,
        description: 'Registro no encontrado'
    )]
    #[OA\Security(name: 'sanctum')]
    public function getByTeam($teamId, Request $request)
    {
        $query = Standing::with([
            'team',
            'category.championshipDiscipline.discipline'
        ])->where('team_id', $teamId);

        if ($request->has('championship_id')) {
            $query->where('championship_id', $request->championship_id);
        }

        if ($request->has('category_id')) {
            $query->where('category_id', $request->category_id);
        }

        $standing = $query->first();

        if (!$standing) {
            return $this->errorResponse(
                'Registro no encontrado',
                404
            );
        }

        return $this->successResponse(
            $standing,
            'Registro obtenido exitosamente'
        );
    }

    public function recalculate(Request $request)
    {
        $championshipId = $request->input('championship_id');
        $categoryId = $request->input('category_id');

        if (!$championshipId || !$categoryId) {
            return $this->errorResponse('Se requiere championship_id y category_id', 400);
        }

        $service = new \App\Services\StandingService();
        $service->recalculateAllForCategory($championshipId, $categoryId);

        return $this->successResponse(
            null,
            'Posiciones recalculadas exitosamente'
        );
    }

    private function recalcularPosicionesSiEsNecesario($championshipId, $categoryId)
    {
        $matches = \App\Models\GameMatch::where('championship_id', $championshipId)
            ->where('category_id', $categoryId)
            ->where('status', 'finalizado')
            ->get();

        if ($matches->isEmpty()) {
            return;
        }

        $service = new \App\Services\StandingService();
        Standing::where('championship_id', $championshipId)
            ->where('category_id', $categoryId)
            ->delete();

        foreach ($matches as $match) {
            $homeScore = $match->home_score ?? $match->report?->local_score ?? 0;
            $awayScore = $match->away_score ?? $match->report?->visitor_score ?? 0;
            $service->updateFromMatch($match, $homeScore, $awayScore);
        }
    }
}