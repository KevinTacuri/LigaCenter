<?php

namespace App\Services;

use App\Models\CompetitionEvent;
use Illuminate\Support\Collection;

class CompetitionEventStandingService
{
    public function __construct(
        private CompetitionStageStandingService $stageStandingService
    ) {
    }

    public function getStandings(
        CompetitionEvent $event
    ): Collection {
        $event->load([
            'participants.championshipPlayer',
            'participants.championshipTeam',

            'stages.groups.participants.participant.championshipPlayer',
            'stages.groups.participants.participant.championshipTeam',

            'stages.groups.participants.result',
        ]);

        /*
        |--------------------------------------------------------------------------
        | TIRO AL SAPO / PUNTAJE POR RONDAS
        |--------------------------------------------------------------------------
        |
        | Si las etapas son rondas, acumulamos los resultados.
        */
        $roundStages = $event
            ->stages
            ->where('stage_type', 'round');

        if (
            $event->event_type === 'puntaje'
            && $roundStages->isNotEmpty()
        ) {
            return $this->getAccumulatedRoundStandings(
                $event
            );
        }

        /*
        |--------------------------------------------------------------------------
        | NATACIÓN / ATLETISMO
        |--------------------------------------------------------------------------
        |
        | La clasificación oficial sale de la final.
        */
        $finalStage = $event
            ->stages
            ->where('stage_type', 'final')
            ->sortByDesc('stage_number')
            ->first();

        /*
        |--------------------------------------------------------------------------
        | SI NO HAY FINAL
        |--------------------------------------------------------------------------
        |
        | Por ejemplo, una competencia de una sola etapa.
        */
        $stage = $finalStage
            ?? $event
                ->stages
                ->where('status', 'finalizado')
                ->sortByDesc('stage_number')
                ->first();

        if (!$stage) {
            return collect();
        }

        return $this
            ->stageStandingService
            ->getStandings($stage)
            ->map(
                fn ($item) => [
                    'position' =>
                        $item['position'],

                    'competition_event_participant_id' =>
                        $item[
                            'competition_event_participant_id'
                        ],

                    'participant' =>
                        $item['participant'],

                    'result_value' =>
                        $item['result']->result_value,

                    'result_unit' =>
                        $item['result']->result_unit,

                    'stage_id' =>
                        $stage->id,

                    'stage_name' =>
                        $stage->name,
                ]
            )
            ->values();
    }

    private function getAccumulatedRoundStandings(
        CompetitionEvent $event
    ): Collection {
        $totals = [];

        foreach ($event->stages as $stage) {
            if ($stage->stage_type !== 'round') {
                continue;
            }

            foreach ($stage->groups as $group) {
                foreach ($group->participants as $groupParticipant) {

                    $result = $groupParticipant->result;

                    if (
                        !$result
                        || $result->result_value === null
                        || $result->status === 'anulado'
                    ) {
                        continue;
                    }

                    $participantId =
                        $groupParticipant
                            ->competition_event_participant_id;

                    if (!isset($totals[$participantId])) {
                        $totals[$participantId] = [
                            'competition_event_participant_id' =>
                                $participantId,

                            'participant' =>
                                $groupParticipant->participant,

                            'total' => 0,

                            'rounds' => [],
                        ];
                    }

                    $value = (float) $result->result_value;

                    $totals[$participantId]['total'] += $value;

                    $totals[$participantId]['rounds'][] = [
                        'stage_id' => $stage->id,
                        'stage_name' => $stage->name,
                        'value' => $value,
                    ];
                }
            }
        }

        return collect($totals)
            ->sortByDesc('total')
            ->values()
            ->map(
                fn ($item, $index) => [
                    'position' => $index + 1,

                    'competition_event_participant_id' =>
                        $item[
                            'competition_event_participant_id'
                        ],

                    'participant' =>
                        $item['participant'],

                    'result_value' =>
                        $item['total'],

                    'result_unit' =>
                        'pts',

                    'rounds' =>
                        $item['rounds'],
                ]
            );
    }
}