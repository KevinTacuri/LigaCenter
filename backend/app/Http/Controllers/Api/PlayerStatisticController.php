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

    #[OA\Get(
        path: '/api/statistics/top-scorers',
        operationId: 'getTopScorers',
        summary: 'Top goleadores',
        tags: ['Player Statistics']
    )]
    #[OA\Parameter(
        name: 'discipline_id',
        in: 'query',
        required: false,
        schema: new OA\Schema(type: 'integer')
    )]
    #[OA\Parameter(
        name: 'category_id',
        in: 'query',
        required: false,
        schema: new OA\Schema(type: 'integer')
    )]
    #[OA\Parameter(
        name: 'championship_id',
        in: 'query',
        required: false,
        schema: new OA\Schema(type: 'integer')
    )]
    #[OA\Parameter(
        name: 'limit',
        in: 'query',
        required: false,
        schema: new OA\Schema(type: 'integer', default: 10)
    )]
    #[OA\Response(response: 200, description: 'Top goleadores obtenido exitosamente')]
    #[OA\Security(name: 'sanctum')]
    public function getTopScorers(Request $request)
    {
        $topScorers = $this->playerStatisticService->getTopScorers(
            $request->discipline_id,
            $request->category_id,
            $request->championship_id,
            $request->limit ?? 10
        );

        return $this->successResponse($topScorers, 'Top goleadores obtenido exitosamente');
    }

    #[OA\Get(
        path: '/api/statistics/top-yellow-cards',
        operationId: 'getTopYellowCards',
        summary: 'Top tarjetas amarillas',
        tags: ['Player Statistics']
    )]
    #[OA\Parameter(
        name: 'discipline_id',
        in: 'query',
        required: false,
        schema: new OA\Schema(type: 'integer')
    )]
    #[OA\Parameter(
        name: 'category_id',
        in: 'query',
        required: false,
        schema: new OA\Schema(type: 'integer')
    )]
    #[OA\Parameter(
        name: 'championship_id',
        in: 'query',
        required: false,
        schema: new OA\Schema(type: 'integer')
    )]
    #[OA\Parameter(
        name: 'limit',
        in: 'query',
        required: false,
        schema: new OA\Schema(type: 'integer', default: 10)
    )]
    #[OA\Response(response: 200, description: 'Top tarjetas amarillas obtenido exitosamente')]
    #[OA\Security(name: 'sanctum')]
    public function getTopYellowCards(Request $request)
    {
        $topYellow = $this->playerStatisticService->getTopYellowCards(
            $request->discipline_id,
            $request->category_id,
            $request->championship_id,
            $request->limit ?? 10
        );

        return $this->successResponse($topYellow, 'Top tarjetas amarillas obtenido exitosamente');
    }

    #[OA\Get(
        path: '/api/statistics/top-red-cards',
        operationId: 'getTopRedCards',
        summary: 'Top tarjetas rojas',
        tags: ['Player Statistics']
    )]
    #[OA\Parameter(
        name: 'discipline_id',
        in: 'query',
        required: false,
        schema: new OA\Schema(type: 'integer')
    )]
    #[OA\Parameter(
        name: 'category_id',
        in: 'query',
        required: false,
        schema: new OA\Schema(type: 'integer')
    )]
    #[OA\Parameter(
        name: 'championship_id',
        in: 'query',
        required: false,
        schema: new OA\Schema(type: 'integer')
    )]
    #[OA\Parameter(
        name: 'limit',
        in: 'query',
        required: false,
        schema: new OA\Schema(type: 'integer', default: 10)
    )]
    #[OA\Response(response: 200, description: 'Top tarjetas rojas obtenido exitosamente')]
    #[OA\Security(name: 'sanctum')]
    public function getTopRedCards(Request $request)
    {
        $topRed = $this->playerStatisticService->getTopRedCards(
            $request->discipline_id,
            $request->category_id,
            $request->championship_id,
            $request->limit ?? 10
        );

        return $this->successResponse($topRed, 'Top tarjetas rojas obtenido exitosamente');
    }

    // pero json modifica

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
                name: 'statistic_slug',
                in: 'query',
                required: true,
                schema: new OA\Schema(type: 'string'),
                description: 'Slug de la estadística (ejemplo: "goals", "yellow_cards", "red_cards")',
                example: 'goals'
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
            'discipline_id' => 'required|integer|exists:disciplines,id',
            'statistic_slug' => 'required|string',
            'category_id' => 'nullable|integer|exists:categories,id',
            'championship_id' => 'nullable|integer|exists:championships,id',
            'limit' => 'nullable|integer|min:1|max:100',
        ]);

        $ranking = $this->playerStatisticService->getRanking(
            disciplineId: $request->discipline_id,
            slug: $request->statistic_slug,
            championshipId: $request->championship_id,
            categoryId: $request->category_id,
            limit: $request->limit ?? 10,
        );

        return $this->successResponse(
            $ranking,
            'Ranking obtenido exitosamente'
        );
    }
}