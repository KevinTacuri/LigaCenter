<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Discipline;
use Illuminate\Http\Request;
use OpenApi\Attributes as OA;

#[OA\Tag(
    name: "Disciplines",
    description: "Gestión de catálogo de disciplinas deportivas disponibles en el sistema."
)]
class DisciplineController extends Controller
{

    #[OA\Get(
        path: "/api/disciplines",
        summary: "Listar disciplinas",
        description: "Retorna el catálogo de disciplinas deportivas disponibles para ser asociadas a un campeonato.",
        tags: ["Disciplines"],
        responses: [
            new OA\Response(
                response: 200,
                description: "Catálogo de disciplinas obtenido correctamente"
            )
        ]
    )]
    public function index()
    {
        return response()->json(
            Discipline::orderBy('name')->get()
        );
    }

    #[OA\Post(
        path: "/api/disciplines",
        summary: "Crear disciplina",
        description: "Registra una nueva disciplina deportiva en el sistema (ej: fútbol, vóley, básquet).",
        tags: ["Disciplines"],
        requestBody: new OA\RequestBody(
            required: true,
            description: "Datos necesarios para crear una disciplina",
            content: new OA\JsonContent(
                required: ["name"],
                properties: [
                    new OA\Property(
                        property: "name",
                        type: "string",
                        description: "Nombre de la disciplina",
                        example: "Fútbol"
                    ),
                    new OA\Property(
                        property: "specific_rules",
                        type: "string",
                        description: "Reglas específicas de la disciplina",
                        example: "11 jugadores por equipo"
                    )
                ]
            )
        ),
        responses: [
            new OA\Response(
                response: 201,
                description: "Disciplina creada correctamente"
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
            'specific_rules' => 'nullable|string'
        ]);

        $discipline = Discipline::create($validated);

        return response()->json($discipline, 201);
    }

    #[OA\Get(
        path: "/api/disciplines/{id}",
        summary: "Obtener disciplina por ID",
        description: "Devuelve la información detallada de una disciplina específica junto con sus equipos asociados.",
        tags: ["Disciplines"],
        parameters: [
            new OA\Parameter(
                name: "id",
                description: "ID de la disciplina",
                in: "path",
                required: true,
                schema: new OA\Schema(type: "integer")
            )
        ],
        responses: [
            new OA\Response(
                response: 200,
                description: "Disciplina encontrada correctamente"
            ),
            new OA\Response(
                response: 404,
                description: "Disciplina no encontrada"
            )
        ]
    )]
    public function show($id)
    {
        return response()->json(
            Discipline::with('teams')->findOrFail($id)
        );
    }

    #[OA\Put(
        path: "/api/disciplines/{id}",
        summary: "Actualizar disciplina",
        description: "Permite actualizar el nombre o reglas específicas de una disciplina existente.",
        tags: ["Disciplines"],
        parameters: [
            new OA\Parameter(
                name: "id",
                description: "ID de la disciplina a actualizar",
                in: "path",
                required: true,
                schema: new OA\Schema(type: "integer")
            )
        ],
        requestBody: new OA\RequestBody(
            required: false,
            description: "Campos opcionales para actualizar la disciplina",
            content: new OA\JsonContent(
                properties: [
                    new OA\Property(
                        property: "name",
                        type: "string",
                        example: "Fútbol sala"
                    ),
                    new OA\Property(
                        property: "specific_rules",
                        type: "string",
                        example: "5 jugadores por equipo"
                    )
                ]
            )
        ),
        responses: [
            new OA\Response(
                response: 200,
                description: "Disciplina actualizada correctamente"
            ),
            new OA\Response(
                response: 404,
                description: "Disciplina no encontrada"
            )
        ]
    )]
    public function update(Request $request, $id)
    {
        $discipline = Discipline::findOrFail($id);

        $validated = $request->validate([
            'name' => 'sometimes|string|max:255',
            'specific_rules' => 'nullable|string'
        ]);

        $discipline->update($validated);

        return response()->json($discipline);
    }

    #[OA\Delete(
        path: "/api/disciplines/{id}",
        summary: "Eliminar disciplina",
        description: "Elimina una disciplina del sistema. Esto puede afectar a los equipos asociados.",
        tags: ["Disciplines"],
        parameters: [
            new OA\Parameter(
                name: "id",
                description: "ID de la disciplina a eliminar",
                in: "path",
                required: true,
                schema: new OA\Schema(type: "integer")
            )
        ],
        responses: [
            new OA\Response(
                response: 200,
                description: "Disciplina eliminada correctamente"
            ),
            new OA\Response(
                response: 404,
                description: "Disciplina no encontrada"
            )
        ]
    )]
    public function destroy($id)
    {
        $discipline = Discipline::findOrFail($id);

        $discipline->delete();

        return response()->json([
            'message' => 'Disciplina eliminada correctamente'
        ]);
    }



    #[OA\Get(path: '/api/public/disciplines', operationId: 'getPublicDisciplines', summary: 'Listar disciplinas públicas', tags: ['Disciplines'], responses: [new OA\Response(response: 200, description: 'Consulta exitosa'), new OA\Response(response: 404, description: 'Recurso no encontrado')])]
    public function indexPublic()
    {
        return response()->json(
            AppModelsDiscipline::whereHas('championships', fn ($q) => $q->where('is_public', true))
                ->with('statistics')
                ->orderBy('name')
                ->get()
        );
    }

    #[OA\Get(path: '/api/public/disciplines/{id}', operationId: 'getPublicDiscipline', summary: 'Obtener disciplina pública', tags: ['Disciplines'], responses: [new OA\Response(response: 200, description: 'Consulta exitosa'), new OA\Response(response: 404, description: 'Recurso no encontrado')])]
    public function showPublic($id)
    {
        $discipline = AppModelsDiscipline::whereHas('championships', fn ($q) => $q->where('is_public', true))
            ->with(['statistics', 'championshipDisciplines' => fn ($q) => $q->whereHas('championship', fn ($c) => $c->where('is_public', true))])
            ->find($id);

        if (!$discipline) {
            return response()->json(['message' => 'Disciplina pública no encontrada'], 404);
        }

        return response()->json($discipline);
    }

}