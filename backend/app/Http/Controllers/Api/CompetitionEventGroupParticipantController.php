<?php

namespace App\Http\Controllers\Api;

use App\Events\CompetitionLiveUpdated;
use App\Models\CompetitionEventGroup;
use App\Models\CompetitionEventParticipant;
use App\Models\CompetitionEventGroupParticipant;
use App\Http\Controllers\Controller;
use Illuminate\Http\Request;

class CompetitionEventGroupParticipantController extends Controller
{
    public function index(
        CompetitionEventGroup $group
    ) {
        $participants = CompetitionEventGroupParticipant::where(
            'competition_event_group_id',
            $group->id
        )
            ->orderBy('start_order')
            ->get();

        return response()->json([
            'success' => true,
            'data' => $participants,
        ]);
    }

    public function store(
        Request $request,
        CompetitionEventGroup $group
    ) {
        $validated = $request->validate([
            'competition_event_participant_id' => [
                'required',
                'exists:competition_event_participants,id',
            ],

            'start_order' => [
                'nullable',
                'integer',
                'min:1',
            ],
        ]);

        $participant = CompetitionEventParticipant::findOrFail(
            $validated['competition_event_participant_id']
        );

        // Verificar que el participante pertenezca al mismo evento que el grupo
        $group->load('stage.event');

        if ($participant->competition_event_id !== $group->stage->competition_event_id) {
            return response()->json([
                'success' => false,
                'message' =>
                    'El participante no pertenece a este evento.',
            ], 422);
        }

        // Evitar que el participante duplicado en el mismo grupo
        $exists = CompetitionEventGroupParticipant::where(
            'competition_event_group_id',
            $group->id
        )
            ->where(
                'competition_event_participant_id',
                $participant->id
            )
            ->exists();

        if ($exists) {
            return response()->json([
                'success' => false,
                'message' =>
                    'El participante ya pertenece a este grupo.',
            ], 422);
        }

        $existsInStage =
            CompetitionEventGroupParticipant::where(
                'competition_event_participant_id',
                $participant->id
            )
            ->whereHas('group', function ($query) use ($group) {
                $query->where(
                    'competition_event_stage_id',
                    $group->competition_event_stage_id
                );
            })
            ->exists();

        if ($existsInStage) {
            return response()->json([
                'success' => false,
                'message' =>
                    'El participante ya está asignado a un grupo de esta etapa.',
            ], 422);
        }

        $usesLanes = $group
            ->stage->event ->event_type === 'carrera';

        $lane = $usesLanes
            ? $this->nextAvailableLane(
                $group->id
            )
            : null;

        $startOrder = $validated['start_order']
            ?? $this->nextStartOrder(
                $group->id
            );

        // Crear la asignación del participante al grupo
        $groupParticipant = CompetitionEventGroupParticipant::create([
            'competition_event_group_id' =>
                $group->id,

            'competition_event_participant_id' =>
                $participant->id,

            'lane' => $lane,

            'start_order' => $startOrder,
        ]);

        return response()->json([
            'success' => true,
            'message' =>
                'Participante asignado correctamente.',
            'data' => $groupParticipant,
        ], 201);
    }

    public function update(
        Request $request,
        CompetitionEventGroupParticipant $groupParticipant
    ) {
        $validated = $request->validate([
            'lane' => [
                'sometimes',
                'nullable',
                'integer',
                'min:1',
            ],

            'start_order' => [
                'sometimes',
                'nullable',
                'integer',
                'min:1',
            ],
        ]);

        if ($groupParticipant->group ->status === 'finalizado') {
            return response()->json([
                'success' => false,
                'message' =>
                    'No se puede modificar un participante de un grupo finalizado.',
            ], 422);
        }

        if (
            array_key_exists('lane', $validated) &&
            $validated['lane'] !== null
        ) {
            $laneExists = CompetitionEventGroupParticipant::where(
                'competition_event_group_id',
                $groupParticipant->competition_event_group_id
            )
                ->where('lane', $validated['lane'])
                ->where('id', '!=', $groupParticipant->id)
                ->exists();

            if ($laneExists) {return response()->json([
                    'success' => false,
                    'message' =>
                        'Ese carril ya está ocupado en este grupo.',
                ], 422);
            }
        }

        $groupParticipant->update($validated);

        return response()->json([
            'success' => true,
            'message' =>
                'Participante actualizado correctamente.',
            'data' => $groupParticipant,
        ]);
    }

    public function destroy(
        CompetitionEventGroupParticipant $groupParticipant
    ) {
        $groupParticipant->delete();

        return response()->json([
            'success' => true,
            'message' =>
                'Participante retirado del grupo correctamente.',
        ]);
    }

    public function updateStatus(
        Request $request,
        CompetitionEventGroupParticipant $groupParticipant
    ) {
        $groupParticipant->loadMissing('group');

        if (
            $groupParticipant->group->status ===
            'finalizado'
        ) {
            return response()->json([
                'success' => false,
                'message' =>
                    'No se puede modificar un grupo finalizado.',
            ], 422);
        }

        $validated = $request->validate([
            'status' => [
                'required',
                'in:activo,no_presento,retirado',
            ],
        ]);

        $groupParticipant->update([
            'status' =>
                $validated['status'],
        ]);


        $group = $groupParticipant->group;
        $stage = $group->stage;
        $event = $stage->event;

        CompetitionLiveUpdated::publish(
            eventId: $event->id,
            championshipId:
                $event->championshipDiscipline->championship_id,
            stageId: $stage->id,
            groupId: $group->id,
            type: 'participant-status',
            data: [
                'group_participant_id' =>
                    $groupParticipant->id,

                'competition_event_participant_id' =>
                    $groupParticipant
                        ->competition_event_participant_id,

                'status' =>
                    $groupParticipant->status,
            ],
        );

        return response()->json([
            'success' => true,
            'message' =>
                'Estado actualizado correctamente.',
            'data' =>
                $groupParticipant->fresh(),
        ]);
    }

    private function nextAvailableLane(
        int $groupId
    ): int {
        $usedLanes =
            CompetitionEventGroupParticipant::where(
                'competition_event_group_id',
                $groupId
            )
            ->whereNotNull('lane')
            ->pluck('lane')
            ->map(
                fn ($lane) =>
                    (int) $lane
            )
            ->all();

        $lane = 1;

        while (
            in_array(
                $lane,
                $usedLanes,
                true
            )
        ) {
            $lane++;
        }

        return $lane;
    }

    private function nextStartOrder(
        int $groupId
    ): int {
        $currentMax =
            CompetitionEventGroupParticipant::where(
                'competition_event_group_id',
                $groupId
            )
            ->max('start_order');

        return ($currentMax ?? 0) + 1;
    }
}