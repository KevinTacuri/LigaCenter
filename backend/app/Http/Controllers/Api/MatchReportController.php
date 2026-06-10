<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\MatchReport;
use App\Traits\ApiResponse;
use Illuminate\Http\Request;
use OpenApi\Attributes as OA;
use App\Services\StandingService;
use App\Models\GameMatch;

class MatchReportController extends Controller
{
    use ApiResponse;
    protected StandingService $standingService;

    public function __construct(StandingService $standingService)
    {
        $this->standingService = $standingService;
    }

    #[OA\Get(
        path: '/api/match-reports',
        operationId: 'getMatchReports',
        summary: 'Listar actas',
        tags: ['Match Reports']
    )]
    #[OA\Security(name: 'sanctum')]
    public function index()
    {
        $reports = MatchReport::with('match')->get();

        return $this->successResponse(
            $reports,
            'Actas obtenidas exitosamente'
        );
    }

    #[OA\Post(
        path: '/api/match-reports',
        operationId: 'createMatchReport',
        summary: 'Crear acta',
        tags: ['Match Reports']
    )]
    #[OA\Security(name: 'sanctum')]
    #[OA\RequestBody(
        required: true,
        content: new OA\JsonContent(
            required: ['match_id'],
            properties: [
                new OA\Property(property: 'match_id', type: 'integer', example: 1),
                new OA\Property(property: 'local_score', type: 'integer', example: 2),
                new OA\Property(property: 'visitor_score', type: 'integer', example: 1),
                new OA\Property(property: 'observations', type: 'string', example: 'Partido sin incidencias')
            ]
        )
    )]
    public function store(Request $request)
    {
        $request->validate([
            'match_id' => 'required|exists:matches,id|unique:match_reports,match_id',
            'local_score' => 'nullable|integer|min:0',
            'visitor_score' => 'nullable|integer|min:0',
            'observations' => 'nullable|string',
        ]);

        $report = MatchReport::create([
            'match_id' => $request->match_id,
            'local_score' => $request->local_score ?? 0,
            'visitor_score' => $request->visitor_score ?? 0,
            'observations' => $request->observations,
        ]);

        return $this->successResponse(
            $report,
            'Acta creada exitosamente',
            201
        );
    }

    #[OA\Get(
        path: '/api/match-reports/{id}',
        operationId: 'getMatchReport',
        summary: 'Obtener acta',
        tags: ['Match Reports']
    )]
    #[OA\Security(name: 'sanctum')]
    public function show($id)
    {
        $report = MatchReport::with('match')->find($id);

        if (!$report) {
            return $this->errorResponse(
                'Acta no encontrada',
                404
            );
        }

        return $this->successResponse(
            $report,
            'Acta obtenida exitosamente'
        );
    }

    #[OA\Put(
        path: '/api/match-reports/{id}',
        operationId: 'updateMatchReport',
        summary: 'Actualizar acta',
        tags: ['Match Reports']
    )]
    #[OA\Security(name: 'sanctum')]
    public function update(Request $request, $id)
    {
        $report = MatchReport::find($id);

        if (!$report) {
            return $this->errorResponse(
                'Acta no encontrada',
                404
            );
        }

        if ($report->is_locked) {
            return $this->errorResponse(
                'El acta ya fue oficializada',
                400
            );
        }

        $request->validate([
            'local_score' => 'integer|min:0',
            'visitor_score' => 'integer|min:0',
            'observations' => 'nullable|string',
        ]);

        $report->update($request->only([
            'local_score',
            'visitor_score',
            'observations',
        ]));

        return $this->successResponse(
            $report,
            'Acta actualizada exitosamente'
        );
    }

    #[OA\Delete(
        path: '/api/match-reports/{id}',
        operationId: 'deleteMatchReport',
        summary: 'Eliminar acta',
        tags: ['Match Reports']
    )]
    #[OA\Security(name: 'sanctum')]
    public function destroy($id)
    {
        $report = MatchReport::find($id);

        if (!$report) {
            return $this->errorResponse(
                'Acta no encontrada',
                404
            );
        }

        if ($report->is_locked) {
            return $this->errorResponse(
                'No se puede eliminar un acta oficializada',
                400
            );
        }

        $report->delete();

        return $this->successResponse(
            null,
            'Acta eliminada exitosamente'
        );
    }

    #[OA\Post(
        path: '/api/match-reports/{id}/lock',
        operationId: 'lockMatchReport',
        summary: 'Oficializar resultado',
        tags: ['Match Reports']
    )]
    #[OA\Security(name: 'sanctum')]
    public function lock($id)
    {
        $report = MatchReport::find($id);

        if (!$report) {
            return $this->errorResponse(
                'Acta no encontrada',
                404
            );
        }

        if ($report->is_locked) {
            return $this->errorResponse(
                'El acta ya fue oficializada',
                400
            );
        }

        $match = GameMatch::find($report->match_id);

        $this->standingService->updateFromMatch(
            $match,
            $report->local_score,
            $report->visitor_score
        );

        $match->update([
            'status' => 'finalizado'
        ]);

        $report->update([
            'is_locked' => true
        ]);

        return $this->successResponse(
            $report,
            'Resultado oficializado correctamente'
        );
    }
}