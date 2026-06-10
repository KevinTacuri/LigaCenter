<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Category;
use Illuminate\Http\Request;
use OpenApi\Attributes as OA;

#[OA\Tag(
    name: "Categories",
    description: "Gestión de categorías de torneos deportivos, utilizadas para clasificar equipos según rango de edad"
)]
class CategoryController extends Controller
{
    #[OA\Get(
        path: "/api/categories",
        summary: "Listar categorías",
        description: "Retorna todas las categorías registradas en el sistema, incluyendo los equipos asociados a cada categoría.",
        tags: ["Categories"],
        responses: [
            new OA\Response(
                response: 200,
                description: "Lista de categorías obtenida correctamente"
            )
        ]
    )]
    public function index()
    {
        return response()->json(
            Category::with('teams')->get()
        );
    }

    #[OA\Post(
        path: "/api/categories",
        summary: "Crear categoría",
        description: "Registra una nueva categoría en el sistema. Las categorías se utilizan para agrupar equipos según rangos de edad.",
        tags: ["Categories"],
        requestBody: new OA\RequestBody(
            required: true,
            description: "Datos necesarios para crear una categoría",
            content: new OA\JsonContent(
                required: ["name", "age_range"],
                properties: [
                    new OA\Property(
                        property: "name",
                        type: "string",
                        description: "Nombre de la categoría (ej: Juvenil, Libre, Senior)",
                        example: "Juvenil"
                    ),
                    new OA\Property(
                        property: "age_range",
                        type: "string",
                        description: "Rango de edad permitido en formato mínimo-máximo (ej: 18-25)",
                        example: "18-25"
                    )
                ]
            )
        ),
        responses: [
            new OA\Response(
                response: 201,
                description: "Categoría creada exitosamente"
            ),
            new OA\Response(
                response: 422,
                description: "Error de validación en los datos enviados"
            )
        ]
    )]
    public function store(Request $request)
    {
        $validated = $request->validate([
            'name' => 'required|string|max:255',
            'age_range' => [
                'required',
                'regex:/^\d+\-\d+$/'
            ]
        ]);

        $category = Category::create($validated);

        return response()->json($category, 201);
    }

    #[OA\Get(
        path: "/api/categories/{id}",
        summary: "Obtener categoría por ID",
        description: "Devuelve la información detallada de una categoría específica junto con sus equipos asociados.",
        tags: ["Categories"],
        parameters: [
            new OA\Parameter(
                name: "id",
                description: "ID único de la categoría",
                in: "path",
                required: true,
                schema: new OA\Schema(type: "integer")
            )
        ],
        responses: [
            new OA\Response(
                response: 200,
                description: "Categoría encontrada correctamente"
            ),
            new OA\Response(
                response: 404,
                description: "La categoría no existe"
            )
        ]
    )]
    public function show($id)
    {
        return response()->json(
            Category::with('teams')->findOrFail($id)
        );
    }

    #[OA\Put(
        path: "/api/categories/{id}",
        summary: "Actualizar categoría",
        description: "Permite actualizar la información de una categoría existente como nombre o rango de edad.",
        tags: ["Categories"],
        parameters: [
            new OA\Parameter(
                name: "id",
                description: "ID de la categoría a actualizar",
                in: "path",
                required: true,
                schema: new OA\Schema(type: "integer")
            )
        ],
        requestBody: new OA\RequestBody(
            required: false,
            description: "Campos opcionales para actualizar la categoría",
            content: new OA\JsonContent(
                properties: [
                    new OA\Property(
                        property: "name",
                        type: "string",
                        description: "Nuevo nombre de la categoría",
                        example: "Juvenil A"
                    ),
                    new OA\Property(
                        property: "age_range",
                        type: "string",
                        description: "Nuevo rango de edad",
                        example: "18-23"
                    )
                ]
            )
        ),
        responses: [
            new OA\Response(
                response: 200,
                description: "Categoría actualizada correctamente"
            ),
            new OA\Response(
                response: 404,
                description: "Categoría no encontrada"
            )
        ]
    )]
    public function update(Request $request, $id)
    {
        $category = Category::findOrFail($id);

        $validated = $request->validate([
            'name' => 'sometimes|string|max:255',
            'age_range' => [
                'sometimes',
                'regex:/^\d+\-\d+$/'
            ]
        ]);

        $category->update($validated);

        return response()->json($category);
    }

    #[OA\Delete(
        path: "/api/categories/{id}",
        summary: "Eliminar categoría",
        description: "Elimina una categoría del sistema. Esta acción es permanente y también puede afectar a los equipos asociados.",
        tags: ["Categories"],
        parameters: [
            new OA\Parameter(
                name: "id",
                description: "ID de la categoría a eliminar",
                in: "path",
                required: true,
                schema: new OA\Schema(type: "integer")
            )
        ],
        responses: [
            new OA\Response(
                response: 200,
                description: "Categoría eliminada correctamente"
            ),
            new OA\Response(
                response: 404,
                description: "Categoría no encontrada"
            )
        ]
    )]
    public function destroy($id)
    {
        $category = Category::findOrFail($id);

        $category->delete();

        return response()->json([
            'message' => 'Categoría eliminada correctamente'
        ]);
    }
}