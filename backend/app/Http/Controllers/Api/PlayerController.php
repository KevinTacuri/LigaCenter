<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Player;
use App\Models\Team;
use Illuminate\Http\Request;
use OpenApi\Attributes as OA;

#[OA\Tag(
    name: "Players",
    description: "Gestión de jugadores registrados en equipos, incluyendo validación de edad según categoría"
)]
class PlayerController extends Controller
{
    #[OA\Get(
        path: "/api/players",
        summary: "Listar jugadores",
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
        $query = Player::with([
            'team.organization',
            'team.category',
            'team.discipline'
        ]);

        if ($request->has('championship_id')) {
            $query->whereHas('team', function ($q) use ($request) {
                $q->where('championship_id', $request->championship_id);
            });
        }

        return response()->json($query->get());
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

        $team = Team::with('category')->findOrFail($validated['team_id']);
        $category = $team->category;

        if ($request->has('championship_id') && $team->championship_id != $request->championship_id) {
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

        $player = Player::create([
            'names' => $names,
            'last_names' => $lastNames,
            'document_number' => $validated['dni'] ?? null,
            'birth_date' => $birthDate,
            'gender' => $team->category->gender_type ?? null,
        ]);

        // Associate player to team via team_players pivot table
        $player->teams()->attach($validated['team_id'], [
            'jersey_number' => $request->input('number') ?? $request->input('jersey_number') ?? null,
            'status' => 'activo'
        ]);

        $player->load('team');

        return response()->json($player, 201);
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
                'team.organization',
                'team.category',
                'team.discipline'
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
        $player = Player::findOrFail($id);

        $validated = $request->validate([
            'team_id' => 'sometimes|exists:teams,id',
            'full_name' => 'sometimes|string|max:255',
            'dni' => 'nullable|string|max:20|unique:players,document_number,' . $player->id,
            'college_id' => 'nullable|string|max:50',
            'age' => 'sometimes|integer|min:1'
        ]);

        $updateData = [];

        if (isset($validated['full_name'])) {
            $parts = explode(' ', $validated['full_name'], 2);
            $updateData['names'] = $parts[0];
            $updateData['last_names'] = isset($parts[1]) ? $parts[1] : '';
        }

        if (array_key_exists('dni', $validated)) {
            $updateData['document_number'] = $validated['dni'];
        }

        if (isset($validated['age'])) {
            $updateData['birth_date'] = now()->subYears($validated['age'])->format('Y-m-d');
        }

        if (!empty($updateData)) {
            $player->update($updateData);
        }

        if (isset($validated['team_id'])) {
            $player->teams()->sync([
                $validated['team_id'] => [
                    'jersey_number' => $request->input('number') ?? $request->input('jersey_number') ?? null,
                    'status' => 'activo'
                ]
            ]);
        }

        $player->load('team');

        return response()->json($player);
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
        $player = Player::findOrFail($id);

        $player->delete();

        return response()->json([
            'message' => 'Jugador eliminado correctamente'
        ]);
    }
}