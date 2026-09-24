<?php

namespace App\Services;

use App\Models\CompetitionEvent;
use App\Models\CompetitionEventStage;

class CompetitionStageGeneratorService
{
    public function generate(
        CompetitionEvent $event
    ): void {
        switch ($event->competition_format) {

            case 'single_final':
                $this->createStage(
                    $event,
                    'Final',
                    'final',
                    1
                );
                break;

            case 'qualifying_final':
                $this->createStage(
                    $event,
                    'Clasificatoria',
                    'qualifying',
                    1
                );

                $this->createStage(
                    $event,
                    'Final',
                    'final',
                    2
                );
                break;

            case 'qualifying_semifinal_final':
                $this->createStage(
                    $event,
                    'Clasificatoria',
                    'qualifying',
                    1
                );

                $this->createStage(
                    $event,
                    'Semifinal',
                    'semifinal',
                    2
                );

                $this->createStage(
                    $event,
                    'Final',
                    'final',
                    3
                );
                break;

            case 'custom':
                // Las etapas se crean manualmente.
                break;
        }
    }

    private function createStage(
        CompetitionEvent $event,
        string $name,
        string $stageType,
        int $stageNumber
    ): CompetitionEventStage {
        return CompetitionEventStage::create([
            'competition_event_id' =>
                $event->id,

            'name' =>
                $name,

            'stage_type' =>
                $stageType,

            'stage_number' =>
                $stageNumber,

            'rounds_count' =>
                1,

            'result_aggregation' =>
                'sum',

            'qualification_method' =>
                $stageType === 'final'
                    ? 'none'
                    : null,

            'qualifiers_count' =>
                null,

            'qualifiers_per_group' =>
                null,

            'podium_places' =>
                $stageType === 'final'
                    ? 3
                    : null,

            'status' =>
                'programado',
        ]);
    }
}