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
        $query = GameMatch::with(['localTeam', 'visitorTeam', 'venue', 'category', 'report']);

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
        event(new \App\Events\MatchUpdated($match));
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
        event(new \App\Events\MatchUpdated($match));

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

        // Disparar evento de WebSocket
        event(new \App\Events\MatchTimerSynced(
            $match->id,
            $match->current_elapsed_time,
            $match->current_period,
            $match->timer_status,
            $match->timer_started_at
        ));

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

    // En GameMatchController.php

public function updatePeriodScore(Request $request, $id)
{
    $match = GameMatch::findOrFail($id);
    
    $request->validate([
        'period_index' => 'required|integer|min:0',
        'home_score' => 'required|integer|min:0',
        'away_score' => 'required|integer|min:0',
        'is_finished' => 'boolean',
    ]);
    
    $periodIndex = $request->period_index;
    $homeScore = $request->home_score;
    $awayScore = $request->away_score;
    
    if ($match->sport_type === 'voley') {
        $fields = ['set1', 'set2', 'set3', 'set4', 'set5'];
        if (isset($fields[$periodIndex])) {
            $fieldHome = $fields[$periodIndex] . '_home';
            $fieldAway = $fields[$periodIndex] . '_away';
            $match->$fieldHome = $homeScore;
            $match->$fieldAway = $awayScore;
        }
    } elseif ($match->sport_type === 'basquet') {
        $fields = ['quarter1', 'quarter2', 'quarter3', 'quarter4', 'overtime'];
        if (isset($fields[$periodIndex])) {
            $fieldHome = $fields[$periodIndex] . '_home';
            $fieldAway = $fields[$periodIndex] . '_away';
            $match->$fieldHome = $homeScore;
            $match->$fieldAway = $awayScore;
        }
    }
    
    $match->current_period_score_home = $homeScore;
    $match->current_period_score_away = $awayScore;
    $match->is_period_finished = $request->is_finished ?? false;
    
    // Actualizar totales
    if ($match->sport_type === 'voley') {
        $sets = [
            $match->set1_home > $match->set1_away ? 1 : 0,
            $match->set2_home > $match->set2_away ? 1 : 0,
            $match->set3_home > $match->set3_away ? 1 : 0,
            $match->set4_home > $match->set4_away ? 1 : 0,
            $match->set5_home > $match->set5_away ? 1 : 0,
        ];
        $match->home_score = array_sum($sets);
        $match->away_score = 5 - array_sum($sets);
    } else {
        // Futbol, balonmano, basquet
        $match->home_score = $homeScore;
        $match->away_score = $awayScore;
    }
    
    $match->save();
    
    return $this->successResponse($match, 'Puntuación de periodo actualizada');
}

public function getMatchState($id)
{
    $match = GameMatch::with(['localTeam', 'visitorTeam', 'category', 'discipline'])->findOrFail($id);
    
    $sportType = $match->sport_type ?? 'futbol';
    $config = $this->getSportConfig($sportType);
    
    $response = [
        'match' => $match,
        'sport_type' => $sportType,
        'config' => $config,
        'sets' => $match->sets,
        'quarters' => $match->quarters,
        'current_period' => $match->current_period,
        'current_period_score_home' => $match->current_period_score_home,
        'current_period_score_away' => $match->current_period_score_away,
        'is_period_finished' => $match->is_period_finished,
        'elapsed_time' => $match->elapsed_time,
        'clock_status' => $match->clock_status,
        'total_home' => $match->total_home_score,
        'total_away' => $match->total_away_score,
    ];
    
    return $this->successResponse($response, 'Estado del partido obtenido');
}

    private function getSportConfig(string $sportType): array
    {
        $configs = [
            'futbol' => [
                'has_timer' => true,
                'timer_countdown' => false,
                'period_label' => 'Tiempo',
                'periods' => [
                    ['name' => '1° Tiempo', 'duration' => 45],
                    ['name' => '2° Tiempo', 'duration' => 45],
                    ['name' => '1° Prórroga', 'duration' => 15],
                    ['name' => '2° Prórroga', 'duration' => 15],
                ],
                'score_label' => 'Goles',
                'max_periods' => 4,
                'win_score' => 0,
            ],
            'voley' => [
                'has_timer' => false,
                'timer_countdown' => false,
                'period_label' => 'Set',
                'periods' => [
                    ['name' => 'Set 1', 'duration' => 0],
                    ['name' => 'Set 2', 'duration' => 0],
                    ['name' => 'Set 3', 'duration' => 0],
                    ['name' => 'Set 4', 'duration' => 0],
                    ['name' => 'Set 5', 'duration' => 0],
                ],
                'score_label' => 'Sets',
                'max_periods' => 5,
                'win_score' => 3,
            ],
            'basquet' => [
                'has_timer' => true,
                'timer_countdown' => true,
                'period_label' => 'Cuarto',
                'periods' => [
                    ['name' => '1° Cuarto', 'duration' => 10],
                    ['name' => '2° Cuarto', 'duration' => 10],
                    ['name' => '3° Cuarto', 'duration' => 10],
                    ['name' => '4° Cuarto', 'duration' => 10],
                    ['name' => 'Prórroga', 'duration' => 5],
                ],
                'score_label' => 'Puntos',
                'max_periods' => 5,
                'win_score' => 0,
            ],
            'balonmano' => [
                'has_timer' => true,
                'timer_countdown' => false,
                'period_label' => 'Tiempo',
                'periods' => [
                    ['name' => '1° Tiempo', 'duration' => 30],
                    ['name' => '2° Tiempo', 'duration' => 30],
                    ['name' => 'Prórroga', 'duration' => 5],
                ],
                'score_label' => 'Goles',
                'max_periods' => 3,
                'win_score' => 0,
            ],
        ];
        
        return $configs[$sportType] ?? $configs['futbol'];
    }
}