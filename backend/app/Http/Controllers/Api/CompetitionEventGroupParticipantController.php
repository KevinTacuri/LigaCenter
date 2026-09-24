<?php

namespace App\Http\Controllers\Api;

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

            'lane' => [
                'nullable',
                'integer',
                'min:1',
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
        $group->load('stage');

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

        // Crear la asignación del participante al grupo
        $groupParticipant = CompetitionEventGroupParticipant::create([
            'competition_event_group_id' =>
                $group->id,

            'competition_event_participant_id' =>
                $participant->id,

            'lane' =>
                $validated['lane'] ?? null,

            'start_order' =>
                $validated['start_order'] ?? null,
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
}