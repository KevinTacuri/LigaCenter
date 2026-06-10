<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Team;
use App\Models\Player;
use App\Models\TeamPlayer;
use App\Traits\ApiResponse;
use Illuminate\Http\Request;
use OpenApi\Attributes as OA;

#[OA\Tag(
    name: "Team Players",
    description: "Gestión de jugadores asignados a equipos (relación muchos a muchos)"
)]
class TeamPlayerController extends Controller
{
    use ApiResponse;

    #[OA\Get(
        path: "/api/team-players",
        summary: "Listar relaciones equipo-jugador",
        description: "Retorna todas las asignaciones de jugadores a equipos.",
        tags: ["Team Players"],
        security: [["sanctum" => []]],
        parameters: [
            new OA\Parameter(
                name: "team_id",
                description: "Filtrar por equipo",
                in: "query",
                required: false,
                schema: new OA\Schema(type: "integer")
            ),
            new OA\Parameter(
                name: "player_id",
                description: "Filtrar por jugador",
                in: "query",
                required: false,
                schema: new OA\Schema(type: "integer")
            ),
            new OA\Parameter(
                name: "championship_id",
                description: "Filtrar por campeonato (a través del equipo)",
                in: "query",
                required: false,
                schema: new OA\Schema(type: "integer")
            ),
        ],
        responses: [
            new OA\Response(response: 200, description: "Relaciones obtenidas exitosamente")
        ]
    )]
    public function index(Request $request)
    {
        $query = TeamPlayer::with(['team', 'player']);

        if ($request->has('team_id')) {
            $query->where('team_id', $request->team_id);
        }

        if ($request->has('player_id')) {
            $query->where('player_id', $request->player_id);
        }

        if ($request->has('championship_id')) {
            $query->whereHas('team', function ($q) use ($request) {
                $q->where('championship_id', $request->championship_id);
            });
        }

        $teamPlayers = $query->get();

        return $this->successResponse($teamPlayers, 'Relaciones obtenidas exitosamente');
    }

    #[OA\Post(
        path: "/api/team-players",
        summary: "Asignar jugador a equipo",
        description: "Asigna un jugador existente a un equipo existente.",
        tags: ["Team Players"],
        security: [["sanctum" => []]],
        requestBody: new OA\RequestBody(
            required: true,
            content: new OA\JsonContent(
                required: ["team_id", "player_id"],
                properties: [
                    new OA\Property(property: "team_id", type: "integer", example: 1),
                    new OA\Property(property: "player_id", type: "integer", example: 1),
                    new OA\Property(property: "jersey_number", type: "integer", example: 10),
                    new OA\Property(property: "status", type: "string", example: "activo"),
                ]
            )
        ),
        responses: [
            new OA\Response(response: 201, description: "Jugador asignado exitosamente"),
            new OA\Response(response: 409, description: "El jugador ya está asignado a este equipo"),
            new OA\Response(response: 422, description: "Error de validación")
        ]
    )]
    public function store(Request $request)
    {
        $request->validate([
            'team_id' => 'required|exists:teams,id',
            'player_id' => 'required|exists:players,id',
            'jersey_number' => 'nullable|integer',
            'status' => 'nullable|string|in:activo,inactivo',
        ]);

        $existing = TeamPlayer::where('team_id', $request->team_id)
            ->where('player_id', $request->player_id)
            ->first();

        if ($existing) {
            return $this->errorResponse('El jugador ya está asignado a este equipo', 409);
        }

        $teamPlayer = TeamPlayer::create([
            'team_id' => $request->team_id,
            'player_id' => $request->player_id,
            'jersey_number' => $request->jersey_number,
            'status' => $request->status ?? 'activo',
        ]);

        return $this->successResponse($teamPlayer, 'Jugador asignado exitosamente', 201);
    }

    #[OA\Get(
        path: "/api/team-players/{id}",
        summary: "Obtener relación por ID",
        description: "Devuelve la información de una asignación específica.",
        tags: ["Team Players"],
        security: [["sanctum" => []]],
        parameters: [
            new OA\Parameter(name: "id", in: "path", required: true, schema: new OA\Schema(type: "integer"))
        ],
        responses: [
            new OA\Response(response: 200, description: "Relación obtenida exitosamente"),
            new OA\Response(response: 404, description: "Relación no encontrada")
        ]
    )]
    public function show($id)
    {
        $teamPlayer = TeamPlayer::with(['team', 'player'])->find($id);

        if (!$teamPlayer) {
            return $this->errorResponse('Relación no encontrada', 404);
        }

        return $this->successResponse($teamPlayer, 'Relación obtenida exitosamente');
    }

    #[OA\Put(
        path: "/api/team-players/{id}",
        summary: "Actualizar relación",
        description: "Actualiza el número de camiseta o estado de la asignación.",
        tags: ["Team Players"],
        security: [["sanctum" => []]],
        parameters: [
            new OA\Parameter(name: "id", in: "path", required: true, schema: new OA\Schema(type: "integer"))
        ],
        requestBody: new OA\RequestBody(
            required: false,
            content: new OA\JsonContent(
                properties: [
                    new OA\Property(property: "jersey_number", type: "integer", example: 10),
                    new OA\Property(property: "status", type: "string", example: "inactivo"),
                ]
            )
        ),
        responses: [
            new OA\Response(response: 200, description: "Relación actualizada exitosamente"),
            new OA\Response(response: 404, description: "Relación no encontrada")
        ]
    )]
    public function update(Request $request, $id)
    {
        $teamPlayer = TeamPlayer::find($id);

        if (!$teamPlayer) {
            return $this->errorResponse('Relación no encontrada', 404);
        }

        $request->validate([
            'jersey_number' => 'nullable|integer',
            'status' => 'nullable|string|in:activo,inactivo',
        ]);

        $teamPlayer->update($request->only(['jersey_number', 'status']));

        return $this->successResponse($teamPlayer, 'Relación actualizada exitosamente');
    }

    #[OA\Delete(
        path: "/api/team-players/{id}",
        summary: "Eliminar relación",
        description: "Remueve la asignación de un jugador a un equipo.",
        tags: ["Team Players"],
        security: [["sanctum" => []]],
        parameters: [
            new OA\Parameter(name: "id", in: "path", required: true, schema: new OA\Schema(type: "integer"))
        ],
        responses: [
            new OA\Response(response: 200, description: "Relación eliminada exitosamente"),
            new OA\Response(response: 404, description: "Relación no encontrada")
        ]
    )]
    public function destroy($id)
    {
        $teamPlayer = TeamPlayer::find($id);

        if (!$teamPlayer) {
            return $this->errorResponse('Relación no encontrada', 404);
        }

        $teamPlayer->delete();

        return $this->successResponse(null, 'Relación eliminada exitosamente');
    }

    #[OA\Get(
        path: "/api/teams/{teamId}/players",
        summary: "Jugadores de un equipo",
        description: "Retorna todos los jugadores asignados a un equipo específico.",
        tags: ["Team Players"],
        security: [["sanctum" => []]],
        parameters: [
            new OA\Parameter(name: "teamId", in: "path", required: true, schema: new OA\Schema(type: "integer"))
        ],
        responses: [
            new OA\Response(response: 200, description: "Jugadores obtenidos exitosamente"),
            new OA\Response(response: 404, description: "Equipo no encontrado")
        ]
    )]
    public function getPlayersByTeam($teamId)
    {
        $team = Team::find($teamId);

        if (!$team) {
            return $this->errorResponse('Equipo no encontrado', 404);
        }

        $players = $team->players()->withPivot('jersey_number', 'status')->get();

        return $this->successResponse($players, 'Jugadores obtenidos exitosamente');
    }

    #[OA\Get(
        path: "/api/players/{playerId}/teams",
        summary: "Equipos de un jugador",
        description: "Retorna todos los equipos en los que ha participado un jugador.",
        tags: ["Team Players"],
        security: [["sanctum" => []]],
        parameters: [
            new OA\Parameter(name: "playerId", in: "path", required: true, schema: new OA\Schema(type: "integer"))
        ],
        responses: [
            new OA\Response(response: 200, description: "Equipos obtenidos exitosamente"),
            new OA\Response(response: 404, description: "Jugador no encontrado")
        ]
    )]
    public function getTeamsByPlayer($playerId)
    {
        $player = Player::find($playerId);

        if (!$player) {
            return $this->errorResponse('Jugador no encontrado', 404);
        }

        $teams = $player->teams()->withPivot('jersey_number', 'status')->get();

        return $this->successResponse($teams, 'Equipos obtenidos exitosamente');
    }
}