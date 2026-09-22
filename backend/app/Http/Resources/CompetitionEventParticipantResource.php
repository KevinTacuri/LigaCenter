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

            'lane' => $this->lane,

            'start_order' => $this->start_order,

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

            'result' => $this->whenLoaded(
                'result',
                function () {
                    return $this->result
                        ? [
                            'id' => $this->result->id,
                            'result_value' => $this->result->result_value,
                            'result_unit' => $this->result->result_unit,
                            'position' => $this->result->position,
                            'status' => $this->result->status,
                        ]
                        : null;
                }
            ),

            'created_at' => $this->created_at,
            'updated_at' => $this->updated_at,
        ];
    }
}