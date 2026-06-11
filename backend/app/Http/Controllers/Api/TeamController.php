<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Team;
use App\Models\Championship;
use App\Traits\ApiResponse;
use Illuminate\Http\Request;
use OpenApi\Attributes as OA;

#[OA\Tag(
    name: "Teams",
    description: "Gestión de equipos deportivos dentro de un campeonato"
)]
class TeamController extends Controller
{
    use ApiResponse;

    #[OA\Get(
        path: "/api/teams",
        summary: "Listar equipos",
        description: "Retorna todos los equipos de un campeonato específico.",
        tags: ["Teams"],
        security: [["sanctum" => []]],
        parameters: [
            new OA\Parameter(name: "championship_id", in: "query", required: true, schema: new OA\Schema(type: "integer"))
        ],
        responses: [
            new OA\Response(response: 200, description: "Equipos obtenidos exitosamente")
        ]
    )]
    public function index(Request $request)
    {
        $request->validate([
            'championship_id' => 'required|exists:championships,id',
        ]);

        $teams = Team::where('championship_id', $request->championship_id)
            ->with(['category.discipline', 'players', 'organization'])
            ->get();

        return $this->successResponse($teams, 'Equipos obtenidos exitosamente');
    }

    #[OA\Post(
        path: "/api/teams",
        summary: "Crear equipo",
        description: "Registra un nuevo equipo dentro de un campeonato.",
        tags: ["Teams"],
        security: [["sanctum" => []]],
        requestBody: new OA\RequestBody(
            required: true,
            content: new OA\JsonContent(
                required: ["championship_id", "category_id", "name"],
                properties: [
                    new OA\Property(property: "championship_id", type: "integer", example: 1),
                    new OA\Property(property: "category_id", type: "integer", example: 1),
                    new OA\Property(property: "name", type: "string", example: "Equipo A"),
                    new OA\Property(property: "logo", type: "string", example: "logos/equipo-a.png"),
                    new OA\Property(property: "description", type: "string", example: "Equipo representante de la empresa X"),
                    new OA\Property(property: "registration_status", type: "string", example: "pendiente"),
                ]
            )
        ),
        responses: [
            new OA\Response(response: 201, description: "Equipo creado exitosamente"),
            new OA\Response(response: 422, description: "Error de validación")
        ]
    )]
    public function store(Request $request)
    {
        $request->validate([
            'championship_id' => 'required|exists:championships,id',
            'category_id' => 'required|exists:categories,id',
            'organization_id' => 'nullable|exists:organizations,id',
            'representative' => 'nullable|string|max:255',
            'name' => 'required|string|max:255',
            'logo' => 'nullable|string',
            'description' => 'nullable|string',
            'registration_status' => 'nullable|string',
        ]);

        $category = \App\Models\Category::findOrFail($request->category_id);
        if ($category->championship_id != $request->championship_id) {
            return $this->errorResponse('La categoría no pertenece a este campeonato', 422);
        }

        $team = Team::create([
            'championship_id' => $request->championship_id,
            'category_id' => $request->category_id,
            'organization_id' => $request->organization_id,
            'representative' => $request->representative,
            'name' => $request->name,
            'logo' => $request->logo,
            'description' => $request->description,
            'registration_status' => $request->registration_status ?? 'pendiente',
        ]);

        $team->load('organization');

        return $this->successResponse($team, 'Equipo creado exitosamente', 201);
    }

    #[OA\Get(
        path: "/api/teams/{id}",
        summary: "Obtener equipo por ID",
        description: "Devuelve la información detallada de un equipo específico.",
        tags: ["Teams"],
        security: [["sanctum" => []]],
        parameters: [
            new OA\Parameter(name: "id", in: "path", required: true, schema: new OA\Schema(type: "integer"))
        ],
        responses: [
            new OA\Response(response: 200, description: "Equipo obtenido exitosamente"),
            new OA\Response(response: 404, description: "Equipo no encontrado")
        ]
    )]
    public function show($id)
    {
        $team = Team::with(['category.discipline', 'players', 'organization'])->find($id);

        if (!$team) {
            return $this->errorResponse('Equipo no encontrado', 404);
        }

        return $this->successResponse($team, 'Equipo obtenido exitosamente');
    }

    #[OA\Put(
        path: "/api/teams/{id}",
        summary: "Actualizar equipo",
        description: "Actualiza la información de un equipo existente.",
        tags: ["Teams"],
        security: [["sanctum" => []]],
        parameters: [
            new OA\Parameter(name: "id", in: "path", required: true, schema: new OA\Schema(type: "integer"))
        ],
        requestBody: new OA\RequestBody(
            required: false,
            content: new OA\JsonContent(
                properties: [
                    new OA\Property(property: "name", type: "string", example: "Equipo A Actualizado"),
                    new OA\Property(property: "logo", type: "string"),
                    new OA\Property(property: "description", type: "string"),
                    new OA\Property(property: "registration_status", type: "string", enum: ["pendiente", "aprobado", "rechazado"]),
                ]
            )
        ),
        responses: [
            new OA\Response(response: 200, description: "Equipo actualizado exitosamente"),
            new OA\Response(response: 404, description: "Equipo no encontrado")
        ]
    )]
    public function update(Request $request, $id)
    {
        $team = Team::find($id);

        if (!$team) {
            return $this->errorResponse('Equipo no encontrado', 404);
        }

        $request->validate([
            'organization_id' => 'nullable|exists:organizations,id',
            'representative' => 'nullable|string|max:255',
            'name' => 'sometimes|string|max:255',
            'logo' => 'nullable|string',
            'description' => 'nullable|string',
            'registration_status' => 'sometimes|string|in:pendiente,aprobado,rechazado',
        ]);

        $team->update($request->only([
            'organization_id', 'representative', 'name', 'logo', 'description', 'registration_status'
        ]));

        $team->load('organization');

        return $this->successResponse($team, 'Equipo actualizado exitosamente');
    }

    #[OA\Delete(
        path: "/api/teams/{id}",
        summary: "Eliminar equipo",
        description: "Elimina un equipo del sistema.",
        tags: ["Teams"],
        security: [["sanctum" => []]],
        parameters: [
            new OA\Parameter(name: "id", in: "path", required: true, schema: new OA\Schema(type: "integer"))
        ],
        responses: [
            new OA\Response(response: 200, description: "Equipo eliminado exitosamente"),
            new OA\Response(response: 404, description: "Equipo no encontrado")
        ]
    )]
    public function destroy($id)
    {
        $team = Team::find($id);

        if (!$team) {
            return $this->errorResponse('Equipo no encontrado', 404);
        }

        $team->delete();

        return $this->successResponse(null, 'Equipo eliminado exitosamente');
    }

    #[OA\Post(
        path: "/api/teams/{id}/players",
        summary: "Agregar jugador al equipo",
        description: "Asigna un jugador existente a un equipo.",
        tags: ["Teams"],
        security: [["sanctum" => []]],
        parameters: [
            new OA\Parameter(name: "id", in: "path", required: true, schema: new OA\Schema(type: "integer"))
        ],
        requestBody: new OA\RequestBody(
            required: true,
            content: new OA\JsonContent(
                required: ["player_id"],
                properties: [
                    new OA\Property(property: "player_id", type: "integer", example: 1),
                    new OA\Property(property: "jersey_number", type: "integer", example: 10),
                ]
            )
        ),
        responses: [
            new OA\Response(response: 200, description: "Jugador agregado exitosamente"),
            new OA\Response(response: 404, description: "Equipo o jugador no encontrado")
        ]
    )]
    public function addPlayer(Request $request, $id)
    {
        $team = Team::find($id);

        if (!$team) {
            return $this->errorResponse('Equipo no encontrado', 404);
        }

        $request->validate([
            'player_id' => 'required|exists:players,id',
            'jersey_number' => 'nullable|integer',
        ]);

        $team->players()->attach($request->player_id, [
            'jersey_number' => $request->jersey_number,
        ]);

        return $this->successResponse(null, 'Jugador agregado al equipo exitosamente');
    }

    #[OA\Delete(
        path: "/api/teams/{id}/players/{playerId}",
        summary: "Remover jugador del equipo",
        description: "Remueve un jugador de un equipo.",
        tags: ["Teams"],
        security: [["sanctum" => []]],
        parameters: [
            new OA\Parameter(name: "id", in: "path", required: true, schema: new OA\Schema(type: "integer")),
            new OA\Parameter(name: "playerId", in: "path", required: true, schema: new OA\Schema(type: "integer"))
        ],
        responses: [
            new OA\Response(response: 200, description: "Jugador removido exitosamente"),
            new OA\Response(response: 404, description: "Equipo o jugador no encontrado")
        ]
    )]
    public function removePlayer($id, $playerId)
    {
        $team = Team::find($id);

        if (!$team) {
            return $this->errorResponse('Equipo no encontrado', 404);
        }

        $team->players()->detach($playerId);

        return $this->successResponse(null, 'Jugador removido del equipo exitosamente');
    }
}