<?php

namespace App\Http\Controllers\Api;

use App\Events\CompetitionDataUpdated;

use App\Models\CompetitionEventGroup;
use App\Models\CompetitionEventStage;
use App\Http\Controllers\Controller;
use Illuminate\Http\Request;
use App\Models\CompetitionEventGroupParticipant;
use App\Models\CompetitionResult;
use Illuminate\Support\Facades\DB;

class CompetitionEventGroupController extends Controller
{
    public function index(
        CompetitionEventStage $stage
    ) {
        $groups = $stage
            ->groups()
            ->with('venue')
            ->orderBy('group_number')
            ->get();

        return response()->json([
            'success' => true,
            'data' => $groups,
        ]);
    }

    public function store(
        Request $request,
        CompetitionEventStage $stage
    ) {
        $validated = $request->validate([
            'name' => [
                'required',
                'string',
                'max:255',
            ],

            'group_type' => [
                'required',
                'in:series,group',
            ],

            'group_number' => [
                'required',
                'integer',
                'min:1',
            ],

            'date' => [
                'nullable',
                'date',
            ],

            'start_time' => [
                'nullable',
                'date_format:H:i',
            ],

            'venue_id' => [
                'nullable',
                'exists:venues,id',
            ],

            'status' => [
                'nullable',
                'in:programado,en_curso,finalizado,cancelado',
            ],
        ]);

        $exists = CompetitionEventGroup::where(
            'competition_event_stage_id',
            $stage->id
        )
            ->where(
                'group_number',
                $validated['group_number']
            )
            ->exists();

        if ($exists) {
            return response()->json([
                'success' => false,
                'message' =>
                    'Ya existe un grupo o serie con ese número.',
            ], 422);
        }

        $group = $stage
            ->groups()
            ->create([
                'name' => $validated['name'],
                'group_type' => $validated['group_type'],
                'group_number' => $validated['group_number'],
                'date' => $validated['date'] ?? null,
                'start_time' =>
                    $validated['start_time'] ?? null,
                'venue_id' =>
                    $validated['venue_id'] ?? null,
                'status' =>
                    $validated['status'] ?? 'programado',
            ]);

        $group->load('venue');

        CompetitionDataUpdated::publish($group, 'store');

        return response()->json([
            'success' => true,
            'message' =>
                'Grupo o serie creado correctamente.',
            'data' => $group,
        ], 201);
    }

    public function update(
        Request $request,
        CompetitionEventGroup $group
    ) {
        $validated = $request->validate([
            'name' => [
                'sometimes',
                'string',
                'max:255',
            ],

            'group_type' => [
                'sometimes',
                'in:series,group',
            ],

            'group_number' => [
                'sometimes',
                'integer',
                'min:1',
            ],

            'date' => [
                'sometimes',
                'nullable',
                'date',
            ],

            'start_time' => [
                'sometimes',
                'nullable',
                'date_format:H:i',
            ],

            'venue_id' => [
                'sometimes',
                'nullable',
                'exists:venues,id',
            ],

            'status' => [
                'sometimes',
                'in:programado,en_curso,finalizado,cancelado',
            ],
        ]);

        if (isset($validated['group_number'])) {
            $exists = CompetitionEventGroup::where(
                'competition_event_stage_id',
                $group->competition_event_stage_id
            )
                ->where(
                    'group_number',
                    $validated['group_number']
                )
                ->where('id', '!=', $group->id)
                ->exists();

            if ($exists) {
                return response()->json([
                    'success' => false,
                    'message' =>
                        'Ya existe un grupo o serie con ese número.',
                ], 422);
            }
        }

        $group->update($validated);

        $group->load('venue');

        CompetitionDataUpdated::publish($group, 'update');

        return response()->json([
            'success' => true,
            'message' =>
                'Grupo o serie actualizado correctamente.',
            'data' => $group,
        ]);
    }

    public function destroy(
        CompetitionEventGroup $group
    ) {
        $group->delete();

        CompetitionDataUpdated::publish($group, 'destroy');

        return response()->json([
            'success' => true,
            'message' =>
                'Grupo o serie eliminado correctamente.',
        ]);
    }

    // Iniciar un grupo o serie de evento de competencia
    public function start(
        CompetitionEventGroup $competitionEventGroup
    ) {
        if ($competitionEventGroup->status === 'finalizado') {
            return response()->json([
                'success' => false,
                'message' => 'Este grupo ya fue finalizado.',
            ], 422);
        }

        if ($competitionEventGroup->status === 'cancelado') {
            return response()->json([
                'success' => false,
                'message' => 'No se puede iniciar un grupo cancelado.',
            ], 422);
        }

        $tieneParticipantes =
            CompetitionEventGroupParticipant::where(
                'competition_event_group_id',
                $competitionEventGroup->id
            )->exists();

        if (!$tieneParticipantes) {
            return response()->json([
                'success' => false,
                'message' =>
                    'No se puede iniciar un grupo sin participantes.',
            ], 422);
        }

        DB::transaction(
            function () use ($competitionEventGroup) {
                $competitionEventGroup->update([
                    'status' => 'en_curso',
                ]);

                $competitionEventGroup->loadMissing(
                    'stage.event'
                );

                if (
                    $competitionEventGroup
                        ->stage
                        ->status === 'programado'
                ) {
                    $competitionEventGroup
                        ->stage
                        ->update([
                            'status' => 'en_curso',
                        ]);
                }

                if (
                    $competitionEventGroup
                        ->stage
                        ->event
                        ->status === 'programado'
                ) {
                    $competitionEventGroup
                        ->stage
                        ->event
                        ->update([
                            'status' => 'en_curso',
                        ]);
                }
            }
        );

        CompetitionDataUpdated::publish($competitionEventGroup, 'start');

        return response()->json([
            'success' => true,
            'message' => 'Grupo iniciado correctamente.',
            'data' => $competitionEventGroup->fresh(),
        ]);
    }

    // Finalizar un grupo o serie de evento de competencia
    public function finish(
        CompetitionEventGroup $competitionEventGroup
    ) {
        if (
            $competitionEventGroup->status !== 'en_curso'
        ) {
            return response()->json([
                'success' => false,
                'message' =>
                    'El grupo debe estar en curso para poder finalizarlo.',
            ], 422);
        }

        $competitionEventGroup->loadMissing(
            'stage'
        );

        $roundsCount =
            (int) $competitionEventGroup
                ->stage
                ->rounds_count;

        $participants =
            CompetitionEventGroupParticipant::with('participant')
                ->where(
                    'competition_event_group_id',
                    $competitionEventGroup->id
                )
                ->get();

        if ($participants->isEmpty()) {
            return response()->json([
                'success' => false,
                'message' =>
                    'El grupo no tiene participantes.',
            ], 422);
        }

        $participantIds =
            $participants->pluck('id');

        $results =
            CompetitionResult::with('attempts')
                ->whereIn(
                    'competition_event_group_participant_id',
                    $participantIds
                )
                ->get()
                ->keyBy(
                    'competition_event_group_participant_id'
                );

        $incompletos = [];

        foreach ($participants as $participant) {
            $result =
                $results->get(
                    $participant->id
                );

            // No se presentó o se retiró
            if (in_array($participant->status, ['no_presento', 'retirado'], true)) {
                continue;
            }

            /*
            |--------------------------------------------------------------------------
            | SIN RESULTADO
            |--------------------------------------------------------------------------
            */

            if (!$result) {
                $incompletos[] =
                    $participant->id;

                continue;
            }

            /*
            |--------------------------------------------------------------------------
            | ANULADO
            |--------------------------------------------------------------------------
            |
            | Un resultado anulado no necesita completar rondas.
            |
            */

            if ($result->status === 'anulado') {
                continue;
            }

            /*
            |--------------------------------------------------------------------------
            | VALIDAR TODAS LAS RONDAS
            |--------------------------------------------------------------------------
            */

            $attemptNumbers =
                $result
                    ->attempts
                    ->whereNotNull('value')
                    ->pluck('attempt_number')
                    ->unique();

            for (
                $round = 1;
                $round <= $roundsCount;
                $round++
            ) {
                if (
                    !$attemptNumbers->contains(
                        $round
                    )
                ) {
                    $incompletos[] =
                        $participant->id;

                    break;
                }
            }
        }

        if (!empty($incompletos)) {
            return response()->json([
                'success' => false,
                'message' =>
                    'No se puede finalizar el grupo porque existen participantes con resultados incompletos.',
                'data' => [
                    'incomplete_participant_ids' =>
                        array_values(
                            array_unique(
                                $incompletos
                            )
                        ),
                ],
            ], 422);
        }

        /*
        |--------------------------------------------------------------------------
        | CERRAR GRUPO
        |--------------------------------------------------------------------------
        */

        DB::transaction(
            function () use (
                $competitionEventGroup,
                $results
            ) {
                foreach ($results as $result) {
                    if (
                        $result->status !== 'anulado'
                    ) {
                        $result->update([
                            'status' => 'oficializado',
                        ]);
                    }
                }

                $competitionEventGroup->update([
                    'status' => 'finalizado',
                ]);
            }
        );

        CompetitionDataUpdated::publish($competitionEventGroup, 'finish');

        return response()->json([
            'success' => true,
            'message' =>
                'Grupo finalizado y resultados oficializados correctamente.',
            'data' =>
                $competitionEventGroup->fresh(),
        ]);
    }
}