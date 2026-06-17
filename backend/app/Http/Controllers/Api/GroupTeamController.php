<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Group;
use App\Models\GroupTeam;
use App\Traits\ApiResponse;
use Illuminate\Http\Request;
use OpenApi\Attributes as OA;

#[OA\Tag(
    name: "Group Teams",
    description: "Gestión de equipos asignados a grupos"
)]
class GroupTeamController extends Controller
{
    use ApiResponse;

    #[OA\Get(
        path: "/api/group-teams",
        summary: "Listar equipos en grupos",
        tags: ["Group Teams"],
        security: [["sanctum" => []]],
        parameters: [
            new OA\Parameter(name: "group_id", in: "query", required: false, schema: new OA\Schema(type: "integer")),
            new OA\Parameter(name: "category_id", in: "query", required: false, schema: new OA\Schema(type: "integer"))
        ],
        responses: [
            new OA\Response(response: 200, description: "Equipos obtenidos exitosamente")
        ]
    )]
    public function index(Request $request)
    {
        $query = GroupTeam::with(['group', 'team']);

        if ($request->has('group_id')) {
            $query->where('group_id', $request->group_id);
        }

        if ($request->has('category_id')) {
            $query->whereHas('group', function ($q) use ($request) {
                $q->where('category_id', $request->category_id);
            });
        }

        $groupTeams = $query->get();

        return $this->successResponse($groupTeams, 'Equipos obtenidos exitosamente');
    }

    #[OA\Get(
        path: "/api/group-teams/{id}",
        summary: "Obtener asignación por ID",
        tags: ["Group Teams"],
        security: [["sanctum" => []]],
        parameters: [
            new OA\Parameter(name: "id", in: "path", required: true, schema: new OA\Schema(type: "integer"))
        ],
        responses: [
            new OA\Response(response: 200, description: "Asignación obtenida exitosamente"),
            new OA\Response(response: 404, description: "Asignación no encontrada")
        ]
    )]
    public function show($id)
    {
        $groupTeam = GroupTeam::with(['group', 'team'])->find($id);

        if (!$groupTeam) {
            return $this->errorResponse('Asignación no encontrada', 404);
        }

        return $this->successResponse($groupTeam, 'Asignación obtenida exitosamente');
    }

    #[OA\Put(
        path: "/api/group-teams/{id}",
        summary: "Actualizar estadísticas del equipo en el grupo",
        tags: ["Group Teams"],
        security: [["sanctum" => []]],
        parameters: [
            new OA\Parameter(name: "id", in: "path", required: true, schema: new OA\Schema(type: "integer"))
        ],
        requestBody: new OA\RequestBody(
            required: false,
            content: new OA\JsonContent(
                properties: [
                    new OA\Property(property: "points", type: "integer"),
                    new OA\Property(property: "goals_for", type: "integer"),
                    new OA\Property(property: "goals_against", type: "integer"),
                    new OA\Property(property: "matches_played", type: "integer"),
                    new OA\Property(property: "wins", type: "integer"),
                    new OA\Property(property: "draws", type: "integer"),
                    new OA\Property(property: "losses", type: "integer"),
                ]
            )
        ),
        responses: [
            new OA\Response(response: 200, description: "Estadísticas actualizadas exitosamente"),
            new OA\Response(response: 404, description: "Asignación no encontrada")
        ]
    )]
    public function update(Request $request, $id)
    {
        $groupTeam = GroupTeam::find($id);

        if (!$groupTeam) {
            return $this->errorResponse('Asignación no encontrada', 404);
        }

        $request->validate([
            'points' => 'nullable|integer|min:0',
            'goals_for' => 'nullable|integer|min:0',
            'goals_against' => 'nullable|integer|min:0',
            'matches_played' => 'nullable|integer|min:0',
            'wins' => 'nullable|integer|min:0',
            'draws' => 'nullable|integer|min:0',
            'losses' => 'nullable|integer|min:0',
        ]);

        $groupTeam->update($request->only([
            'points', 'goals_for', 'goals_against', 'matches_played', 'wins', 'draws', 'losses'
        ]));

        return $this->successResponse($groupTeam, 'Estadísticas actualizadas exitosamente');
    }
}