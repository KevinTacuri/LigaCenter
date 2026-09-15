<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Player;
use App\Models\ChampionshipPlayer;
use App\Models\Team;
use App\Models\ChampionshipTeam;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Storage;
use Illuminate\Support\Str;
use OpenApi\Attributes as OA;
use App\Traits\ApiResponse;
use App\Http\Resources\ChampionshipPlayerListResource;
use Illuminate\Support\Facades\DB;

#[OA\Tag(
    name: "Players",
    description: "Gestión de jugadores registrados en equipos, incluyendo validación de edad según categoría"
)]
class ChampionshipPlayerController extends Controller
{
    use ApiResponse;

    #[OA\Get(
        path: "/api/championshipPlayers",
        summary: "Listar jugadores pertenecientes a un campeonato",
        description: "Retorna todos los jugadores registrados en el sistema con información del equipo, organización, categoría y disciplina.",
        tags: ["Players"],
        parameters: [
            new OA\Parameter(
                name: "championship_id",
                description: "ID del campeonato (opcional)",
                in: "query",
                required: false,
                schema: new OA\Schema(type: "integer")
            )
        ],
        responses: [
            new OA\Response(
                response: 200,
                description: "Listado de jugadores obtenido correctamente"
            )
        ]
    )]
    public function index(Request $request)
    {
        $championshipId = $request->query('championship_id');

        if (!$championshipId) {
            return $this->errorResponse('El parámetro championship_id es obligatorio.', 400);
        }

        $championshipPlayers = ChampionshipPlayer::with([
            'player'
        ])->whereHas('championshipTeam.championshipDiscipline', function ($query) use ($championshipId) {
            $query->where('championship_id', $championshipId);
        })->get();



        return response()->json(ChampionshipPlayerListResource::collection($championshipPlayers));
    }

    #[OA\Post(
        path: "/api/players",
        summary: "Registrar jugador",
        description: "Registra un nuevo jugador en un equipo validando automáticamente su elegibilidad según el rango de edad de la categoría.",
        tags: ["Players"],
        requestBody: new OA\RequestBody(
            required: true,
            description: "Datos necesarios para registrar un jugador",
            content: new OA\JsonContent(
                required: ["team_id", "full_name", "age"],
                properties: [
                    new OA\Property(
                        property: "team_id",
                        type: "integer",
                        description: "ID del equipo al que pertenece el jugador",
                        example: 1
                    ),
                    new OA\Property(
                        property: "full_name",
                        type: "string",
                        description: "Nombre completo del jugador",
                        example: "Juan Pérez"
                    ),
                    new OA\Property(
                        property: "dni",
                        type: "string",
                        description: "Documento de identidad (opcional)",
                        example: "12345678"
                    ),
                    new OA\Property(
                        property: "college_id",
                        type: "string",
                        description: "Código universitario o ID institucional",
                        example: "UNI2024001"
                    ),
                    new OA\Property(
                        property: "age",
                        type: "integer",
                        description: "Edad del jugador (validada contra la categoría del equipo)",
                        example: 20
                    )
                ]
            )
        ),
        responses: [
            new OA\Response(
                response: 201,
                description: "Jugador registrado correctamente"
            ),
            new OA\Response(
                response: 422,
                description: "Error de validación o jugador no elegible por edad"
            )
        ]
    )]
    public function store(Request $request)
    {
        $validated = $request->validate([
            'team_id' => 'required|exists:teams,id',
            'full_name' => 'required|string|max:255',
            'dni' => 'nullable|string|max:20|unique:players,document_number',
            'college_id' => 'nullable|string|max:50',
            'age' => 'required|integer|min:1'
        ]);

        $championshipTeam = ChampionshipTeam::with('category')->findOrFail($validated['team_id']);
        $category = $championshipTeam->category;

        if ($request->has('championship_id') && $championshipTeam->championshipDiscipline->championship_id != $request->championship_id) {
            return response()->json([
                'message' => 'El equipo no pertenece al campeonato activo.'
            ], 422);
        }

        if (!$category) {
            return response()->json([
                'message' => 'El equipo no tiene una categoría válida asignada.'
            ], 422);
        }

        $isEligible = true;
        if ($category->age_min !== null && $validated['age'] < $category->age_min) {
            $isEligible = false;
        }
        if ($category->age_max !== null && $validated['age'] > $category->age_max) {
            $isEligible = false;
        }

        if (!$isEligible) {
            $minLabel = $category->age_min ?? '0';
            $maxLabel = $category->age_max ?? 'sin límite';
            return response()->json([
                'message' => "La edad del jugador no corresponde a la categoría (Rango permitido: {$minLabel} - {$maxLabel} años)."
            ], 422);
        }

        $parts = explode(' ', $validated['full_name'], 2);
        $names = $parts[0];
        $lastNames = isset($parts[1]) ? $parts[1] : '';

        $birthDate = now()->subYears($validated['age'])->format('Y-m-d');

        $photoValue = $this->resolvePhoto($request);

        $championshipPlayer = DB::transaction(function () use (
            $category,
            $championshipTeam,
            $validated,
            $request,
            $names,
            $lastNames,
            $birthDate,
            $photoValue,
        ) {
            $player = Player::create([
                'names' => $names,
                'last_names' => $lastNames,
                'document_number' => $validated['dni'] ?? null,
                'birth_date' => $birthDate,
                'gender' => $category->gender_type ?? null,
                'photo' => $photoValue,
            ]);

            return ChampionshipPlayer::create([
                'championship_team_id' => $championshipTeam->id,
                'player_id' => $player->id,
                'jersey_number' => $request->input('number')
                    ?? $request->input('jersey_number')
                    ?? null,
                'position' => $request->input('position') ?? null,
                'is_captain' => $request->input('is_captain') ?? false,
            ]);
        });

        $championshipPlayer->load('championshipTeam');

        return response()->json(new ChampionshipPlayerListResource($championshipPlayer), 201);
    }

    #[OA\Get(
        path: "/api/players/{id}",
        summary: "Obtener jugador por ID",
        description: "Devuelve la información detallada de un jugador junto con su equipo, categoría, organización y disciplina.",
        tags: ["Players"],
        parameters: [
            new OA\Parameter(
                name: "id",
                description: "ID del jugador",
                in: "path",
                required: true,
                schema: new OA\Schema(type: "integer")
            )
        ],
        responses: [
            new OA\Response(
                response: 200,
                description: "Jugador encontrado correctamente"
            ),
            new OA\Response(
                response: 404,
                description: "Jugador no encontrado"
            )
        ]
    )]
    public function show($id)
    {
        return response()->json(
            Player::with([
                'team.category.championshipDiscipline.discipline'
            ])->findOrFail($id)
        );
    }

    #[OA\Put(
        path: "/api/players/{id}",
        summary: "Actualizar jugador",
        description: "Permite actualizar los datos de un jugador registrado en el sistema.",
        tags: ["Players"],
        parameters: [
            new OA\Parameter(
                name: "id",
                description: "ID del jugador a actualizar",
                in: "path",
                required: true,
                schema: new OA\Schema(type: "integer")
            )
        ],
        requestBody: new OA\RequestBody(
            required: false,
            description: "Campos opcionales para actualizar el jugador",
            content: new OA\JsonContent(
                properties: [
                    new OA\Property(property: "team_id", type: "integer", example: 1),
                    new OA\Property(property: "full_name", type: "string", example: "Juan Pérez"),
                    new OA\Property(property: "dni", type: "string", example: "12345678"),
                    new OA\Property(property: "college_id", type: "string", example: "UNI2024001"),
                    new OA\Property(property: "age", type: "integer", example: 21)
                ]
            )
        ),
        responses: [
            new OA\Response(
                response: 200,
                description: "Jugador actualizado correctamente"
            ),
            new OA\Response(
                response: 404,
                description: "Jugador no encontrado"
            )
        ]
    )]
    public function update(Request $request, $id)
    {
        $championshipPlayer = ChampionshipPlayer::with('player')->find($id);

        if (!$championshipPlayer) {
            return $this->errorResponse('Jugador no encontrado.', 404);
        }

        $validated = $request->validate([
            'team_id' => 'sometimes|exists:championship_teams,id',
            'full_name' => 'sometimes|string|max:255',
            'dni' => 'nullable|string|max:20|unique:players,document_number,' . $championshipPlayer->player->id,
            'college_id' => 'nullable|string|max:50',
            'age' => 'sometimes|integer|min:1',
            'number' => 'nullable|integer|min:0|max:99',
            'position' => 'nullable|string|max:50',
        ]);

        $updateDataForPlayer = [];
        $updateDataForChampionshipPlayer = [];

        if (isset($validated['full_name'])) {
            $parts = explode(' ', $validated['full_name'], 2);
            $updateDataForPlayer['names'] = $parts[0];
            $updateDataForPlayer['last_names'] = isset($parts[1]) ? $parts[1] : '';
        }

        if (array_key_exists('dni', $validated)) {
            $updateDataForPlayer['document_number'] = $validated['dni'];
        }

        if (isset($validated['age'])) {
            $updateDataForPlayer['birth_date'] = now()->subYears($validated['age'])->format('Y-m-d');
        }

        if ($request->hasFile('photo') || $request->filled('photo')) {
            $photoAnterior = $championshipPlayer->player->getRawOriginal('photo');
            if ($photoAnterior && !Str::startsWith($photoAnterior, ['http://', 'https://'])) {
                Storage::disk('public')->delete($photoAnterior);
            }
            $updateDataForPlayer['photo'] = $this->resolvePhoto($request);
        }

        if (!empty($updateDataForPlayer)) {
            $championshipPlayer->player->update($updateDataForPlayer);
        }
        /*
        * Cambio de equipo dentro del campeonato
        */
        if (isset($validated['team_id'])) {
            $championshipTeam = ChampionshipTeam::where('id', $validated['team_id'])
                ->whereHas('championshipDiscipline', function ($query) use ($championshipPlayer) {
                    $query->where(
                        'championship_id',
                        $championshipPlayer->championshipTeam->championshipDiscipline->championship_id
                    );
                })
                ->firstOrFail();

            $updateDataForChampionshipPlayer['championship_team_id'] = $championshipTeam->id;
        }

        if (array_key_exists('number', $validated)) {
            $updateDataForChampionshipPlayer['jersey_number'] = $validated['number'];
        }

        if (array_key_exists('position', $validated)) {
            $updateDataForChampionshipPlayer['position'] = $validated['position'];
        }

        if (!empty($updateDataForChampionshipPlayer)) {
            $championshipPlayer->update($updateDataForChampionshipPlayer);
        }

        $championshipPlayer->load('player', 'championshipTeam.team');

        return response()->json(
            new ChampionshipPlayerListResource($championshipPlayer)
        );
    }

    #[OA\Delete(
        path: "/api/players/{id}",
        summary: "Eliminar jugador",
        description: "Elimina un jugador del sistema. Esta acción es permanente.",
        tags: ["Players"],
        parameters: [
            new OA\Parameter(
                name: "id",
                description: "ID del jugador a eliminar",
                in: "path",
                required: true,
                schema: new OA\Schema(type: "integer")
            )
        ],
        responses: [
            new OA\Response(
                response: 200,
                description: "Jugador eliminado correctamente"
            ),
            new OA\Response(
                response: 404,
                description: "Jugador no encontrado"
            )
        ]
    )]
    public function destroy($id)
    {
        $championshipPlayer = ChampionshipPlayer::find($id);

        if (!$championshipPlayer) {
            return $this->errorResponse('Jugador no encontrado.', 404);
        }

        $championshipPlayer->delete();

        return $this->successResponse('Jugador eliminado correctamente.');
    }

    private function resolvePhoto(Request $request): ?string
    {
        if ($request->hasFile('photo')) {
            $request->validate([
                'photo' => 'image|mimes:jpg,jpeg,png,webp|max:2048',
            ]);
            return $request->file('photo')->store('players/photos', 'public');
        }

        if ($request->filled('photo')) {
            $request->validate([
                'photo' => 'string|max:2048|url',
            ]);
            return $request->input('photo');
        }

        return null;
    }

    public function addExistingPlayers(Request $request)
    {
        $validated = $request->validate([
            'player_ids' => 'required|array',
            'player_ids.*' => 'exists:players,id',
            'championship_team_id' => 'nullable|exists:championship_teams,id',
        ]);

        $championshipTeamId = $validated['championship_team_id'] ?? null;

        $championshipPlayers = [];
        foreach ($validated['player_ids'] as $playerId) {
            // return a message if the player is already registered in the championship
            $existingPlayer = ChampionshipPlayer::where('player_id', $playerId)
                ->whereHas('championshipTeam.championshipDiscipline', function ($query) use ($championshipTeamId) {
                    if ($championshipTeamId) {
                        $query->where('id', $championshipTeamId);
                    }
                })
                ->first();
            
            if ($existingPlayer) {
                return response()->json([
                    'message' => "El jugador con ID {$playerId} ya está registrado en el campeonato.",
                ], 422);
            }

            $championshipPlayers[] = ChampionshipPlayer::create([
                'player_id' => $playerId,
                'championship_team_id' => $championshipTeamId,
            ]);


        }

        return response()->json([
            'message' => 'Jugadores añadidos correctamente.',
            'data' => ChampionshipPlayerListResource::collection($championshipPlayers),
        ], 201);
    }
}