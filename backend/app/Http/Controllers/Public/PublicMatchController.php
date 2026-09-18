<?php

namespace App\Http\Controllers\Public;

use App\Models\GameMatch;
use App\Models\MatchIncidence;
use App\Http\Resources\Public\PublicMatchResource;
use Illuminate\Http\Request;

class PublicMatchController extends PublicController
{
    public function index(Request $request)
    {
        $disciplineId = $request->get('discipline_id');
        $status = $request->get('status');
        $championshipId = $request->get('championship_id');
        $search = $request->get('search');

        $matches = GameMatch::whereHas('championship', function ($query) {
                $query->where('is_public', true);
            })
            ->with(['localTeam', 'visitorTeam', 'venue', 'group', 'championship'])
            ->when($disciplineId, function ($query) use ($disciplineId) {
                return $query->whereHas('championship.disciplines', function ($q) use ($disciplineId) {
                    $q->where('disciplines.id', $disciplineId);
                });
            })
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
            ->when($championshipId, function ($query) use ($championshipId) {
                return $query->where('championship_id', $championshipId);
            })
            ->when($search, function ($query) use ($search) {
                return $query->whereHas('localTeam', function ($q) use ($search) {
                    $q->where('name', 'LIKE', "%{$search}%");
                })->orWhereHas('visitorTeam', function ($q) use ($search) {
                    $q->where('name', 'LIKE', "%{$search}%");
                });
            })
            ->orderBy('match_date', 'desc')
            ->orderBy('match_time', 'desc')
            ->get();

        return $this->successResponse(
            PublicMatchResource::collection($matches)->response()->getData(true),
            'Partidos obtenidos exitosamente'
        );
    }

    public function live()
    {
        $matches = GameMatch::whereHas('championship', function ($query) {
                $query->where('is_public', true);
            })
            ->where('status', 'en_curso')
            ->with(['localTeam', 'visitorTeam', 'championship', 'venue'])
            ->orderBy('match_date')
            ->orderBy('match_time')
            ->get();

        return $this->successResponse(
            PublicMatchResource::collection($matches),
            'Partidos en vivo obtenidos exitosamente'
        );
    }

    public function highlighted()
    {
        // Partidos en vivo primero
        $live = GameMatch::whereHas('championship', function ($query) {
                $query->where('is_public', true);
            })
            ->where('status', 'en_curso')
            ->with(['localTeam', 'visitorTeam', 'championship', 'venue'])
            ->limit(4)
            ->get();

        // Si hay menos de 4 en vivo, completar con próximos
        if ($live->count() < 4) {
            $upcoming = GameMatch::whereHas('championship', function ($query) {
                    $query->where('is_public', true);
                })
                ->where('status', 'programado')
                ->where('match_date', '>=', now()->toDateString())
                ->with(['localTeam', 'visitorTeam', 'championship', 'venue'])
                ->orderBy('match_date')
                ->orderBy('match_time')
                ->limit(4 - $live->count())
                ->get();

            $live = $live->merge($upcoming);
        }

        // Si aún faltan, agregar finalizados recientes
        if ($live->count() < 4) {
            $recent = GameMatch::whereHas('championship', function ($query) {
                    $query->where('is_public', true);
                })
                ->where('status', 'finalizado')
                ->with(['localTeam', 'visitorTeam', 'championship', 'venue'])
                ->orderBy('match_date', 'desc')
                ->orderBy('match_time', 'desc')
                ->limit(4 - $live->count())
                ->get();

            $live = $live->merge($recent);
        }

        return $this->successResponse(
            PublicMatchResource::collection($live),
            'Partidos destacados obtenidos exitosamente'
        );
    }

    public function show($id)
    {
        $match = GameMatch::whereHas('championship', function ($query) {
                $query->where('is_public', true);
            })
            ->with([
                'localTeam',
                'visitorTeam',
                'championship',
                'venue',
                'group',
                'report',
                'incidences.player'
            ])
            ->find($id);

        if (!$match) {
            return $this->errorResponse('Partido no encontrado', 404);
        }

        // Agrupar incidencias por tipo
        $incidences = $match->incidences->groupBy('type')->map(function ($group) {
            return $group->map(function ($incidence) {
                return [
                    'id' => $incidence->id,
                    'minute' => $incidence->minute,
                    'type' => $incidence->type,
                    'player' => $incidence->player->player ? $incidence->player->player->names . ' ' . $incidence->player->player->last_names : null,
                    'description' => $incidence->description,
                ];
            });
        });

        $data = [
            'match' => new PublicMatchResource($match),
            'incidences' => $incidences,
            'report' => $match->report ? [
                'id' => $match->report->id,
                'summary' => $match->report->summary,
                'created_at' => $match->report->created_at?->format('Y-m-d H:i'),
            ] : null,
        ];

        return $this->successResponse($data, 'Partido obtenido exitosamente');
    }

    public function matches($id, Request $request)
    {
        $championship = Championship::where('is_public', true)->find($id);

        if (!$championship) {
            return $this->errorResponse('Campeonato no encontrado', 404);
        }

        $status = $request->get('status');
        $categoryId = $request->get('category_id');
        $disciplineId = $request->get('discipline_id');

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
            ->when($categoryId, function ($query) use ($categoryId) {
                return $query->where('category_id', $categoryId);
            })
            ->when($disciplineId, function ($query) use ($disciplineId) {
                return $query->where('discipline_id', $disciplineId);
            })
            // Filtrar solo partidos con equipos aprobados
            ->whereHas('localTeam', function ($q) {
                $q->where('registration_status', 'aprobado');
            })
            ->whereHas('visitorTeam', function ($q) {
                $q->where('registration_status', 'aprobado');
            })
            ->orderBy('match_date', 'desc')
            ->orderBy('match_time', 'desc')
            ->paginate(20);

        return $this->successResponse(
            PublicMatchResource::collection($matches)->response()->getData(true),
            'Partidos obtenidos exitosamente'
        );
    }
}