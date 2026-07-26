<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Championship;
use App\Services\ChampionshipImportService;
use App\Traits\ApiResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Storage;
use OpenApi\Attributes as OA;

#[OA\Tag(
    name: "Championships",
    description: "Gestión de campeonatos (tenants del sistema)"
)]
class ChampionshipController extends Controller
{
    use ApiResponse;

    protected $importService;

    public function __construct(ChampionshipImportService $importService)
    {
        $this->importService = $importService;
    }

    #[OA\Get(
        path: "/api/championships",
        summary: "Listar campeonatos del usuario",
        tags: ["Championships"],
        security: [["sanctum" => []]],
        responses: [
            new OA\Response(response: 200, description: "Campeonatos obtenidos exitosamente")
        ]
    )]
    public function index(Request $request)
    {
        $championships = Championship::where('user_id', $request->user()->id)
            ->orWhereHas('users', function ($query) use ($request) {
                $query->where('user_id', $request->user()->id);
            })
            ->get();

        return $this->successResponse($championships, 'Campeonatos obtenidos exitosamente');
    }

    #[OA\Post(
        path: "/api/championships",
        summary: "Crear campeonato",
        tags: ["Championships"],
        security: [["sanctum" => []]],
        requestBody: new OA\RequestBody(
            required: true,
            content: new OA\MediaType(
                mediaType: "multipart/form-data",
                schema: new OA\Schema(
                    type: "object",
                    required: ["name"],
                    properties: [
                        new OA\Property(property: "name", type: "string", example: "Liga Empresarial 2026"),
                        new OA\Property(property: "description", type: "string", example: "Campeonato entre empresas"),
                        new OA\Property(property: "type", type: "string", example: "basico"),
                        new OA\Property(property: "start_date", type: "string", format: "date", example: "2026-06-01"),
                        new OA\Property(property: "end_date", type: "string", format: "date", example: "2026-12-20"),
                        new OA\Property(property: "is_public", type: "boolean", example: true),
                        new OA\Property(property: "settings", type: "object"),
                        new OA\Property(property: "rules_pdf", type: "string", format: "binary", description: "Archivo PDF con el reglamento del campeonato")
                    ]
                )
            ),
        ),
        responses: [
            new OA\Response(response: 201, description: "Campeonato creado exitosamente"),
            new OA\Response(response: 422, description: "Error de validación")
        ]
    )]
    public function store(Request $request)
    {
        $request->validate([
            'name' => 'required|string|max:255',
            'description' => 'nullable|string',
            'type' => 'nullable|string|max:50',
            'start_date' => 'nullable|date',
            'end_date' => 'nullable|date|after_or_equal:start_date',
            'is_public' => 'boolean',
            'settings' => 'nullable|array',
            'rules_pdf' => 'nullable|file|mimes:pdf|max:10240',
        ]);

        $rulesPdf = null;
        if ($request->hasFile('rules_pdf')) {
            $rulesPdf = $request->file('rules_pdf')->store('rules_pdfs', 'public');
        }

        $championship = Championship::create([
            'user_id' => $request->user()->id,
            'name' => $request->name,
            'description' => $request->description,
            'type' => $request->type ?? 'basico',
            'status' => 'creado',
            'start_date' => $request->start_date,
            'end_date' => $request->end_date,
            'is_public' => $request->is_public ?? false,
            'settings' => $request->settings,
            'rules_pdf' => $rulesPdf,
        ]);

        return $this->successResponse($championship, 'Campeonato creado exitosamente', 201);
    }

    #[OA\Get(
        path: "/api/championships/{id}",
        summary: "Obtener campeonato",
        tags: ["Championships"],
        security: [["sanctum" => []]],
        parameters: [
            new OA\Parameter(name: "id", in: "path", required: true, schema: new OA\Schema(type: "integer"))
        ],
        responses: [
            new OA\Response(response: 200, description: "Campeonato obtenido exitosamente"),
            new OA\Response(response: 404, description: "Campeonato no encontrado")
        ]
    )]
    public function show($id, Request $request)
    {
        $championship = Championship::where('id', $id)
            ->where(function ($query) use ($request) {
                $query->where('user_id', $request->user()->id)
                    ->orWhereHas('users', function ($q) use ($request) {
                        $q->where('user_id', $request->user()->id);
                    });
            })
            ->first();

        if (!$championship) {
            return $this->errorResponse('Campeonato no encontrado', 404);
        }

        return $this->successResponse($championship, 'Campeonato obtenido exitosamente');
    }

    #[OA\Put(
        path: "/api/championships/{id}",
        summary: "Actualizar campeonato",
        tags: ["Championships"],
        security: [["sanctum" => []]],
        parameters: [
            new OA\Parameter(name: "id", in: "path", required: true, schema: new OA\Schema(type: "integer"))
        ],
        requestBody: new OA\RequestBody(
            required: false,
            content: new OA\MediaType(
                mediaType: "multipart/form-data",
                schema: new OA\Schema(
                    properties: [
                        new OA\Property(property: "name", type: "string"),
                        new OA\Property(property: "description",type: "string"),
                        new OA\Property(property: "status",type: "string",enum: ["creado", "en_curso", "finalizado"]),
                        new OA\Property(property: "start_date",type: "string", format: "date"),
                        new OA\Property(property: "end_date", type: "string", format: "date"),
                        new OA\Property(property: "is_public",type: "boolean"),
                        new OA\Property(property: "settings", type: "object"),
                        new OA\Property(property: "rules_pdf", type: "string", format: "binary", description: "PDF del reglamento (opcional, reemplaza el anterior)")
                    ]
                )
            )
        ),
        responses: [
            new OA\Response(response: 200, description: "Campeonato actualizado exitosamente"),
            new OA\Response(response: 404, description: "Campeonato no encontrado")
        ]
    )]
    public function update(Request $request, $id)
    {
        $championship = Championship::where('id', $id)
            ->where(function ($query) use ($request) {
                $query->where('user_id', $request->user()->id)
                    ->orWhereHas('users', function ($q) use ($request) {
                        $q->where('user_id', $request->user()->id);
                    });
            })
            ->first();

        if (!$championship) {
            return $this->errorResponse('Campeonato no encontrado o no autorizado', 404);
        }

        if ($request->has('is_public')) {
            $request->merge([
                'is_public' => filter_var($request->is_public, FILTER_VALIDATE_BOOLEAN)
            ]);
        }

        $request->validate([
            'name' => 'sometimes|string|max:255',
            'description' => 'nullable|string',
            'type' => 'nullable|string',
            'status' => 'sometimes|string|in:creado,activo,en_curso,finalizado,suspendido',
            'start_date' => 'nullable|date',
            'end_date' => 'nullable|date|after_or_equal:start_date',
            'is_public' => 'nullable|boolean',
            'settings' => 'nullable',
            'rules_pdf' => 'nullable|file|mimes:pdf|max:10240',
        ]);

        $data = $request->only([
            'name', 'description', 'type', 'status', 'start_date', 'end_date', 'is_public'
        ]);

        if ($request->has('settings')) {
            $settings = $request->settings;
            if (is_string($settings)) {
                $settings = json_decode($settings, true);
            }
            $data['settings'] = $settings;
        }

        if ($request->hasFile('rules_pdf')) {
            // Eliminar el archivo anterior si existe
            if ($championship->rules_pdf) {
                Storage::disk('public')->delete($championship->rules_pdf);
            }
            // Subir el nuevo archivo
            $data['rules_pdf'] = $request->file('rules_pdf')->store('rules_pdfs', 'public');
        }

        $championship->update($data);

        return $this->successResponse($championship, 'Campeonato actualizado exitosamente');
    }

    #[OA\Delete(
        path: "/api/championships/{id}",
        summary: "Eliminar campeonato",
        tags: ["Championships"],
        security: [["sanctum" => []]],
        parameters: [
            new OA\Parameter(name: "id", in: "path", required: true, schema: new OA\Schema(type: "integer"))
        ],
        responses: [
            new OA\Response(response: 200, description: "Campeonato eliminado exitosamente"),
            new OA\Response(response: 404, description: "Campeonato no encontrado")
        ]
    )]
    public function destroy($id, Request $request)
    {
        $championship = Championship::where('id', $id)
            ->where('user_id', $request->user()->id)
            ->first();

        if (!$championship) {
            return $this->errorResponse('Campeonato no encontrado o no autorizado', 404);
        }

        $championship->delete();

        return $this->successResponse(null, 'Campeonato eliminado exitosamente');
    }

    #[OA\Post(
        path: "/api/championships/{id}/users",
        summary: "Agregar usuario al campeonato",
        tags: ["Championships"],
        security: [["sanctum" => []]],
        parameters: [
            new OA\Parameter(name: "id", in: "path", required: true, schema: new OA\Schema(type: "integer"))
        ],
        requestBody: new OA\RequestBody(
            required: true,
            content: new OA\JsonContent(
                required: ["user_id", "role"],
                properties: [
                    new OA\Property(property: "user_id", type: "integer", example: 5),
                    new OA\Property(property: "role", type: "string", enum: ["organizer", "referee", "team_delegate", "score_table"], example: "referee"),
                    new OA\Property(property: "team_id", type: "integer", example: 3)
                ]
            )
        ),
        responses: [
            new OA\Response(response: 200, description: "Usuario agregado exitosamente"),
            new OA\Response(response: 404, description: "Campeonato no encontrado")
        ]
    )]
    public function addUser(Request $request, $id)
    {
        $championship = Championship::where('id', $id)
            ->where('user_id', $request->user()->id)
            ->first();

        if (!$championship) {
            return $this->errorResponse('Campeonato no encontrado o no autorizado', 404);
        }

        $request->validate([
            'user_id' => 'required|exists:users,id',
            'role' => 'required|string|in:organizer,referee,team_delegate,score_table',
            'team_id' => 'nullable|exists:teams,id',
        ]);

        $championship->users()->attach($request->user_id, [
            'role' => $request->role,
            'team_id' => $request->team_id,
        ]);

        return $this->successResponse(null, 'Usuario agregado al campeonato exitosamente');
    }

    #[OA\Get(
        path: "/api/championships/{id}/rules",
        summary: "Descargar reglamento del campeonato (PDF)",
        tags: ["Championships"],
        security: [["sanctum" => []]],
        parameters: [
            new OA\Parameter(
                name: "id",
                in: "path",
                required: true,
                schema: new OA\Schema(type: "integer")
            )
        ],
        responses: [
            new OA\Response(
                response: 200,
                description: "PDF descargado exitosamente",
                content: new OA\MediaType(
                    mediaType: "application/pdf",
                    schema: new OA\Schema(
                        type: "string",
                        format: "binary"
                    )
                )
            ),
            new OA\Response(
                response: 404,
                description: "Campeonato o archivo no encontrado"
            )
        ]
    )]
    public function downloadRules($id, Request $request)
    {
        $championship = Championship::where('id', $id)
            ->where(function ($query) use ($request) {
                $query->where('user_id', $request->user()->id)
                    ->orWhereHas('users', function ($q) use ($request) {
                        $q->where('user_id', $request->user()->id);
                    });
            })
            ->first();

        if (!$championship) {
            return $this->errorResponse('Campeonato no encontrado', 404);
        }

        if (!$championship->rules_pdf) {
            return $this->errorResponse('No tiene reglamento PDF', 404);
        }

        return Storage::disk('public')->download($championship->rules_pdf);
    }

    // ======================= Excel upload =====================
    public function import(Request $request, Championship $championship)
    {
        $request->validate([
            'file' => 'required|file|mimes:xlsx,xls'
        ]);

        $result = $this->importService->import(
            $championship,
            $request->file('file')
        );

        return response()->json($result);
    }
}