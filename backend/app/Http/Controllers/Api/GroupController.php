<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Group;
use App\Models\GroupTeam;
use App\Traits\ApiResponse;
use Illuminate\Http\Request;
use OpenApi\Attributes as OA;

#[OA\Tag(
    name: "Groups",
    description: "Gestión de grupos en fase de grupos"
)]
class GroupController extends Controller
{
    use ApiResponse;

    #[OA\Get(
        path: "/api/groups",
        summary: "Listar grupos",
        tags: ["Groups"],
        security: [["sanctum" => []]],
        parameters: [
            new OA\Parameter(name: "category_id", in: "query", required: true, schema: new OA\Schema(type: "integer"))
        ],
        responses: [
            new OA\Response(response: 200, description: "Grupos obtenidos exitosamente")
        ]
    )]
    public function index(Request $request)
    {
        $request->validate([
            'category_id' => 'required|exists:categories,id',
        ]);

        $groups = Group::where('category_id', $request->category_id)
            ->with(['teams'])
            ->get();

        return $this->successResponse($groups, 'Grupos obtenidos exitosamente');
    }

    #[OA\Get(
        path: "/api/groups/{id}",
        summary: "Obtener grupo por ID",
        tags: ["Groups"],
        security: [["sanctum" => []]],
        parameters: [
            new OA\Parameter(name: "id", in: "path", required: true, schema: new OA\Schema(type: "integer"))
        ],
        responses: [
            new OA\Response(response: 200, description: "Grupo obtenido exitosamente"),
            new OA\Response(response: 404, description: "Grupo no encontrado")
        ]
    )]
    public function show($id)
    {
        $group = Group::with(['teams', 'category', 'championship'])->find($id);

        if (!$group) {
            return $this->errorResponse('Grupo no encontrado', 404);
        }

        return $this->successResponse($group, 'Grupo obtenido exitosamente');
    }

    #[OA\Get(
        path: "/api/groups/{id}/standings",
        summary: "Tabla de posiciones del grupo",
        tags: ["Groups"],
        security: [["sanctum" => []]],
        parameters: [
            new OA\Parameter(name: "id", in: "path", required: true, schema: new OA\Schema(type: "integer"))
        ],
        responses: [
            new OA\Response(response: 200, description: "Tabla obtenida exitosamente"),
            new OA\Response(response: 404, description: "Grupo no encontrado")
        ]
    )]
    public function getStandings($id)
    {
        $group = Group::find($id);

        if (!$group) {
            return $this->errorResponse('Grupo no encontrado', 404);
        }

        $standings = GroupTeam::with(['team'])
            ->where('group_id', $id)
            ->orderBy('points', 'desc')
            ->orderBy('goals_for', 'desc')
            ->get();

        return $this->successResponse([
            'group' => $group,
            'standings' => $standings,
        ], 'Tabla de posiciones obtenida exitosamente');
    }
}