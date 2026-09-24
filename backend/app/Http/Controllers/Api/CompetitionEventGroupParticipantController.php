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
        $participants = $group
            ->participants()
            ->with([
                'participant.championshipPlayer.championshipTeam.team',
                'participant.championshipTeam.team',
                'participant.members.championshipPlayer',
                'result.attempts',
            ])
            ->orderByRaw('lane IS NULL, lane ASC')
            ->orderByRaw('start_order IS NULL, start_order ASC')
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

            'status' => [
                'nullable',
                'in:programado,confirmado,no_presento,retirado',
            ],
        ]);

        $participant = CompetitionEventParticipant::findOrFail(
            $validated['competition_event_participant_id']
        );

        $alreadyAssignedInStage =
            CompetitionEventGroupParticipant::where(
                'competition_event_participant_id',
                $participant->id
            )
                ->whereHas(
                    'group',
                    fn ($query) => $query->where(
                        'competition_event_stage_id',
                        $group->competition_event_stage_id
                    )
                )
                ->exists();

        if ($alreadyAssignedInStage) {
            return response()->json([
                'success' => false,
                'message' =>
                    'El participante ya está asignado a una serie o grupo de esta etapa.',
            ], 422);
        }

        /*
        |--------------------------------------------------------------------------
        | VALIDAR QUE EL PARTICIPANTE PERTENEZCA AL MISMO EVENTO
        |--------------------------------------------------------------------------
        */
        $eventId = $group
            ->stage
            ->competition_event_id;

        if (
            $participant->competition_event_id
            !== $eventId
        ) {
            return response()->json([
                'success' => false,
                'message' =>
                    'El participante no pertenece a este evento.',
            ], 422);
        }

        /*
        |--------------------------------------------------------------------------
        | EVITAR DUPLICADO EN LA MISMA SERIE / GRUPO
        |--------------------------------------------------------------------------
        */
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
                    'El participante ya está asignado a este grupo.',
            ], 422);
        }

        /*
        |--------------------------------------------------------------------------
        | EVITAR CARRIL DUPLICADO
        |--------------------------------------------------------------------------
        */
        if (!empty($validated['lane'])) {
            $laneExists =
                CompetitionEventGroupParticipant::where(
                    'competition_event_group_id',
                    $group->id
                )
                    ->where(
                        'lane',
                        $validated['lane']
                    )
                    ->exists();

            if ($laneExists) {
                return response()->json([
                    'success' => false,
                    'message' =>
                        'Ese carril ya está ocupado.',
                ], 422);
            }
        }

        /*
        |--------------------------------------------------------------------------
        | EVITAR ORDEN DUPLICADO
        |--------------------------------------------------------------------------
        */
        if (!empty($validated['start_order'])) {
            $orderExists =
                CompetitionEventGroupParticipant::where(
                    'competition_event_group_id',
                    $group->id
                )
                    ->where(
                        'start_order',
                        $validated['start_order']
                    )
                    ->exists();

            if ($orderExists) {
                return response()->json([
                    'success' => false,
                    'message' =>
                        'Ese orden de participación ya está ocupado.',
                ], 422);
            }
        }

        $groupParticipant =
            CompetitionEventGroupParticipant::create([
                'competition_event_group_id' =>
                    $group->id,

                'competition_event_participant_id' =>
                    $participant->id,

                'lane' =>
                    $validated['lane'] ?? null,

                'start_order' =>
                    $validated['start_order'] ?? null,

                'status' =>
                    $validated['status'] ?? 'programado',
            ]);

        $groupParticipant->load([
            'participant.championshipPlayer.championshipTeam.team',
            'participant.championshipTeam.team',
            'participant.members.championshipPlayer',
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

            'status' => [
                'sometimes',
                'in:programado,confirmado,no_presento,retirado',
            ],
        ]);

        /*
        |--------------------------------------------------------------------------
        | CARRIL ÚNICO DENTRO DEL GRUPO
        |--------------------------------------------------------------------------
        */
        if (
            array_key_exists('lane', $validated)
            && $validated['lane'] !== null
        ) {
            $exists =
                CompetitionEventGroupParticipant::where(
                    'competition_event_group_id',
                    $groupParticipant->competition_event_group_id
                )
                    ->where(
                        'lane',
                        $validated['lane']
                    )
                    ->where(
                        'id',
                        '!=',
                        $groupParticipant->id
                    )
                    ->exists();

            if ($exists) {
                return response()->json([
                    'success' => false,
                    'message' =>
                        'Ese carril ya está ocupado.',
                ], 422);
            }
        }

        /*
        |--------------------------------------------------------------------------
        | ORDEN ÚNICO DENTRO DEL GRUPO
        |--------------------------------------------------------------------------
        */
        if (
            array_key_exists('start_order', $validated)
            && $validated['start_order'] !== null
        ) {
            $exists =
                CompetitionEventGroupParticipant::where(
                    'competition_event_group_id',
                    $groupParticipant->competition_event_group_id
                )
                    ->where(
                        'start_order',
                        $validated['start_order']
                    )
                    ->where(
                        'id',
                        '!=',
                        $groupParticipant->id
                    )
                    ->exists();

            if ($exists) {
                return response()->json([
                    'success' => false,
                    'message' =>
                        'Ese orden de participación ya está ocupado.',
                ], 422);
            }
        }

        $groupParticipant->update($validated);

        return response()->json([
            'success' => true,
            'message' =>
                'Asignación actualizada correctamente.',
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