<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Organization;
use Illuminate\Http\Request;
use OpenApi\Attributes as OA;

#[OA\Tag(
    name: "Organizations",
    description: "Gestión de delegaciones o instituciones deportivas que representan equipos en el torneo"
)]
class OrganizationController extends Controller
{
    #[OA\Get(
        path: "/api/organizations",
        summary: "Listar delegaciones",
        description: "Retorna todas las delegaciones registradas en el sistema junto con sus equipos asociados.",
        tags: ["Organizations"],
        responses: [
            new OA\Response(
                response: 200,
                description: "Listado de delegaciones obtenido correctamente"
            )
        ]
    )]
    public function index()
    {
        return response()->json(
            Organization::with('teams')->get()
        );
    }

    #[OA\Post(
        path: "/api/organizations",
        summary: "Registrar delegación",
        description: "Crea una nueva delegación deportiva que podrá registrar equipos dentro del sistema.",
        tags: ["Organizations"],
        requestBody: new OA\RequestBody(
            required: true,
            description: "Datos necesarios para registrar una delegación",
            content: new OA\JsonContent(
                required: ["name", "delegate_name"],
                properties: [
                    new OA\Property(
                        property: "name",
                        type: "string",
                        description: "Nombre de la delegación o institución",
                        example: "Universidad Nacional"
                    ),
                    new OA\Property(
                        property: "delegate_name",
                        type: "string",
                        description: "Nombre del delegado responsable de la institución",
                        example: "Juan Pérez"
                    )
                ]
            )
        ),
        responses: [
            new OA\Response(
                response: 201,
                description: "Delegación creada correctamente"
            ),
            new OA\Response(
                response: 422,
                description: "Error de validación"
            )
        ]
    )]
    public function store(Request $request)
    {
        $validated = $request->validate([
            'name' => 'required|string|max:255',
            'delegate_name' => 'required|string|max:255',
        ]);

        $organization = Organization::create($validated);

        return response()->json($organization, 201);
    }

    #[OA\Get(
        path: "/api/organizations/{id}",
        summary: "Obtener delegación por ID",
        description: "Devuelve la información detallada de una delegación específica junto con sus equipos registrados.",
        tags: ["Organizations"],
        parameters: [
            new OA\Parameter(
                name: "id",
                description: "ID de la delegación",
                in: "path",
                required: true,
                schema: new OA\Schema(type: "integer")
            )
        ],
        responses: [
            new OA\Response(
                response: 200,
                description: "Delegación encontrada correctamente"
            ),
            new OA\Response(
                response: 404,
                description: "Delegación no encontrada"
            )
        ]
    )]
    public function show($id)
    {
        return response()->json(
            Organization::with('teams')->findOrFail($id)
        );
    }

    #[OA\Put(
        path: "/api/organizations/{id}",
        summary: "Actualizar delegación",
        description: "Permite actualizar el nombre de la delegación o el nombre del delegado responsable.",
        tags: ["Organizations"],
        parameters: [
            new OA\Parameter(
                name: "id",
                description: "ID de la delegación a actualizar",
                in: "path",
                required: true,
                schema: new OA\Schema(type: "integer")
            )
        ],
        requestBody: new OA\RequestBody(
            required: false,
            description: "Campos opcionales para actualizar la delegación",
            content: new OA\JsonContent(
                properties: [
                    new OA\Property(
                        property: "name",
                        type: "string",
                        example: "Universidad Nacional Mayor"
                    ),
                    new OA\Property(
                        property: "delegate_name",
                        type: "string",
                        example: "Carlos Ramírez"
                    )
                ]
            )
        ),
        responses: [
            new OA\Response(
                response: 200,
                description: "Delegación actualizada correctamente"
            ),
            new OA\Response(
                response: 404,
                description: "Delegación no encontrada"
            )
        ]
    )]
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

    #[OA\Delete(
        path: "/api/organizations/{id}",
        summary: "Eliminar delegación",
        description: "Elimina una delegación del sistema. Esto puede afectar a los equipos asociados a la misma.",
        tags: ["Organizations"],
        parameters: [
            new OA\Parameter(
                name: "id",
                description: "ID de la delegación a eliminar",
                in: "path",
                required: true,
                schema: new OA\Schema(type: "integer")
            )
        ],
        responses: [
            new OA\Response(
                response: 200,
                description: "Delegación eliminada correctamente"
            ),
            new OA\Response(
                response: 404,
                description: "Delegación no encontrada"
            )
        ]
    )]
    public function destroy($id)
    {
        $organization = Organization::findOrFail($id);

        $organization->delete();

        return response()->json([
            'message' => 'Delegación eliminada correctamente'
        ]);
    }
}