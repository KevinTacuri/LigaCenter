<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Team;
use App\Models\Championship;
use App\Models\Discipline;
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
        path: "/teams?discipline_id={discipline_id}",
        summary: "Listar equipos",
        description: "Retorna una lista de equipos registrados en una disciplina específica.",
        tags: ["Teams"],
        security: [["sanctum" => []]],
        parameters: [
            new OA\Parameter(
                name: "discipline_id",
                in: "path",
                required: true,
                schema: new OA\Schema(type: "integer")
            )
        ],
        responses: [
            new OA\Response(
                response: 200,
                description: "Equipos obtenidos exitosamente"
            ),
            new OA\Response(
                response: 404,
                description: "Disciplina no encontrada"
            ),
            new OA\Response(
                response: 401,
                description: "Usuario no autenticado"
            )
        ]
    )]
    public function index(Request $request, $disciplineId = null)
    {
        $userId = $request->user()->id;

        if (!$userId) {
            return $this->errorResponse(
                'Usuario no autenticado',
                401
            );
        }

        $query = Team::where('user_id', $userId);

        if ($disciplineId) {
            $discipline = Discipline::find($disciplineId);

            if (!$discipline) {
                return $this->errorResponse(
                    'Disciplina no encontrada',
                    404
                );
            }

            $query->where('discipline_id', $disciplineId);
        }

        // Solo equipos que todavía no pertenecen al campeonato
        if ($request->boolean('available') && $request->filled('championship_id')) {
            $championshipId = $request->championship_id;

            $query->whereDoesntHave('championshipTeams', function ($q) use ($championshipId) {
                $q->whereHas('championshipDiscipline', function ($q) use ($championshipId) {
                    $q->where('championship_id', $championshipId);
                });
            });
        }

        $teams = $query
            ->with('latestChampionshipTeam.category')
            ->withCount('players')
            ->get();

        return $this->successResponse(
            TeamListResource::collection($teams),
            'Equipos obtenidos exitosamente'
        );
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
            'enable_delegate' => 'nullable',
            'delegate_name' => 'required_if:enable_delegate,true|string|max:255',
            'delegate_email' => 'required_if:enable_delegate,true|email|max:255',
            'delegate_password' => 'required_if:enable_delegate,true|string|min:8',
        ]);

        $category = Category::find($request->category_id);

        if (!$category) {
            return $this->errorResponse('Categoría no encontrada', 404);
        }

        if ($category->championshipDiscipline->championship_id != $request->championship_id) {
            return $this->errorResponse('La disciplina de la categoría no pertenece a este campeonato', 422);
        }

        $logoValue = $this->resolveLogo($request);

        $representative = $request->representative;
        $enableDelegate = filter_var($request->enable_delegate, FILTER_VALIDATE_BOOLEAN);

        if ($enableDelegate) {
            $representative = $request->delegate_name;
        }

        $team = Team::create([
            'championship_id' => $request->championship_id,
            'category_id' => $request->category_id,
            'representative' => $representative,
            'name' => $request->name,
            'logo' => $logoValue,
            'description' => $request->description,
            'registration_status' => $request->registration_status ?? 'pendiente',
        ]);

        if ($enableDelegate) {
            $user = \App\Models\User::where('email', $request->delegate_email)->first();
            if (!$user) {
                $request->validate([
                    'delegate_email' => 'unique:users,email',
                ]);

                $user = \App\Models\User::create([
                    'name' => $request->delegate_name,
                    'email' => $request->delegate_email,
                    'password' => \Illuminate\Support\Facades\Hash::make($request->delegate_password),
                    'is_active' => true,
                ]);

                $user->assignRole('usuario_publico');
            } else {
                $user->name = $request->delegate_name;
                if ($request->filled('delegate_password')) {
                    $user->password = \Illuminate\Support\Facades\Hash::make($request->delegate_password);
                }
                $user->save();
            }

            \App\Models\ChampionshipUser::updateOrCreate(
                [
                    'championship_id' => $team->championship_id,
                    'team_id' => $team->id,
                    'role' => 'team_delegate',
                ],
                [
                    'user_id' => $user->id,
                ]
            );
        }

        $team->load(['championshipUser.user', 'category.championshipDiscipline.discipline']);

        return $this->successResponse(new TeamResource($team), 'Equipo creado exitosamente', 201);
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
            'championshipUser.user',
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
            'enable_delegate' => 'nullable',
            'delegate_name' => 'required_if:enable_delegate,true|string|max:255',
            'delegate_email' => 'required_if:enable_delegate,true|email|max:255',
            'delegate_password' => 'nullable|string|min:8',
        ]);

        $datosActualizar = $request->only(['representative', 'name', 'description', 'registration_status']);

        $enableDelegate = $request->has('enable_delegate') ? filter_var($request->enable_delegate, FILTER_VALIDATE_BOOLEAN) : null;

        if ($enableDelegate !== null) {
            if ($enableDelegate) {
                $datosActualizar['representative'] = $request->delegate_name;
            }
        }

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

        if ($enableDelegate !== null) {
            if ($enableDelegate) {
                $user = \App\Models\User::where('email', $request->delegate_email)->first();
                if (!$user) {
                    $request->validate([
                        'delegate_email' => 'unique:users,email',
                    ]);

                    $user = \App\Models\User::create([
                        'name' => $request->delegate_name,
                        'email' => $request->delegate_email,
                        'password' => \Illuminate\Support\Facades\Hash::make($request->delegate_password ?? '12345678'),
                        'is_active' => true,
                    ]);

                    $user->assignRole('usuario_publico');
                } else {
                    $user->name = $request->delegate_name;
                    if ($request->filled('delegate_password')) {
                        $user->password = \Illuminate\Support\Facades\Hash::make($request->delegate_password);
                    }
                    $user->save();
                }

                \App\Models\ChampionshipUser::updateOrCreate(
                    [
                        'championship_id' => $team->championship_id,
                        'team_id' => $team->id,
                        'role' => 'team_delegate',
                    ],
                    [
                        'user_id' => $user->id,
                    ]
                );
            } else {
                \App\Models\ChampionshipUser::where('championship_id', $team->championship_id)
                    ->where('team_id', $team->id)
                    ->where('role', 'team_delegate')
                    ->delete();
            }
        }

        $team->load(['championshipUser.user', 'category.championshipDiscipline.discipline']);

        return $this->successResponse(new TeamResource($team), 'Equipo actualizado exitosamente');
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
            $file = $request->file('logo');

            // Validar el archivo
            $request->validate([
                'logo' => 'image|mimes:jpg,jpeg,png,webp|max:2048',
            ]);

            // Verificar que el archivo es válido (no falló en la subida)
            if (!$file->isValid()) {
                \Illuminate\Support\Facades\Log::error('Logo upload error', [
                    'error' => $file->getErrorMessage(),
                    'error_code' => $file->getError(),
                ]);
                return null;
            }

            // Asegurar que el directorio existe
            $disk = \Illuminate\Support\Facades\Storage::disk('public');
            if (!$disk->exists('teams/logos')) {
                $disk->makeDirectory('teams/logos');
            }

            // Generar nombre único y guardar
            $extension = $file->getClientOriginalExtension() ?: 'jpg';
            $filename = 'teams/logos/' . \Illuminate\Support\Str::uuid() . '.' . $extension;

            $stored = $disk->put($filename, file_get_contents($file->getRealPath()));

            if (!$stored) {
                \Illuminate\Support\Facades\Log::error('Logo could not be stored', [
                    'filename' => $filename,
                    'disk_root' => $disk->path(''),
                ]);
                return null;
            }

            \Illuminate\Support\Facades\Log::info('Logo stored', ['path' => $filename]);
            return $filename;
        }

        if ($request->filled('logo')) {
            $logoValue = $request->input('logo');
            // Solo aceptar si es URL válida
            if (filter_var($logoValue, FILTER_VALIDATE_URL)) {
                return $logoValue;
            }
            return null;
        }

        return null;
    }
}