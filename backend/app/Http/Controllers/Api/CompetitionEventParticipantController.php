<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\CompetitionEvent;
use App\Models\CompetitionEventParticipant;
use App\Models\ChampionshipPlayer;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Validation\ValidationException;
use App\Http\Resources\CompetitionEventParticipantResource;

class CompetitionEventParticipantController extends Controller
{
    /**
     * Listar participantes de un evento.
     */
    public function index(Request $request)
    {
        $query = CompetitionEventParticipant::with([
            'championshipPlayer',
            'championshipTeam',
            'result.attempts',
        ]);

        if ($request->filled('competition_event_id')) {
            $query->where(
                'competition_event_id',
                $request->competition_event_id
            );
        }

        if ($request->filled('championship_player_id')) {
            $query->where(
                'championship_player_id',
                $request->championship_player_id
            );
        }

        if ($request->filled('championship_team_id')) {
            $query->where(
                'championship_team_id',
                $request->championship_team_id
            );
        }

        $participants = $query
            ->orderBy('start_order')
            ->orderBy('lane')
            ->get();

        return response()->json([
            'success' => true,
            'data' => CompetitionEventParticipantResource::collection($participants),
        ]);
    }

    /**
     * Registrar un participante en un evento.
     */
    public function store(Request $request)
    {
        $validated = $request->validate([
            'competition_event_id' => [
                'required',
                'integer',
                'exists:competition_events,id',
            ],

            'championship_player_id' => [
                'required',
                'integer',
                'exists:championship_players,id',
            ],

            'championship_team_id' => [
                'nullable',
                'integer',
                'exists:championship_teams,id',
            ],

            'lane' => [
                'nullable',
                'integer',
                'min:1',
            ],

            'start_order' => [
                'nullable',
                'integer',
                'min:1',
            ],

            'status' => [
                'nullable',
                'string',
                'in:inscrito,confirmado,no_presento,retirado',
            ],
        ]);

        $event = CompetitionEvent::with(
            'championshipDiscipline'
        )->findOrFail($validated['competition_event_id']);

        /*
         * Verificar que el jugador pertenece al campeonato
         * del evento.
         */
        $championshipId = $event
            ->championshipDiscipline
            ->championship_id;

        $playerBelongsToChampionship = ChampionshipPlayer::query()
            ->where('id', $validated['championship_player_id'])
            ->whereHas('championshipTeam.championshipDiscipline', function ($query) use ($championshipId) {
                $query->where('championship_id', $championshipId);
            })
            ->exists();

        if (!$playerBelongsToChampionship) {
            throw ValidationException::withMessages([
                'championship_player_id' =>
                    'El jugador no pertenece al campeonato del evento.',
            ]);
        }

        /*
         * Si se especifica equipo, verificar que pertenece
         * al mismo campeonato.
         */
        if (!empty($validated['championship_team_id'])) {
            $teamBelongsToChampionship = $event
                ->championshipDiscipline
                ->championship
                ->teams()
                ->where(
                    'championship_teams.id',
                    $validated['championship_team_id']
                )
                ->exists();

            if (!$teamBelongsToChampionship) {
                throw ValidationException::withMessages([
                    'championship_team_id' =>
                        'El equipo no pertenece al campeonato del evento.',
                ]);
            }
        }

        /*
         * Evitar registrar dos veces al mismo jugador
         * en el mismo evento.
         */
        $alreadyRegistered = CompetitionEventParticipant::where(
            'competition_event_id',
            $validated['competition_event_id']
        )
            ->where(
                'championship_player_id',
                $validated['championship_player_id']
            )
            ->exists();

        if ($alreadyRegistered) {
            throw ValidationException::withMessages([
                'championship_player_id' =>
                    'El jugador ya está registrado en este evento.',
            ]);
        }

        $participant = DB::transaction(function () use ($validated) {
            return CompetitionEventParticipant::create($validated);
        });

        $participant->load([
            'championshipPlayer',
            'championshipTeam',
            'event',
        ]);

        return response()->json([
            'success' => true,
            'message' => 'Participante registrado correctamente.',
            'data' => $participant,
        ], 201);
    }

    /**
     * Mostrar un participante.
     */
    public function show(
        CompetitionEventParticipant $competitionEventParticipant
    ) {
        $competitionEventParticipant->load([
            'championshipPlayer',
            'championshipTeam',
            'event.championshipDiscipline.discipline',
            'event.category',
            'result.attempts',
        ]);

        return response()->json([
            'success' => true,
            'data' => $competitionEventParticipant,
        ]);
    }

    /**
     * Actualizar un participante.
     */
    public function update(
        Request $request,
        CompetitionEventParticipant $competitionEventParticipant
    ) {
        $validated = $request->validate([
            'championship_player_id' => [
                'sometimes',
                'integer',
                'exists:championship_players,id',
            ],

            'championship_team_id' => [
                'nullable',
                'integer',
                'exists:championship_teams,id',
            ],

            'lane' => [
                'nullable',
                'integer',
                'min:1',
            ],

            'start_order' => [
                'nullable',
                'integer',
                'min:1',
            ],

            'status' => [
                'sometimes',
                'string',
                'in:inscrito,confirmado,no_presento,retirado',
            ],
        ]);

        $competitionEventParticipant->update($validated);

        $competitionEventParticipant->load([
            'championshipPlayer',
            'championshipTeam',
            'event',
        ]);

        return response()->json([
            'success' => true,
            'message' => 'Participante actualizado correctamente.',
            'data' => $competitionEventParticipant,
        ]);
    }

    /**
     * Eliminar un participante.
     */
    public function destroy(
        CompetitionEventParticipant $competitionEventParticipant
    ) {
        $competitionEventParticipant->delete();

        return response()->json([
            'success' => true,
            'message' => 'Participante eliminado correctamente.',
        ]);
    }
}