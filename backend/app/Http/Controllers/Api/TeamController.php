<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Team;
use App\Models\Championship;
use App\Traits\ApiResponse;
use Illuminate\Http\Request;
use OpenApi\Attributes as OA;
use App\Http\Resources\TeamResource;
use App\Models\Category;
use \App\Http\Resources\TeamListResource;
use Illuminate\Support\Str;


#[OA\Tag(
    name: "Teams",
    description: "Gestión de equipos deportivos dentro de un campeonato"
)]
class TeamController extends Controller
{
    use ApiResponse;

    #[OA\Get(
        path: "/categories/{category_id}/teams",
        summary: "Listar equipos",
        description: "Retorna una lista de equipos registrados en una categoría específica.",
        tags: ["Teams"],
        security: [["sanctum" => []]],
        parameters: [
            new OA\Parameter(name: "category_id", in: "path", required: true, schema: new OA\Schema(type: "integer"))
        ],
        responses: [
            new OA\Response(response: 200, description: "Equipos obtenidos exitosamente"),
            new OA\Response(response: 404, description: "Categoría no encontrada")
        ]
    )]
    public function index(Request $request, $categoryId = null)
    {
        if ($categoryId) {
            $category = Category::find($categoryId);

            if (!$category) {
                return $this->errorResponse('Categoría no encontrada', 404);
            }

            $teams = $category->teams()->withCount('players')->get();

            return $this->successResponse(TeamListResource::collection($teams), 'Equipos obtenidos exitosamente');
        }

        $championshipId = $request->query('championship_id') 
            ?? $request->header('X-Championship-ID');

        if (!$championshipId) {
            return $this->errorResponse('Falta el ID del campeonato', 400);
        }

        $teams = Team::where('championship_id', $championshipId)->withCount('players')->get();

        return $this->successResponse(TeamListResource::collection($teams), 'Equipos obtenidos exitosamente');
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
            'representative' => 'nullable|string|max:255',
            'name' => 'required|string|max:255',
            'description' => 'nullable|string',
            'registration_status' => 'nullable|string',
        ]);

        $category = Category::find($request->category_id);

        if (!$category) {
            return $this->errorResponse('Categoría no encontrada', 404);
        }

        if ($category->championshipDiscipline->championship_id != $request->championship_id) {
            return $this->errorResponse('La disciplina de la categoría no pertenece a este campeonato', 422);
        }

        $logoValue = $this->resolveLogo($request);

        $team = Team::create([
            'championship_id' => $request->championship_id,
            'category_id' => $request->category_id,
            'representative' => $request->representative,
            'name' => $request->name,
            'logo' => $logoValue,
            'description' => $request->description,
            'registration_status' => $request->registration_status ?? 'pendiente',
        ]);

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
        $team = Team::with([
            'category.championshipDiscipline.discipline',
            'players'
        ])->find($id);

        if (!$team) {
            return $this->errorResponse('Equipo no encontrado', 404);
        }

        return $this->successResponse(
            new TeamResource($team),
            'Equipo obtenido exitosamente'
        );
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
            'representative' => 'nullable|string|max:255',
            'name' => 'sometimes|string|max:255',
            'description' => 'nullable|string',
            'registration_status' => 'sometimes|string|in:pendiente,aprobado,rechazado',
        ]);

        $datosActualizar = $request->only(['representative', 'name', 'description', 'registration_status']);

        // Solo tocamos el logo si el usuario mandó un archivo nuevo o una URL nueva
        if ($request->hasFile('logo') || $request->filled('logo')) {
            // Borrar el logo físico anterior, solo si era un archivo local (no una URL externa)
            $logoAnterior = $team->getRawOriginal('logo');
            if ($logoAnterior && !Str::startsWith($logoAnterior, ['http://', 'https://'])) {
                \Illuminate\Support\Facades\Storage::disk('public')->delete($logoAnterior);
            }

            $datosActualizar['logo'] = $this->resolveLogo($request);
        }

        $team->update($datosActualizar);

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
    /**
     * Resuelve el valor a guardar en 'logo': procesa un archivo subido o
     * devuelve la URL de texto tal cual fue enviada.
     */
    private function resolveLogo(Request $request): ?string
    {
        if ($request->hasFile('logo')) {
            $request->validate([
                'logo' => 'image|mimes:jpg,jpeg,png,webp|max:2048',
            ]);
            return $request->file('logo')->store('teams/logos', 'public');
        }

        if ($request->filled('logo')) {
            $request->validate([
                'logo' => 'string|max:2048|url',
            ]);
            return $request->input('logo');
        }

        return null;
    }
}