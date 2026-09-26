<?php

namespace App\Services;

use App\Events\CompetitionDataUpdated;

use App\Models\CompetitionEvent;
use App\Models\CompetitionEventGroup;
use App\Models\CompetitionEventStage;
use RuntimeException;

class CompetitionEventLifecycleService
{
    public function startEvent(
        CompetitionEvent $event
    ): CompetitionEvent {
        if ($event->status === 'finalizado') {
            throw new RuntimeException(
                'El evento ya está finalizado.'
            );
        }

        if ($event->status === 'cancelado') {
            throw new RuntimeException(
                'El evento está cancelado.'
            );
        }

        if ($event->status === 'programado') {
            $event->update([
                'status' => 'en_curso',
            ]);
        }

        return $event->fresh();
    }

    public function startGroup(
        CompetitionEventGroup $group
    ): CompetitionEventGroup {
        if ($group->status === 'finalizado') {
            throw new RuntimeException(
                'La serie o grupo ya está finalizado.'
            );
        }

        if ($group->status === 'cancelado') {
            throw new RuntimeException(
                'La serie o grupo está cancelado.'
            );
        }

        $group->load(
            'stage.event'
        );

        /*
        |--------------------------------------------------------------------------
        | INICIAR EVENTO
        |--------------------------------------------------------------------------
        */
        $event = $group->stage->event;

        $this->startEvent($event);

        /*
        |--------------------------------------------------------------------------
        | INICIAR ETAPA
        |--------------------------------------------------------------------------
        */
        $stage = $group->stage;

        if ($stage->status === 'programado') {
            $stage->update([
                'status' => 'en_curso',
            ]);
        }

        /*
        |--------------------------------------------------------------------------
        | INICIAR GRUPO / SERIE
        |--------------------------------------------------------------------------
        */
        $group->update([
            'status' => 'en_curso',
        ]);

        return $group->fresh();
    }

    public function finishGroup(
        CompetitionEventGroup $group
    ): CompetitionEventGroup {
        if ($group->status === 'finalizado') {
            throw new RuntimeException(
                'La serie o grupo ya está finalizado.'
            );
        }

        if ($group->status === 'cancelado') {
            throw new RuntimeException(
                'No se puede finalizar una serie o grupo cancelado.'
            );
        }

        $group->load([
            'participants.result',
        ]);

        if ($group->participants->isEmpty()) {
            throw new RuntimeException(
                'La serie o grupo no tiene participantes.'
            );
        }

        foreach ($group->participants as $participant) {
            if (
                in_array(
                    $participant->status,
                    [
                        'no_presento',
                        'retirado',
                    ]
                )
            ) {
                continue;
            }

            if (
                !$participant->result
                || $participant->result->result_value === null
            ) {
                throw new RuntimeException(
                    'Todos los participantes activos deben tener un resultado.'
                );
            }
        }

        $group->update([
            'status' => 'finalizado',
        ]);

        return $group->fresh();
    }

    public function finishStage(
        CompetitionEventStage $stage
    ): CompetitionEventStage {
        if ($stage->status === 'finalizado') {
            throw new RuntimeException(
                'La etapa ya está finalizada.'
            );
        }

        if ($stage->status === 'cancelado') {
            throw new RuntimeException(
                'No se puede finalizar una etapa cancelada.'
            );
        }

        $stage->load('groups');

        if ($stage->groups->isEmpty()) {
            throw new RuntimeException(
                'La etapa no tiene grupos o series.'
            );
        }

        $pendingGroups = $stage
            ->groups
            ->filter(
                fn ($group) =>
                    !in_array(
                        $group->status,
                        [
                            'finalizado',
                            'cancelado',
                        ]
                    )
            );

        if ($pendingGroups->isNotEmpty()) {
            throw new RuntimeException(
                'Aún existen series o grupos pendientes.'
            );
        }

        $stage->update([
            'status' => 'finalizado',
        ]);

        return $stage->fresh();
    }

    public function finishEvent(
        CompetitionEvent $event
    ): CompetitionEvent {
        if ($event->status === 'finalizado') {
            throw new RuntimeException(
                'El evento ya está finalizado.'
            );
        }

        if ($event->status === 'cancelado') {
            throw new RuntimeException(
                'No se puede finalizar un evento cancelado.'
            );
        }

        $event->load('stages');

        if ($event->stages->isEmpty()) {
            throw new RuntimeException(
                'El evento no tiene etapas.'
            );
        }

        $pendingStages = $event
            ->stages
            ->filter(
                fn ($stage) =>
                    !in_array(
                        $stage->status,
                        [
                            'finalizado',
                            'cancelado',
                        ]
                    )
            );

        if ($pendingStages->isNotEmpty()) {
            throw new RuntimeException(
                'Aún existen etapas pendientes.'
            );
        }

        $event->update([
            'status' => 'finalizado',
        ]);

        CompetitionDataUpdated::publish($event, 'finish');

        return $event->fresh();
    }
}
