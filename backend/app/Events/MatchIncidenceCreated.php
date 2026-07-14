<?php

namespace App\Events;

use App\Models\MatchIncidence;
use Illuminate\Broadcasting\Channel;
use Illuminate\Broadcasting\InteractsWithSockets;
use Illuminate\Contracts\Broadcasting\ShouldBroadcastNow;
use Illuminate\Foundation\Events\Dispatchable;
use Illuminate\Queue\SerializesModels;

class MatchIncidenceCreated implements ShouldBroadcastNow
{
    use Dispatchable, InteractsWithSockets, SerializesModels;

    public $incidence;

    /**
     * Create a new event instance.
     */
    public function __construct(MatchIncidence $incidence)
    {
        $this->incidence = $incidence;
    }

    /**
     * Get the channels the event should broadcast on.
     *
     * @return array<int, Channel>
     */
    public function broadcastOn(): array
    {
        return [
            new Channel('matches.' . $this->incidence->match_id),
        ];
    }

    /**
     * Get the data to broadcast.
     */
    public function broadcastWith(): array
    {
        return [
            'id' => $this->incidence->id,
            'match_id' => $this->incidence->match_id,
            'player_id' => $this->incidence->player_id,
            'team_id' => $this->incidence->team_id,
            'type' => $this->incidence->type,
            'minute' => $this->incidence->minute,
            'second' => $this->incidence->second,
            'description' => $this->incidence->description,
            'player' => $this->incidence->player ? [
                'id' => $this->incidence->player->id,
                'name' => $this->incidence->player->name,
                'photo' => $this->incidence->player->photo,
            ] : null,
            'team' => $this->incidence->team ? [
                'id' => $this->incidence->team->id,
                'name' => $this->incidence->team->name,
                'logo' => $this->incidence->team->logo,
            ] : null,
        ];
    }

    /**
     * Get the broadcast name.
     */
    public function broadcastAs(): string
    {
        return 'MatchIncidenceCreated';
    }
}
