<?php

namespace App\Services;

use App\Models\CompetitionResult;
use Illuminate\Support\Collection;

class CompetitionResultService
{
    public function recalculatePositions(
        int $groupId
    ): void {
        $results = CompetitionResult::query()
            ->with([
                'groupParticipant.group.stage.event',
            ])
            ->whereHas(
                'groupParticipant',
                function ($query) use ($groupId) {
                    $query->where(
                        'competition_event_group_id',
                        $groupId
                    );
                }
            )
            ->get();

        if ($results->isEmpty()) {
            return;
        }

        $eventType = $results
            ->first()
            ->groupParticipant
            ->group
            ->stage
            ->event
            ->event_type;

        /*
        |--------------------------------------------------------------------------
        | QUITAR POSICIÓN A RESULTADOS NO VÁLIDOS
        |--------------------------------------------------------------------------
        */
        foreach ($results as $result) {
            if (
                $result->result_value === null
                || $result->status === 'anulado'
            ) {
                $result->updateQuietly([
                    'position' => null,
                ]);
            }
        }

        $validResults = $results
            ->filter(
                fn ($result) =>
                    $result->result_value !== null
                    && $result->status !== 'anulado'
            );

        /*
        |--------------------------------------------------------------------------
        | ORDEN
        |--------------------------------------------------------------------------
        */
        if ($eventType === 'carrera') {
            // menor tiempo gana
            $validResults = $validResults
                ->sortBy('result_value');
        } else {
            // mayor distancia / puntaje gana
            $validResults = $validResults
                ->sortByDesc('result_value');
        }

        /*
        |--------------------------------------------------------------------------
        | POSICIONES
        |--------------------------------------------------------------------------
        */
        $position = 1;

        foreach ($validResults as $result) {
            $result->updateQuietly([
                'position' => $position,
            ]);

            $position++;
        }
    }

    public function syncResult(
        CompetitionResult $result
    ): void {
        $result->loadMissing([
            'groupParticipant.group.stage.event',
            'attempts',
        ]);

        $this->recalculateResultValue($result);

        $this->recalculatePositions(
            $result
                ->groupParticipant
                ->competition_event_group_id
        );
    }
    
    public function recalculateResultValue(
        CompetitionResult $result
    ): void {
        $result->loadMissing([
            'groupParticipant.group.stage.event',
            'attempts',
        ]);

        $stage = $result
            ->groupParticipant
            ->group
            ->stage;

        $eventType = $stage
            ->event
            ->event_type;

        $values = $result
            ->attempts
            ->whereNotNull('value')
            ->pluck('value')
            ->map(
                fn ($value) => (float) $value
            );

        if ($values->isEmpty()) {
            $result->updateQuietly([
                'result_value' => null,
            ]);

            return;
        }

        $resultValue = match (
            $stage->result_aggregation
        ) {
            'sum' =>
                $values->sum(),

            'average' =>
                $values->avg(),

            'best' =>
                $eventType === 'carrera'
                    ? $values->min()
                    : $values->max(),

            default =>
                null,
        };

        $result->updateQuietly([
            'result_value' => $resultValue,
        ]);

    }
}