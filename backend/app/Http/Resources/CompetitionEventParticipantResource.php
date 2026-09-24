<?php

namespace App\Http\Resources;

use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

class CompetitionEventParticipantResource extends JsonResource
{
    public function toArray(Request $request): array
    {
        return [
            'id' => $this->id,

            'competition_event_id' => $this->competition_event_id,

            'championship_player_id' => $this->championship_player_id,

            'championship_team_id' => $this->championship_team_id,

            'status' => $this->status,

            'championship_player' => $this->whenLoaded(
                'championshipPlayer',
                function () {
                    return ChampionshipPlayerListResource::make($this->championshipPlayer);
                }
            ),

            'championship_team' => $this->whenLoaded(
                'championshipTeam',
                function () {
                    return ChampionshipTeamResource::make($this->championshipTeam);
                }
            ),

            'members' => CompetitionEventParticipantMemberResource::collection(
                $this->whenLoaded('members')
            ),
        ];
    }
}