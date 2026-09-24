<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\CompetitionEvent;
use Illuminate\Http\Request;
use Illuminate\Validation\Rule;
use App\Events\CompetitionEventUpdated;
use App\Services\CompetitionEventLifecycleService;
use App\Services\CompetitionEventStandingService;
use RuntimeException;

class CompetitionEventController extends Controller
{
    /**
     * Listar eventos de competición.
     */
    public function index(Request $request)
    {
        $query = CompetitionEvent::with([
            'championshipDiscipline.discipline',
            'category',
            'venue',
        ]);

        if ($request->filled('championship_id')) {
            $championshipId = $request->integer(
                'championship_id'
            );

            $query->whereHas(
                'championshipDiscipline',
                function ($q) use ($championshipId) {
                    $q->where(
                        'championship_id',
                        $championshipId
                    );
                }
            );
        }

        if ($request->filled('category_id')) {
            $query->where(
                'category_id',
                $request->category_id
            );
        }

        // Filtrar por disciplina de campeonato a través de la relación championshipDiscipline
        if ($request->filled('discipline_id')) {
            $disciplineId = $request->integer('discipline_id');

            $query->whereHas('championshipDiscipline', function ($q) use ($disciplineId) {
                $q->where('discipline_id', $disciplineId);
            });
        }

        if ($request->filled('status')) {
            $query->where('status', $request->query('status'));
        }

        $events = $query
            ->orderBy('date')
            ->orderBy('start_time')
            ->get();

        return response()->json([
            'success' => true,
            'data' => $events,
        ]);
    }

    /**
     * Crear un evento.
     */
    public function store(Request $request)
    {
        $validated = $request->validate([
            'championship_discipline_id' => [
                'required',
                'integer',
                'exists:championship_disciplines,id',
            ],

            'event_type' => [
                'required',
                'string',
                Rule::in([
                    'carrera',
                    'salto',
                    'lanzamiento',
                    'puntaje',
                ]),
            ],

            'category_id' => [
                'required',
                'integer',
                'exists:categories,id',
            ],

            'name' => [
                'required',
                'string',
                'max:255',
            ],

            'date' => [
                'required',
                'date',
            ],

            'start_time' => [
                'nullable',
                'date_format:H:i',
            ],

            'venue_id' => [
                'nullable',
                'integer',
                'exists:venues,id',
            ],

            'status' => [
                'nullable',
                'string',
                Rule::in([
                    'programado',
                    'en_curso',
                    'finalizado',
                    'cancelado',
                ]),
            ],

            'participation_type' => [
                'required',
                'in:individual,team',
            ],
        ]);

        $event = CompetitionEvent::create($validated);

        $event->load([
            'championshipDiscipline.discipline',
            'category',
            'venue',
        ]);

        return response()->json([
            'success' => true,
            'message' => 'Evento creado correctamente.',
            'data' => $event,
        ], 201);
    }

    /**
     * Mostrar un evento.
     */
    public function show(CompetitionEvent $competitionEvent)
    {
        $competitionEvent->load([
            'championshipDiscipline.discipline',
            'category',
            'venue',
            'participants.championshipPlayer',
            'participants.championshipTeam',
            'participants.members.championshipPlayer',

            'stages.groups.venue',

            'stages.groups.participants.participant.championshipPlayer',
            'stages.groups.participants.participant.championshipTeam',
            'stages.groups.participants.participant.members.championshipPlayer',
            'stages.groups.participants.result.attempts.member.championshipPlayer',
        ]);

        return response()->json([
            'success' => true,
            'data' => $competitionEvent,
        ]);
    }

    /**
     * Actualizar un evento.
     */
    public function update(
        Request $request,
        CompetitionEvent $competitionEvent
    ) {
        $validated = $request->validate([
            'championship_discipline_id' => [
                'sometimes',
                'integer',
                'exists:championship_disciplines,id',
            ],

            'category_id' => [
                'sometimes',
                'integer',
                'exists:categories,id',
            ],

            'event_type' => [
                'sometimes',
                'string',
                Rule::in([
                    'carrera',
                    'salto',
                    'lanzamiento',
                    'puntaje',
                ]),
            ],

            'name' => [
                'sometimes',
                'string',
                'max:255',
            ],

            'date' => [
                'sometimes',
                'date',
            ],

            'start_time' => [
                'nullable',
                'date_format:H:i',
            ],

            'venue_id' => [
                'nullable',
                'integer',
                'exists:venues,id',
            ],

            'status' => [
                'sometimes',
                'string',
                Rule::in([
                    'programado',
                    'en_curso',
                    'finalizado',
                    'cancelado',
                ]),
            ],

            'participation_type' => [
                'sometimes',
                'in:individual,team',
            ],
        ]);

        if (
            isset($validated['participation_type'])
            && $validated['participation_type']
                !== $competitionEvent->participation_type
            && $competitionEvent->participants()->exists()
        ) {
            return response()->json([
                'success' => false,
                'message' =>
                    'No se puede cambiar el tipo de participación porque el evento ya tiene participantes.',
            ], 422);
        }

        $competitionEvent->update($validated);

        event(
            new CompetitionEventUpdated(
                $competitionEvent->fresh()
            )
        );

        $competitionEvent->load([
            'championshipDiscipline.discipline',
            'category',
            'venue',
        ]);

        return response()->json([
            'success' => true,
            'message' => 'Evento actualizado correctamente.',
            'data' => $competitionEvent,
        ]);
    }

    /**
     * Eliminar un evento.
     */
    public function destroy(CompetitionEvent $competitionEvent)
    {
        $competitionEvent->delete();

        return response()->json([
            'success' => true,
            'message' => 'Evento eliminado correctamente.',
        ]);
    }


    public function standings(CompetitionEvent $competitionEvent, CompetitionEventStandingService $standingService)
    {
        $standings = $standingService
            ->getStandings($competitionEvent);

        return response()->json([
            'success' => true,
            'data' => [
                'event' => [
                    'id' => $competitionEvent->id,
                    'name' => $competitionEvent->name,
                    'event_type' =>
                        $competitionEvent->event_type,
                    'participation_type' =>
                        $competitionEvent->participation_type,
                    'status' =>
                        $competitionEvent->status,
                ],

                'standings' => $standings,
            ],
        ]);
    }

    public function finish(
        CompetitionEvent $competitionEvent,
        CompetitionEventLifecycleService $service
    ) {
        try {
            $event = $service->finishEvent($competitionEvent);

            return response()->json([
                'success' => true,
                'message' =>
                    'Evento finalizado correctamente.',
                'data' => $event,
            ]);
        } catch (RuntimeException $e) {
            return response()->json([
                'success' => false,
                'message' => $e->getMessage(),
            ], 422);
        }
    }
}