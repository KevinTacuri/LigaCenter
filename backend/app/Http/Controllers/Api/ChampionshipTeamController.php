<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\ChampionshipTeam;
use App\Models\ChampionshipUser;
use App\Models\ChampionshipDiscipline;
use App\Models\Category;
use App\Models\Team;
use App\Traits\ApiResponse;
use App\Http\Resources\ChampionshipTeamResource;
use Illuminate\Http\Request;
use Illuminate\Http\JsonResponse;
use Illuminate\Validation\Rule;
use App\Http\Resources\ChampionshipTeamListResource;
use Illuminate\Support\Str;
use App\Services\TeamService;

/**
 * @OA\Tag(
 *     name="Inscripciones de Equipos (ChampionshipTeams)",
 *     description="API Endpoints para gestionar la participación de equipos en disciplinas de torneos."
 * )
 */
class ChampionshipTeamController extends Controller
{
    use ApiResponse;

    private TeamService $teamService;

    public function __construct(TeamService $teamService)
    {
        $this->teamService = $teamService;
    }

    /**
     * @OA\Get(
     *     path="/api/championship-teams",
     *     summary="Listar equipos inscritos en una disciplina del torneo",
     *     description="Retorna una lista filtrada de equipos inscritos en una disciplina específica.",
     *     tags={"Inscripciones de Equipos (ChampionshipTeams)"},
     *     @OA\Parameter(
     *         name="championship_discipline_id",
     *         in="query",
     *         required=true,
     *         description="ID de la disciplina del campeonato",
     *         @OA\Schema(type="integer", example=1)
     *     ),
     *     @OA\Parameter(
     *         name="category_id",
     *         in="query",
     *         required=false,
     *         description="Filtrar por categoría",
     *         @OA\Schema(type="integer", example=2)
     *     ),
     *     @OA\Parameter(
     *         name="registration_status",
     *         in="query",
     *         required=false,
     *         description="Filtrar por estado de registro",
     *         @OA\Schema(type="string", enum={"pending", "approved", "rejected", "registered"}, example="registered")
     *     ),
     *     @OA\Response(
     *         response=200,
     *         description="Operación exitosa",
     *         @OA\JsonContent(
     *             type="array",
     *             @OA\Items(
     *                 type="object",
     *                 @OA\Property(property="id", type="integer", example=10),
     *                 @OA\Property(property="championship_discipline_id", type="integer", example=1),
     *                 @OA\Property(property="team_id", type="integer", example=5),
     *                 @OA\Property(property="category_id", type="integer", example=2),
     *                 @OA\Property(property="representative", type="string", example="Juan Pérez"),
     *                 @OA\Property(property="registration_status", type="string", example="registered"),
     *                 @OA\Property(property="created_at", type="string", format="date-time"),
     *                 @OA\Property(property="updated_at", type="string", format="date-time")
     *             )
     *         )
     *     ),
     *     @OA\Response(
     *         response=422,
     *         description="Error de validación (Falta el parámetro championship_discipline_id)"
     *     )
     * )
     */
    public function index(Request $request, $categoryId = null)
    {
        $perPage = min(max((int) $request->query('per_page', 15), 1), 100);
        if ($categoryId) {
            $category = Category::find($categoryId);

            if (!$category) {
                return $this->errorResponse('Categoría no encontrada', 404);
            }

            $championshipTeams = ChampionshipTeam::whereHas('category', function ($query) use ($categoryId) {
                $query->where('id', $categoryId);
            })
            ->with([
                'team',
                'category.championshipDiscipline.discipline',
                'championshipUser.user'
            ])
            ->withCount('players')
            ->paginate($perPage);

            return $this->successResponse([
                'teams' => ChampionshipTeamListResource::collection($championshipTeams->items()),
                'pagination' => $this->paginationMeta($championshipTeams),
            ], 'Equipos obtenidos exitosamente');
        }

        $championshipId = $request->query('championship_id') 
            ?? $request->header('X-Championship-ID');

        if (!$championshipId) {
            return $this->errorResponse('Falta el ID del campeonato', 400);
        }

        $championshipTeams = ChampionshipTeam::whereHas(
            'championshipDiscipline',
            function ($query) use ($championshipId) {
                $query->where('championship_id', $championshipId);
            }
        )
            ->with([
                'team',
                'category.championshipDiscipline.discipline',
                'championshipUser.user',
            ])
            ->withCount('players');

        if ($request->filled('search')) {
            $search = trim($request->query('search'));
            $championshipTeams->where(function ($query) use ($search) {
                $query->where('representative', 'like', "%{$search}%")
                    ->orWhereHas('team', fn ($teamQuery) => $teamQuery->where('name', 'like', "%{$search}%"));
            });
        }
        if ($request->filled('category_id')) {
            $championshipTeams->where('category_id', $request->integer('category_id'));
        }
        if ($request->filled('registration_status')) {
            $championshipTeams->where('registration_status', $request->query('registration_status'));
        }

        $sort = $request->query('sort', 'name');
        $direction = strtolower($request->query('direction', 'asc')) === 'desc' ? 'desc' : 'asc';
        if ($sort === 'representative' || $sort === 'registration_status') {
            $championshipTeams->orderBy($sort, $direction);
        } else {
            $championshipTeams->orderBy(
                Team::select('name')->whereColumn('teams.id', 'championship_teams.team_id'),
                $direction
            );
        }

        $championshipTeams = $championshipTeams
            ->paginate($perPage);

        return $this->successResponse([
            'teams' => ChampionshipTeamListResource::collection($championshipTeams->items()),
            'pagination' => $this->paginationMeta($championshipTeams),
        ], 'Equipos obtenidos exitosamente');
    }

    private function paginationMeta($paginator): array
    {
        return [
            'total' => $paginator->total(),
            'per_page' => $paginator->perPage(),
            'current_page' => $paginator->currentPage(),
            'last_page' => $paginator->lastPage(),
        ];
    }



    /**
     * @OA\Post(
     *     path="/api/championship-teams",
     *     summary="Inscribir un equipo en un torneo/disciplina",
     *     description="Registra la participación de un equipo dentro de una disciplina y categoría de un torneo.",
     *     tags={"Inscripciones de Equipos (ChampionshipTeams)"},
     *     @OA\RequestBody(
     *         required=true,
     *         @OA\JsonContent(
     *             required={"championship_discipline_id", "team_id", "category_id"},
     *             @OA\Property(property="championship_discipline_id", type="integer", example=1, description="ID del torneo-disciplina"),
     *             @OA\Property(property="team_id", type="integer", example=5, description="ID del equipo a inscribir"),
     *             @OA\Property(property="category_id", type="integer", example=2, description="ID de la categoría"),
     *             @OA\Property(property="representative", type="string", example="Carlos Gómez", description="Nombre del representante delegado"),
     *             @OA\Property(property="registration_status", type="string", enum={"pending", "approved", "rejected", "registered"}, example="registered")
     *         )
     *     ),
     *     @OA\Response(
     *         response=201,
     *         description="Equipo inscrito exitosamente",
     *         @OA\JsonContent(
     *             @OA\Property(property="message", type="string", example="Equipo inscrito exitosamente en el torneo."),
     *             @OA\Property(property="data", type="object",
     *                 @OA\Property(property="id", type="integer", example=10),
     *                 @OA\Property(property="championship_discipline_id", type="integer", example=1),
     *                 @OA\Property(property="team_id", type="integer", example=5),
     *                 @OA\Property(property="category_id", type="integer", example=2),
     *                 @OA\Property(property="representative", type="string", example="Carlos Gómez"),
     *                 @OA\Property(property="registration_status", type="string", example="registered")
     *             )
     *         )
     *     ),
     *     @OA\Response(
     *         response=422,
     *         description="Error de validación o inscripción duplicada del equipo"
     *     )
     * )
     */
    public function store(Request $request): JsonResponse
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

        $logoValue = $this->teamService->resolveLogo($request);

        $representative = $request->representative;
        $enableDelegate = filter_var($request->enable_delegate, FILTER_VALIDATE_BOOLEAN);

        if ($enableDelegate) {
            $representative = $request->delegate_name;
        }

        // first create the team
        $team = Team::create([
            'user_id' => $request->user()->id,
            'name' => $request->name,
            'discipline_id' => $category->championshipDiscipline->discipline_id,
            'logo' => $logoValue,
            'description' => $request->description,
        ]);

        // then create the championship team entry
        $championshipTeam = ChampionshipTeam::create([
            'championship_discipline_id' => $category->championshipDiscipline->id,
            'team_id' => $team->id,
            'category_id' => $request->category_id,
            'representative' => $representative,
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

            ChampionshipUser::updateOrCreate(
                [
                    'championship_id' => $championshipTeam->championshipDiscipline->championship_id,
                    'championship_team_id' => $championshipTeam->id,
                    'role' => 'team_delegate',
                ],
                [
                    'user_id' => $user->id,
                ]
            );
        }

        $championshipTeam->load(['team', 'category.championshipDiscipline.discipline', 'championshipUser.user']);

        return $this->successResponse(new ChampionshipTeamResource($championshipTeam), 'Equipo creado exitosamente', 201);
    }

    /**
     * @OA\Get(
     *     path="/api/championship-teams/{id}",
     *     summary="Obtener detalle de la inscripción de un equipo",
     *     description="Retorna el detalle completo de la inscripción incluyendo equipo, categoría, jugadores convocados y sus partidos.",
     *     tags={"Inscripciones de Equipos (ChampionshipTeams)"},
     *     @OA\Parameter(
     *         name="id",
     *         in="path",
     *         required=true,
     *         description="ID de la inscripción (ChampionshipTeam)",
     *         @OA\Schema(type="integer", example=10)
     *     ),
     *     @OA\Response(
     *         response=200,
     *         description="Detalle de la inscripción recuperado con éxito",
     *         @OA\JsonContent(
     *             @OA\Property(property="id", type="integer", example=10),
     *             @OA\Property(property="championship_discipline_id", type="integer", example=1),
     *             @OA\Property(property="team_id", type="integer", example=5),
     *             @OA\Property(property="category_id", type="integer", example=2),
     *             @OA\Property(property="representative", type="string", example="Carlos Gómez"),
     *             @OA\Property(property="registration_status", type="string", example="registered"),
     *             @OA\Property(property="team", type="object"),
     *             @OA\Property(property="category", type="object"),
     *             @OA\Property(property="championship_discipline", type="object"),
     *             @OA\Property(property="players", type="array", @OA\Items(type="object")),
     *             @OA\Property(property="championship_user", type="object"),
     *             @OA\Property(property="home_matches", type="array", @OA\Items(type="object")),
     *             @OA\Property(property="away_matches", type="array", @OA\Items(type="object"))
     *         )
     *     ),
     *     @OA\Response(
     *         response=404,
     *         description="Registro de inscripción no encontrado"
     *     )
     * )
     */
    public function show($id): JsonResponse
    {
        $championshipTeam = ChampionshipTeam::with([
            'team',
            'category',
            'championshipDiscipline',
            'players',
            'championshipUser',
            'homeMatches',
            'awayMatches',
        ])->findOrFail($id);

        return response()->json(new ChampionshipTeamResource($championshipTeam), 200);
    }

    /**
     * @OA\Put(
     *     path="/api/championship-teams/{id}",
     *     summary="Actualizar inscripción de un equipo",
     *     description="Permite modificar la categoría, el representante o el estado del registro de inscripción.",
     *     tags={"Inscripciones de Equipos (ChampionshipTeams)"},
     *     @OA\Parameter(
     *         name="id",
     *         in="path",
     *         required=true,
     *         description="ID del ChampionshipTeam",
     *         @OA\Schema(type="integer", example=10)
     *     ),
     *     @OA\RequestBody(
     *         required=true,
     *         @OA\JsonContent(
     *             @OA\Property(property="category_id", type="integer", example=2),
     *             @OA\Property(property="representative", type="string", example="Roberto Silva"),
     *             @OA\Property(property="registration_status", type="string", enum={"pending", "approved", "rejected", "registered", "disqualified"}, example="approved")
     *         )
     *     ),
     *     @OA\Response(
     *         response=200,
     *         description="Inscripción actualizada correctamente",
     *         @OA\JsonContent(
     *             @OA\Property(property="message", type="string", example="Inscripción actualizada correctamente."),
     *             @OA\Property(property="data", type="object")
     *         )
     *     ),
     *     @OA\Response(
     *         response=404,
     *         description="Inscripción no encontrada"
     *     )
     * )
     */
    public function update(Request $request, $id): JsonResponse
    {
        $championshipTeam = ChampionshipTeam::find($id);
        $team = $championshipTeam ? $championshipTeam->team : null;

        if (!$championshipTeam) {
            return $this->errorResponse('Inscripción no encontrada', 404);
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

        $teamDataToUpdate = $request->only(['name', 'description']);

        $datosActualizar = $request->only(['representative', 'registration_status']);
        $enableDelegate = $request->has('enable_delegate') ? filter_var($request->enable_delegate, FILTER_VALIDATE_BOOLEAN) : null;

        if ($enableDelegate !== null) {
            if ($enableDelegate) {
                $datosActualizar['representative'] = $request->delegate_name;
            }
        }
        // Solo tocamos el logo si el usuario mandó un archivo nuevo o una URL nueva
        if ($request->hasFile('logo') || $request->filled('logo')) {
            // Borrar el logo físico anterior, solo si era un archivo local (no una URL externa)
            $logoAnterior = $championshipTeam->team->getRawOriginal('logo');
            if ($logoAnterior && !Str::startsWith($logoAnterior, ['http://', 'https://'])) {
                \Illuminate\Support\Facades\Storage::disk('public')->delete($logoAnterior);
            }

            $teamDataToUpdate['logo'] = $this->teamService->resolveLogo($request);

        }

        $championshipTeam->update($datosActualizar);
        $team->update($teamDataToUpdate);

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

                ChampionshipUser::updateOrCreate(
                    [
                        'championship_id' => $championshipTeam->championshipDiscipline->championship_id,
                        'championship_team_id' => $championshipTeam->id,
                        'role' => 'team_delegate',
                    ],
                    [
                        'user_id' => $user->id,
                    ]
                );
            } else {
                ChampionshipUser::where('championship_id', $championshipTeam->championshipDiscipline->championship_id)
                    ->where('championship_team_id', $championshipTeam->id)
                    ->where('role', 'team_delegate')
                    ->delete();
            }
        }

        $championshipTeam->load(['championshipUser.user', 'championshipDiscipline.discipline']);

        return $this->successResponse(new ChampionshipTeamResource($championshipTeam), 'Equipo actualizado exitosamente');


        /*

        $championshipTeam = ChampionshipTeam::findOrFail($id);

        $validated = $request->validate([
            'category_id'         => 'sometimes|required|exists:categories,id',
            'representative'      => 'nullable|string|max:255',
            'registration_status' => 'sometimes|required|string|in:pending,approved,rejected,registered,disqualified',
        ]);

        $championshipTeam->update($validated);

        return response()->json([
            'message' => 'Inscripción actualizada correctamente.',
            'data'    => $championshipTeam->fresh(['team', 'category'])
        ], 200);
        */
    }

    /**
     * @OA\Delete(
     *     path="/api/championship-teams/{id}",
     *     summary="Eliminar o cancelar la inscripción de un equipo",
     *     description="Elimina la inscripción del equipo. Se valida que no posea partidos locales o visitantes asignados.",
     *     tags={"Inscripciones de Equipos (ChampionshipTeams)"},
     *     @OA\Parameter(
     *         name="id",
     *         in="path",
     *         required=true,
     *         description="ID de la inscripción a eliminar",
     *         @OA\Schema(type="integer", example=10)
     *     ),
     *     @OA\Response(
     *         response=200,
     *         description="Inscripción eliminada correctamente",
     *         @OA\JsonContent(
     *             @OA\Property(property="message", type="string", example="Inscripción del equipo eliminada del torneo correctamente.")
     *         )
     *     ),
     *     @OA\Response(
     *         response=422,
     *         description="No se puede eliminar porque ya posee partidos programados"
     *     ),
     *     @OA\Response(
     *         response=404,
     *         description="Inscripción no encontrada"
     *     )
     * )
     */
    public function destroy($id): JsonResponse
    {
        $championshipTeam = ChampionshipTeam::findOrFail($id);

        $hasMatches = $championshipTeam->homeMatches()->exists() || $championshipTeam->awayMatches()->exists();
        
        if ($hasMatches) {
            return response()->json([
                'message' => 'No se puede eliminar la inscripción porque el equipo ya tiene partidos asignados.'
            ], 422);
        }

        $championshipTeam->delete();

        return $this->successResponse(null, 'Equipo eliminado exitosamente');
    }

    public function addExistingTeams(Request $request): JsonResponse
    {
        $request->validate([
            'team_ids' => 'required|array',
            'team_ids.*' => [
                'required',
                'integer',
                Rule::exists('teams', 'id'),
            ],
        ]);
        
        $championshipId = $request->query('championship_id') ?? $request->header('X-Championship-ID');

        if (!$championshipId) {
            return $this->errorResponse('Falta el ID del campeonato', 400);
        }
        // get all championship disciplines for this championship with their discipline_id
        $championshipDisciplines = ChampionshipDiscipline::where('championship_id', $championshipId)->get();

        // verify that each team_id has a discipline_id that matches one of the championshipDiscipline's discipline_id
        foreach ($request->team_ids as $teamId) {
            // each team_id have a discipline_id that must match the championshipDiscipline's discipline_id
            $team = Team::find($teamId);
            $disciplineId = $team->discipline_id;

            $championshipDiscipline = $championshipDisciplines->firstWhere('discipline_id', $disciplineId);

            if (!$championshipDiscipline) {
                return $this->errorResponse('El equipo con ID ' . $teamId . ' no pertenece a la disciplina del campeonato especificada.', 422);
            }

            ChampionshipTeam::firstOrCreate(
                [
                    'championship_discipline_id' => $championshipDiscipline->id,
                    'team_id' => $teamId,
                    'category_id' => null,
                ],
                [
                    'representative' => null,
                    'registration_status' => 'pendiente',
                ]
            );
        }

        return $this->successResponse(null, 'Equipos existentes agregados exitosamente al campeonato.');
    }
}
