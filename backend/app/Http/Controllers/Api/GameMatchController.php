<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\GameMatch;
use App\Traits\ApiResponse;
use Illuminate\Http\Request;
use OpenApi\Attributes as OA;

class GameMatchController extends Controller
{
    use ApiResponse;

    #[OA\Get(
        path: '/api/matches',
        operationId: 'getMatches',
        summary: 'Listar partidos',
        description: 'Obtiene una lista de partidos con filtros opcionales por disciplina, categoría, fecha y estado.',
        tags: ['Partidos']
    )]
    #[OA\Security(name: 'sanctum')]
    #[OA\Parameter(
        name: 'discipline_id',
        description: 'ID de la disciplina',
        in: 'query',
        required: false,
        schema: new OA\Schema(type: 'integer')
    )]
    #[OA\Parameter(
        name: 'category_id',
        description: 'ID de la categoría',
        in: 'query',
        required: false,
        schema: new OA\Schema(type: 'integer')
    )]
    #[OA\Parameter(
        name: 'round',
        description: 'Número de fecha',
        in: 'query',
        required: false,
        schema: new OA\Schema(type: 'integer')
    )]
    #[OA\Parameter(
        name: 'status',
        description: 'Estado del partido',
        in: 'query',
        required: false,
        schema: new OA\Schema(type: 'string', enum: ['programado', 'en_curso', 'finalizado', 'cancelado', 'reprogramado'])
    )]
    #[OA\Parameter(
        name: 'championship_id',
        description: 'ID del campeonato (opcional, para filtrar)',
        in: 'query',
        required: false,
        schema: new OA\Schema(type: 'integer')
    )]
    #[OA\Response(
        response: 200,
        description: 'Partidos obtenidos exitosamente'
    )]

    public function index(Request $request)
    {
        $query = GameMatch::with(['localTeam', 'visitorTeam', 'venue', 'discipline', 'category', 'report']);

        if (!$request->user()) {
            $query->whereHas('championship', function($q) {
                $q->where('is_public', true);
            });
        }

        if ($request->has('championship_id')) {
            $query->where('championship_id', $request->championship_id);
        }
        if ($request->has('discipline_id')) {
            $query->where('discipline_id', $request->discipline_id);
        }
        if ($request->has('category_id')) {
            $query->where('category_id', $request->category_id);
        }
        if ($request->has('round')) {
            $query->where('round', $request->round);
        }
        if ($request->has('status')) {
            $query->where('status', $request->status);
        }

        $matches = $query->orderBy('match_date')->orderBy('match_time')->get();
        return $this->successResponse($matches, 'Partidos obtenidos exitosamente');
    }

    #[OA\Get(
        path: '/api/matches/{id}',
        operationId: 'getMatchById',
        summary: 'Obtener partido',
        description: 'Obtiene la información detallada de un partido específico.',
        tags: ['Partidos']
    )]
    #[OA\Security(name: 'sanctum')]
    #[OA\Parameter(
        name: 'id',
        description: 'ID del partido',
        in: 'path',
        required: true,
        schema: new OA\Schema(type: 'integer')
    )]
    #[OA\Response(response: 200, description: 'Partido obtenido exitosamente')]
    #[OA\Response(response: 404, description: 'Partido no encontrado')]
    public function show($id)
    {
        $match = GameMatch::with(['localTeam', 'visitorTeam', 'venue', 'discipline', 'category', 'championship', 'report'])->find($id);
        if (!$match) {
            return $this->errorResponse('Partido no encontrado', 404);
        }
        return $this->successResponse($match, 'Partido obtenido exitosamente');
    }

    #[OA\Put(
        path: '/api/matches/{id}',
        operationId: 'updateMatch',
        summary: 'Actualizar partido',
        description: 'Actualiza la información de un partido.',
        tags: ['Partidos']
    )]
    #[OA\Security(name: 'sanctum')]
    #[OA\Parameter(
        name: 'id',
        in: 'path',
        required: true,
        schema: new OA\Schema(type: 'integer')
    )]
    #[OA\RequestBody(
        required: false,
        content: new OA\JsonContent(
            properties: [
                new OA\Property(property: 'match_date', type: 'string', format: 'date', example: '2026-06-20'),
                new OA\Property(property: 'match_time', type: 'string', example: '15:00'),
                new OA\Property(property: 'venue_id', type: 'integer', example: 1),
                new OA\Property(property: 'status', type: 'string', enum: ['programado', 'en_curso', 'finalizado', 'cancelado'], example: 'programado')
            ]
        )
    )]
    #[OA\Response(response: 200, description: 'Partido actualizado exitosamente')]
    #[OA\Response(response: 404, description: 'Partido no encontrado')]
    #[OA\Response(response: 422, description: 'Error de validación')]
    public function update(Request $request, $id)
    {
        $match = GameMatch::find($id);
        if (!$match) {
            return $this->errorResponse('Partido no encontrado', 404);
        }

        $request->validate([
            'match_date' => 'date',
            'match_time' => 'string',
            'venue_id' => 'exists:venues,id',
            'status' => 'in:programado,en_curso,finalizado,cancelado',
        ]);

        $match->update($request->all());
        return $this->successResponse($match, 'Partido actualizado exitosamente');
    }

    #[OA\Put(
        path: '/api/matches/{id}/reschedule',
        operationId: 'rescheduleMatch',
        summary: 'Reprogramar partido',
        description: 'Cambia la fecha, hora y/o escenario de un partido.',
        tags: ['Partidos']
    )]
    #[OA\Security(name: 'sanctum')]
    #[OA\Parameter(
        name: 'id',
        in: 'path',
        required: true,
        schema: new OA\Schema(type: 'integer')
    )]
    #[OA\RequestBody(
        required: true,
        content: new OA\JsonContent(
            required: ['match_date', 'match_time', 'venue_id'],
            properties: [
                new OA\Property(property: 'match_date', type: 'string', format: 'date', example: '2026-06-25'),
                new OA\Property(property: 'match_time', type: 'string', example: '16:00'),
                new OA\Property(property: 'venue_id', type: 'integer', example: 2)
            ]
        )
    )]
    #[OA\Response(response: 200, description: 'Partido reprogramado exitosamente')]
    #[OA\Response(response: 404, description: 'Partido no encontrado')]
    #[OA\Response(response: 422, description: 'Error de validación')]
    public function reschedule(Request $request, $id)
    {
        $match = GameMatch::find($id);
        if (!$match) {
            return $this->errorResponse('Partido no encontrado', 404);
        }

        $request->validate([
            'match_date' => 'required|date',
            'match_time' => 'required|string',
            'venue_id' => 'required|exists:venues,id',
        ]);

        $match->update([
            'match_date' => $request->match_date,
            'match_time' => $request->match_time,
            'venue_id' => $request->venue_id,
            'status' => 'reprogramado',
        ]);

        return $this->successResponse($match, 'Partido reprogramado exitosamente');
    }

    #[OA\Get(
        path: '/api/public/matches/live',
        operationId: 'getPublicLiveMatches',
        summary: 'Listar partidos en vivo',
        description: 'Obtiene los partidos en curso de campeonatos públicos, con filtro opcional por campeonato.',
        tags: ['Partidos'],
        parameters: [
            new OA\Parameter(name: 'championship_id', description: 'ID del campeonato público', in: 'query', required: false, schema: new OA\Schema(type: 'integer'))
        ],
        responses: [
            new OA\Response(response: 200, description: 'Partidos en vivo obtenidos exitosamente')
        ]
    )]
    public function live(Request $request)
    {
        $request->validate(['championship_id' => 'nullable|integer']);

        $query = GameMatch::with([
                'localTeam:id,name,logo',
                'visitorTeam:id,name,logo',
                'venue:id,name,location',
                'discipline:id,name',
                'category:id,name',
            ])
            ->where('status', 'en_curso')
            ->whereHas('championship', fn ($q) => $q->where('is_public', true));

        if ($request->filled('championship_id')) {
            $query->where('championship_id', $request->integer('championship_id'));
        }

        return $this->successResponse(
            $query->orderBy('match_date')->orderBy('match_time')->get(),
            'Partidos en vivo obtenidos exitosamente'
        );
    }

    #[OA\Get(
        path: '/api/public/matches/upcoming',
        operationId: 'getPublicUpcomingMatches',
        summary: 'Listar próximos partidos',
        description: 'Obtiene los próximos partidos programados de campeonatos públicos.',
        tags: ['Partidos'],
        parameters: [
            new OA\Parameter(name: 'championship_id', description: 'ID del campeonato público', in: 'query', required: false, schema: new OA\Schema(type: 'integer')),
            new OA\Parameter(name: 'discipline_id', description: 'ID de la disciplina', in: 'query', required: false, schema: new OA\Schema(type: 'integer')),
            new OA\Parameter(name: 'category_id', description: 'ID de la categoría', in: 'query', required: false, schema: new OA\Schema(type: 'integer')),
            new OA\Parameter(name: 'limit', description: 'Cantidad máxima de partidos a retornar', in: 'query', required: false, schema: new OA\Schema(type: 'integer', default: 20, minimum: 1))
        ],
        responses: [
            new OA\Response(response: 200, description: 'Próximos partidos obtenidos exitosamente')
        ]
    )]
    public function upcoming(Request $request)
    {
        $request->validate([
            'championship_id' => 'nullable|integer',
            'discipline_id' => 'nullable|integer',
            'category_id' => 'nullable|integer',
            'limit' => 'nullable|integer|min:1|max:50',
        ]);

        $query = GameMatch::with([
                'localTeam:id,name,logo',
                'visitorTeam:id,name,logo',
                'venue:id,name,location',
                'discipline:id,name',
                'category:id,name',
            ])
            ->where('status', 'programado')
            ->whereDate('match_date', '>=', now()->toDateString())
            ->whereHas('championship', fn ($q) => $q->where('is_public', true));

        foreach (['championship_id', 'discipline_id', 'category_id'] as $filter) {
            if ($request->filled($filter)) {
                $query->where($filter, $request->input($filter));
            }
        }

        return $this->successResponse(
            $query->orderBy('match_date')->orderBy('match_time')->limit($request->integer('limit', 20))->get(),
            'Próximos partidos obtenidos exitosamente'
        );
    }

    #[OA\Get(path: '/api/public/matches', operationId: 'getPublicMatches', summary: 'Listar partidos públicos', tags: ['Partidos'], responses: [new OA\Response(response: 200, description: 'Consulta exitosa'), new OA\Response(response: 404, description: 'Recurso no encontrado')])]
    public function indexPublic(Request $request)
    {
        $request->validate([
            'championship_id' => 'nullable|integer',
            'discipline_id' => 'nullable|integer',
            'category_id' => 'nullable|integer',
            'round' => 'nullable|integer',
            'status' => 'nullable|in:programado,en_curso,finalizado,cancelado,reprogramado',
        ]);

        $query = GameMatch::with([
                'localTeam:id,name,logo',
                'visitorTeam:id,name,logo',
                'venue:id,name,location',
                'discipline:id,name',
                'category:id,name',
            ])
            ->whereHas('championship', fn ($q) => $q->where('is_public', true));

        foreach (['championship_id', 'discipline_id', 'category_id', 'round', 'status'] as $filter) {
            if ($request->filled($filter)) {
                $query->where($filter, $request->input($filter));
            }
        }

        return $this->successResponse(
            $query->orderBy('match_date')->orderBy('match_time')->get(),
            'Partidos públicos obtenidos exitosamente'
        );
    }

    #[OA\Get(path: '/api/public/matches/{id}', operationId: 'getPublicMatch', summary: 'Obtener partido público', tags: ['Partidos'], responses: [new OA\Response(response: 200, description: 'Consulta exitosa'), new OA\Response(response: 404, description: 'Recurso no encontrado')])]
    public function showPublic($id)
    {
        $match = GameMatch::with([
                'localTeam:id,name,logo',
                'visitorTeam:id,name,logo',
                'venue:id,name,location',
                'discipline:id,name',
                'category:id,name',
                'championship:id,name',
            ])
            ->whereHas('championship', fn ($q) => $q->where('is_public', true))
            ->find($id);

        if (!$match) {
            return $this->errorResponse('Partido público no encontrado', 404);
        }

        return $this->successResponse($match, 'Partido público obtenido exitosamente');
    }

}