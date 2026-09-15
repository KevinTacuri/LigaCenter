<?php

namespace App\Http\Controllers\Public;

use App\Models\ChampionshipTeam;
use App\Models\GameMatch;
use App\Models\Player;
use App\Http\Resources\Public\PublicChampionshipTeamResource;
use App\Http\Resources\Public\PublicPlayerResource;
use Illuminate\Http\Request;


// this controller is for public championship teams, it will return the teams of a championship that is public and approved
class PublicChampionshipTeamController extends PublicController
{
    public function index(Request $request)
    {
        $championshipId = $request->get('championship_id');
        $search = $request->get('search');

        $teams = ChampionshipTeam::whereHas('championship', function ($query) {
                $query->where('is_public', true);
            })
            ->where('registration_status', 'aprobado')
            ->with(['team', 'championship'])
            ->when($championshipId, function ($query) use ($championshipId) {
                $query->wherehas('championship', function ($q) use ($championshipId) {
                    $q->where('championships.id', $championshipId);
                });
            })
            ->when($search, function ($query) use ($search) {
                $query->whereHas('team', function ($q) use ($search) {
                    $q->where('name', 'LIKE', "%{$search}%");
                });
            })
            ->join('teams', 'championship_teams.team_id', '=', 'teams.id')
            ->orderBy('teams.name')
            ->select('championship_teams.*')
            ->paginate(20);

        return $this->successResponse(
            PublicChampionshipTeamResource::collection($teams)->response()->getData(true),
            'Equipos obtenidos exitosamente'
        );
    }

    public function show($id)
    {
        $team = ChampionshipTeam::whereHas('championship', function ($query) {
                $query->where('is_public', true);
            })
            ->with(['championship', 'category'])
            ->find($id);

        if (!$team) {
            return $this->errorResponse('Equipo no encontrado', 404);
        }

        // Jugadores del equipo
        $players = Player::whereHas('teams', function ($query) use ($id) {
                $query->where('team_id', $id);
            })
            ->get();

        // Últimos partidos
        $recentMatches = GameMatch::where(function ($query) use ($id) {
                $query->where('home_team_id', $id)
                    ->orWhere('away_team_id', $id);
            })
            ->whereHas('championship', function ($query) {
                $query->where('is_public', true);
            })
            ->with(['localTeam', 'visitorTeam'])
            ->orderBy('match_date', 'desc')
            ->orderBy('match_time', 'desc')
            ->limit(5)
            ->get();

        // Estadísticas del equipo en la tabla de posiciones
        $standing = $team->standing;

        $data = [
            'team' => new PublicChampionshipTeamResource($team),
            'players' => PublicPlayerResource::collection($players),
            'recent_matches' => $recentMatches->map(function ($match) {
                return [
                    'id' => $match->id,
                    'home_team' => $match->localTeam->name,
                    'away_team' => $match->visitorTeam->name,
                    'home_score' => $match->home_score,
                    'away_score' => $match->away_score,
                    'status' => $match->status,
                    'date' => $match->match_date?->format('Y-m-d'),
                ];
            }),
                'standing' => $standing ? [
                    'position' => null,
                    'points' => $standing->points,
                    'matches_played' => $standing->matches_played,
                    'wins' => $standing->wins,
                    'draws' => $standing->draws,
                    'losses' => $standing->losses,
                    'goals_for' => $standing->goals_for,
                    'goals_against' => $standing->goals_against,
                    'goal_difference' => $standing->goal_difference,
                ] : null,
        ];

        return $this->successResponse($data, 'Equipo obtenido exitosamente');
    }
}