<?php

namespace App\Http\Controllers\Api;

use App\Models\CompetitionEvent;
use App\Models\CompetitionEventStage;
use Illuminate\Validation\Rule;
use App\Http\Controllers\Controller;
use Illuminate\Http\Request;
use App\Services\CompetitionStageStandingService;
use App\Services\CompetitionQualificationService;
use Illuminate\Validation\ValidationException;

class CompetitionEventStageController extends Controller
{
    public function index(CompetitionEvent $competitionEvent)
    {
        $stages = $competitionEvent
            ->stages()
            ->with('groups')
            ->orderBy('stage_number')
            ->get();

        return response()->json([
            'success' => true,
            'data' => $stages,
        ]);
    }

    public function store(
        Request $request,
        CompetitionEvent $competitionEvent
    ) {
        $validated = $request->validate([
            'name' => [
                'required',
                'string',
                'max:255',
            ],

            'stage_type' => [
                'required',
                'in:qualifying,semifinal,final',
            ],

            'stage_number' => [
                'required',
                'integer',
                'min:1',
                Rule::unique('competition_event_stages', 'stage_number')->where(fn ($query) => 
                    $query->where('competition_event_id', $competitionEvent->id)
                ),
            ],
            'rounds_count' => [
                'required',
                'integer',
                'min:1',
            ],
            'result_aggregation' =>
            [
                'required',
                'in:best,average,sum',
            ],
            'qualifiers_count' => [
                'nullable',
                'integer',
                'min:1',
            ],
            'qualification_method' => [
                'nullable',
                'in:best_overall,best_per_group,all,none'
            ],

            'qualifiers_per_group' => [
                'nullable',
                'integer',
                'min:1',
            ],

            'podium_places' => [
                'nullable',
                'integer',
                'min:1',
            ],

            'status' => [
                'nullable',
                'in:programado,en_curso,finalizado,cancelado',
            ],
        ]);

        $error = $this->validateStageConfiguration(
            $validated
        );

        if ($error) {
            return response()->json([
                'success' => false,
                'message' => $error,
            ], 422);
        }

        $stage = $competitionEvent
            ->stages()
            ->create([
                'name' => $validated['name'],
                'stage_type' => $validated['stage_type'],
                'stage_number' => $validated['stage_number'],
                'rounds_count' => $validated['rounds_count'],
                'result_aggregation' => $validated['result_aggregation'],
                'qualifiers_count' => $validated['qualifiers_count'] ?? null,
                'qualification_method' => $validated['qualification_method'] ?? null,
                'qualifiers_per_group' => $validated['qualifiers_per_group'] ?? null,
                'podium_places' => $validated['podium_places'] ?? null,
                'status' => $validated['status'] ?? 'programado',
            ]);

        return response()->json([
            'success' => true,
            'message' => 'Etapa creada correctamente.',
            'data' => $stage,
        ], 201);
    }

    public function update(
        Request $request,
        CompetitionEventStage $stage
    ) {
        $validated = $request->validate([
            'name' => [
                'sometimes',
                'string',
                'max:255',
            ],

            'stage_type' => [
                'sometimes',
                'in:qualifying,semifinal,final',
            ],

            'stage_number' => [
                'required',
                'integer',
                'min:1',

                Rule::unique(
                    'competition_event_stages',
                    'stage_number'
                )
                    ->where(
                        fn ($query) =>
                            $query->where(
                                'competition_event_id',
                                $stage->competition_event_id
                            )
                    )
                    ->ignore($stage->id),
            ],

            'rounds_count' => [
                'required',
                'integer',
                'min:1',
            ],

            'result_aggregation' => [
                'required',
                Rule::in([
                    'sum',
                    'best',
                    'average',
                ]),
            ],

            'qualifiers_count' => [
                'sometimes',
                'nullable',
                'integer',
                'min:1',
            ],

            'qualification_method' => [
                'sometimes',
                'nullable',
                'in:best_overall,best_per_group,all,none'
            ],

            'qualifiers_per_group' => [
                'nullable',
                'integer',
                'min:1',
            ],

            'podium_places' => [
                'nullable',
                'integer',
                'min:1',
            ],

            'status' => [
                'sometimes',
                'in:programado,en_curso,finalizado,cancelado',
            ],
        ]);

        $error = $this->validateStageConfiguration(
            $validated
        );

        if ($error) {
            return response()->json([
                'success' => false,
                'message' => $error,
            ], 422);
        }

        $stage->update($validated);

        return response()->json([
            'success' => true,
            'message' => 'Etapa actualizada correctamente.',
            'data' => $stage->fresh(),
        ]);
    }

    public function destroy(
        CompetitionEventStage $stage
    ) {
        $stage->delete();

        return response()->json([
            'success' => true,
            'message' => 'Etapa eliminada correctamente.',
        ]);
    }

    // Mostrar la clasificación de la etapa
    public function standings(
        CompetitionEventStage $stage,
        CompetitionStageStandingService $standingService
    ) {
        $standings = $standingService
            ->getStandings($stage);

        return response()->json([
            'success' => true,
            'data' => [
                'stage' => $stage,
                'standings' => $standings,
            ],
        ]);
    }

    // Avanzar a los participantes clasificados a la siguiente etapa
    public function advance(
        CompetitionEventStage $stage,
        CompetitionStageStandingService $standingService
    ) {
        try {
            $result = $standingService
                ->advanceQualifiers($stage);

            return response()->json([
                'success' => true,
                'message' =>
                    'Participantes clasificados correctamente.',
                'data' => $result,
            ]);
        } catch (\RuntimeException $e) {
            return response()->json([
                'success' => false,
                'message' => $e->getMessage(),
            ], 422);
        }
    }

    private function validateStageConfiguration(array &$data): ?string {
        /*
        |--------------------------------------------------------------------------
        | FINAL
        |--------------------------------------------------------------------------
        */
        if ($data['stage_type'] === 'final') {

            $data['qualification_method'] = 'none';

            $data['qualifiers_count'] = null;

            $data['qualifiers_per_group'] = null;

            if (empty($data['podium_places'])) {
                return 'La final debe indicar la cantidad de puestos premiados.';
            }

            return null;
        }

        /*
        |--------------------------------------------------------------------------
        | CLASIFICATORIA / SEMIFINAL
        |--------------------------------------------------------------------------
        */

        $data['podium_places'] = null;

        $method =
            $data['qualification_method'] ?? null;

        if (!$method || $method === 'none') {
            return 'Debe seleccionar un método de clasificación.';
        }

        /*
        |--------------------------------------------------------------------------
        | MEJORES GENERALES
        |--------------------------------------------------------------------------
        */
        if ($method === 'best_overall') {

            if (empty($data['qualifiers_count'])) {
                return 'Debe indicar cuántos participantes clasifican.';
            }

            $data['qualifiers_per_group'] = null;
        }

        /*
        |--------------------------------------------------------------------------
        | MEJORES POR GRUPO
        |--------------------------------------------------------------------------
        */
        if ($method === 'best_per_group') {

            if (empty($data['qualifiers_per_group'])) {
                return 'Debe indicar cuántos participantes clasifican por grupo.';
            }

            $data['qualifiers_count'] = null;
        }

        /*
        |--------------------------------------------------------------------------
        | TODOS CLASIFICAN
        |--------------------------------------------------------------------------
        */
        if ($method === 'all') {
            $data['qualifiers_count'] = null;
            $data['qualifiers_per_group'] = null;
        }

        return null;
    }

    public function finish(
        CompetitionEventStage $competitionEventStage,
        CompetitionQualificationService $qualificationService
    ) {
        try {
            $data =
                $qualificationService->finalizeStage(
                    $competitionEventStage
                );

            return response()->json([
                'success' => true,
                'message' =>
                    $competitionEventStage->stage_type === 'final'
                        ? 'Competencia finalizada correctamente.'
                        : 'Etapa finalizada y clasificados promovidos correctamente.',
                'data' => $data,
            ]);
        } catch (
            ValidationException $exception
        ) {
            return response()->json([
                'success' => false,
                'message' =>
                    collect(
                        $exception->errors()
                    )
                    ->flatten()
                    ->first()
                    ?? 'No se pudo finalizar la etapa.',
                'errors' =>
                    $exception->errors(),
            ], 422);
        }
    }

    public function summary(
        CompetitionEventStage $competitionEventStage,
        CompetitionQualificationService $qualificationService
    ) {
        return response()->json([
            'success' => true,

            'data' =>
                $qualificationService
                    ->getStageSummary(
                        $competitionEventStage
                    ),
        ]);
    }

    public function tiebreak(
        CompetitionEventStage $competitionEventStage,
        CompetitionQualificationService $qualificationService
    ) {
        return response()->json([
            'success' => true,

            'data' =>
                $qualificationService
                    ->getTiebreakInfo(
                        $competitionEventStage
                    ),
        ]);
    }
}