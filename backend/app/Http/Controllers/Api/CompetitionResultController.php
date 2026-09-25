<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\CompetitionEventGroupParticipant;
use App\Models\CompetitionResult;
use App\Services\CompetitionResultService;
use Illuminate\Http\Request;

class CompetitionResultController extends Controller
{
    public function __construct(
        private CompetitionResultService $resultService
    ) {
    }

    public function index(Request $request)
    {
        $validated = $request->validate([
            'competition_event_group_id' => [
                'required',
                'exists:competition_event_groups,id',
            ],
        ]);

        $results = CompetitionResult::with([
            'groupParticipant.participant.championshipPlayer',
            'groupParticipant.participant.championshipTeam',
            'groupParticipant.participant.members.championshipPlayer',
            'attempts.member.championshipPlayer',
        ])
            ->whereHas('groupParticipant', fn ($query) =>
                $query->where(
                    'competition_event_group_id',
                    $validated['competition_event_group_id']
                )
            )
            ->orderBy('position')
            ->get();

        return response()->json([
            'success' => true,
            'data' => $results,
        ]);
    }

    public function store(Request $request)
    {
        $validated = $request->validate([
            'competition_event_group_participant_id' => [
                'required',
                'exists:competition_event_group_participants,id',
            ],
            'result_unit' => [
                'nullable',
                'string',
                'max:50',
            ],
            'status' => [
                'nullable',
                'string',
                'in:registrado,oficializado,anulado',
            ],
        ]);

        $groupParticipant = CompetitionEventGroupParticipant::findOrFail(
            $validated[
                'competition_event_group_participant_id'
            ]
        );

        $exists = CompetitionResult::where(
            'competition_event_group_participant_id',
            $groupParticipant->id
        )->exists();

        if ($exists) {
            return response()->json([
                'success' => false,
                'message' =>
                    'Este participante ya tiene un resultado registrado.',
            ], 422);
        }

        $result = CompetitionResult::create([
            'competition_event_group_participant_id' =>
                $groupParticipant->id,

            'result_value' => null,

            'result_unit' =>
                $validated['result_unit'] ?? null,

            'position' => null,

            'status' =>
                $validated['status'] ?? 'registrado',
        ]);

        $this->resultService->recalculatePositions(
            $groupParticipant->competition_event_group_id
        );

        $result->load([
            'groupParticipant.participant.championshipPlayer',
            'groupParticipant.participant.championshipTeam',
            'groupParticipant.participant.members.championshipPlayer',
            'attempts',
        ]);

        return response()->json([
            'success' => true,
            'message' => 'Resultado registrado correctamente.',
            'data' => $result,
        ], 201);
    }

    public function show(CompetitionResult $competitionResult)
    {
        $competitionResult->load([
            'groupParticipant.group.stage.event',
            'groupParticipant.participant.championshipPlayer',
            'groupParticipant.participant.championshipTeam',
            'groupParticipant.participant.members.championshipPlayer',
            'attempts.member.championshipPlayer',
        ]);

        return response()->json([
            'success' => true,
            'data' => $competitionResult,
        ]);
    }

    public function update(
        Request $request,
        CompetitionResult $competitionResult
    ) {
        if ($competitionResult->status === 'oficializado') {
            return response()->json([
                'success' => false,
                'message' =>
                    'No se puede modificar un resultado oficializado.',
            ], 422);
        }

        $validated = $request->validate([
            'result_unit' => [
                'sometimes',
                'nullable',
                'string',
                'max:50',
            ],
            'status' => [
                'sometimes',
                'string',
                'in:registrado,oficializado,anulado',
            ],
        ]);

        $competitionResult->update($validated);

        $this->resultService->recalculatePositions(
            $competitionResult
                ->groupParticipant
                ->competition_event_group_id
        );

        $competitionResult->load([
            'groupParticipant.participant.championshipPlayer',
            'groupParticipant.participant.championshipTeam',
            'groupParticipant.participant.members.championshipPlayer',
            'attempts.member.championshipPlayer',
        ]);

        return response()->json([
            'success' => true,
            'message' => 'Resultado actualizado correctamente.',
            'data' => $competitionResult,
        ]);
    }

    public function destroy(CompetitionResult $competitionResult)
    {
        if ($competitionResult->status === 'oficializado') {
            return response()->json([
                'success' => false,
                'message' =>
                    'No se puede eliminar un resultado oficializado.',
            ], 422);
        }

        $groupId = $competitionResult
            ->groupParticipant
            ->competition_event_group_id;

        $competitionResult->delete();

        $this->resultService->recalculatePositions(
            $groupId
        );

        return response()->json([
            'success' => true,
            'message' => 'Resultado eliminado correctamente.',
        ]);
    }


    public function updateTiebreak(
        Request $request,
        CompetitionResult $competitionResult
    ) {
        $validated = $request->validate([
            'tiebreak_order' => [
                'nullable',
                'integer',
                'min:1',
            ],
        ]);

        $competitionResult->update([
            'tiebreak_order' =>
                $validated['tiebreak_order'],
        ]);

        return response()->json([
            'success' => true,
            'message' =>
                'Desempate actualizado correctamente.',
            'data' =>
                $competitionResult->fresh(),
        ]);
    }
}