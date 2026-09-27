<?php

namespace App\Events;

use Illuminate\Broadcasting\Channel;
use Illuminate\Contracts\Broadcasting\ShouldBroadcastNow;
use Illuminate\Foundation\Events\Dispatchable;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Str;
use Throwable;

class CompetitionLiveUpdated implements ShouldBroadcastNow
{
    use Dispatchable;

    public function __construct(
        public int $eventId,
        public int $championshipId,
        public ?int $stageId,
        public ?int $groupId,
        public string $type,
        public array $data,
    ) {}

    public static function publish(
        int $eventId,
        int $championshipId,
        ?int $stageId,
        ?int $groupId,
        string $type,
        array $data,
    ): void {
        $event = new self(
            $eventId,
            $championshipId,
            $stageId,
            $groupId,
            $type,
            $data,
        );

        $dispatch = static function () use ($event): void {
            try {
                event($event);
            } catch (Throwable $exception) {
                report($exception);
            }
        };

        if (DB::transactionLevel() > 0) {
            DB::afterCommit($dispatch);
        } else {
            $dispatch();
        }
    }

    public function broadcastOn(): array
    {
        return [
            new Channel(
                'competition-events.' . $this->eventId
            ),
        ];
    }

    public function broadcastAs(): string
    {
        return 'competition.live.updated';
    }

    public function broadcastWith(): array
    {
        return [
            'change_id' => (string) Str::uuid(),
            'event_id' => $this->eventId,
            'championship_id' => $this->championshipId,
            'stage_id' => $this->stageId,
            'group_id' => $this->groupId,
            'type' => $this->type,
            'data' => $this->data,
        ];
    }
}