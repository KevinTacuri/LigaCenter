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
        parameters: [
            new OA\Parameter(name: "championship_id", in: "query", required: true, schema: new OA\Schema(type: "integer")),
            new OA\Parameter(name: "discipline_id", in: "query", required: false, schema: new OA\Schema(type: "integer"))
        ],
        responses: [
            new OA\Response(
                response: 200,
                description: "Lista de categorías obtenida correctamente"
            )
        ]
    )]
    public function index(Request $request)
    {
        $request->validate([
            'championship_id' => 'required|exists:championships,id',
            'discipline_id' => 'nullable|exists:disciplines,id',
        ]);

        $query = Category::where('championship_id', $request->championship_id);

        if ($request->has('discipline_id')) {
            $query->where('discipline_id', $request->discipline_id);
        }

        return response()->json($query->with(['teams', 'discipline'])->get());
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
                required: ["championship_id", "discipline_id", "name"],
                properties: [
                    new OA\Property(property: "championship_id", type: "integer", example: 1),
                    new OA\Property(property: "discipline_id", type: "integer", example: 1),
                    new OA\Property(property: "name", type: "string", description: "Nombre de la categoría", example: "Sub-15"),
                    new OA\Property(property: "description", type: "string", description: "Descripción de la categoría", example: "Categoría para menores de 15 años"),
                    new OA\Property(property: "gender_type", type: "string", description: "Género de la categoría", example: "Masculino"),
                    new OA\Property(property: "age_min", type: "integer", example: 10),
                    new OA\Property(property: "age_max", type: "integer", example: 15)
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
            'championship_id' => 'required|exists:championships,id',
            'discipline_id' => 'required|exists:disciplines,id',
            'name' => 'required|string|max:255',
            'description' => 'nullable|string',
            'gender_type' => 'nullable|string|in:Masculino,Femenino,Mixto',
            'age_min' => 'nullable|integer|min:0',
            'age_max' => 'nullable|integer|min:0',
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
            Category::with(['teams', 'discipline'])->findOrFail($id)
        );
    }

    #[OA\Put(
        path: "/api/categories/{id}",
        summary: "Actualizar categoría",
        description: "Permite actualizar la información de una categoría existente.",
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
                    new OA\Property(property: "name", type: "string", description: "Nuevo nombre de la categoría", example: "Sub-15 A"),
                    new OA\Property(property: "description", type: "string", description: "Nueva descripción", example: "Categoría actualizada"),
                    new OA\Property(property: "gender_type", type: "string", description: "Nuevo género", example: "Femenino"),
                    new OA\Property(property: "age_min", type: "integer", example: 12),
                    new OA\Property(property: "age_max", type: "integer", example: 16)
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
            'description' => 'nullable|string',
            'gender_type' => 'nullable|string|in:Masculino,Femenino,Mixto',
            'age_min' => 'nullable|integer|min:0',
            'age_max' => 'nullable|integer|min:0',
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