<?php

namespace App\Http\Controllers\Public;

use App\Http\Controllers\Controller;
use App\Models\CompetitionEvent;
use Illuminate\Http\Request;

class PublicCompetitionEventController extends Controller
{
    public function index(Request $request)
    {
        $query = CompetitionEvent::query()
            ->whereHas('championshipDiscipline.championship', fn ($q) =>
                $q->where('is_public', true)
            )
            ->with([
                'championshipDiscipline.championship',
                'championshipDiscipline.discipline',
                'category',
                'venue',
                'stages.groups',
            ]);

        if ($request->filled('championship_id')) {
            $query->whereHas('championshipDiscipline', fn ($q) =>
                $q->where('championship_id', $request->championship_id)
            );
        }

        if ($request->filled('discipline_id')) {
            $query->whereHas('championshipDiscipline', fn ($q) =>
                $q->where('discipline_id', $request->discipline_id)
            );
        }

        if ($request->filled('category_id')) {
            $query->where('category_id', $request->category_id);
        }

        if ($request->filled('status')) {
            $query->where('status', $request->status);
        }

        $events = $query
            ->orderBy('date')
            ->orderBy('start_time')
            ->get()
            ->map(fn ($event) => $this->serializeEvent($event));

        return response()->json([
            'success' => true,
            'data' => $events,
        ]);
    }

    public function highlighted()
    {
        $events = CompetitionEvent::query()
            ->whereHas('championshipDiscipline.championship', fn ($q) =>
                $q->where('is_public', true)
            )
            ->with([
                'championshipDiscipline.championship',
                'championshipDiscipline.discipline',
                'category',
                'venue',
                'stages.groups',
            ])
            ->whereIn('status', ['en_curso', 'programado'])
            ->orderByRaw("FIELD(status, 'en_curso', 'programado')")
            ->orderBy('date')
            ->orderBy('start_time')
            ->limit(10)
            ->get()
            ->map(fn ($event) => $this->serializeEvent($event));

        return response()->json([
            'success' => true,
            'data' => $events,
        ]);
    }

    private function serializeEvent(CompetitionEvent $event): array
    {
        $activeStage = $event->stages
            ->firstWhere('status', 'en_curso')
            ?? $event->stages->firstWhere('status', 'programado')
            ?? $event->stages->last();

        $activeGroup = $activeStage?->groups
            ?->firstWhere('status', 'en_curso')
            ?? $activeStage?->groups?->firstWhere('status', 'programado')
            ?? $activeStage?->groups?->last();

        return [
            'id' => $event->id,
            'name' => $event->name,
            'event_type' => $event->event_type,
            'status' => $event->status,
            'date' => $event->date?->format('Y-m-d'),
            'start_time' => $event->start_time?->format('H:i'),

            'championship_id' => $event->championshipDiscipline->championship_id,
            'championship_name' => $event->championshipDiscipline->championship?->name,

            'discipline_id' => $event->championshipDiscipline->discipline_id,
            'discipline_name' => $event->championshipDiscipline->discipline?->name,

            'category_id' => $event->category_id,
            'category_name' => $event->category?->name,

            'venue' => $event->venue ? [
                'id' => $event->venue->id,
                'name' => $event->venue->name,
            ] : null,

            'current_stage' => $activeStage ? [
                'id' => $activeStage->id,
                'name' => $activeStage->name,
                'stage_type' => $activeStage->stage_type,
                'status' => $activeStage->status,
            ] : null,

            'current_group' => $activeGroup ? [
                'id' => $activeGroup->id,
                'name' => $activeGroup->name,
                'status' => $activeGroup->status,
            ] : null,
        ];
    }

    public function show($id)
    {
        $event = CompetitionEvent::query()
            ->whereHas('championshipDiscipline.championship', fn ($q) =>
                $q->where('is_public', true)
            )
            ->with([
                'championshipDiscipline.championship',
                'championshipDiscipline.discipline',
                'category',
                'venue',
                'stages.groups',
                'participants',
            ])
            ->find($id);

        if (!$event) {
            return response()->json([
                'success' => false,
                'message' => 'Evento no encontrado',
            ], 404);
        }

        return response()->json([
            'success' => true,
            'data' => $this->serializeEventDetail($event),
        ]);
    }

    private function serializeEventDetail(CompetitionEvent $event): array
    {
        $base = $this->serializeEvent($event);

        return [
            ...$base,
            'participation_type' => $event->participation_type,
            'competition_format' => $event->competition_format,
            'result_aggregation' => $event->result_aggregation,

            'participants_count' => $event->participants->count(),

            'stages' => $event->stages->map(fn ($stage) => [
                'id' => $stage->id,
                'name' => $stage->name,
                'stage_type' => $stage->stage_type,
                'stage_number' => $stage->stage_number,
                'status' => $stage->status,
                'qualification_method' => $stage->qualification_method,
                'qualifiers_count' => $stage->qualifiers_count,
                'qualifiers_per_group' => $stage->qualifiers_per_group,
                'podium_places' => $stage->podium_places,

                'groups' => $stage->groups->map(fn ($group) => [
                    'id' => $group->id,
                    'name' => $group->name,
                    'group_number' => $group->group_number,
                    'status' => $group->status,
                    'date' => $group->date,
                    'start_time' => $group->start_time,
                ])->values(),
            ])->values(),
        ];
    }
}