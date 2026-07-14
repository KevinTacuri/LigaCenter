<?php

namespace App\Events;

use Illuminate\Broadcasting\Channel;
use Illuminate\Broadcasting\InteractsWithSockets;
use Illuminate\Contracts\Broadcasting\ShouldBroadcastNow;
use Illuminate\Foundation\Events\Dispatchable;
use Illuminate\Queue\SerializesModels;

class MatchIncidenceDeleted implements ShouldBroadcastNow
{
    use Dispatchable, InteractsWithSockets, SerializesModels;

    public $matchId;
    public $incidenceId;

    /**
     * Create a new event instance.
     */
    public function __construct($matchId, $incidenceId)
    {
        $this->matchId = $matchId;
        $this->incidenceId = $incidenceId;
    }

    /**
     * Get the channels the event should broadcast on.
     *
     * @return array<int, Channel>
     */
    public function broadcastOn(): array
    {
        return [
            new Channel('matches.' . $this->matchId),
        ];
    }

    /**
     * Get the data to broadcast.
     */
    public function broadcastWith(): array
    {
        return [
            'match_id' => $this->matchId,
            'incidence_id' => $this->incidenceId,
        ];
    }
}
