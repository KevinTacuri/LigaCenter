<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use Illuminate\Http\Request;
use App\Models\Standing;
use App\Traits\ApiResponse;
use OpenApi\Attributes as OA;

class StandingController extends Controller
{
    use ApiResponse;

    #[OA\Get(
        path: '/api/standings',
        operationId: 'getStandings',
        summary: 'Tabla de posiciones',
        tags: ['Standings']
    )]
    #[OA\Security(name: 'sanctum')]
    public function index()
    {
        $standings = Standing::with([
            'team',
            'discipline',
            'category'
        ])
        ->orderByDesc('total_points')
        ->orderByDesc('goal_difference')
        ->orderByDesc('goals_for')
        ->get();

        return $this->successResponse(
            $standings,
            'Tabla obtenida exitosamente'
        );
    }

    #[OA\Get(
        path: '/api/standings/{id}',
        operationId: 'getStanding',
        summary: 'Detalle posición',
        tags: ['Standings']
    )]
    #[OA\Security(name: 'sanctum')]
    public function show($id)
    {
        $standing = Standing::with([
            'team',
            'discipline',
            'category'
        ])->find($id);

        if (!$standing) {
            return $this->errorResponse(
                'Registro no encontrado',
                404
            );
        }

        return $this->successResponse(
            $standing,
            'Registro obtenido exitosamente'
        );
    }
}
