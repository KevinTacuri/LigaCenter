<?php

namespace App\Services;

use App\Models\CompetitionEventGroup;

class CompetitionLiveService
{
    public function groupSnapshot(
        CompetitionEventGroup $group
    ): array {
        $group->load([
            'participants.participant.championshipPlayer',
            'participants.participant.championshipTeam.team',
            'participants.result.attempts',
        ]);

        return [
            'group_id' => $group->id,

            'results' => $group->participants
                ->map(function ($assignment) {
                    $result = $assignment->result;

                    if (!$result) {
                        return null;
                    }

                    $participant =
                        $assignment->participant;

                    return [
                        'id' => $result->id,
                        'competition_event_participant_id' =>
                            $participant->id,

                        'position' => $result->position,
                        'result_value' => $result->result_value,
                        'result_unit' => $result->result_unit,
                        'status' => $result->status,

                        'lane' => $assignment->lane,
                        'start_order' => $assignment->start_order,

                        'attempts' =>
                            $result->attempts->map(
                                fn ($attempt) => [
                                    'id' => $attempt->id,
                                    'attempt_number' =>
                                        $attempt->attempt_number,
                                    'value' => $attempt->value,
                                ]
                            )->values(),

                        // luego aquí agregaremos qualified
                        'qualified' => false,
                    ];
                })
                ->filter()
                ->values(),
        ];
    }
}