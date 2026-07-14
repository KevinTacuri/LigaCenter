<?php

namespace App\Events;

use App\Models\GameMatch;
use Illuminate\Broadcasting\Channel;
use Illuminate\Broadcasting\InteractsWithSockets;
use Illuminate\Contracts\Broadcasting\ShouldBroadcastNow;
use Illuminate\Foundation\Events\Dispatchable;
use Illuminate\Queue\SerializesModels;

class MatchUpdated implements ShouldBroadcastNow
{
    use Dispatchable, InteractsWithSockets, SerializesModels;

    public $match;

    /**
     * Create a new event instance.
     */
    public function __construct(GameMatch $match)
    {
        $this->match = $match;
    }

    /**
     * Get the channels the event should broadcast on.
     *
     * @return array<int, Channel>
     */
    public function broadcastOn(): array
    {
        return [
            new Channel('matches.' . $this->match->id),
            new Channel('championship.' . $this->match->championship_id),
        ];
    }

    /**
     * Get the data to broadcast.
     */
    public function broadcastWith(): array
    {
        return [
            'match_id' => $this->match->id,
            'championship_id' => $this->match->championship_id,
            'local_team_goals' => $this->match->local_team_goals,
            'visitor_team_goals' => $this->match->visitor_team_goals,
            'status' => $this->match->status,
            'timer_status' => $this->match->timer_status ?? 'stopped',
            'current_period' => $this->match->current_period ?? 1,
        ];
    }

    /**
     * Get the broadcast name.
     */
    public function broadcastAs(): string
    {
        return 'MatchUpdated';
    }
}
