<?php

namespace App\Events;

use App\Models\CompetitionEvent;
use Illuminate\Broadcasting\Channel;
use Illuminate\Contracts\Broadcasting\ShouldBroadcast;
use Illuminate\Foundation\Events\Dispatchable;
use Illuminate\Queue\SerializesModels;

class CompetitionEventStandingsUpdated implements ShouldBroadcast
{
    use Dispatchable, SerializesModels;

    public function __construct(
        public CompetitionEvent $event,
        public string $action = 'updated'
    ) {
    }

    public function broadcastOn(): array
    {
        return [
            new Channel(
                'competition-events.' . $this->event->id
            ),
        ];
    }

    public function broadcastAs(): string
    {
        return 'competition.standings.updated';
    }

    public function broadcastWith(): array
    {
        $results = $this->event
            ->participants()
            ->with([
                'championshipPlayer',
                'championshipTeam',
                'result.attempts',
            ])
            ->whereHas('result', function ($query) {
                $query
                    ->whereNotNull('result_value')
                    ->where('status', '!=', 'anulado');
            })
            ->get()
            ->map(function ($participant) {
                return $participant->result;
            })
            ->sortBy('position')
            ->values();

        return [
            'action' => $this->action,
            'event_id' => $this->event->id,
            'event_type' => $this->event->event_type,
            'results' => $results,
        ];
    }
}