<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\CompetitionEvent;
use App\Models\CompetitionEventParticipant;
use App\Models\ChampionshipPlayer;
use App\Models\ChampionshipTeam;
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
        $request->validate([
            'competition_event_id' => [
                'required',
                'exists:competition_events,id'  ,
            ]
        ]);

        $participants = CompetitionEventParticipant::with([
            'championshipPlayer.player',
            'championshipTeam.team',
            'members.championshipPlayer.player',
        ])
            ->where(
                'competition_event_id',
                $request->competition_event_id
            )
            ->orderBy('id')
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
                'nullable',
                'integer',
                'exists:championship_players,id',
            ],

            'championship_team_id' => [
                'nullable',
                'integer',
                'exists:championship_teams,id',
            ],

            'status' => [
                'nullable',
                'string',
                'in:inscrito,confirmado,no_presento,retirado',
            ],
        ]);

        $event = CompetitionEvent::with(
            'category',
            'championshipDiscipline'
        )->findOrFail($validated['competition_event_id']);

        $participant = match ($event->participation_type) {
            'individual' => $this->registerIndividual(
                $event,
                $validated
            ),

            'team' => $this->registerTeam(
                $event,
                $validated
            ),

            default => abort(422, 'Tipo de participación no válido.'),
        };

        $participant->load([
            'championshipPlayer.player',
            'championshipTeam.team',
            'members.championshipPlayer.player',
        ]);

        return response()->json([
            'success' => true,
            'message' => 'Participante registrado correctamente.',
            'data' => new CompetitionEventParticipantResource($participant),
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
            'status' => [
                'string',
                'in:inscrito,confirmado,no_presento,retirado',
            ],
        ]);

        $competitionEventParticipant->update($validated);

        return response()->json([
            'success' => true,
            'message' => 'Participante actualizado correctamente.',
            'data' => new CompetitionEventParticipantResource(
                $competitionEventParticipant->load([
                    'championshipPlayer.player',
                    'championshipTeam.team',
                    'members.championshipPlayer.player',
                ])
            ),
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

    // Additional methods for managing group participations can be added here.
    private function registerIndividual(
        CompetitionEvent $event,
        array $validated
    ): CompetitionEventParticipant {

        if (empty($validated['championship_player_id'])) {
            abort(422, 'Debe seleccionar un jugador.');
        }

        $player = ChampionshipPlayer::with('championshipTeam')
            ->findOrFail($validated['championship_player_id']);

        if (
            $player->championshipTeam?->category_id
            !== $event->category_id
        ) {
            abort(
                422,
                'El jugador no pertenece a la categoría del evento.'
            );
        }

        $exists = CompetitionEventParticipant::where([
            'competition_event_id' => $event->id,
            'championship_player_id' => $player->id,
        ])->exists();

        if ($exists) {
            abort(
                422,
                'El jugador ya está inscrito en este evento.'
            );
        }

        return CompetitionEventParticipant::create([
            'competition_event_id' => $event->id,
            'championship_player_id' => $player->id,
            'championship_team_id' => null,
            'status' => $validated['status'] ?? 'inscrito',
        ]);
    }

    private function registerTeam(
        CompetitionEvent $event,
        array $validated
    ): CompetitionEventParticipant {

        if (empty($validated['championship_team_id'])) {
            abort(422, 'Debe seleccionar un equipo.');
        }

        $team = ChampionshipTeam::findOrFail(
            $validated['championship_team_id']
        );

        if ($team->category_id !== $event->category_id) {
            abort(
                422,
                'El equipo no pertenece a la categoría del evento.'
            );
        }

        $exists = CompetitionEventParticipant::where([
            'competition_event_id' => $event->id,
            'championship_team_id' => $team->id,
        ])->exists();

        if ($exists) {
            abort(
                422,
                'El equipo ya está inscrito en este evento.'
            );
        }

        return CompetitionEventParticipant::create([
            'competition_event_id' => $event->id,
            'championship_player_id' => null,
            'championship_team_id' => $team->id,
            'status' => $validated['status'] ?? 'inscrito',
        ]);
    }

    public function updateStatus(
        Request $request,
        CompetitionEventParticipant $competitionEventParticipant
    ) {
        $validated = $request->validate([
            'status' => [
                'required',
                'string',
                'in:inscrito,confirmado,no_presento,retirado',
            ],
        ]);

        $competitionEventParticipant->update([
            'status' => $validated['status'],
        ]);

        return response()->json([
            'success' => true,
            'message' =>
                'Estado del participante actualizado correctamente.',
            'data' =>
                $competitionEventParticipant->fresh(),
        ]);
    }
}