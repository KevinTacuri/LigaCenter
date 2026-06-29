<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Category;
use Illuminate\Http\Request;
use OpenApi\Attributes as OA;
use App\Models\ChampionshipDiscipline;

#[OA\Tag(
    name: "Categories",
    description: "Gestión de categorías de torneos deportivos, utilizadas para clasificar equipos según rango de edad"
)]
class CategoryController extends Controller
{
    #[OA\Get(
        path: "/api/championship-disciplines/{championshipDiscipline}/categories",
        summary: "Listar categorías",
        description: "Retorna todas las categorías registradas para una disciplina específica de un campeonato, incluyendo los equipos asociados a cada categoría.",
        tags: ["Categories"],
        parameters: [
            new OA\Parameter(
                name: "championshipDiscipline",
                description: "ID de la disciplina asociada al campeonato",
                in: "path",
                required: true,
                schema: new OA\Schema(type: "integer")
            )
        ],
        responses: [
            new OA\Response(
                response: 200,
                description: "Lista de categorías obtenida correctamente"
            ),
            new OA\Response(
                response: 404,
                description: "La disciplina del campeonato no existe"
            )
        ]
    )]
    public function index(ChampionshipDiscipline $championshipDiscipline)
    {
        return response()->json(
            Category::where(
                'championship_discipline_id',
                $championshipDiscipline->id
            )
                ->with(['teams', 'championshipDiscipline.discipline'])
                ->get()
        );
    }

    #[OA\Post(
        path: "/api/championship-disciplines/{championshipDiscipline}/categories",
        summary: "Crear categoría",
        description: "Registra una nueva categoría para una disciplina específica de un campeonato. Las categorías se utilizan para agrupar equipos según rangos de edad y definir el formato de competición.",
        tags: ["Categories"],
        parameters: [
            new OA\Parameter(
                name: "championshipDiscipline",
                description: "ID de la disciplina asociada al campeonato",
                in: "path",
                required: true,
                schema: new OA\Schema(type: "integer")
            )
        ],
        requestBody: new OA\RequestBody(
            required: true,
            description: "Datos necesarios para crear una categoría",
            content: new OA\JsonContent(
                required: ["name"],
                properties: [
                    new OA\Property(
                        property: "name",
                        type: "string",
                        description: "Nombre de la categoría",
                        example: "Sub-15"
                    ),
                    new OA\Property(
                        property: "format",
                        type: "string",
                        description: "Formato de competición",
                        enum: ["liga", "grupos", "eliminacion_directa"],
                        example: "grupos"
                    ),
                    new OA\Property(
                        property: "format_settings",
                        type: "object",
                        description: "Configuración JSON según el formato elegido",
                        example: "{\"num_groups\":4,\"advance_per_group\":2,\"third_place\":true}"
                    ),
                    new OA\Property(
                        property: "description",
                        type: "string",
                        description: "Descripción de la categoría",
                        example: "Categoría para menores de 15 años"
                    ),
                    new OA\Property(
                        property: "gender_type",
                        type: "string",
                        description: "Género de la categoría",
                        example: "Masculino"
                    ),
                    new OA\Property(
                        property: "age_min",
                        type: "integer",
                        example: 10
                    ),
                    new OA\Property(
                        property: "age_max",
                        type: "integer",
                        example: 15
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
                response: 404,
                description: "La disciplina del campeonato no existe"
            ),
            new OA\Response(
                response: 422,
                description: "Error de validación en los datos enviados"
            )
        ]
    )] 
    public function store(Request $request, ChampionshipDiscipline $championshipDiscipline)
    {
        $validated = $request->validate([
            'name' => 'required|string|max:255',
            'format' => 'nullable|string|in:liga,grupos,eliminacion_directa',
            'format_settings' => 'nullable|array',
            'format_settings.num_groups' => 'required_if:format,grupos|integer|min:1',
            'format_settings.advance_per_group' => 'required_if:format,grupos|integer|min:1',
            'format_settings.third_place' => 'nullable|boolean',
            'description' => 'nullable|string',
            'gender_type' => 'nullable|string|in:Masculino,Femenino,Mixto',
            'age_min' => 'nullable|integer|min:0',
            'age_max' => 'nullable|integer|min:0',
        ]);

        $validated['championship_discipline_id'] = $championshipDiscipline->id;

        $category = Category::create($validated);

        return response()->json($category, 201);
    }

    #[OA\Get(
        path: "/api/categories/{id}",
        summary: "Obtener categoría por ID",
        description: "Devuelve la información detallada de una categoría específica junto con los equipos asociados y la disciplina del campeonato a la que pertenece.",
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
            Category::with([
                'teams',
                'championshipDiscipline.discipline'
            ])->findOrFail($id)
        );
    }

    #[OA\Put(
        path: "/api/categories/{id}",
        summary: "Actualizar categoría",
        description: "Permite actualizar la información de una categoría existente, incluyendo su formato de competición.",
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
                        example: "Sub-15 A"
                    ),
                    new OA\Property(
                        property: "format",
                        type: "string",
                        description: "Nuevo formato de competición",
                        enum: ["liga", "grupos", "eliminacion_directa"],
                        example: "liga"
                    ),
                    new OA\Property(
                        property: "format_settings",
                        type: "object",
                        description: "Configuración JSON según el formato elegido",
                        example: "{\"num_groups\":4,\"advance_per_group\":2,\"third_place\":true}"
                    ),
                    new OA\Property(
                        property: "description",
                        type: "string",
                        description: "Nueva descripción",
                        example: "Categoría actualizada"
                    ),
                    new OA\Property(
                        property: "gender_type",
                        type: "string",
                        description: "Nuevo género",
                        example: "Femenino"
                    ),
                    new OA\Property(
                        property: "age_min",
                        type: "integer",
                        example: 12
                    ),
                    new OA\Property(
                        property: "age_max",
                        type: "integer",
                        example: 16
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
            ),
            new OA\Response(
                response: 422,
                description: "Error de validación"
            )
        ]
    )]
    public function update(Request $request, $id)
    {
        $category = Category::findOrFail($id);

        $validated = $request->validate([
            'name' => 'sometimes|string|max:255',
            'format' => 'sometimes|string|in:liga,grupos,eliminacion_directa',
            'format_settings' => 'nullable|array',
            'format_settings.num_groups' => 'required_if:format,grupos|integer|min:1',
            'format_settings.advance_per_group' => 'required_if:format,grupos|integer|min:1',
            'format_settings.third_place' => 'nullable|boolean',
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

    #[OA\Get(
        path: "/api/championships/{championship}/categories",
        operationId: "getCategoriesByChampionship",
        summary: "Listar categorías de un campeonato",
        description: "Obtiene todas las categorías asociadas a las disciplinas de un campeonato.",
        tags: ["Categories"],
        security: [["sanctum" => []]],
        parameters: [
            new OA\Parameter(name: "championship", description: "ID del campeonato", in: "path", required: true, schema: new OA\Schema(type: "integer"))
        ],
        responses: [
            new OA\Response(response: 200, description: "Categorías obtenidas exitosamente"),
            new OA\Response(response: 401, description: "No autenticado"),
            new OA\Response(response: 404, description: "Campeonato no encontrado")
        ]
    )]
    public function indexByChampionship(\App\Models\Championship $championship)
    {
        return response()->json(
            Category::whereHas('championshipDiscipline', function ($query) use ($championship) {
                $query->where('championship_id', $championship->id);
            })
                ->with(['teams', 'championshipDiscipline.discipline'])
                ->get()
        );
    }

    #[OA\Get(
        path: "/api/public/categories",
        operationId: "getPublicCategories",
        summary: "Listar categorías públicas",
        description: "Obtiene categorías pertenecientes a campeonatos públicos y permite filtrarlas.",
        tags: ["Categories"],
        parameters: [
            new OA\Parameter(name: "championship_id", description: "ID del campeonato", in: "query", required: false, schema: new OA\Schema(type: "integer")),
            new OA\Parameter(name: "discipline_id", description: "ID de la disciplina", in: "query", required: false, schema: new OA\Schema(type: "integer"))
        ],
        responses: [
            new OA\Response(response: 200, description: "Categorías públicas obtenidas exitosamente")
        ]
    )]
    public function indexPublic(Request $request)
    {
        $query = Category::with(['championshipDiscipline.discipline', 'teams'])
            ->whereHas('championshipDiscipline.championship', function($q) {
                $q->where('is_public', true);
            });

        if ($request->has('championship_id')) {
            $query->whereHas('championshipDiscipline', function($q) use ($request) {
                $q->where('championship_id', $request->championship_id);
            });
        }
        if ($request->has('discipline_id')) {
            $query->whereHas('championshipDiscipline', function($q) use ($request) {
                $q->where('discipline_id', $request->discipline_id);
            });
        }

        return response()->json($query->get());
    }
}