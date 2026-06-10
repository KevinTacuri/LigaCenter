<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\ChampionshipUser;
use App\Traits\ApiResponse;
use Illuminate\Http\Request;
use OpenApi\Attributes as OA;

#[OA\Tag(
    name: "Championship Users",
    description: "Gestión de usuarios asignados a campeonatos"
)]
class ChampionshipUserController extends Controller
{
    use ApiResponse;

    #[OA\Get(
        path: "/api/championships/{championshipId}/users",
        summary: "Listar usuarios de un campeonato",
        tags: ["Championship Users"],
        security: [["sanctum" => []]],
        parameters: [
            new OA\Parameter(name: "championshipId", in: "path", required: true, schema: new OA\Schema(type: "integer"))
        ],
        responses: [
            new OA\Response(response: 200, description: "Usuarios obtenidos exitosamente")
        ]
    )]
    public function index($championshipId, Request $request)
    {
        $users = ChampionshipUser::where('championship_id', $championshipId)
            ->with(['user', 'team'])
            ->get();

        return $this->successResponse($users, 'Usuarios obtenidos exitosamente');
    }

    #[OA\Put(
        path: "/api/championship-users/{id}",
        summary: "Actualizar rol de usuario en campeonato",
        tags: ["Championship Users"],
        security: [["sanctum" => []]],
        parameters: [
            new OA\Parameter(name: "id", in: "path", required: true, schema: new OA\Schema(type: "integer"))
        ],
        requestBody: new OA\RequestBody(
            required: true,
            content: new OA\JsonContent(
                required: ["role"],
                properties: [
                    new OA\Property(property: "role", type: "string", enum: ["organizer", "referee", "team_delegate", "score_table"], example: "score_table"),
                    new OA\Property(property: "team_id", type: "integer", nullable: true, example: null)
                ]
            )
        ),
        responses: [
            new OA\Response(response: 200, description: "Rol actualizado exitosamente"),
            new OA\Response(response: 404, description: "Registro no encontrado")
        ]
    )]
    public function update(Request $request, $id)
    {
        $championshipUser = ChampionshipUser::find($id);

        if (!$championshipUser) {
            return $this->errorResponse('Registro no encontrado', 404);
        }

        $request->validate([
            'role' => 'required|string|in:organizer,referee,team_delegate,score_table',
            'team_id' => 'nullable|exists:teams,id',
        ]);

        $championshipUser->update([
            'role' => $request->role,
            'team_id' => $request->team_id,
        ]);

        return $this->successResponse($championshipUser, 'Rol actualizado exitosamente');
    }

    #[OA\Delete(
        path: "/api/championship-users/{id}",
        summary: "Remover usuario de campeonato",
        tags: ["Championship Users"],
        security: [["sanctum" => []]],
        parameters: [
            new OA\Parameter(name: "id", in: "path", required: true, schema: new OA\Schema(type: "integer"))
        ],
        responses: [
            new OA\Response(response: 200, description: "Usuario removido exitosamente"),
            new OA\Response(response: 404, description: "Registro no encontrado")
        ]
    )]
    public function destroy($id)
    {
        $championshipUser = ChampionshipUser::find($id);

        if (!$championshipUser) {
            return $this->errorResponse('Registro no encontrado', 404);
        }

        $championshipUser->delete();

        return $this->successResponse(null, 'Usuario removido del campeonato exitosamente');
    }
}