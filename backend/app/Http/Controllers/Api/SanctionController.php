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
    #[OA\Security(name: 'sanctum')]
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