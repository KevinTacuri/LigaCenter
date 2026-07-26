<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Championship;
use App\Models\ChampionshipDiscipline;
use Illuminate\Http\Request;
use OpenApi\Attributes as OA;

#[OA\Tag(
    name: "Championship Disciplines",
    description: "Administración de las disciplinas habilitadas para un campeonato."
)]
class ChampionshipDisciplineController extends Controller
{
    #[OA\Get(
        path: "/api/championships/{championship}/disciplines",
        summary: "Listar disciplinas del campeonato",
        tags: ["Championship Disciplines"],
        responses: [
            new OA\Response(
                response: 200,
                description: "Listado obtenido correctamente"
            )
        ]
    )]
    public function index(Championship $championship)
    {
        return response()->json(
            $championship->championshipDisciplines()
                ->with('discipline')
                ->orderBy('id')
                ->get()
        );
    }

    #[OA\Post(
        path: "/api/championships/{championship}/disciplines",
        summary: "Agregar disciplina al campeonato",
        description: "Asocia una disciplina deportiva a un campeonato específico. Cada disciplina solo puede registrarse una vez por campeonato.",
        tags: ["Championship Disciplines"],
        parameters: [
            new OA\Parameter(
                name: "championship",
                in: "path",
                required: true,
                description: "ID del campeonato",
                schema: new OA\Schema(type: "integer")
            )
        ],
        requestBody: new OA\RequestBody(
            required: true,
            description: "Información de la disciplina a asociar",
            content: new OA\JsonContent(
                required: ["discipline_id"],
                properties: [
                    new OA\Property(
                        property: "discipline_id",
                        type: "integer",
                        example: 1,
                        description: "ID de la disciplina del catálogo"
                    ),
                    new OA\Property(
                        property: "rules",
                        type: "string",
                        nullable: true,
                        example: "Tiempo de juego de 40 minutos por tiempo.",
                        description: "Reglas específicas de la disciplina para este campeonato"
                    ),
                ]
            )
        ),
        responses: [
            new OA\Response(
                response: 201,
                description: "Disciplina agregada correctamente al campeonato"
            ),
            new OA\Response(
                response: 422,
                description: "La disciplina ya existe en el campeonato o los datos enviados son inválidos"
            ),
            new OA\Response(
                response: 404,
                description: "Campeonato o disciplina no encontrados"
            )
        ]
    )]
    public function store(Request $request, Championship $championship)
    {
        $validated = $request->validate([
            'discipline_id' => [
                'required',
                'exists:disciplines,id',
            ],
            'specific_rules' => 'nullable|string',
        ]);

        $exists = ChampionshipDiscipline::where('championship_id', $championship->id)
            ->where('discipline_id', $validated['discipline_id'])
            ->exists();

        if ($exists) {
            return response()->json([
                'message' => 'La disciplina ya fue agregada a este campeonato.'
            ], 422);
        }

        $championshipDiscipline = ChampionshipDiscipline::create([
            'championship_id' => $championship->id,
            'discipline_id' => $validated['discipline_id'],
            'specific_rules' => $validated['specific_rules'] ?? null,
        ]);

        return response()->json(
            $championshipDiscipline->load('discipline'),
            201
        );
}


    #[OA\Get(
        path: "/api/championship-disciplines/{id}",
        summary: "Obtener disciplina del campeonato",
        tags: ["Championship Disciplines"],
        responses: [
            new OA\Response(
                response: 200,
                description: "Información obtenida correctamente"
            ),
            new OA\Response(
                response: 404,
                description: "Registro no encontrado"
            )
        ]
    )]
    public function show($id)
    {
        return response()->json(
            ChampionshipDiscipline::with([
                'championship',
                'discipline'
            ])->findOrFail($id)
        );
    }

    #[OA\Put(
        path: "/api/championship-disciplines/{id}",
        summary: "Actualizar reglas",
        tags: ["Championship Disciplines"],
        requestBody: new OA\RequestBody(
            required: true,
            description: "Reglas específicas de la disciplina para este campeonato",
            content: new OA\JsonContent(
                required: ["specific_rules"],
                properties: [
                    new OA\Property(
                        property: "specific_rules",
                        type: "string",
                        example: "Tiempo de juego de 40 minutos por tiempo."
                    ),
                ]
            )
        ),
        responses: [
            new OA\Response(
                response: 200,
                description: "Actualizado correctamente"
            ),
            new OA\Response(
                response: 404,
                description: "Registro no encontrado"
            )
        ]
    )]
    
    public function update(Request $request, $id)
    {
        $championshipDiscipline = ChampionshipDiscipline::findOrFail($id);

        $validated = $request->validate([
            'specific_rules' => 'nullable|string',
            'match_duration_minutes' => 'nullable|integer|min:1|max:60',
        ]);

        if ($request->has('specific_rules')) {
            $championshipDiscipline->specific_rules = $validated['specific_rules'];
        }
        
        if ($request->has('match_duration_minutes')) {
            $championshipDiscipline->match_duration_minutes = $validated['match_duration_minutes'];
        }

        $championshipDiscipline->save();

        return response()->json($championshipDiscipline);
    }

    #[OA\Delete(
        path: "/api/championship-disciplines/{id}",
        summary: "Eliminar disciplina del campeonato",
        tags: ["Championship Disciplines"],
        responses: [
            new OA\Response(
                response: 200,
                description: "Eliminada correctamente"
            )
        ]
    )]
    public function destroy($id)
    {
        $championshipDiscipline = ChampionshipDiscipline::findOrFail($id);

        $championshipDiscipline->delete();

        return response()->json([
            'message' => 'Disciplina eliminada correctamente.'
        ]);
    }
}