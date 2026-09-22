<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\CompetitionResult;
use App\Models\CompetitionResultAttempt;
use Illuminate\Http\Request;
use Illuminate\Validation\ValidationException;

class CompetitionResultAttemptController extends Controller
{
    /**
     * Listar intentos.
     */
    public function index(Request $request)
    {
        $query = CompetitionResultAttempt::with([
            'result.participant.championshipPlayer',
            'result.participant.event',
        ]);

        if ($request->filled('competition_result_id')) {
            $query->where(
                'competition_result_id',
                $request->competition_result_id
            );
        }

        $attempts = $query
            ->orderBy('competition_result_id')
            ->orderBy('attempt_number')
            ->get();

        return response()->json([
            'success' => true,
            'data' => $attempts,
        ]);
    }

    /**
     * Registrar intento.
     */
    public function store(Request $request)
    {
        $validated = $request->validate([
            'competition_result_id' => [
                'required',
                'integer',
                'exists:competition_results,id',
            ],

            'attempt_number' => [
                'required',
                'integer',
                'min:1',
            ],

            'value' => [
                'nullable',
                'numeric',
            ],
        ]);

        $result = CompetitionResult::findOrFail(
            $validated['competition_result_id']
        );

        if ($result->status === 'oficializado') {
            throw ValidationException::withMessages([
                'competition_result_id' =>
                    'No se pueden agregar intentos a un resultado oficializado.',
            ]);
        }

        $alreadyExists = CompetitionResultAttempt::where(
            'competition_result_id',
            $validated['competition_result_id']
        )
            ->where(
                'attempt_number',
                $validated['attempt_number']
            )
            ->exists();

        if ($alreadyExists) {
            throw ValidationException::withMessages([
                'attempt_number' =>
                    'El número de intento ya existe para este resultado.',
            ]);
        }

        $attempt = CompetitionResultAttempt::create($validated);

        $attempt->load([
            'result.participant.championshipPlayer',
            'result.participant.event',
        ]);

        return response()->json([
            'success' => true,
            'message' => 'Intento registrado correctamente.',
            'data' => $attempt,
        ], 201);
    }

    /**
     * Mostrar intento.
     */
    public function show(
        CompetitionResultAttempt $competitionResultAttempt
    ) {
        $competitionResultAttempt->load([
            'result.participant.championshipPlayer',
            'result.participant.championshipTeam',
            'result.participant.event',
        ]);

        return response()->json([
            'success' => true,
            'data' => $competitionResultAttempt,
        ]);
    }

    /**
     * Actualizar intento.
     */
    public function update(
        Request $request,
        CompetitionResultAttempt $competitionResultAttempt
    ) {
        if (
            $competitionResultAttempt->result->status === 'oficializado'
        ) {
            throw ValidationException::withMessages([
                'result' =>
                    'No se puede modificar un intento de un resultado oficializado.',
            ]);
        }

        $validated = $request->validate([
            'attempt_number' => [
                'sometimes',
                'integer',
                'min:1',
            ],

            'value' => [
                'sometimes',
                'nullable',
                'numeric',
            ],
        ]);

        if (
            isset($validated['attempt_number'])
            && CompetitionResultAttempt::where(
                'competition_result_id',
                $competitionResultAttempt->competition_result_id
            )
                ->where(
                    'attempt_number',
                    $validated['attempt_number']
                )
                ->where(
                    'id',
                    '!=',
                    $competitionResultAttempt->id
                )
                ->exists()
        ) {
            throw ValidationException::withMessages([
                'attempt_number' =>
                    'El número de intento ya existe para este resultado.',
            ]);
        }

        $competitionResultAttempt->update($validated);

        $competitionResultAttempt->load([
            'result.participant.championshipPlayer',
            'result.participant.event',
        ]);

        return response()->json([
            'success' => true,
            'message' => 'Intento actualizado correctamente.',
            'data' => $competitionResultAttempt,
        ]);
    }

    /**
     * Eliminar intento.
     */
    public function destroy(
        CompetitionResultAttempt $competitionResultAttempt
    ) {
        if (
            $competitionResultAttempt->result->status === 'oficializado'
        ) {
            throw ValidationException::withMessages([
                'result' =>
                    'No se puede eliminar un intento de un resultado oficializado.',
            ]);
        }

        $competitionResultAttempt->delete();

        return response()->json([
            'success' => true,
            'message' => 'Intento eliminado correctamente.',
        ]);
    }
}