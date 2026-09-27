<?php

namespace App\Http\Controllers\Public;

use App\Http\Controllers\Controller;
use App\Models\CompetitionResult;

class PublicCompetitionResultController extends Controller
{
    public function index($groupId)
    {
        $results = CompetitionResult::query()
            ->whereHas('groupParticipant.group.stage.event.championshipDiscipline.championship', fn ($q) =>
                $q->where('is_public', true)
            )
            ->whereHas('groupParticipant', fn ($q) =>
                $q->where('competition_event_group_id', $groupId)
            )
            ->with([
                'groupParticipant.participant.championshipPlayer',
                'groupParticipant.participant.championshipTeam.team',
                'attempts',
            ])
            ->orderBy('position')
            ->get()
            ->map(fn ($result) => [
                'id' => $result->id,
                'result_value' => $result->result_value,
                'result_unit' => $result->result_unit,
                'position' => $result->position,
                'tiebreak_order' => $result->tiebreak_order,
                'status' => $result->status,

                'lane' => $result->groupParticipant?->lane,
                'start_order' => $result->groupParticipant?->start_order,

                'participant' => $this->serializeParticipant(
                    $result->groupParticipant?->participant
                ),

                'attempts' => $result->attempts->map(fn ($attempt) => [
                    'id' => $attempt->id,
                    'attempt_number' => $attempt->attempt_number,
                    'value' => $attempt->value,
                ])->values(),
            ]);

        return response()->json([
            'success' => true,
            'data' => $results,
        ]);
    }

    private function serializeParticipant($participant): ?array
    {
        if (!$participant) return null;

        if ($participant->championshipPlayer) {
            return [
                'type' => 'player',
                'id' => $participant->championshipPlayer->id,
                'name' => $participant->championshipPlayer->player->name,
            ];
        }

        if ($participant->championshipTeam) {
            return [
                'type' => 'team',
                'id' => $participant->championshipTeam->id,
                'name' => $participant->championshipTeam->team?->name,
            ];
        }

        return null;
    }

}