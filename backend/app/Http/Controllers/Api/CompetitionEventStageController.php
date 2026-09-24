<?php

namespace App\Http\Controllers\Api;

use App\Models\CompetitionEvent;
use App\Models\CompetitionEventStage;
use App\Http\Controllers\Controller;
use Illuminate\Http\Request;
use App\Services\CompetitionStageStandingService;

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
                'in:qualifying,semifinal,final,round',
            ],

            'stage_number' => [
                'required',
                'integer',
                'min:1',
            ],
            'qualifiers_count' => [
                'nullable',
                'integer',
                'min:1',
            ],
            'qualification_method' => [
                'nullable',
                'in:best_overall,all'
            ],

            'status' => [
                'nullable',
                'in:programado,en_curso,finalizado,cancelado',
            ],
        ]);

        if (
            ($validated['qualification_method'] ?? null) === 'best_overall'
            && empty($validated['qualifiers_count'])
        ) {
            return response()->json([
                'success' => false,
                'message' =>
                    'Debe indicar cuántos participantes clasifican.',
            ], 422);
        }

        $exists = CompetitionEventStage::where(
            'competition_event_id',
            $competitionEvent->id
        )
            ->where(
                'stage_number',
                $validated['stage_number']
            )
            ->exists();

        if ($exists) {
            return response()->json([
                'success' => false,
                'message' =>
                    'Ya existe una etapa con ese número.',
            ], 422);
        }

        $stage = $competitionEvent
            ->stages()
            ->create([
                'name' => $validated['name'],
                'stage_type' => $validated['stage_type'],
                'stage_number' => $validated['stage_number'],
                'qualifiers_count' =>
                    ($validated['qualification_method'] ?? null) === 'best_overall'
                        ? ($validated['qualifiers_count'] ?? null)
                        : null,
                'qualification_method' => $validated['qualification_method'] ?? null,
                'status' =>
                    $validated['status'] ?? 'programado',
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
                'in:qualifying,semifinal,final,round',
            ],

            'stage_number' => [
                'sometimes',
                'integer',
                'min:1',
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
                'in:best_overall, all'
            ],

            'status' => [
                'sometimes',
                'in:programado,en_curso,finalizado,cancelado',
            ],
        ]);

        if (isset($validated['stage_number'])) {
            $exists = CompetitionEventStage::where(
                'competition_event_id',
                $stage->competition_event_id
            )
                ->where(
                    'stage_number',
                    $validated['stage_number']
                )
                ->where('id', '!=', $stage->id)
                ->exists();

            if ($exists) {
                return response()->json([
                    'success' => false,
                    'message' =>
                        'Ya existe una etapa con ese número.',
                ], 422);
            }
        }

        $stage->update($validated);

        return response()->json([
            'success' => true,
            'message' => 'Etapa actualizada correctamente.',
            'data' => $stage,
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
}