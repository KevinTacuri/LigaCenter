<?php

namespace App\Http\Controllers\Api;

use App\Events\CompetitionDataUpdated;

use App\Http\Controllers\Controller;
use App\Http\Resources\CompetitionEventParticipantMemberResource;
use App\Models\ChampionshipPlayer;
use App\Models\CompetitionEventParticipant;
use App\Models\CompetitionEventParticipantMember;
use Illuminate\Http\Request;

class CompetitionEventParticipantMemberController extends Controller
{
    public function index(
        CompetitionEventParticipant $participant
    ) {
        $members = $participant
            ->members()
            ->with([
                'championshipPlayer.championshipTeam.team.discipline',
                'championshipPlayer.championshipTeam.category',
                'championshipPlayer.championshipTeam.championshipUser.user',
            ])
            ->get();

        return response()->json([
            'success' => true,
            'data' =>
                CompetitionEventParticipantMemberResource::collection(
                    $members
                ),
        ]);
    }

    public function store(
        Request $request,
        CompetitionEventParticipant $participant
    ) {
        $validated = $request->validate([
            'championship_player_id' => [
                'required',
                'exists:championship_players,id',
            ],
        ]);

        /*
        |--------------------------------------------------------------------------
        | SOLO PARTICIPANTES POR EQUIPO
        |--------------------------------------------------------------------------
        */
        if (!$participant->championship_team_id) {
            return response()->json([
                'success' => false,
                'message' =>
                    'Este participante no representa a un equipo.',
            ], 422);
        }

        $player = ChampionshipPlayer::findOrFail(
            $validated['championship_player_id']
        );

        /*
        |--------------------------------------------------------------------------
        | EL JUGADOR DEBE PERTENECER AL EQUIPO
        |--------------------------------------------------------------------------
        */
        if (
            $player->championship_team_id
            !== $participant->championship_team_id
        ) {
            return response()->json([
                'success' => false,
                'message' =>
                    'El jugador no pertenece al equipo participante.',
            ], 422);
        }

        /*
        |--------------------------------------------------------------------------
        | EVITAR DUPLICADOS
        |--------------------------------------------------------------------------
        */
        $exists = CompetitionEventParticipantMember::where(
            'competition_event_participant_id',
            $participant->id
        )
            ->where(
                'championship_player_id',
                $player->id
            )
            ->exists();

        if ($exists) {
            return response()->json([
                'success' => false,
                'message' =>
                    'El jugador ya pertenece a este participante.',
            ], 422);
        }

        $member = CompetitionEventParticipantMember::create([
            'competition_event_participant_id' =>
                $participant->id,

            'championship_player_id' =>
                $player->id,
        ]);

        $member->load([
            'championshipPlayer.championshipTeam.team.discipline',
            'championshipPlayer.championshipTeam.category',
            'championshipPlayer.championshipTeam.championshipUser.user',
        ]);

        CompetitionDataUpdated::publish($member, 'store');

        return response()->json([
            'success' => true,
            'message' =>
                'Jugador agregado al equipo correctamente.',
            'data' =>
                new CompetitionEventParticipantMemberResource(
                    $member
                ),
        ], 201);
    }

    public function destroy(
        CompetitionEventParticipant $participant,
        CompetitionEventParticipantMember $member
    ) {
        if (
            $member->competition_event_participant_id
            !== $participant->id
        ) {
            return response()->json([
                'success' => false,
                'message' =>
                    'El jugador no pertenece a este participante.',
            ], 422);
        }

        $member->delete();

        CompetitionDataUpdated::publish($member, 'destroy');

        return response()->json([
            'success' => true,
            'message' =>
                'Jugador retirado del equipo correctamente.',
        ]);
    }
}