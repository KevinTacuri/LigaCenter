<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\CompetitionEventParticipant;
use App\Models\CompetitionResult;
use App\Services\CompetitionResultService;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Validation\ValidationException;

class CompetitionResultController extends Controller
{
    public function __construct(
        private CompetitionResultService $competitionResultService
    ) {
    }

    public function index(Request $request)
    {
        $query = CompetitionResult::with([
            'participant.championshipPlayer',
            'participant.championshipTeam',
            'participant.event',
            'attempts',
        ]);

        if ($request->filled('competition_event_id')) {
            $query->whereHas('participant', function ($q) use ($request) {
                $q->where(
                    'competition_event_id',
                    $request->competition_event_id
                );
            });
        }

        if ($request->filled('competition_event_participant_id')) {
            $query->where(
                'competition_event_participant_id',
                $request->competition_event_participant_id
            );
        }

        if ($request->filled('position')) {
            $query->where(
                'position',
                $request->position
            );
        }

        $results = $query
            ->orderBy('position')
            ->get();

        return response()->json([
            'success' => true,
            'data' => $results,
        ]);
    }

    public function store(Request $request)
    {
        $validated = $request->validate([
            'competition_event_participant_id' => [
                'required',
                'integer',
                'exists:competition_event_participants,id',
            ],
            'result_value' => [
                'nullable',
                'numeric',
            ],
            'result_unit' => [
                'nullable',
                'string',
                'max:50',
            ],
            'status' => [
                'nullable',
                'string',
                'in:registrado,oficializado,anulado',
            ],
        ]);

        $participant = CompetitionEventParticipant::with([
            'event',
            'result',
        ])->findOrFail(
            $validated['competition_event_participant_id']
        );

        if ($participant->result) {
            throw ValidationException::withMessages([
                'competition_event_participant_id' =>
                    'Este participante ya tiene un resultado registrado.',
            ]);
        }

        if ($participant->event->status === 'cancelado') {
            throw ValidationException::withMessages([
                'competition_event_participant_id' =>
                    'No se puede registrar un resultado en un evento cancelado.',
            ]);
        }

        $result = DB::transaction(function () use (
            $validated,
            $participant
        ) {
            $result = CompetitionResult::create($validated);

            $this->competitionResultService
                ->recalculatePositions($participant->event);

            return $result;
        });

        $result->load([
            'participant.championshipPlayer',
            'participant.championshipTeam',
            'participant.event',
            'attempts',
        ]);

        return response()->json([
            'success' => true,
            'message' => 'Resultado registrado correctamente.',
            'data' => $result,
        ], 201);
    }

    public function show(CompetitionResult $competitionResult)
    {
        $competitionResult->load([
            'participant.championshipPlayer',
            'participant.championshipTeam',
            'participant.event.championshipDiscipline.discipline',
            'participant.event.category',
            'attempts',
        ]);

        return response()->json([
            'success' => true,
            'data' => $competitionResult,
        ]);
    }

    public function update(
        Request $request,
        CompetitionResult $competitionResult
    ) {
        if ($competitionResult->status === 'oficializado') {
            throw ValidationException::withMessages([
                'result' =>
                    'No se puede modificar un resultado oficializado.',
            ]);
        }

        $validated = $request->validate([
            'result_value' => [
                'sometimes',
                'nullable',
                'numeric',
            ],
            'result_unit' => [
                'sometimes',
                'nullable',
                'string',
                'max:50',
            ],
            'status' => [
                'sometimes',
                'string',
                'in:registrado,oficializado,anulado',
            ],
        ]);

        $event = $competitionResult
            ->participant
            ->event;

        DB::transaction(function () use (
            $competitionResult,
            $validated,
            $event
        ) {
            $competitionResult->update($validated);

            $this->competitionResultService
                ->recalculatePositions($event);
        });

        $competitionResult->load([
            'participant.championshipPlayer',
            'participant.championshipTeam',
            'participant.event',
            'attempts',
        ]);

        return response()->json([
            'success' => true,
            'message' => 'Resultado actualizado correctamente.',
            'data' => $competitionResult,
        ]);
    }

    public function destroy(CompetitionResult $competitionResult)
    {
        if ($competitionResult->status === 'oficializado') {
            throw ValidationException::withMessages([
                'result' =>
                    'No se puede eliminar un resultado oficializado.',
            ]);
        }

        $event = $competitionResult
            ->participant
            ->event;

        DB::transaction(function () use (
            $competitionResult,
            $event
        ) {
            $competitionResult->delete();

            $this->competitionResultService
                ->recalculatePositions($event);
        });

        return response()->json([
            'success' => true,
            'message' => 'Resultado eliminado correctamente.',
        ]);
    }
}