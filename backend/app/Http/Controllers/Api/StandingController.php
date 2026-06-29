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
    #[OA\Parameter(
        name: 'championship_id',
        description: 'ID del campeonato (opcional)',
        in: 'query',
        required: false,
        schema: new OA\Schema(type: 'integer')
    )]
    #[OA\Parameter(
        name: 'discipline_id',
        description: 'ID de la disciplina (opcional)',
        in: 'query',
        required: false,
        schema: new OA\Schema(type: 'integer')
    )]
    #[OA\Parameter(
        name: 'category_id',
        description: 'ID de la categoría (opcional)',
        in: 'query',
        required: false,
        schema: new OA\Schema(type: 'integer')
    )]
    #[OA\Response(
        response: 200,
        description: 'Tabla de posiciones obtenida exitosamente'
    )]
    #[OA\Security(name: 'sanctum')]
    public function index(Request $request)
    {
        $query = Standing::with([
            'team',
            'discipline',
            'category'
        ]);

        if ($request->has('championship_id')) {
            $query->where('championship_id', $request->championship_id);
        }

        if ($request->has('discipline_id')) {
            $query->where('discipline_id', $request->discipline_id);
        }

        if ($request->has('category_id')) {
            $query->where('category_id', $request->category_id);
        }

        $standings = $query
            ->orderByDesc('total_points')
            ->orderByDesc('goal_difference')
            ->orderByDesc('goals_for')
            ->get();

        return $this->successResponse(
            $standings,
            'Tabla de posiciones obtenida exitosamente'
        );
    }

    #[OA\Get(
        path: '/api/standings/{id}',
        operationId: 'getStanding',
        summary: 'Obtener posición por ID',
        tags: ['Standings']
    )]
    #[OA\Response(
        response: 200,
        description: 'Registro obtenido exitosamente'
    )]
    #[OA\Response(
        response: 404,
        description: 'Registro no encontrado'
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

    #[OA\Get(
        path: '/api/standings/team/{teamId}',
        operationId: 'getStandingByTeam',
        summary: 'Obtener posición por equipo',
        tags: ['Standings']
    )]
    #[OA\Parameter(
        name: 'championship_id',
        description: 'ID del campeonato (opcional)',
        in: 'query',
        required: false,
        schema: new OA\Schema(type: 'integer')
    )]
    #[OA\Parameter(
        name: 'discipline_id',
        description: 'ID de la disciplina (opcional)',
        in: 'query',
        required: false,
        schema: new OA\Schema(type: 'integer')
    )]
    #[OA\Parameter(
        name: 'category_id',
        description: 'ID de la categoría (opcional)',
        in: 'query',
        required: false,
        schema: new OA\Schema(type: 'integer')
    )]
    #[OA\Response(
        response: 200,
        description: 'Registro obtenido exitosamente'
    )]
    #[OA\Response(
        response: 404,
        description: 'Registro no encontrado'
    )]
    #[OA\Security(name: 'sanctum')]
    public function getByTeam($teamId, Request $request)
    {
        $query = Standing::with([
            'team',
            'discipline',
            'category'
        ])->where('team_id', $teamId);

        if ($request->has('championship_id')) {
            $query->where('championship_id', $request->championship_id);
        }

        if ($request->has('discipline_id')) {
            $query->where('discipline_id', $request->discipline_id);
        }

        if ($request->has('category_id')) {
            $query->where('category_id', $request->category_id);
        }

        $standing = $query->first();

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

    #[OA\Get(
        path: '/api/public/standings/championship/{championshipId}',
        operationId: 'getPublicStandingsByChampionship',
        summary: 'Obtener tabla de posiciones de un campeonato público',
        description: 'Lista las posiciones de un campeonato público, con filtros opcionales por disciplina y categoría.',
        tags: ['Standings'],
        parameters: [
            new OA\Parameter(name: 'championshipId', description: 'ID del campeonato público', in: 'path', required: true, schema: new OA\Schema(type: 'integer')),
            new OA\Parameter(name: 'discipline_id', description: 'ID de la disciplina', in: 'query', required: false, schema: new OA\Schema(type: 'integer')),
            new OA\Parameter(name: 'category_id', description: 'ID de la categoría', in: 'query', required: false, schema: new OA\Schema(type: 'integer'))
        ],
        responses: [
            new OA\Response(response: 200, description: 'Tabla de posiciones obtenida exitosamente'),
            new OA\Response(response: 404, description: 'Campeonato público no encontrado')
        ]
    )]
    public function byChampionship($championshipId, Request $request)
    {
        $championship = Championship::where('is_public', true)->findOrFail($championshipId);

        $query = Standing::with(['team', 'discipline', 'category'])
            ->where('championship_id', $championshipId);

        if ($request->has('discipline_id')) {
            $query->where('discipline_id', $request->discipline_id);
        }
        if ($request->has('category_id')) {
            $query->where('category_id', $request->category_id);
        }

        $standings = $query
            ->orderByDesc('total_points')
            ->orderByDesc('goal_difference')
            ->orderByDesc('goals_for')
            ->get();

        return $this->successResponse(
            $standings,
            'Tabla de posiciones obtenida exitosamente'
        );
    }
}