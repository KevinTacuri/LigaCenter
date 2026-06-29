<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Services\PlayerStatisticService;
use App\Traits\ApiResponse;
use Illuminate\Http\Request;
use OpenApi\Attributes as OA;

class PlayerStatisticController extends Controller
{
    use ApiResponse;

    protected $playerStatisticService;

    public function __construct(PlayerStatisticService $playerStatisticService)
    {
        $this->playerStatisticService = $playerStatisticService;
    }

    #[OA\Get(
        path: '/api/players/{id}/history',
        operationId: 'getPlayerHistory',
        summary: 'Historial del jugador',
        description: 'Obtiene el historial completo del jugador (totales y desglose por campeonato)',
        tags: ['Player Statistics']
    )]
    #[OA\Parameter(
        name: 'id',
        in: 'path',
        required: true,
        schema: new OA\Schema(type: 'integer')
    )]
    #[OA\Response(response: 200, description: 'Historial obtenido exitosamente')]
    #[OA\Response(response: 404, description: 'Jugador no encontrado')]
    #[OA\Security(name: 'sanctum')]
    public function getHistory($id)
    {
        $history = $this->playerStatisticService->getPlayerHistory($id);

        if (!$history) {
            return $this->errorResponse('Jugador no encontrado', 404);
        }

        return $this->successResponse($history, 'Historial obtenido exitosamente');
    }

    // Función para obtener el ranking de jugadores según una estadística específica
    #[OA\Get(
        path: '/api/statistics/ranking',
        operationId: 'getRanking',
        summary: 'Ranking de jugadores',
        tags: ['Player Statistics'],
        parameters: [
            new OA\Parameter(
                name: 'discipline_id',
                in: 'query',
                required: true,
                schema: new OA\Schema(type: 'integer'),
                example: 1
            ),
            new OA\Parameter(
                name: 'statistic_type_id',
                in: 'query',
                required: true,
                schema: new OA\Schema(type: 'integer'),
                example: 1
            ),
            new OA\Parameter(
                name: 'championship_id',
                in: 'query',
                required: false,
                schema: new OA\Schema(type: 'integer'),
                example: 1
            ),
            new OA\Parameter(
                name: 'category_id',
                in: 'query',
                required: false,
                schema: new OA\Schema(type: 'integer'),
                example: 1
            ),
            new OA\Parameter(
                name: 'limit',
                in: 'query',
                required: false,
                schema: new OA\Schema(type: 'integer', default: 10),
                description: 'Número máximo de jugadores a mostrar en el ranking (default 10)',
                example: 10
             )
        ],
        responses: [
            new OA\Response(
                response: 200,
                description: 'Ranking obtenido exitosamente'
            ),
            new OA\Response(
                response: 422,
                description: 'Error de validación'
            )
        ],
    )]
    public function getRanking(Request $request)
    {
        $request->validate([
            'discipline_id' => 'required|exists:disciplines,id',
            'statistic_type_id' => 'required|exists:statistic_types,id',
            'category_id' => 'nullable|exists:categories,id',
            'championship_id' => 'nullable|exists:championships,id',
            'limit' => 'nullable|integer|min:1|max:100',
        ]);

        $ranking = $this->playerStatisticService->getRanking(
            disciplineId: $request->discipline_id,
            statisticTypeId: $request->statistic_type_id,
            championshipId: $request->championship_id,
            categoryId: $request->category_id,
            limit: $request->limit ?? 10
        );

        return $this->successResponse(
            $ranking,
            'Ranking obtenido correctamente.'
        );
    }

    #[OA\Get(
        path: '/api/public/statistics/top-scorers',
        operationId: 'getPublicTopScorers',
        summary: 'Obtener máximos goleadores',
        description: 'Obtiene el ranking público de jugadores con más goles.',
        tags: ['Player Statistics'],
        parameters: [
            new OA\Parameter(name: 'championship_id', in: 'query', required: false, schema: new OA\Schema(type: 'integer')),
            new OA\Parameter(name: 'discipline_id', in: 'query', required: false, schema: new OA\Schema(type: 'integer')),
            new OA\Parameter(name: 'category_id', in: 'query', required: false, schema: new OA\Schema(type: 'integer')),
            new OA\Parameter(name: 'limit', description: 'Cantidad máxima de jugadores', in: 'query', required: false, schema: new OA\Schema(type: 'integer', default: 10, minimum: 1, maximum: 50))
        ],
        responses: [
            new OA\Response(response: 200, description: 'Máximos goleadores obtenidos exitosamente'),
            new OA\Response(response: 422, description: 'Error de validación')
        ]
    )]
    public function getTopScorers(Request $request)
    {
        $request->validate([
            'championship_id' => 'nullable|exists:championships,id',
            'discipline_id' => 'nullable|exists:disciplines,id',
            'category_id' => 'nullable|exists:categories,id',
            'limit' => 'nullable|integer|min:1|max:50',
        ]);

        $ranking = $this->playerStatisticService->getRanking(
            disciplineId: $request->discipline_id,
            statisticTypeId: 1, // ID para "Goles" en statistic_types
            championshipId: $request->championship_id,
            categoryId: $request->category_id,
            limit: $request->limit ?? 10
        );

        return $this->successResponse($ranking, 'Máximos goleadores obtenidos exitosamente');
    }

    #[OA\Get(
        path: '/api/public/statistics/top-assists',
        operationId: 'getPublicTopAssists',
        summary: 'Obtener máximos asistentes',
        description: 'Obtiene el ranking público de jugadores con más asistencias.',
        tags: ['Player Statistics'],
        parameters: [
            new OA\Parameter(name: 'championship_id', in: 'query', required: false, schema: new OA\Schema(type: 'integer')),
            new OA\Parameter(name: 'discipline_id', in: 'query', required: false, schema: new OA\Schema(type: 'integer')),
            new OA\Parameter(name: 'category_id', in: 'query', required: false, schema: new OA\Schema(type: 'integer')),
            new OA\Parameter(name: 'limit', description: 'Cantidad máxima de jugadores', in: 'query', required: false, schema: new OA\Schema(type: 'integer', default: 10, minimum: 1, maximum: 50))
        ],
        responses: [
            new OA\Response(response: 200, description: 'Máximos asistentes obtenidos exitosamente'),
            new OA\Response(response: 422, description: 'Error de validación')
        ]
    )]
    public function getTopAssists(Request $request)
    {
        $request->validate([
            'championship_id' => 'nullable|exists:championships,id',
            'discipline_id' => 'nullable|exists:disciplines,id',
            'category_id' => 'nullable|exists:categories,id',
            'limit' => 'nullable|integer|min:1|max:50',
        ]);

        $ranking = $this->playerStatisticService->getRanking(
            disciplineId: $request->discipline_id,
            statisticTypeId: 2, // ID para "Asistencias" en statistic_types
            championshipId: $request->championship_id,
            categoryId: $request->category_id,
            limit: $request->limit ?? 10
        );

        return $this->successResponse($ranking, 'Máximos asistentes obtenidos exitosamente');
    }

}