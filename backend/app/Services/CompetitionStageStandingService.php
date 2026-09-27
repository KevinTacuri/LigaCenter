<?php

namespace App\Services;

use App\Models\CompetitionEventStage;
use Illuminate\Support\Collection;
use App\Models\CompetitionEventGroupParticipant;
use Illuminate\Support\Facades\DB;

class CompetitionStageStandingService
{
    public function getStandings(
        CompetitionEventStage $stage
    ): Collection {
        $stage->load([
            'event',
            'groups.participants.participant.championshipPlayer',
            'groups.participants.participant.championshipTeam',
            'groups.participants.result',
        ]);

        $results = $stage
            ->groups
            ->flatMap(
                fn ($group) => $group->participants
            )
            ->filter(
                fn ($groupParticipant) =>
                    $groupParticipant->result !== null
                    && $groupParticipant->result->result_value !== null
                    && $groupParticipant->result->status !== 'anulado'
            );

        if ($stage->event->event_type === 'carrera') {
            $results = $results->sortBy(
                fn ($groupParticipant) =>
                    $groupParticipant->result->result_value
            );
        } else {
            $results = $results->sortByDesc(
                fn ($groupParticipant) =>
                    $groupParticipant->result->result_value
            );
        }

        return $results
            ->values()
            ->map(
                function ($groupParticipant, $index) {
                    return [
                        'position' => $index + 1,

                        'group_participant_id' =>
                            $groupParticipant->id,

                        'competition_event_participant_id' =>
                            $groupParticipant
                                ->competition_event_participant_id,

                        'lane' =>
                            $groupParticipant->lane,

                        'start_order' =>
                            $groupParticipant->start_order,

                        'participant' =>
                            $groupParticipant->participant,

                        'result' =>
                            $groupParticipant->result,
                    ];
                }
            );
    }

    public function advanceQualifiers(
        CompetitionEventStage $stage
    ): array {
        if ($stage->status !== 'finalizado') {
            throw new \RuntimeException(
                'La etapa debe estar finalizada antes de avanzar participantes.'
            );
        }

        if (!$stage->qualification_method) {
            throw new \RuntimeException(
                'La etapa no tiene configurado un método de avance.'
            );
        }

        /*
        |--------------------------------------------------------------------------
        | SIGUIENTE ETAPA
        |--------------------------------------------------------------------------
        */
        $nextStage = CompetitionEventStage::where(
            'competition_event_id',
            $stage->competition_event_id
        )
            ->where(
                'stage_number',
                '>',
                $stage->stage_number
            )
            ->orderBy('stage_number')
            ->first();

        if (!$nextStage) {
            throw new \RuntimeException(
                'No existe una etapa siguiente.'
            );
        }

        $nextStage->load('groups');

        if ($nextStage->groups->isEmpty()) {
            throw new \RuntimeException(
                'La siguiente etapa no tiene grupos o series.'
            );
        }

        /*
        |--------------------------------------------------------------------------
        | OBTENER PARTICIPANTES QUE AVANZAN
        |--------------------------------------------------------------------------
        */
        if ($stage->qualification_method === 'best_overall') {

            if (!$stage->qualifiers_count) {
                throw new \RuntimeException(
                    'Debe indicar cuántos participantes clasifican.'
                );
            }

            $standings = $this->getStandings($stage);

            $qualifiers = $standings
                ->take($stage->qualifiers_count)
                ->values();
        }

        elseif ($stage->qualification_method === 'all') {

            $qualifiers = $stage
                ->groups()
                ->with('participants')
                ->get()
                ->flatMap(
                    fn ($group) => $group->participants
                )
                ->unique(
                    'competition_event_participant_id'
                )
                ->values()
                ->map(
                    fn ($groupParticipant) => [
                        'competition_event_participant_id' =>
                            $groupParticipant
                                ->competition_event_participant_id,
                    ]
                );
        }

        else {
            throw new \RuntimeException(
                'Método de avance no válido.'
            );
        }

        if ($qualifiers->isEmpty()) {
            throw new \RuntimeException(
                'No existen participantes para avanzar.'
            );
        }

        /*
        |--------------------------------------------------------------------------
        | ASIGNAR A SIGUIENTE ETAPA
        |--------------------------------------------------------------------------
        */
        DB::transaction(function () use (
            $nextStage,
            $qualifiers
        ) {
            $groups = $nextStage
                ->groups
                ->sortBy('group_number')
                ->values();

            foreach ($qualifiers as $index => $qualifier) {

                $group = $groups[
                    $index % $groups->count()
                ];

                CompetitionEventGroupParticipant::firstOrCreate(
                    [
                        'competition_event_group_id' =>
                            $group->id,

                        'competition_event_participant_id' =>
                            $qualifier[
                                'competition_event_participant_id'
                            ],
                    ],
                    [
                        'lane' => null,

                        'start_order' =>
                            $index + 1,

                        'status' =>
                            'programado',
                    ]
                );
            }
        });

        return [
            'next_stage' => $nextStage,
            'participants' => $qualifiers,
        ];
    }

}
