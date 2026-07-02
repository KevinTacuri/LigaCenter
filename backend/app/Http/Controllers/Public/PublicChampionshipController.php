<?php

namespace App\Http\Controllers\Public;

use App\Models\Championship;
use App\Models\Standing;
use App\Models\GameMatch;
use App\Models\Team;
use App\Http\Resources\Public\PublicChampionshipResource;
use App\Http\Resources\Public\PublicMatchResource;
use App\Http\Resources\Public\PublicStandingResource;
use Illuminate\Http\Request;

class PublicChampionshipController extends PublicController
{
    public function index(Request $request)
    {
        $disciplineId = $request->get('discipline_id');
        $search = $request->get('search');

        $championships = Championship::where('is_public', true)
            ->with(['disciplines'])
            ->withCount(['teams', 'matches'])
            ->when($disciplineId, function ($query) use ($disciplineId) {
                return $query->whereHas('disciplines', function ($q) use ($disciplineId) {
                    $q->where('disciplines.id', $disciplineId);
                });
            })
            ->when($search, function ($query) use ($search) {
                return $query->where('name', 'LIKE', "%{$search}%");
            })
            ->orderBy('created_at', 'desc')
            ->paginate(12);

        return $this->successResponse(
            PublicChampionshipResource::collection($championships)->response()->getData(true),
            'Campeonatos obtenidos exitosamente'
        );
    }

    public function show($id)
    {
        $championship = Championship::where('is_public', true)
            ->with(['disciplines'])
            ->withCount(['teams', 'matches'])
            ->find($id);

        if (!$championship) {
            return $this->errorResponse('Campeonato no encontrado', 404);
        }

        // Estadísticas adicionales
        $totalMatches = GameMatch::where('championship_id', $id)->count();
        $liveMatches = GameMatch::where('championship_id', $id)
            ->where('status', 'en_curso')
            ->count();
        
        $totalGoals = GameMatch::where('championship_id', $id)
            ->sum('home_score') + GameMatch::where('championship_id', $id)
            ->sum('away_score');

        $data = [
            'championship' => new PublicChampionshipResource($championship),
            'stats' => [
                'total_matches' => $totalMatches,
                'live_matches' => $liveMatches,
                'total_goals' => $totalGoals,
                'avg_goals' => $totalMatches > 0 ? round($totalGoals / $totalMatches, 2) : 0,
                'teams_count' => $championship->teams_count,
            ]
        ];

        return $this->successResponse($data, 'Campeonato obtenido exitosamente');
    }

    public function standings($id)
    {
        $championship = Championship::where('is_public', true)->find($id);

        if (!$championship) {
            return $this->errorResponse('Campeonato no encontrado', 404);
        }

        $standings = Standing::where('championship_id', $id)
            ->with(['team'])
            ->orderBy('points', 'desc')
            ->orderBy('goal_difference', 'desc')
            ->orderBy('goals_for', 'desc')
            ->get();

        // Agregar posición
        $standings->each(function ($item, $index) {
            $item->position = $index + 1;
        });

        return $this->successResponse(
            PublicStandingResource::collection($standings),
            'Tabla de posiciones obtenida exitosamente'
        );
    }

    public function matches($id, Request $request)
    {
        $championship = Championship::where('is_public', true)->find($id);

        if (!$championship) {
            return $this->errorResponse('Campeonato no encontrado', 404);
        }

        $status = $request->get('status');

        $matches = GameMatch::where('championship_id', $id)
            ->with(['localTeam', 'visitorTeam', 'venue', 'group', 'championship'])
            ->when($status, function ($query) use ($status) {
                $statusMap = [
                    'pendiente' => 'programado',
                    'en_vivo' => 'en_curso',
                    'finalizado' => 'finalizado',
                ];
                if (isset($statusMap[$status])) {
                    return $query->where('status', $statusMap[$status]);
                }
                return $query->where('status', $status);
            })
            ->orderBy('match_date', 'desc')
            ->orderBy('match_time', 'desc')
            ->paginate(20);

        return $this->successResponse(
            PublicMatchResource::collection($matches)->response()->getData(true),
            'Partidos obtenidos exitosamente'
        );
    }

    public function statistics($id)
    {
        $championship = Championship::where('is_public', true)->find($id);

        if (!$championship) {
            return $this->errorResponse('Campeonato no encontrado', 404);
        }

        $totalMatches = GameMatch::where('championship_id', $id)->count();
        $totalGoals = GameMatch::where('championship_id', $id)
            ->sum('home_score') + GameMatch::where('championship_id', $id)
            ->sum('away_score');

        // Máximos goleadores (usando player_statistics)
        $topScorers = \DB::table('player_statistics')
            ->join('players', 'player_statistics.player_id', '=', 'players.id')
            ->join('statistic_types', 'player_statistics.discipline_statistic_id', '=', 'statistic_types.id')
            ->where('player_statistics.championship_id', $id)
            ->where('statistic_types.slug', 'goals')
            ->select(
                'players.id',
                'players.names',
                'players.last_names',
                'player_statistics.value as goals'
            )
            ->orderBy('goals', 'desc')
            ->limit(5)
            ->get()
            ->map(function ($item) {
                return [
                    'id' => $item->id,
                    'name' => $item->names . ' ' . $item->last_names,
                    'goals' => $item->goals,
                ];
            });

        $stats = [
            'total_matches' => $totalMatches,
            'total_goals' => $totalGoals,
            'avg_goals_per_match' => $totalMatches > 0 ? round($totalGoals / $totalMatches, 2) : 0,
            'teams_count' => $championship->teams()->count(),
            'top_scorers' => $topScorers,
        ];

        return $this->successResponse($stats, 'Estadísticas obtenidas exitosamente');
    }

    public function standingsComplete($id)
    {
        $championship = Championship::where('is_public', true)->find($id);

        if (!$championship) {
            return $this->errorResponse('Campeonato no encontrado', 404);
        }

        $teams = Team::where('championship_id', $id)->get();
        $standings = Standing::where('championship_id', $id)->get()->keyBy('team_id');

        $result = [];
        foreach ($teams as $team) {
            if ($standings->has($team->id)) {
                $standing = $standings->get($team->id);
                // Crear un array con los mismos datos que el equipo virtual
                $result[] = [
                    'position' => null,
                    'team' => [
                        'id' => $team->id,
                        'name' => $team->name,
                        'logo' => $team->logo ?? null,
                    ],
                    'matches_played' => $standing->matches_played ?? 0,
                    'wins' => $standing->wins ?? 0,
                    'draws' => $standing->draws ?? 0,
                    'losses' => $standing->losses ?? 0,
                    'goals_for' => $standing->goals_for ?? 0,
                    'goals_against' => $standing->goals_against ?? 0,
                    'goal_difference' => $standing->goal_difference ?? 0,
                    'points' => $standing->points ?? 0,
                    'form' => null,
                ];
            } else {
                $result[] = [
                    'position' => null,
                    'team' => [
                        'id' => $team->id,
                        'name' => $team->name,
                        'logo' => $team->logo ?? null,
                    ],
                    'matches_played' => 0,
                    'wins' => 0,
                    'draws' => 0,
                    'losses' => 0,
                    'goals_for' => 0,
                    'goals_against' => 0,
                    'goal_difference' => 0,
                    'points' => 0,
                    'form' => null,
                ];
            }
        }

        usort($result, function ($a, $b) {
            if ($a['points'] != $b['points']) {
                return $b['points'] - $a['points'];
            }
            if ($a['goal_difference'] != $b['goal_difference']) {
                return $b['goal_difference'] - $a['goal_difference'];
            }
            return $b['goals_for'] - $a['goals_for'];
        });

        foreach ($result as $index => &$item) {
            $item['position'] = $index + 1;
        }

        return $this->successResponse($result, 'Tabla de posiciones completa obtenida exitosamente');
    }
}