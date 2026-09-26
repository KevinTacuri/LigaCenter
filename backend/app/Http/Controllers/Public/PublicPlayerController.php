<?php

namespace App\Http\Controllers\Public;

use App\Models\ChampionshipPlayer;
use App\Models\PlayerStatistic;
use App\Http\Resources\Public\PublicPlayerResource;
use Illuminate\Http\Request;

class PublicPlayerController extends PublicController
{
    public function index(Request $request)
    {
        $teamId = $request->get('team_id');
        $championshipId = $request->get('championship_id');
        $search = $request->get('search');

        $players = ChampionshipPlayer::whereHas(
                'championshipTeam.championshipDiscipline.championship',
                function ($query) {
                    $query->where('is_public', true);
                }
            )
            ->with([
                'player',
                'championshipTeam.team',
                'championshipTeam.championshipDiscipline.championship',
            ])

            // Filtrar por equipo dentro del campeonato
            ->when($teamId, function ($query) use ($teamId) {
                return $query->where('championship_team_id', $teamId);
            })

            // Filtrar por campeonato
            ->when($championshipId, function ($query) use ($championshipId) {
                return $query->whereHas(
                    'championshipTeam.championshipDiscipline.championship',
                    function ($q) use ($championshipId) {
                        $q->where('id', $championshipId);
                    }
                );
            })

            // Buscar por nombre del Player base
            ->when($search, function ($query) use ($search) {
                return $query->whereHas('player', function ($q) use ($search) {
                    $q->where(function ($q) use ($search) {
                        $q->where('names', 'LIKE', "%{$search}%")
                            ->orWhere('last_names', 'LIKE', "%{$search}%");
                    });
                });
            })

            ->paginate(20);

        return $this->successResponse(
            PublicPlayerResource::collection($players)
                ->response()
                ->getData(true),
            'Jugadores obtenidos exitosamente'
        );
    }

    public function show($id)
    {
        $championshipPlayer = ChampionshipPlayer::whereHas(
                'championshipTeam.championshipDiscipline.championship',
                function ($query) {
                    $query->where('is_public', true);
                }
            )
            ->with([
                'player',
                'championshipTeam.team',
                'championshipTeam.championshipDiscipline.championship',
            ])
            ->find($id);

        if (!$championshipPlayer) {
            return $this->errorResponse(
                'Jugador no encontrado',
                404
            );
        }

        $player = $championshipPlayer->player;

        $statistics = PlayerStatistic::where(
                'player_id',
                $player->id
            )
            ->whereHas('championship', function ($q) {
                $q->where('is_public', true);
            })
            ->with([
                'disciplineStatistic.statisticType',
                'championship'
            ])
            ->get();

        $statsByChampionship = $statistics
            ->groupBy('championship_id')
            ->map(function ($group) {
                $championship = $group->first()->championship;

                $stats = $group->mapWithKeys(function ($item) {
                    return [
                        $item->disciplineStatistic
                            ->statisticType
                            ->slug => $item->value
                    ];
                });

                return [
                    'championship' => $championship ? [
                        'id' => $championship->id,
                        'name' => $championship->name,
                    ] : null,

                    'statistics' => $stats,
                ];
            })
            ->values();

        $team = $championshipPlayer
            ->championshipTeam
            ?->team;

        $championship = $championshipPlayer
            ->championshipTeam
            ?->championshipDiscipline
            ?->championship;

        $data = [
            'player' => [
                'id' => $championshipPlayer->id,

                'player_id' => $player->id,

                'name' => trim(
                    $player->names . ' ' . $player->last_names
                ),

                'photo' => $player->photo
                    ? asset($player->photo)
                    : null,

                'jersey_number' =>
                    $championshipPlayer->jersey_number,

                'position' =>
                    $championshipPlayer->position,

                'is_captain' =>
                    $championshipPlayer->is_captain,

                'team' => $team ? [
                    'id' => $championshipPlayer
                        ->championshipTeam
                        ->id,

                    'team_id' => $team->id,

                    'name' => $team->name,

                    'logo' => $team->logo
                        ? asset($team->logo)
                        : null,
                ] : null,

                'championship' => $championship ? [
                    'id' => $championship->id,
                    'name' => $championship->name,
                ] : null,
            ],

            'statistics_by_championship' =>
                $statsByChampionship,
        ];

        return $this->successResponse(
            $data,
            'Jugador obtenido exitosamente'
        );
    }
}