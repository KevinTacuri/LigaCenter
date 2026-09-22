<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\CompetitionEvent;
use Illuminate\Http\Request;
use Illuminate\Validation\Rule;

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

        if ($request->filled('championship_discipline_id')) {
            $query->where(
                'championship_discipline_id',
                $request->championship_discipline_id
            );
        }

        if ($request->filled('category_id')) {
            $query->where(
                'category_id',
                $request->category_id
            );
        }

        if ($request->filled('date')) {
            $query->whereDate('date', $request->date);
        }

        if ($request->filled('status')) {
            $query->where('status', $request->status);
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
            'participants.result.attempts',
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
        ]);

        $competitionEvent->update($validated);

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


    public function standings(CompetitionEvent $competitionEvent)
    {
        $competitionEvent->load([
            'championshipDiscipline.discipline',
            'category',
            'venue',
        ]);

        $results = $competitionEvent
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
            ->sortBy(function ($result) use ($competitionEvent) {
                return $result->position ?? PHP_INT_MAX;
            })
            ->values();

        return response()->json([
            'success' => true,
            'data' => [
                'event' => $competitionEvent,
                'results' => $results,
            ],
        ]);
    }
}