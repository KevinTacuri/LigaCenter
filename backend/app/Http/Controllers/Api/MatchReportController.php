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

        $report = MatchReport::create($request->all());
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

        $report->update($request->all());
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

        if ($report->home_score === null || $report->away_score === null) {
            return $this->errorResponse('No hay resultados registrados para este partido', 400);
        }

        $match = GameMatch::find($report->match_id);
        if (!$match) {
            return $this->errorResponse('Partido no encontrado', 404);
        }

        $this->standingService->updateFromMatch($match, $report->home_score, $report->away_score);

        $this->playerStatisticService->updateFromMatch($match, $match->championship_id);

        $this->sanctionService->generateAutomaticSanctions($match->id);

        $report->update(['is_locked' => true]);

        $match->update(['status' => 'finalizado']);

        return $this->successResponse([
            'report' => $report,
            'match' => $match,
        ], 'Acta bloqueada exitosamente. Tabla de posiciones, estadísticas de jugadores y sanciones actualizadas.');
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

    #[OA\Post(
        path: '/api/match-reports/{id}/walkover',
        operationId: 'walkoverMatch',
        summary: 'Registrar Walkover (WO)',
        description: 'Marca un partido como walkover cuando un equipo no se presenta.',
        tags: ['Match Reports']
    )]
    #[OA\Response(
        response: 200,
        description: 'Walkover registrado exitosamente'
    )]
    #[OA\Response(
        response: 400,
        description: 'El partido ya está bloqueado o tiene resultados'
    )]
    #[OA\Response(
        response: 404,
        description: 'Acta no encontrada'
    )]
    #[OA\Security(name: 'sanctum')]

    public function walkover(Request $request, $id)
    {
        try {
            $report = MatchReport::find($id);
            if (!$report) {
                return $this->errorResponse('Acta no encontrada', 404);
            }

            if ($report->is_locked) {
                return $this->errorResponse('El acta ya está bloqueada', 400);
            }

            $request->validate([
                'forfeited_team_id' => 'required|in:local,visitor',
            ]);

            $match = GameMatch::find($report->match_id);
            if (!$match) {
                return $this->errorResponse('Partido no encontrado', 404);
            }

            if ($match->status === 'finalizado') {
                return $this->errorResponse('El partido ya está finalizado', 400);
            }

            $isLocalForfeit = $request->forfeited_team_id === 'local';
            
            // Valores por defecto
            $localScore = 0;
            $visitorScore = 3;
            $winnerTeamId = $match->visitor_team_id;
            $loserTeamId = $match->local_team_id;
            $forfeitedTeam = 'local';

            if (!$isLocalForfeit) {
                $localScore = 3;
                $visitorScore = 0;
                $winnerTeamId = $match->local_team_id;
                $loserTeamId = $match->visitor_team_id;
                $forfeitedTeam = 'visitante';
            }

            // Ajustar por deporte
            $disciplineName = $match->discipline?->name ?? '';
            $disciplineLower = strtolower($disciplineName);
            
            if (str_contains($disciplineLower, 'basquet') || 
                str_contains($disciplineLower, 'básquet') || 
                str_contains($disciplineLower, 'basketball') || 
                str_contains($disciplineLower, 'baloncesto')) {
                $localScore = $isLocalForfeit ? 0 : 20;
                $visitorScore = $isLocalForfeit ? 20 : 0;
            }

            // Actualizar el reporte
            $report->home_score = $localScore;
            $report->away_score = $visitorScore;
            $report->observations = '[WALKOVER] Equipo ' . $forfeitedTeam . ' no se presentó. Resultado: ' . $localScore . '-' . $visitorScore;
            $report->is_locked = true;
            $report->save();

            // Actualizar standings
            $this->standingService->updateFromMatch($match, $localScore, $visitorScore);

            // Actualizar estado del partido
            $match->status = 'finalizado';
            $match->save();

            // Registrar incidencia
            try {
                \App\Models\MatchIncidence::create([
                    'match_id' => $match->id,
                    'team_id' => $loserTeamId,
                    'type' => 'walkover',
                    'incidence_type' => 'walkover',
                    'minute' => 0,
                    'description' => 'Walkover - Equipo no se presentó',
                    'created_by_user_id' => $request->user()->id,
                ]);
            } catch (\Exception $e) {
                // No fallar si no se puede crear la incidencia
            }

            return $this->successResponse([
                'report' => $report,
                'match' => $match,
                'winner_team_id' => $winnerTeamId,
                'loser_team_id' => $loserTeamId,
                'forfeited_team' => $forfeitedTeam,
            ], 'Walkover registrado exitosamente.');

        } catch (\Illuminate\Validation\ValidationException $e) {
            return $this->errorResponse($e->errors(), 422);
        } catch (\Exception $e) {
            \Log::error('Walkover error: ' . $e->getMessage(), [
                'trace' => $e->getTraceAsString()
            ]);
            return $this->errorResponse('Error al procesar walkover: ' . $e->getMessage(), 500);
        }
    }
}