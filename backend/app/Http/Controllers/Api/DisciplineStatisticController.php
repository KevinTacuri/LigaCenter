<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Discipline;
use App\Traits\ApiResponse;
use OpenApi\Attributes as OA;

class DisciplineStatisticController extends Controller
{
    use ApiResponse;

    #[OA\Get(
        path: '/api/disciplines/{discipline}/statistics',
        operationId: 'getDisciplineStatistics',
        summary: 'Obtiene las estadísticas configuradas para una disciplina',
        tags: ['Discipline Statistics'],
        parameters: [
            new OA\Parameter(
                name: 'discipline',
                in: 'path',
                required: true,
                description: 'ID de la disciplina',
                schema: new OA\Schema(type: 'integer')
            )
        ],
        responses: [
            new OA\Response(
                response: 200,
                description: 'Estadísticas obtenidas correctamente'
            ),
            new OA\Response(
                response: 404,
                description: 'Disciplina no encontrada'
            )
        ],
    )]

    public function index(Discipline $discipline)
    {
        $statistics = $discipline->statistics()
            ->with('statisticType')
            ->orderBy('order')
            ->get()
            ->map(function ($statistic) {
                return [
                    'id' => $statistic->id, // discipline_statistic_id
                    'order' => $statistic->order,
                    'statistic_type' => [
                        'id' => $statistic->statisticType->id,
                        'slug' => $statistic->statisticType->slug,
                        'display_name' => $statistic->statisticType->display_name,
                    ],
                ];
            });

        return $this->successResponse(
            $statistics,
            'Estadísticas obtenidas correctamente'
        );
    }
}