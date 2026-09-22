<?php

namespace App\Events;

use App\Models\CompetitionEvent;
use Illuminate\Broadcasting\Channel;
use Illuminate\Contracts\Broadcasting\ShouldBroadcast;
use Illuminate\Foundation\Events\Dispatchable;
use Illuminate\Queue\SerializesModels;

class CompetitionEventUpdated implements ShouldBroadcast
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
        return 'competition.event.updated';
    }

    public function broadcastWith(): array
    {
        return [
            'action' => $this->action,
            'event' => $this->event->load([
                'championshipDiscipline.discipline',
                'category',
                'venue',
            ]),
        ];
    }
}