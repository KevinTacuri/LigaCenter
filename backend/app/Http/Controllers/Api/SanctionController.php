<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Sanction;
use App\Traits\ApiResponse;
use Illuminate\Http\Request;
use OpenApi\Attributes as OA;

class SanctionController extends Controller
{
    use ApiResponse;

    #[OA\Get(
        path: '/api/sanctions',
        operationId: 'getSanctions',
        summary: 'Listar sanciones',
        tags: ['Sanctions']
    )]
    #[OA\Response(
        response: 200,
        description: 'Sanciones obtenidas exitosamente'
    )]
    #[OA\Security(name: 'sanctum')]
    public function index()
    {
        $sanctions = Sanction::with([
            'player',
            'match'
        ])->get();

        return $this->successResponse(
            $sanctions,
            'Sanciones obtenidas exitosamente'
        );
    }

    #[OA\Post(
        path: '/api/sanctions',
        operationId: 'createSanction',
        summary: 'Registrar sanción',
        tags: ['Sanctions']
    )]
    #[OA\Response(
        response: 201,
        description: 'Sanción registrada exitosamente'
    )]
    #[OA\Response(
        response: 422,
        description: 'Error de validación'
    )]
    #[OA\Security(name: 'sanctum')]
    #[OA\RequestBody(
        required: true,
        content: new OA\JsonContent(
            required: ['player_id', 'origin_match_id', 'sanction_type', 'reason', 'start_date', 'status'],
            properties: [
                new OA\Property(property: 'player_id', type: 'integer', example: 1),
                new OA\Property(property: 'origin_match_id', type: 'integer', example: 1),
                new OA\Property(property: 'sanction_type', type: 'string', example: 'tarjeta_roja'),
                new OA\Property(property: 'reason', type: 'string', example: 'Conducta violenta'),
                new OA\Property(property: 'start_date', type: 'string', format: 'date', example: '2026-06-10'),
                new OA\Property(property: 'end_date', type: 'string', format: 'date', example: '2026-06-17'),
                new OA\Property(property: 'duration', type: 'integer', example: 7),
                new OA\Property(property: 'status', type: 'string', example: 'activa')
            ]
        )
    )]
    public function store(Request $request)
    {
        $request->validate([
            'player_id' => 'required|exists:players,id',
            'origin_match_id' => 'required|exists:matches,id',
            'sanction_type' => 'required|string|max:255',
            'reason' => 'required|string',
            'start_date' => 'required|date',
            'end_date' => 'nullable|date',
            'duration' => 'nullable|integer|min:1',
            'status' => 'required|string|max:50',
        ]);

        $sanction = Sanction::create(
            $request->all()
        );

        return $this->successResponse(
            $sanction,
            'Sanción registrada exitosamente',
            201
        );
    }

    #[OA\Get(
        path: '/api/sanctions/{id}',
        operationId: 'getSanction',
        summary: 'Obtener sanción',
        tags: ['Sanctions']
    )]
    #[OA\Response(
        response: 200,
        description: 'Sanción obtenida exitosamente'
    )]
    #[OA\Response(
        response: 404,
        description: 'Sanción no encontrada'
    )]
    #[OA\Security(name: 'sanctum')]
    public function show($id)
    {
        $sanction = Sanction::with([
            'player',
            'match'
        ])->find($id);

        if (!$sanction) {
            return $this->errorResponse(
                'Sanción no encontrada',
                404
            );
        }

        return $this->successResponse(
            $sanction,
            'Sanción obtenida exitosamente'
        );
    }

    #[OA\Put(
        path: '/api/sanctions/{id}',
        operationId: 'updateSanction',
        summary: 'Actualizar sanción',
        tags: ['Sanctions']
    )]
    #[OA\Response(
        response: 200,
        description: 'Sanción actualizada exitosamente'
    )]
    #[OA\Response(
        response: 404,
        description: 'Sanción no encontrada'
    )]
    #[OA\Response(
        response: 422,
        description: 'Error de validación'
    )]
    #[OA\Security(name: 'sanctum')]
    public function update(Request $request, $id)
    {
        $sanction = Sanction::find($id);

        if (!$sanction) {
            return $this->errorResponse(
                'Sanción no encontrada',
                404
            );
        }

        $request->validate([
            'sanction_type' => 'string|max:255',
            'reason' => 'string',
            'start_date' => 'date',
            'end_date' => 'nullable|date',
            'duration' => 'nullable|integer|min:1',
            'status' => 'string|max:50',
        ]);

        $sanction->update(
            $request->all()
        );

        return $this->successResponse(
            $sanction,
            'Sanción actualizada exitosamente'
        );
    }

    #[OA\Delete(
        path: '/api/sanctions/{id}',
        operationId: 'deleteSanction',
        summary: 'Eliminar sanción',
        tags: ['Sanctions']
    )]
    #[OA\Response(
        response: 200,
        description: 'Sanción eliminada exitosamente'
    )]
    #[OA\Response(
        response: 404,
        description: 'Sanción no encontrada'
    )]
    #[OA\Security(name: 'sanctum')]
    public function destroy($id)
    {
        $sanction = Sanction::find($id);

        if (!$sanction) {
            return $this->errorResponse(
                'Sanción no encontrada',
                404
            );
        }

        $sanction->delete();

        return $this->successResponse(
            null,
            'Sanción eliminada exitosamente'
        );
    }
}