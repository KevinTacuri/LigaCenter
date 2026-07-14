<?php

namespace App\Events;

use Illuminate\Broadcasting\Channel;
use Illuminate\Broadcasting\InteractsWithSockets;
use Illuminate\Contracts\Broadcasting\ShouldBroadcastNow;
use Illuminate\Foundation\Events\Dispatchable;
use Illuminate\Queue\SerializesModels;

class MatchTimerSynced implements ShouldBroadcastNow
{
    use Dispatchable, InteractsWithSockets, SerializesModels;

    public $matchId;
    public $currentElapsedTime;
    public $currentPeriod;
    public $timerStatus;
    public $timerStartedAt;

    /**
     * Create a new event instance.
     */
    public function __construct($matchId, $currentElapsedTime, $currentPeriod, $timerStatus, $timerStartedAt = null)
    {
        $this->matchId = $matchId;
        $this->currentElapsedTime = $currentElapsedTime;
        $this->currentPeriod = $currentPeriod;
        $this->timerStatus = $timerStatus;
        $this->timerStartedAt = $timerStartedAt;
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
            'current_elapsed_time' => $this->currentElapsedTime,
            'current_period' => $this->currentPeriod,
            'timer_status' => $this->timerStatus,
            'timer_started_at' => $this->timerStartedAt ? $this->timerStartedAt : null,
        ];
    }
}
