<?php

namespace App\Http\Controllers\Api;

use App\Events\CompetitionLiveUpdated;
use App\Http\Controllers\Controller;
use App\Models\CompetitionEventGroup;
use App\Models\CompetitionResult;
use App\Models\CompetitionResultAttempt;
use App\Services\CompetitionResultService;
use App\Models\CompetitionEventParticipantMember;
use App\Services\CompetitionLiveService;
use Illuminate\Http\Request;

class CompetitionResultAttemptController extends Controller
{
    public function __construct(
        private CompetitionResultService $resultService,
        private CompetitionLiveService $liveService
    ) {}
    /**
     * Listar intentos.
     */
    public function index(CompetitionResult $competitionResult)
    {
        $attempts = $competitionResult
            ->attempts()
            ->with([
                'member.championshipPlayer',
            ])
            ->orderBy('attempt_number')
            ->get();

        return response()->json([
            'success' => true,
            'data' => $attempts,
        ]);
    }

    /**
     * Registrar intento.
     */
    public function store(Request $request, CompetitionResult $competitionResult)
    {
        if ($competitionResult->status === 'oficializado') {
            return response()->json([
                'success' => false,
                'message' =>
                    'No se pueden agregar intentos a un resultado oficializado.',
            ], 422);
        }

        $validated = $request->validate([
            'competition_event_participant_member_id' => [
                'nullable',
                'exists:competition_event_participant_members,id',
            ],

            'attempt_number' => [
                'required',
                'integer',
                'min:1',
            ],

            'value' => [
                'nullable',
                'numeric',
            ],
        ]);

        $competitionResult->loadMissing(
            'groupParticipant.group.stage'
        );

        $stage = $competitionResult
            ->groupParticipant
            ->group
            ->stage;

        if (
            $validated['attempt_number'] >
            $stage->rounds_count
        ) {
            return response()->json([
                'success' => false,
                'message' =>
                    "Esta etapa solo permite {$stage->rounds_count} ronda(s).",
            ], 422);
        }

        /*
        |--------------------------------------------------------------------------
        | VALIDAR MIEMBRO
        |--------------------------------------------------------------------------
        */
        if (!empty(
            $validated[
                'competition_event_participant_member_id'
            ]
        )) {
            $member =
                CompetitionEventParticipantMember::findOrFail(
                    $validated[
                        'competition_event_participant_member_id'
                    ]
                );

            $eventParticipantId =
                $competitionResult
                    ->groupParticipant
                    ->competition_event_participant_id;

            if (
                $member->competition_event_participant_id
                !== $eventParticipantId
            ) {
                return response()->json([
                    'success' => false,
                    'message' =>
                        'El miembro no pertenece al participante de este resultado.',
                ], 422);
            }
        }

        /*
        |--------------------------------------------------------------------------
        | EVITAR INTENTO DUPLICADO
        |--------------------------------------------------------------------------
        */
        $query = CompetitionResultAttempt::where(
            'competition_result_id',
            $competitionResult->id
        )
            ->where(
                'attempt_number',
                $validated['attempt_number']
            );

        if (
            !empty(
                $validated[
                    'competition_event_participant_member_id'
                ]
            )
        ) {
            $query->where(
                'competition_event_participant_member_id',
                $validated[
                    'competition_event_participant_member_id'
                ]
            );
        } else {
            $query->whereNull(
                'competition_event_participant_member_id'
            );
        }

        if ($query->exists()) {
            return response()->json([
                'success' => false,
                'message' =>
                    'Ese número de intento ya fue registrado.',
            ], 422);
        }

        $attempt = $competitionResult
            ->attempts()
            ->create([
                'competition_event_participant_member_id' =>
                    $validated[
                        'competition_event_participant_member_id'
                    ] ?? null,

                'attempt_number' =>
                    $validated['attempt_number'],

                'value' =>
                    $validated['value'] ?? null,
            ]);

        $this->resultService->syncResult($competitionResult);

        $attempt->load(
            'member.championshipPlayer'
        );

        // Broadcast Live service
        $groupId = $competitionResult
            ->groupParticipant
            ->competition_event_group_id;
        $this->broadcastGroupResults($groupId);

        return response()->json([
            'success' => true,
            'message' =>
                'Intento registrado correctamente.',
            'data' => $attempt,
        ], 201);
    }

    /**
     * Mostrar intento.
     */
    public function show(
        CompetitionResultAttempt $attempt
    ) {
        $attempt->load([
            'result.groupParticipant.group.stage.event',
            'member.championshipPlayer',
        ]);

        return response()->json([
            'success' => true,
            'data' => $attempt,
        ]);
    }

    /**
     * Actualizar intento.
     */
    public function update(
        Request $request,
        CompetitionResultAttempt $attempt
    ) {
        $attempt->load('result');

        if ($attempt->result->status === 'oficializado') {
            return response()->json([
                'success' => false,
                'message' =>
                    'No se puede modificar un intento de un resultado oficializado.',
            ], 422);
        }

        $validated = $request->validate([
            'value' => [
                'sometimes',
                'nullable',
                'numeric',
            ],
        ]);

        $attempt->update($validated);

        $this->resultService->syncResult($attempt->result);

        // Broadcast live event
        $groupId = $attempt
            ->result
            ->groupParticipant
            ->competition_event_group_id;

        $this->broadcastGroupResults($groupId);

        return response()->json([
            'success' => true,
            'message' =>
                'Intento actualizado correctamente.',
            'data' => $attempt,
        ]);

    }

    /**
     * Eliminar intento.
     */
    public function destroy(
        CompetitionResultAttempt $attempt
    ) {
        $attempt->load('result');

        if ($attempt->result->status === 'oficializado') {
            return response()->json([
                'success' => false,
                'message' =>
                    'No se puede eliminar un intento de un resultado oficializado.',
            ], 422);
        }
        // Guarda el grupo antes de borrarlo para emitir el broadcast luego
        $groupId = $attempt
            ->result
            ->groupParticipant
            ->competition_event_group_id;

        $attempt->delete();

        $this->resultService->syncResult($attempt->result);

        // Broadcast live event
        $this->broadcastGroupResults($groupId);

        return response()->json([
            'success' => true,
            'message' => 'Intento eliminado correctamente.',
        ]);
    }

    private function broadcastGroupResults(int $groupId): void
    {
        $group = CompetitionEventGroup::with([
            'stage.event.championshipDiscipline',
        ])->find($groupId);

        if (!$group) {
            return;
        }

        $stage = $group->stage;
        $event = $stage->event;

        CompetitionLiveUpdated::publish(
            eventId: $event->id,
            championshipId:
                $event->championshipDiscipline->championship_id,
            stageId: $stage->id,
            groupId: $group->id,
            type: 'group-results',
            data: $this->liveService->groupSnapshot($group),
        );
    }
}
