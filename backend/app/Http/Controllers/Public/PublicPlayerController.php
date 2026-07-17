<?php

namespace App\Http\Controllers\Public;

use App\Models\Player;
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

        $players = Player::whereHas('teams.championship', function ($query) {
                $query->where('is_public', true);
            })
            ->with(['teams'])
            ->when($teamId, function ($query) use ($teamId) {
                return $query->whereHas('teams', function ($q) use ($teamId) {
                    $q->where('team_id', $teamId);
                });
            })
            ->when($championshipId, function ($query) use ($championshipId) {
                return $query->whereHas('teams.championship', function ($q) use ($championshipId) {
                    $q->where('id', $championshipId);
                });
            })
            ->when($search, function ($query) use ($search) {
                return $query->where('names', 'LIKE', "%{$search}%")
                    ->orWhere('last_names', 'LIKE', "%{$search}%");
            })
            ->orderBy('names')
            ->paginate(20);

        return $this->successResponse(
            PublicPlayerResource::collection($players)->response()->getData(true),
            'Jugadores obtenidos exitosamente'
        );
    }

    public function show($id)
    {
        $player = Player::whereHas('teams.championship', function ($query) {
                $query->where('is_public', true);
            })
            ->with(['teams.championship', 'teams.category'])
            ->find($id);

        if (!$player) {
            return $this->errorResponse('Jugador no encontrado', 404);
        }

        // Estadísticas del jugador
        $statistics = PlayerStatistic::where('player_id', $id)
            ->whereHas('championship', function ($q) {
                $q->where('is_public', true);
            })
            ->with(['disciplineStatistic', 'championship'])
            ->get();

        // Agrupar estadísticas por campeonato
        $statsByChampionship = $statistics->groupBy('championship_id')->map(function ($group, $championshipId) {
            $championship = $group->first()->championship;
            $stats = $group->mapWithKeys(function ($item) {
                return [$item->disciplineStatistic->statisticType->slug => $item->value];
            });

            return [
                'championship' => $championship ? [
                    'id' => $championship->id,
                    'name' => $championship->name,
                ] : null,
                'statistics' => $stats,
            ];
        })->values();

        $data = [
            'player' => [
                'id' => $player->id,
                'name' => $player->names . ' ' . $player->last_names,
                'photo' => $player->photo ? asset('storage/' . $player->photo) : null,
                'team' => $player->teams->first() ? [
                    'id' => $player->teams->first()->id,
                    'name' => $player->teams->first()->name,
                    'logo' => $player->teams->first()->logo ? asset('storage/' . $player->teams->first()->logo) : null,
                ] : null,
            ],
            'statistics_by_championship' => $statsByChampionship,
        ];

        return $this->successResponse($data, 'Jugador obtenido exitosamente');
    }
}