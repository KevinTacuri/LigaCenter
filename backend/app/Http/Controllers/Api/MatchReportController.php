<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use Illuminate\Http\Request;
use App\Models\MatchReport;
use App\Models\GameMatch;
use App\Traits\ApiResponse;
use App\Services\StandingService;
use App\Services\SanctionService;
use App\Services\PlayerStatisticService;
use OpenApi\Attributes as OA;

class MatchReportController extends Controller
{
    use ApiResponse;

    protected $standingService;
    protected $sanctionService;
    protected $playerStatisticService;

    public function __construct(
        StandingService $standingService,
        SanctionService $sanctionService,
        PlayerStatisticService $playerStatisticService
    ) {
        $this->standingService = $standingService;
        $this->sanctionService = $sanctionService;
        $this->playerStatisticService = $playerStatisticService;
    }

    #[OA\Get(
        path: '/api/match-reports',
        operationId: 'getMatchReports',
        summary: 'Listar actas de partido',
        tags: ['Match Reports']
    )]
    #[OA\Parameter(
        name: 'championship_id',
        description: 'ID del campeonato (opcional)',
        in: 'query',
        required: false,
        schema: new OA\Schema(type: 'integer')
    )]
    #[OA\Response(
        response: 200,
        description: 'Actas obtenidas exitosamente'
    )]
    #[OA\Security(name: 'sanctum')]
    public function index(Request $request)
    {
        $query = MatchReport::with('match');

        if ($request->has('championship_id')) {
            $query->whereHas('match', function ($q) use ($request) {
                $q->where('championship_id', $request->championship_id);
            });
        }

        $reports = $query->get();

        return $this->successResponse($reports, 'Actas obtenidas exitosamente');
    }

    #[OA\Post(
        path: '/api/match-reports',
        operationId: 'createMatchReport',
        summary: 'Registrar acta de partido',
        tags: ['Match Reports']
    )]
    #[OA\Response(
        response: 201,
        description: 'Acta registrada exitosamente'
    )]
    #[OA\Response(
        response: 400,
        description: 'Ya existe un acta para este partido'
    )]
    #[OA\Response(
        response: 422,
        description: 'Error de validación'
    )]
    #[OA\Security(name: 'sanctum')]
    #[OA\RequestBody(
        required: true,
        content: new OA\JsonContent(
            required: ['match_id', 'local_score', 'visitor_score'],
            properties: [
                new OA\Property(property: 'match_id', type: 'integer', example: 1),
                new OA\Property(property: 'local_score', type: 'integer', example: 2),
                new OA\Property(property: 'visitor_score', type: 'integer', example: 1),
                new OA\Property(property: 'referee_signature', type: 'string', example: 'Juan Perez'),
                new OA\Property(property: 'delegate_signature', type: 'string', example: 'Maria Gomez'),
                new OA\Property(property: 'observations', type: 'string', example: 'Partido disputado'),
                new OA\Property(property: 'is_locked', type: 'boolean', example: false)
            ]
        )
    )]
    public function store(Request $request)
    {
        $request->validate([
            'match_id' => 'required|exists:matches,id',
            'local_score' => 'required|integer|min:0',
            'visitor_score' => 'required|integer|min:0',
            'referee_signature' => 'nullable|string',
            'delegate_signature' => 'nullable|string',
            'observations' => 'nullable|string',
            'is_locked' => 'boolean',
        ]);

        $existing = MatchReport::where('match_id', $request->match_id)->first();
        if ($existing) {
            return $this->errorResponse('Ya existe un acta para este partido', 400);
        }

        $data = $request->all();
        $data['home_score'] = $data['local_score'];
        $data['away_score'] = $data['visitor_score'];
        unset($data['local_score'], $data['visitor_score']);

        $report = MatchReport::create($data);
        return $this->successResponse($report, 'Acta registrada exitosamente', 201);
    }

    #[OA\Get(
        path: '/api/match-reports/{id}',
        operationId: 'getMatchReport',
        summary: 'Obtener acta por ID',
        tags: ['Match Reports']
    )]
    #[OA\Response(
        response: 200,
        description: 'Acta obtenida exitosamente'
    )]
    #[OA\Response(
        response: 404,
        description: 'Acta no encontrada'
    )]
    #[OA\Security(name: 'sanctum')]
    public function show($id)
    {
        $report = MatchReport::with('match')->find($id);
        if (!$report) {
            return $this->errorResponse('Acta no encontrada', 404);
        }
        return $this->successResponse($report, 'Acta obtenida exitosamente');
    }

    #[OA\Get(
        path: '/api/match-reports/by-match/{matchId}',
        operationId: 'getMatchReportByMatch',
        summary: 'Obtener acta por partido',
        tags: ['Match Reports']
    )]
    #[OA\Response(
        response: 200,
        description: 'Acta obtenida exitosamente'
    )]
    #[OA\Response(
        response: 404,
        description: 'Acta no encontrada'
    )]
    #[OA\Security(name: 'sanctum')]
    public function getByMatch($matchId)
    {
        $report = MatchReport::with('match')->where('match_id', $matchId)->first();
        return $this->successResponse($report, 'Acta obtenida exitosamente');
    }

    #[OA\Put(
        path: '/api/match-reports/{id}',
        operationId: 'updateMatchReport',
        summary: 'Actualizar acta',
        tags: ['Match Reports']
    )]
    #[OA\Response(
        response: 200,
        description: 'Acta actualizada exitosamente'
    )]
    #[OA\Response(
        response: 400,
        description: 'El acta ya está bloqueada'
    )]
    #[OA\Response(
        response: 404,
        description: 'Acta no encontrada'
    )]
    #[OA\Response(
        response: 422,
        description: 'Error de validación'
    )]
    #[OA\Security(name: 'sanctum')]
    public function update(Request $request, $id)
    {
        $report = MatchReport::find($id);
        if (!$report) {
            return $this->errorResponse('Acta no encontrada', 404);
        }

        if ($report->is_locked) {
            return $this->errorResponse('El acta ya está bloqueada', 400);
        }

        $request->validate([
            'local_score' => 'integer|min:0',
            'visitor_score' => 'integer|min:0',
            'referee_signature' => 'nullable|string',
            'delegate_signature' => 'nullable|string',
            'observations' => 'nullable|string',
            'is_locked' => 'boolean',
        ]);

        $data = $request->all();
        if (isset($data['local_score'])) {
            $data['home_score'] = $data['local_score'];
            unset($data['local_score']);
        }
        if (isset($data['visitor_score'])) {
            $data['away_score'] = $data['visitor_score'];
            unset($data['visitor_score']);
        }

        $report->update($data);
        return $this->successResponse($report, 'Acta actualizada exitosamente');
    }

    #[OA\Post(
        path: '/api/match-reports/{id}/lock',
        operationId: 'lockMatchReport',
        summary: 'Bloquear acta',
        description: 'Bloquea el acta, actualiza tabla de posiciones, estadísticas de jugadores y genera sanciones',
        tags: ['Match Reports']
    )]
    #[OA\Response(
        response: 200,
        description: 'Acta bloqueada exitosamente'
    )]
    #[OA\Response(
        response: 400,
        description: 'El acta ya está bloqueada o no hay resultados'
    )]
    #[OA\Response(
        response: 404,
        description: 'Acta no encontrada'
    )]
    #[OA\Security(name: 'sanctum')]
    public function lock(Request $request, $id)
    {
        $report = MatchReport::find($id);
        if (!$report) {
            return $this->errorResponse('Acta no encontrada', 404);
        }

        if ($report->is_locked) {
            return $this->errorResponse('El acta ya está bloqueada', 400);
        }

        if ($report->local_score === null || $report->visitor_score === null) {
            return $this->errorResponse('No hay resultados registrados para este partido', 400);
        }

        $match = GameMatch::find($report->match_id);
        if (!$match) {
            return $this->errorResponse('Partido no encontrado', 404);
        }

        $isWalkover = strpos($report->observations ?? '', 'WALKOVER') !== false || 
                      strpos($report->observations ?? '', 'W.O.') !== false;

        $tournamentId = $request->input('tournament_id', null);
        
        // SIEMPRE actualizar la tabla de posiciones (incluso para Walkover)
        $this->standingService->updateFromMatch($match, $report->local_score, $report->visitor_score);

        // Solo actualizar estadisticas de jugadores y sanciones si NO es WO
        if (!$isWalkover) {
            $this->playerStatisticService->updateFromMatch($match, $tournamentId);
            $this->sanctionService->generateAutomaticSanctions($match->id);
        } else {
            \Log::info('Walkover detectado para el partido ' . $match->id . '. Tabla de posiciones actualizada, estadisticas y sanciones omitidas.');
        }

        $report->update(['is_locked' => true]);
        $match->update(['status' => 'finalizado']);

        // Disparar evento de WebSocket
        event(new \App\Events\MatchUpdated($match));

        return $this->successResponse([
            'report' => $report,
            'match' => $match,
        ], 'Acta bloqueada exitosamente.');
    }

    #[OA\Delete(
        path: '/api/match-reports/{id}',
        operationId: 'deleteMatchReport',
        summary: 'Eliminar acta',
        tags: ['Match Reports']
    )]
    #[OA\Response(
        response: 200,
        description: 'Acta eliminada exitosamente'
    )]
    #[OA\Response(
        response: 400,
        description: 'No se puede eliminar un acta bloqueada'
    )]
    #[OA\Response(
        response: 404,
        description: 'Acta no encontrada'
    )]
    #[OA\Security(name: 'sanctum')]
    public function destroy($id)
    {
        $report = MatchReport::find($id);
        if (!$report) {
            return $this->errorResponse('Acta no encontrada', 404);
        }

        if ($report->is_locked) {
            return $this->errorResponse('No se puede eliminar un acta bloqueada', 400);
        }

        $report->delete();
        return $this->successResponse(null, 'Acta eliminada exitosamente');
    }
}