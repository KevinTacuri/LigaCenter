<?php

namespace App\Events;

use App\Models\CompetitionEvent;
use App\Models\CompetitionEventGroup;
use App\Models\CompetitionEventGroupParticipant;
use App\Models\CompetitionEventParticipant;
use App\Models\CompetitionEventParticipantMember;
use App\Models\CompetitionEventStage;
use App\Models\CompetitionResult;
use App\Models\CompetitionResultAttempt;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Str;
use Throwable;
use Illuminate\Broadcasting\Channel;
use Illuminate\Contracts\Broadcasting\ShouldBroadcastNow;
use Illuminate\Contracts\Events\ShouldDispatchAfterCommit;
use Illuminate\Foundation\Events\Dispatchable;

/** An invalidation notice; authorized HTTP endpoints remain the source of data. */
class CompetitionDataUpdated implements ShouldBroadcastNow
{
    use Dispatchable;

    public function __construct(public array $change) {}

    /** Called explicitly by the operation that changed the competition. */
    public static function publish(Model $subject, string $action): void
    {
        $event = new self([
            'change_id' => (string) Str::uuid(),
            ...self::scopeFor($subject),
            'resource' => Str::kebab(class_basename($subject)),
            'action' => $action,
            'affects' => ['event', 'stages', 'groups', 'participants', 'results', 'attempts', 'standings', 'tiebreaks', 'qualification'],
        ]);
        $dispatch = static function () use ($event): void {
            try {
                event($event);
            } catch (Throwable $exception) {
                // A broker outage must not turn a committed write into an HTTP failure.
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
            new Channel('competition-events.'.$this->change['event_id']),
            new Channel('championship.'.$this->change['championship_id']),
        ];
    }

    public function broadcastAs(): string
    {
        return 'competition.data.updated';
    }

    public function broadcastWith(): array
    {
        return $this->change;
    }

    private static function scopeFor(Model $model): array
    {
        $group = null;
        $stage = null;
        if ($model instanceof CompetitionResultAttempt) {
            $model = $model->result;
        }
        if ($model instanceof CompetitionResult) {
            $model = $model->groupParticipant;
        }
        if ($model instanceof CompetitionEventGroupParticipant) {
            $model = $model->group;
        }
        if ($model instanceof CompetitionEventGroup) {
            $group = $model;
            $model = $model->stage;
        }
        if ($model instanceof CompetitionEventStage) {
            $stage = $model;
            $model = $model->event;
        }
        if ($model instanceof CompetitionEventParticipantMember) {
            $model = $model->participant;
        }
        if ($model instanceof CompetitionEventParticipant) {
            $model = $model->event;
        }
        if (!$model instanceof CompetitionEvent) {
            throw new \InvalidArgumentException('Unsupported competition model.');
        }

        return [
            'event_id' => (int) $model->id,
            'championship_id' => (int) $model->championshipDiscipline->championship_id,
            'stage_id' => $stage?->id,
            'group_id' => $group?->id,
        ];
    }
}
