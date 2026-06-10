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
}