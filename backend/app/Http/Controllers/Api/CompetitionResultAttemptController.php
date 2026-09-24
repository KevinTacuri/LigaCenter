<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\CompetitionResult;
use App\Models\CompetitionResultAttempt;
use App\Services\CompetitionResultService;
use App\Models\CompetitionEventParticipantMember;
use Illuminate\Http\Request;
use Illuminate\Validation\ValidationException;

class CompetitionResultAttemptController extends Controller
{
    public function __construct(
        private CompetitionResultService $resultService
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

        $attempt->delete();

        $this->resultService->syncResult($attempt->result);

        return response()->json([
            'success' => true,
            'message' => 'Intento eliminado correctamente.',
        ]);
    }
}