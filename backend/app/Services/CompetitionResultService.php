<?php

namespace App\Services;

use App\Events\CompetitionEventStandingsUpdated;
use App\Models\CompetitionEvent;
use App\Models\CompetitionResult;
use Illuminate\Support\Collection;

class CompetitionResultService
{
    public function recalculatePositions(
        CompetitionEvent $event
    ): Collection {
        $results = CompetitionResult::with([
            'participant',
        ])
            ->whereHas('participant', function ($query) use ($event) {
                $query->where(
                    'competition_event_id',
                    $event->id
                );
            })
            ->whereNotNull('result_value')
            ->where('status', '!=', 'anulado')
            ->get();

        $results = $this->sortResults(
            $results,
            $event->event_type
        );

        $position = 1;

        foreach ($results as $result) {
            $result->update([
                'position' => $position,
            ]);

            $position++;
        }

        event(
            new CompetitionEventStandingsUpdated(
                $event->fresh(),
                'updated'
            )
        );

        return $results;
    }

    private function sortResults(
        Collection $results,
        string $eventType
    ): Collection {
        return match ($eventType) {
            'carrera' => $results
                ->sortBy('result_value')
                ->values(),

            'salto',
            'lanzamiento',
            'puntaje' => $results
                ->sortByDesc('result_value')
                ->values(),

            default => $results
                ->sortBy('result_value')
                ->values(),
        };
    }
}