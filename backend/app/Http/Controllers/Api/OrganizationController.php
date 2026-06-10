<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Organization;
use Illuminate\Http\Request;

/**
 * @OA\Tag(
 *     name="Organizations",
 *     description="Gestión de delegaciones"
 * )
 */
class OrganizationController extends Controller
{
    /**
     * @OA\Get(
     *     path="/api/organizations",
     *     tags={"Organizations"},
     *     summary="Listar delegaciones",
     *     @OA\Response(response=200, description="Listado obtenido correctamente")
     * )
     */
    public function index()
    {
        return response()->json(
            Organization::with('teams')->get()
        );
    }

    /**
     * @OA\Post(
     *     path="/api/organizations",
     *     tags={"Organizations"},
     *     summary="Registrar delegación",
     *     @OA\RequestBody(
     *         required=true,
     *         @OA\JsonContent(
     *             required={"name","delegate_name"},
     *             @OA\Property(property="name", type="string"),
     *             @OA\Property(property="delegate_name", type="string")
     *         )
     *     ),
     *     @OA\Response(response=201, description="Delegación creada")
     * )
     */
    public function store(Request $request)
    {
        $validated = $request->validate([
            'name' => 'required|string|max:255',
            'delegate_name' => 'required|string|max:255',
        ]);

        $organization = Organization::create($validated);

        return response()->json($organization, 201);
    }

    /**
     * @OA\Get(
     *     path="/api/organizations/{id}",
     *     tags={"Organizations"},
     *     summary="Obtener delegación",
     *     @OA\Parameter(
     *         name="id",
     *         in="path",
     *         required=true,
     *         @OA\Schema(type="integer")
     *     ),
     *     @OA\Response(response=200, description="Delegación encontrada")
     * )
     */
    public function show($id)
    {
        return response()->json(
            Organization::with('teams')->findOrFail($id)
        );
    }

    /**
     * @OA\Put(
     *     path="/api/organizations/{id}",
     *     tags={"Organizations"},
     *     summary="Actualizar delegación",
     *     @OA\Response(response=200, description="Actualizada")
     * )
     */
    public function update(Request $request, $id)
    {
        $organization = Organization::findOrFail($id);

        $validated = $request->validate([
            'name' => 'sometimes|string|max:255',
            'delegate_name' => 'sometimes|string|max:255',
        ]);

        $organization->update($validated);

        return response()->json($organization);
    }

    /**
     * @OA\Delete(
     *     path="/api/organizations/{id}",
     *     tags={"Organizations"},
     *     summary="Eliminar delegación",
     *     @OA\Response(response=200, description="Eliminada")
     * )
     */
    public function destroy($id)
    {
        $organization = Organization::findOrFail($id);

        $organization->delete();

        return response()->json([
            'message' => 'Delegación eliminada correctamente'
        ]);
    }
}