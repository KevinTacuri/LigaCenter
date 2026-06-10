<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use Illuminate\Http\Request;
use App\Models\MatchIncidence;
use App\Models\MatchReport;
use App\Traits\ApiResponse;
use OpenApi\Attributes as OA;

class MatchIncidenceController extends Controller
{
    use ApiResponse;

    #[OA\Get(
        path: '/api/match-incidences',
        operationId: 'getMatchIncidences',
        summary: 'Listar incidencias',
        tags: ['Match Incidences']
    )]
    #[OA\Parameter(
        name: 'match_id',
        description: 'ID del partido (opcional)',
        in: 'query',
        required: false,
        schema: new OA\Schema(type: 'integer')
    )]
    #[OA\Parameter(
        name: 'championship_id',
        description: 'ID del campeonato (opcional, filtra por partidos del campeonato)',
        in: 'query',
        required: false,
        schema: new OA\Schema(type: 'integer')
    )]
    #[OA\Response(
        response: 200,
        description: 'Incidencias obtenidas exitosamente'
    )]
    #[OA\Security(name: 'sanctum')]
    public function index(Request $request)
    {
        $query = MatchIncidence::with(['match', 'player', 'team']);

        if ($request->has('match_id')) {
            $query->where('match_id', $request->match_id);
        }

        if ($request->has('championship_id')) {
            $query->whereHas('match', function ($q) use ($request) {
                $q->where('championship_id', $request->championship_id);
            });
        }

        $incidences = $query->get();

        return $this->successResponse(
            $incidences,
            'Incidencias obtenidas exitosamente'
        );
    }

    #[OA\Post(
        path: '/api/match-incidences',
        operationId: 'createMatchIncidence',
        summary: 'Registrar incidencia',
        tags: ['Match Incidences']
    )]
    #[OA\Response(
        response: 201,
        description: 'Incidencia registrada exitosamente'
    )]
    #[OA\Response(
        response: 400,
        description: 'El partido ya fue oficializado'
    )]
    #[OA\Response(
        response: 422,
        description: 'Error de validación'
    )]
    #[OA\Security(name: 'sanctum')]
    #[OA\RequestBody(
        required: true,
        content: new OA\JsonContent(
            required: [
                'match_id',
                'team_id',
                'incidence_type',
                'minute',
                'second'
            ],
            properties: [
                new OA\Property(property: 'match_id', type: 'integer', example: 1),
                new OA\Property(property: 'player_id', type: 'integer', example: 15),
                new OA\Property(property: 'team_id', type: 'integer', example: 2),
                new OA\Property(property: 'incidence_type', type: 'string', example: 'goal'),
                new OA\Property(property: 'minute', type: 'integer', example: 45),
                new OA\Property(property: 'second', type: 'integer', example: 12),
                new OA\Property(property: 'description', type: 'string', example: 'Goal from penalty')
            ]
        )
    )]
    public function store(Request $request)
    {
        $request->validate([
            'match_id' => 'required|exists:matches,id',
            'player_id' => 'nullable|exists:players,id',
            'team_id' => 'required|exists:teams,id',
            'incidence_type' => 'required|string',
            'minute' => 'required|integer|min:0|max:130',
            'second' => 'required|integer|min:0|max:59',
            'description' => 'nullable|string',
        ]);

        $report = MatchReport::where(
            'match_id',
            $request->match_id
        )->first();

        if ($report && $report->is_locked) {
            return $this->errorResponse(
                'El partido ya fue oficializado',
                400
            );
        }

        $incidence = MatchIncidence::create([
            'match_id' => $request->match_id,
            'player_id' => $request->player_id,
            'team_id' => $request->team_id,
            'incidence_type' => $request->incidence_type,
            'minute' => $request->minute,
            'second' => $request->second,
            'description' => $request->description,
            'created_by_user_id' => auth()->id(),
        ]);

        return $this->successResponse(
            $incidence,
            'Incidencia registrada exitosamente',
            201
        );
    }

    #[OA\Get(
        path: '/api/match-incidences/{id}',
        operationId: 'getMatchIncidence',
        summary: 'Obtener incidencia',
        tags: ['Match Incidences']
    )]
    #[OA\Response(
        response: 200,
        description: 'Incidencia obtenida exitosamente'
    )]
    #[OA\Response(
        response: 404,
        description: 'Incidencia no encontrada'
    )]
    #[OA\Security(name: 'sanctum')]
    public function show($id)
    {
        $incidence = MatchIncidence::with([
            'match',
            'player',
            'team'
        ])->find($id);

        if (!$incidence) {
            return $this->errorResponse(
                'Incidencia no encontrada',
                404
            );
        }

        return $this->successResponse(
            $incidence,
            'Incidencia obtenida exitosamente'
        );
    }

    #[OA\Put(
        path: '/api/match-incidences/{id}',
        operationId: 'updateMatchIncidence',
        summary: 'Actualizar incidencia',
        tags: ['Match Incidences']
    )]
    #[OA\Response(
        response: 200,
        description: 'Incidencia actualizada exitosamente'
    )]
    #[OA\Response(
        response: 400,
        description: 'El partido ya fue oficializado'
    )]
    #[OA\Response(
        response: 404,
        description: 'Incidencia no encontrada'
    )]
    #[OA\Response(
        response: 422,
        description: 'Error de validación'
    )]
    #[OA\Security(name: 'sanctum')]
    public function update(Request $request, $id)
    {
        $incidence = MatchIncidence::find($id);

        if (!$incidence) {
            return $this->errorResponse(
                'Incidencia no encontrada',
                404
            );
        }

        $report = MatchReport::where(
            'match_id',
            $incidence->match_id
        )->first();

        if ($report && $report->is_locked) {
            return $this->errorResponse(
                'El partido ya fue oficializado',
                400
            );
        }

        $request->validate([
            'player_id' => 'nullable|exists:players,id',
            'team_id' => 'exists:teams,id',
            'incidence_type' => 'string',
            'minute' => 'integer|min:0|max:130',
            'second' => 'integer|min:0|max:59',
            'description' => 'nullable|string',
        ]);

        $incidence->update($request->all());

        return $this->successResponse(
            $incidence,
            'Incidencia actualizada exitosamente'
        );
    }

    #[OA\Delete(
        path: '/api/match-incidences/{id}',
        operationId: 'deleteMatchIncidence',
        summary: 'Eliminar incidencia',
        tags: ['Match Incidences']
    )]
    #[OA\Response(
        response: 200,
        description: 'Incidencia eliminada exitosamente'
    )]
    #[OA\Response(
        response: 400,
        description: 'El partido ya fue oficializado'
    )]
    #[OA\Response(
        response: 404,
        description: 'Incidencia no encontrada'
    )]
    #[OA\Security(name: 'sanctum')]
    public function destroy($id)
    {
        $incidence = MatchIncidence::find($id);

        if (!$incidence) {
            return $this->errorResponse(
                'Incidencia no encontrada',
                404
            );
        }

        $report = MatchReport::where(
            'match_id',
            $incidence->match_id
        )->first();

        if ($report && $report->is_locked) {
            return $this->errorResponse(
                'El partido ya fue oficializado',
                400
            );
        }

        $incidence->delete();

        return $this->successResponse(
            null,
            'Incidencia eliminada exitosamente'
        );
    }
}