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
        return $this->rankingBySlug($request, 'goals', false, 'Máximos goleadores obtenidos exitosamente');
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
        return $this->rankingBySlug($request, 'assists', false, 'Máximos asistentes obtenidos exitosamente');
    }


    public function getTopYellowCards(Request $request)
    {
        return $this->rankingBySlug($request, 'yellow_cards', false, 'Ranking de tarjetas amarillas obtenido exitosamente');
    }

    public function getTopRedCards(Request $request)
    {
        return $this->rankingBySlug($request, 'red_cards', false, 'Ranking de tarjetas rojas obtenido exitosamente');
    }

    #[OA\Get(path: '/api/public/statistics/ranking', operationId: 'getPublicStatisticsRanking', summary: 'Obtener ranking público', tags: ['Player Statistics'], responses: [new OA\Response(response: 200, description: 'Consulta exitosa'), new OA\Response(response: 404, description: 'Recurso no encontrado')])]
    public function getPublicRanking(Request $request)
    {
        $request->validate([
            'discipline_id' => 'required|exists:disciplines,id',
            'statistic_type_id' => 'required|exists:statistic_types,id',
            'championship_id' => 'nullable|integer',
            'category_id' => 'nullable|integer',
            'limit' => 'nullable|integer|min:1|max:100',
        ]);

        $ranking = $this->playerStatisticService->getRanking(
            disciplineId: $request->integer('discipline_id'),
            statisticTypeId: $request->integer('statistic_type_id'),
            championshipId: $request->filled('championship_id') ? $request->integer('championship_id') : null,
            categoryId: $request->filled('category_id') ? $request->integer('category_id') : null,
            limit: $request->integer('limit', 10),
            publicOnly: true
        );

        return $this->successResponse($ranking, 'Ranking público obtenido correctamente');
    }

    public function getPublicTopScorers(Request $request)
    {
        return $this->rankingBySlug($request, 'goals', true, 'Máximos goleadores públicos obtenidos exitosamente');
    }

    public function getPublicTopAssists(Request $request)
    {
        return $this->rankingBySlug($request, 'assists', true, 'Máximos asistentes públicos obtenidos exitosamente');
    }

    #[OA\Get(path: '/api/public/statistics/top-yellow-cards', operationId: 'getPublicTopYellowCards', summary: 'Obtener ranking público de tarjetas amarillas', tags: ['Player Statistics'], responses: [new OA\Response(response: 200, description: 'Consulta exitosa'), new OA\Response(response: 404, description: 'Recurso no encontrado')])]
    public function getPublicTopYellowCards(Request $request)
    {
        return $this->rankingBySlug($request, 'yellow_cards', true, 'Tarjetas amarillas públicas obtenidas exitosamente');
    }

    #[OA\Get(path: '/api/public/statistics/top-red-cards', operationId: 'getPublicTopRedCards', summary: 'Obtener ranking público de tarjetas rojas', tags: ['Player Statistics'], responses: [new OA\Response(response: 200, description: 'Consulta exitosa'), new OA\Response(response: 404, description: 'Recurso no encontrado')])]
    public function getPublicTopRedCards(Request $request)
    {
        return $this->rankingBySlug($request, 'red_cards', true, 'Tarjetas rojas públicas obtenidas exitosamente');
    }

    #[OA\Get(path: '/api/public/players/{id}/history', operationId: 'getPublicPlayerHistory', summary: 'Obtener historial público del jugador', tags: ['Player Statistics'], responses: [new OA\Response(response: 200, description: 'Consulta exitosa'), new OA\Response(response: 404, description: 'Recurso no encontrado')])]
    public function getPublicHistory($id)
    {
        $history = $this->playerStatisticService->getPlayerHistory($id, true);

        if (!$history) {
            return $this->errorResponse('Jugador público no encontrado', 404);
        }

        return $this->successResponse($history, 'Historial público obtenido exitosamente');
    }

    private function rankingBySlug(Request $request, string $slug, bool $publicOnly, string $message)
    {
        $request->validate([
            'championship_id' => 'nullable|integer',
            'discipline_id' => 'nullable|integer',
            'category_id' => 'nullable|integer',
            'limit' => 'nullable|integer|min:1|max:50',
        ]);

        $ranking = $this->playerStatisticService->getRankingBySlug(
            slug: $slug,
            disciplineId: $request->filled('discipline_id') ? $request->integer('discipline_id') : null,
            championshipId: $request->filled('championship_id') ? $request->integer('championship_id') : null,
            categoryId: $request->filled('category_id') ? $request->integer('category_id') : null,
            limit: $request->integer('limit', 10),
            publicOnly: $publicOnly
        );

        return $this->successResponse($ranking, $message);
    }

}