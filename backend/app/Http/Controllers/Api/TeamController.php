<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Team;
use Illuminate\Http\Request;
use OpenApi\Attributes as OA;

#[OA\Tag(
    name: "Teams",
    description: "Gestión de equipos deportivos registrados por delegaciones en diferentes disciplinas y categorías"
)]
class TeamController extends Controller
{
    #[OA\Get(
        path: "/api/teams",
        summary: "Listar equipos",
        description: "Retorna todos los equipos registrados en el sistema junto con su organización, disciplina, categoría y jugadores asociados.",
        tags: ["Teams"],
        responses: [
            new OA\Response(
                response: 200,
                description: "Listado de equipos obtenido correctamente"
            )
        ]
    )]
    public function index()
    {
        return response()->json(
            Team::with([
                'organization',
                'discipline',
                'category',
                'players'
            ])->get()
        );
    }

    #[OA\Post(
        path: "/api/teams",
        summary: "Registrar equipo",
        description: "Crea un nuevo equipo asociado a una delegación, disciplina y categoría. El estado inicial del registro es 'pendiente'.",
        tags: ["Teams"],
        requestBody: new OA\RequestBody(
            required: true,
            description: "Datos necesarios para crear un equipo",
            content: new OA\JsonContent(
                required: ["organization_id", "discipline_id", "category_id", "name"],
                properties: [
                    new OA\Property(
                        property: "organization_id",
                        type: "integer",
                        description: "ID de la delegación (organización)",
                        example: 1
                    ),
                    new OA\Property(
                        property: "discipline_id",
                        type: "integer",
                        description: "ID de la disciplina deportiva",
                        example: 2
                    ),
                    new OA\Property(
                        property: "category_id",
                        type: "integer",
                        description: "ID de la categoría del equipo",
                        example: 3
                    ),
                    new OA\Property(
                        property: "name",
                        type: "string",
                        description: "Nombre del equipo",
                        example: "Los Invencibles"
                    )
                ]
            )
        ),
        responses: [
            new OA\Response(
                response: 201,
                description: "Equipo creado correctamente"
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
            'organization_id' => 'required|exists:organizations,id',
            'discipline_id' => 'required|exists:disciplines,id',
            'category_id' => 'required|exists:categories,id',
            'name' => 'required|string|max:255',
        ]);

        $team = Team::create([
            ...$validated,
            'registration_status' => 'pendiente'
        ]);

        return response()->json($team, 201);
    }

    #[OA\Get(
        path: "/api/teams/{id}",
        summary: "Obtener equipo por ID",
        description: "Devuelve la información detallada de un equipo junto con su organización, disciplina, categoría y jugadores registrados.",
        tags: ["Teams"],
        parameters: [
            new OA\Parameter(
                name: "id",
                description: "ID del equipo",
                in: "path",
                required: true,
                schema: new OA\Schema(type: "integer")
            )
        ],
        responses: [
            new OA\Response(
                response: 200,
                description: "Equipo encontrado correctamente"
            ),
            new OA\Response(
                response: 404,
                description: "Equipo no encontrado"
            )
        ]
    )]
    public function show($id)
    {
        return response()->json(
            Team::with([
                'organization',
                'discipline',
                'category',
                'players'
            ])->findOrFail($id)
        );
    }

    #[OA\Put(
        path: "/api/teams/{id}",
        summary: "Actualizar equipo",
        description: "Permite actualizar la información de un equipo como su nombre, categoría, disciplina, organización o estado de registro.",
        tags: ["Teams"],
        parameters: [
            new OA\Parameter(
                name: "id",
                description: "ID del equipo a actualizar",
                in: "path",
                required: true,
                schema: new OA\Schema(type: "integer")
            )
        ],
        requestBody: new OA\RequestBody(
            required: false,
            description: "Campos opcionales para actualizar el equipo",
            content: new OA\JsonContent(
                properties: [
                    new OA\Property(property: "organization_id", type: "integer", example: 1),
                    new OA\Property(property: "discipline_id", type: "integer", example: 2),
                    new OA\Property(property: "category_id", type: "integer", example: 3),
                    new OA\Property(property: "name", type: "string", example: "Los Campeones"),
                    new OA\Property(property: "registration_status", type: "string", example: "aprobado")
                ]
            )
        ),
        responses: [
            new OA\Response(
                response: 200,
                description: "Equipo actualizado correctamente"
            ),
            new OA\Response(
                response: 404,
                description: "Equipo no encontrado"
            )
        ]
    )]
    public function update(Request $request, $id)
    {
        $team = Team::findOrFail($id);

        $validated = $request->validate([
            'organization_id' => 'sometimes|exists:organizations,id',
            'discipline_id' => 'sometimes|exists:disciplines,id',
            'category_id' => 'sometimes|exists:categories,id',
            'name' => 'sometimes|string|max:255',
            'registration_status' => 'sometimes|string|max:50'
        ]);

        $team->update($validated);

        return response()->json($team);
    }

    #[OA\Delete(
        path: "/api/teams/{id}",
        summary: "Eliminar equipo",
        description: "Elimina un equipo del sistema junto con sus relaciones (como jugadores asociados si aplica cascada).",
        tags: ["Teams"],
        parameters: [
            new OA\Parameter(
                name: "id",
                description: "ID del equipo a eliminar",
                in: "path",
                required: true,
                schema: new OA\Schema(type: "integer")
            )
        ],
        responses: [
            new OA\Response(
                response: 200,
                description: "Equipo eliminado correctamente"
            ),
            new OA\Response(
                response: 404,
                description: "Equipo no encontrado"
            )
        ]
    )]
    public function destroy($id)
    {
        $team = Team::findOrFail($id);

        $team->delete();

        return response()->json([
            'message' => 'Equipo eliminado correctamente'
        ]);
    }
}