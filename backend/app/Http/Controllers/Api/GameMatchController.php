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

    public function syncTimer(Request $request, $id)
    {
        $request->validate([
            'current_elapsed_time' => 'required|integer|min:0',
            'current_period' => 'required|integer|min:0',
            'timer_status' => 'required|in:stopped,running,paused,finished',
            'timer_started_at' => 'nullable|date',
        ]);

        $match = GameMatch::findOrFail($id);
        
        $match->current_elapsed_time = $request->current_elapsed_time;
        $match->current_period = $request->current_period;
        $match->timer_status = $request->timer_status;
        $match->timer_started_at = $request->timer_started_at;
        $match->save();

        return $this->successResponse(
            [
                'current_elapsed_time' => $match->current_elapsed_time,
                'current_period' => $match->current_period,
                'timer_status' => $match->timer_status,
                'timer_started_at' => $match->timer_started_at,
            ],
            'Timer sincronizado correctamente'
        );
    }
}